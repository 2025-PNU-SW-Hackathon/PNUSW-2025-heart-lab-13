#!/bin/bash

set -e

# 로그 함수
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/codedeploy-deployment.log
}

error() {
    echo "[ERROR] $1" | tee -a /var/log/codedeploy-deployment.log
}

log "Starting BeforeInstall hook..."

# Amazon Linux 버전 감지 함수
detect_amazon_linux_version() {
    if grep -q "Amazon Linux 2023" /etc/os-release 2>/dev/null; then
        echo "2023"
    elif grep -q "Amazon Linux 2" /etc/os-release 2>/dev/null; then
        echo "2"
    else
        echo "unknown"
    fi
}

AMAZON_LINUX_VERSION=$(detect_amazon_linux_version)
log "Detected Amazon Linux version: $AMAZON_LINUX_VERSION"

# 패키지 관리자 함수
install_package() {
    local package=$1
    local description=${2:-$package}
    
    log "Installing $description..."
    
    if [ "$AMAZON_LINUX_VERSION" = "2023" ]; then
        dnf install -y "$package"
    else
        yum install -y "$package"
    fi
}

update_system() {
    log "Updating system packages..."
    
    if [ "$AMAZON_LINUX_VERSION" = "2023" ]; then
        dnf update -y
    else
        yum update -y
    fi
}

# jq 설치 확인 (JSON 파싱용)
if ! command -v jq &> /dev/null; then
    update_system
    install_package "jq" "jq (JSON processor)"
else
    log "jq is already installed"
fi

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    update_system
    install_package "docker" "Docker"
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user
else
    log "Docker is already installed"
fi

# Docker Compose 설치 확인
if ! command -v docker-compose &> /dev/null && ! (command -v docker &> /dev/null && docker compose version &> /dev/null); then
    log "Installing Docker Compose..."
    
    # Docker Compose V2 (플러그인) 설치 시도
    if command -v docker &> /dev/null; then
        # Docker Compose V2 플러그인 설치
        DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
        mkdir -p $DOCKER_CONFIG/cli-plugins
        curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
        chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
        
        # 시스템 전체에 설치
        sudo mkdir -p /usr/local/lib/docker/cli-plugins
        sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
        sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    fi
    
    # Docker Compose V1 (standalone) 설치
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    log "Docker Compose installation completed"
else
    log "Docker Compose is already available"
fi

# AWS CLI 설치 확인
if ! command -v aws &> /dev/null; then
    log "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    yum install -y unzip
    unzip awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
else
    log "AWS CLI is already installed"
fi

# Nginx 설치 및 설정
if ! command -v nginx &> /dev/null; then
    update_system
    
    if [ "$AMAZON_LINUX_VERSION" = "2" ]; then
        log "Installing Nginx using amazon-linux-extras for Amazon Linux 2"
        amazon-linux-extras install -y nginx1
    else
        install_package "nginx" "Nginx"
    fi
    
    systemctl enable nginx
else
    log "Nginx is already installed"
fi

# Certbot (Let's Encrypt) 설치
if ! command -v certbot &> /dev/null; then
    update_system
    install_package "python3" "Python 3"
    install_package "python3-pip" "Python 3 pip"
    
    # Certbot 설치 시도 (패키지 매니저 우선, 실패 시 pip 사용)
    if [ "$AMAZON_LINUX_VERSION" = "2023" ]; then
        log "Attempting to install Certbot from EPEL repository..."
        dnf install -y epel-release 2>/dev/null || dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm 2>/dev/null || true
        
        if ! dnf install -y certbot python3-certbot-nginx 2>/dev/null; then
            log "Package installation failed, using pip instead"
            pip3 install certbot certbot-nginx
        fi
    else
        log "Installing Certbot using pip for Amazon Linux 2"
        pip3 install certbot certbot-nginx
    fi
else
    log "Certbot is already installed"
fi

# Nginx 설정 디렉토리 준비
log "Setting up Nginx configuration..."
mkdir -p /etc/nginx/conf.d
mkdir -p /etc/nginx/ssl

# 기본 Nginx 설정 복사 (배포된 파일에서) - 강제 업데이트
if [ -f "/opt/moti-server/nginx/nginx.conf" ]; then
    log "Copying Nginx main configuration (force update)..."
    
    # 기존 파일 백업
    if [ -f "/etc/nginx/nginx.conf" ]; then
        cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
        log "Existing nginx.conf backed up"
    fi
    
    # 새 설정 파일 복사
    cp /opt/moti-server/nginx/nginx.conf /etc/nginx/nginx.conf
    log "New nginx.conf installed successfully"
else
    log "Warning: nginx.conf not found in deployment package"
fi

# 기존 SSL 설정 파일들 정리 (이전 배포에서 남은 파일들 제거)
log "Cleaning up old SSL configuration files..."
rm -f /etc/nginx/conf.d/ssl.conf
rm -f /etc/nginx/conf.d/ssl.conf.disabled
rm -f /etc/nginx/conf.d/ssl.ssl.conf
rm -f /etc/nginx/conf.d/ssl.ssl.conf.disabled
log "All existing SSL configuration files removed for clean setup"

# SSL 설정 파일 복사 (배포된 파일에서) - 초기에는 비활성화 상태로 설정
if [ -f "/opt/moti-server/nginx/ssl.conf" ]; then
    log "Copying SSL configuration template (initially disabled)..."
    cp /opt/moti-server/nginx/ssl.conf /etc/nginx/conf.d/ssl.ssl.conf.disabled
    log "SSL configuration will be activated when certificates are available"
    log "Template contains DOMAIN_NAME placeholder that will be replaced during certificate issuance"
else
    log "Warning: ssl.conf not found in deployment package"
fi

# 초기 upstream 설정 (기본값으로 3001 포트 사용)
log "Creating initial upstream configuration..."
cat > /etc/nginx/conf.d/upstream.conf << 'EOF'
# Initial upstream configuration for Blue/Green deployment
# This will be dynamically updated by deployment scripts
upstream backend {
    server 127.0.0.1:3001;
}
EOF
log "Initial upstream configuration created (port 3001)"

# Nginx 설정 테스트
if nginx -t; then
    log "Nginx configuration test passed"
    systemctl restart nginx
    systemctl enable nginx
    log "Nginx started successfully"
else
    log "Warning: Nginx configuration test failed, using default configuration"
fi

# CodeDeploy agent 설치 확인
if ! systemctl is-active --quiet codedeploy-agent; then
    update_system
    install_package "ruby" "Ruby"
    install_package "wget" "wget"
    
    cd /home/ec2-user
    wget https://aws-codedeploy-ap-northeast-2.s3.ap-northeast-2.amazonaws.com/latest/install
    chmod +x ./install
    ./install auto
    systemctl start codedeploy-agent
    systemctl enable codedeploy-agent
else
    log "CodeDeploy agent is already running"
fi

# 배포 디렉토리 권한 설정
chown -R ec2-user:ec2-user /opt/moti-server
chmod +x /opt/moti-server/scripts/*.sh 2>/dev/null || true

log "BeforeInstall hook completed successfully"
