#!/bin/bash

set -e

# 로그 함수
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/codedeploy-deployment.log
}

error() {
    echo "[ERROR] $1" | tee -a /var/log/codedeploy-deployment.log
    exit 1
}

log "Starting ApplicationStart hook..."

cd /opt/moti-server

# Nginx 유틸리티 함수 로드
if [ -f "/opt/moti-server/scripts/nginx-utils.sh" ]; then
    source /opt/moti-server/scripts/nginx-utils.sh
    log "Nginx utility functions loaded"
else
    log "Warning: nginx-utils.sh not found, some functions may not be available"
fi

# SSL 관리 스크립트 로드
if [ -f "/opt/moti-server/scripts/ssl-manager.sh" ]; then
    log "SSL manager script available"
else
    log "Warning: ssl-manager.sh not found, SSL features may not be available"
fi

# AWS Secrets Manager에서 시크릿 가져오기
get_all_secrets() {
    local secret_name=$1
    aws secretsmanager get-secret-value --secret-id "$secret_name" --query 'SecretString' --output text 2>/dev/null || echo "{}"
}

# 환경 결정
# 배포 정보 파일에서 확인 (S3 배포 번들에서 생성된 파일)
if [ -f "/opt/moti-server/deployment-info.json" ]; then
    NODE_ENV=$(cat /opt/moti-server/deployment-info.json | jq -r '.environment // empty' 2>/dev/null)
    log "Environment loaded from deployment info: $NODE_ENV"
fi

# Docker 이미지 태그에서 추론 (fallback)
if [ -z "$NODE_ENV" ] && [ -f "/opt/moti-server/docker-image.txt" ]; then
    DOCKER_IMAGE_TEMP=$(cat /opt/moti-server/docker-image.txt)
    if echo "$DOCKER_IMAGE_TEMP" | grep -q ":stage"; then
        NODE_ENV="stage"
        log "Environment inferred from Docker image tag: stage"
    elif echo "$DOCKER_IMAGE_TEMP" | grep -q ":production"; then
        NODE_ENV="production"
        log "Environment inferred from Docker image tag: production"
    fi
fi

# 최종 기본값 (fallback)
if [ -z "$NODE_ENV" ]; then
    NODE_ENV="stage"
    log "Using default environment: stage"
fi

log "Deployment environment: $NODE_ENV"

# 환경별 파라미터 가져오기
# Docker 이미지 정보는 S3 배포 번들에서 생성된 파일에서만 가져옴
if [ -f "/opt/moti-server/docker-image.txt" ]; then
    DOCKER_IMAGE=$(cat /opt/moti-server/docker-image.txt)
    log "Docker image loaded from local file: $DOCKER_IMAGE"
else
    error "Docker image file not found. S3 deployment bundle may be incomplete."
fi

# ALB Target Group ARN 제거 (Nginx 사용으로 더 이상 필요 없음)
log "Using Nginx for load balancing instead of ALB"

# 환경 변수 파일 생성
create_env_file() {
    local env_file="/opt/moti-server/.env"
    local secret_name="moti/$NODE_ENV"
    
    log "Creating environment file from Secrets Manager and direct values..."
    
    # Secrets Manager에서 모든 시크릿을 한 번에 가져오기
    local secrets_json=$(get_all_secrets "$secret_name")
    
    if [ "$secrets_json" = "{}" ] || [ -z "$secrets_json" ]; then
        error "Failed to retrieve secrets from Secrets Manager: $secret_name"
        return 1
    fi
    
    # JSON에서 개별 값 추출
    GITHUB_CLIENT_ID=$(echo "$secrets_json" | jq -r '.GITHUB_CLIENT_ID // empty')
    GITHUB_CLIENT_SECRET=$(echo "$secrets_json" | jq -r '.GITHUB_CLIENT_SECRET // empty')
    PASSWORD_SALT_ROUNDS=$(echo "$secrets_json" | jq -r '.PASSWORD_SALT_ROUNDS // empty')
    JWT_SECRET=$(echo "$secrets_json" | jq -r '.JWT_SECRET // empty')
    DATABASE_HOST=$(echo "$secrets_json" | jq -r '.DATABASE_HOST // empty')
    DATABASE_USERNAME=$(echo "$secrets_json" | jq -r '.DATABASE_USERNAME // empty')
    DATABASE_PASSWORD=$(echo "$secrets_json" | jq -r '.DATABASE_PASSWORD // empty')
    DATABASE_NAME=$(echo "$secrets_json" | jq -r '.DATABASE_NAME // empty')
    SENDGRID_API_KEY=$(echo "$secrets_json" | jq -r '.SENDGRID_API_KEY // empty')
    OPENAI_API_KEY=$(echo "$secrets_json" | jq -r '.OPENAI_API_KEY // empty')
    ANTHROPIC_API_KEY=$(echo "$secrets_json" | jq -r '.ANTHROPIC_API_KEY // empty')

    # 환경별 설정값 결정 (수정 금지)
    if [ "$NODE_ENV" = "production" ]; then
        GITHUB_CALLBACK_URL="https://api.moti.work/auth/github/callback"
        GITHUB_API_BASE_URL="https://api.github.com"
        GITHUB_TIMEOUT="10000"
        GITHUB_MAX_REDIRECTS="5"
        JWT_EXPIRES_IN="1d"
        DATABASE_PORT="3306"
        DATABASE_SYNCHRONIZE="false"
        DATABASE_LOGGING="false"
        PORT="3000"
        DOMAIN="https://api.moti.work"
        SERVICE_URL="https://app.moti.work"
        CORS_ORIGIN="https://app.moti.work,http://localhost:3000,https://app.stage.moti.work"
        SENDGRID_FROM="admin@moti.work"
        EVALUATION_MODEL="o1-mini"
        ANALYSIS_MODEL="claude-3-7-sonnet-latest"
        REPORT_MODEL="gpt-4o"
        GITHUB_MCP_URL="https://api.githubcopilot.com/mcp/"
    elif [ "$NODE_ENV" = "stage" ]; then
        GITHUB_CALLBACK_URL="https://api.stage.moti.work/auth/github/callback"
        GITHUB_API_BASE_URL="https://api.github.com"
        GITHUB_TIMEOUT="8000"
        GITHUB_MAX_REDIRECTS="5"
        JWT_EXPIRES_IN="1d"
        DATABASE_PORT="3306"
        DATABASE_SYNCHRONIZE="false"
        DATABASE_LOGGING="true"
        PORT="3000"
        DOMAIN="https://api.stage.moti.work"
        SERVICE_URL="https://app.stage.moti.work"
        CORS_ORIGIN="http://localhost:3000,https://app.stage.moti.work"
        SENDGRID_FROM="admin@moti.work"
    else
        # development 기본값
        GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"
        GITHUB_API_BASE_URL="https://api.github.com"
        GITHUB_TIMEOUT="5000"
        GITHUB_MAX_REDIRECTS="5"
        JWT_EXPIRES_IN="1d"
        DATABASE_PORT="3306"
        DATABASE_SYNCHRONIZE="true"
        DATABASE_LOGGING="true"
        PORT="3000"
        DOMAIN="localhost:3000"
        CORS_ORIGIN="http://localhost:3000"
        SENDGRID_FROM="admin@moti.work"
    fi
    
    cat > "$env_file" << EOF
# Environment Configuration (Generated from Secrets Manager and script)
NODE_ENV=$NODE_ENV
PORT=$PORT

# GitHub Configuration (from Secrets Manager)
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL=$GITHUB_CALLBACK_URL
GITHUB_API_BASE_URL=$GITHUB_API_BASE_URL
GITHUB_TIMEOUT=$GITHUB_TIMEOUT
GITHUB_MAX_REDIRECTS=$GITHUB_MAX_REDIRECTS

# Password Configuration (from Secrets Manager)
PASSWORD_SALT_ROUNDS=$PASSWORD_SALT_ROUNDS

# JWT Configuration (from Secrets Manager)
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=$JWT_EXPIRES_IN

# Database Configuration (from Secrets Manager)
DATABASE_HOST=$DATABASE_HOST
DATABASE_PORT=$DATABASE_PORT
DATABASE_USERNAME=$DATABASE_USERNAME
DATABASE_PASSWORD=$DATABASE_PASSWORD
DATABASE_NAME=$DATABASE_NAME
DATABASE_SYNCHRONIZE=$DATABASE_SYNCHRONIZE
DATABASE_LOGGING=$DATABASE_LOGGING

# Email Configuration (from Secrets Manager)
SENDGRID_API_KEY=$SENDGRID_API_KEY
SENDGRID_FROM=$SENDGRID_FROM

# OpenAI
OPENAI_API_KEY=$OPENAI_API_KEY

# Anthropic
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

# AI Evaluation Models
EVALUATION_MODEL=$EVALUATION_MODEL
ANALYSIS_MODEL=$ANALYSIS_MODEL
REPORT_MODEL=$REPORT_MODEL

# GitHub MCP Server Configuration
GITHUB_MCP_URL=$GITHUB_MCP_URL

# Application Configuration
DOCKER_IMAGE=$DOCKER_IMAGE
DOMAIN=$DOMAIN
SERVICE_URL=$SERVICE_URL

CORS_ORIGIN=$CORS_ORIGIN
EOF

    # 파일 권한 설정 (보안)
    chmod 600 "$env_file"
    chown ec2-user:ec2-user "$env_file"
    
    log "Environment file created successfully"
    
    # 중요한 정보가 제대로 로드되었는지 확인 (값은 로깅하지 않음)
    if [ -z "$GITHUB_CLIENT_ID" ] || [ -z "$DATABASE_HOST" ] || [ -z "$JWT_SECRET" ]; then
        error "Failed to load critical secrets from Secrets Manager: $secret_name. Missing required fields."
        log "Debug: GITHUB_CLIENT_ID=$([ -z "$GITHUB_CLIENT_ID" ] && echo "MISSING" || echo "OK")"
        log "Debug: DATABASE_HOST=$([ -z "$DATABASE_HOST" ] && echo "MISSING" || echo "OK")" 
        log "Debug: JWT_SECRET=$([ -z "$JWT_SECRET" ] && echo "MISSING" || echo "OK")"
        return 1
    fi
    
    log "All critical secrets loaded successfully from $secret_name"
}

if [ -z "$DOCKER_IMAGE" ]; then
    error "DOCKER_IMAGE parameter not found for environment: $NODE_ENV"
fi

log "Docker image: $DOCKER_IMAGE"

# 환경 변수 파일 생성
create_env_file

# ECR 로그인
log "Logging in to Amazon ECR..."
aws ecr get-login-password --region $(aws configure get region) | docker login --username AWS --password-stdin $(echo $DOCKER_IMAGE | cut -d'/' -f1)

# 최신 이미지 pull
log "Pulling latest Docker image: $DOCKER_IMAGE"
docker pull $DOCKER_IMAGE

# 배포 시작 전 초기 상태 정리
log "Checking and cleaning up any problematic containers before deployment..."

# Docker Compose 명령어 경로 확인 (나중에 사용할 것이므로 미리 설정)
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif command -v /usr/local/bin/docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="/usr/local/bin/docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    error "Docker Compose not found. Please install docker-compose or use Docker with compose plugin."
fi

log "Using Docker Compose command: $DOCKER_COMPOSE_CMD"

# 실패한 컨테이너나 중복 컨테이너 정리
log "Cleaning up any failed or duplicate containers..."
failed_containers=$(docker ps -a --filter "name=moti-server" --filter "status=exited" -q 2>/dev/null || echo "")
if [ -n "$failed_containers" ]; then
    log "Removing failed containers: $failed_containers"
    docker rm $failed_containers 2>/dev/null || true
fi

# Blue/Green 배포를 위한 현재 상태 확인
CURRENT_ENV="blue"
if docker ps --format "table {{.Names}}" | grep -q "moti-server-green"; then
    CURRENT_ENV="green"
    NEW_ENV="blue"
else
    NEW_ENV="green"
fi

log "Current environment: $CURRENT_ENV, deploying to: $NEW_ENV"

# Docker Compose 파일 생성
create_docker_compose() {
    local env=$1
    local port=$2
    local container_name="moti-server-$env"
    
    cat > docker-compose.$env.yml << EOF
version: '3.8'
services:
  app:
    image: $DOCKER_IMAGE
    container_name: $container_name
    ports:
      - "$port:3000"
    environment:
      - NODE_ENV=$NODE_ENV
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
    networks:
      - moti-network

networks:
  moti-network:
    driver: bridge
EOF
    
    log "Created docker-compose.$env.yml"
}

# Blue/Green 환경별 포트 설정
if [ "$NEW_ENV" = "blue" ]; then
    NEW_PORT=3001
    OLD_PORT=3002
else
    NEW_PORT=3002
    OLD_PORT=3001
fi

log "Port configuration - NEW_ENV: $NEW_ENV, NEW_PORT: $NEW_PORT, OLD_PORT: $OLD_PORT"

# 새 환경용 Docker Compose 파일 생성
create_docker_compose $NEW_ENV $NEW_PORT

# 새 환경 시작
log "Starting new environment: $NEW_ENV on port $NEW_PORT"

$DOCKER_COMPOSE_CMD -f docker-compose.$NEW_ENV.yml up -d

# 컨테이너 시작 대기
log "Waiting for container to be ready..."
sleep 30

# 실제 컨테이너 포트 바인딩 확인
log "Verifying container port bindings..."
container_name="moti-server-$NEW_ENV"
if docker ps --format "table {{.Names}}\t{{.Ports}}" | grep "$container_name"; then
    actual_ports=$(docker ps --format "{{.Ports}}" --filter "name=$container_name")
    log "Container $container_name port bindings: $actual_ports"
    
    # 예상 포트와 실제 포트가 일치하는지 확인
    if echo "$actual_ports" | grep -q "$NEW_PORT:3000"; then
        log "✓ Port binding verified: $NEW_PORT:3000 is correctly mapped"
    else
        log "✗ WARNING: Expected port $NEW_PORT:3000 not found in actual bindings"
        log "  Expected: $NEW_PORT:3000"
        log "  Actual: $actual_ports"
    fi
else
    log "WARNING: Container $container_name not found in running containers"
    log "Running containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | while read line; do
        log "  $line"
    done
fi

# 헬스 체크
HEALTH_CHECK_URL="http://localhost:$NEW_PORT/health"
RETRY_COUNT=0
MAX_RETRIES=10

log "Starting health check for new environment on port $NEW_PORT..."
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f $HEALTH_CHECK_URL >/dev/null 2>&1; then
        log "Health check passed for new environment"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying in 15 seconds..."
    sleep 15
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "Health check failed after $MAX_RETRIES attempts. Rolling back deployment."
fi

log "New environment is healthy. Updating Nginx configuration..."

# Nginx 설정 파일 상태 확인 및 복구
log "Verifying Nginx configuration files..."
if ! grep -q "include /etc/nginx/conf.d/\*.ssl.conf;" /etc/nginx/nginx.conf 2>/dev/null; then
    log "WARNING: nginx.conf appears to be outdated, updating from deployment package..."
    
    if [ -f "/opt/moti-server/nginx/nginx.conf" ]; then
        # 기존 파일 백업
        cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
        
        # 새 설정 파일 복사
        cp /opt/moti-server/nginx/nginx.conf /etc/nginx/nginx.conf
        log "nginx.conf updated from deployment package"
        
        # 기존 문제가 있는 SSL 설정 파일들 제거 (파일명 통일)
        rm -f /etc/nginx/conf.d/ssl.conf
        rm -f /etc/nginx/conf.d/ssl.ssl.conf.disabled
        log "Legacy SSL configuration files removed"
    else
        log "ERROR: nginx.conf not found in deployment package"
    fi
fi

# 도메인 설정 업데이트 (배포 정보에서 도메인 추출)
if [ -f "/opt/moti-server/deployment-info.json" ]; then
    DEPLOYMENT_ENV=$(cat /opt/moti-server/deployment-info.json | jq -r '.environment // empty' 2>/dev/null)
    case "$DEPLOYMENT_ENV" in
        "production")
            DOMAIN_NAME="api.moti.work"
            ;;
        "stage")
            DOMAIN_NAME="api.stage.moti.work"
            ;;
        *)
            DOMAIN_NAME=""
            ;;
    esac
    
    if [ -n "$DOMAIN_NAME" ]; then
        log "Configuring Nginx for domain: $DOMAIN_NAME"
        configure_nginx_ssl "$DOMAIN_NAME"
    else
        log "No domain configured, using HTTP-only mode"
        configure_nginx_ssl ""
    fi
else
    log "No deployment info found, using HTTP-only mode"
    configure_nginx_ssl ""
fi

# Nginx upstream 업데이트 (Nginx가 설치되어 있는 경우)
if command -v nginx >/dev/null 2>&1; then
    log "Updating Nginx upstream configuration..."
    log "Port configuration summary:"
    log "  NEW_ENV: $NEW_ENV"
    log "  NEW_PORT: $NEW_PORT (will be used for upstream)"
    log "  OLD_PORT: $OLD_PORT (previous environment)"
    
    # 현재 upstream 설정 확인
    if [ -f "/etc/nginx/conf.d/upstream.conf" ]; then
        log "Current upstream configuration:"
        cat /etc/nginx/conf.d/upstream.conf | while read line; do
            log "  $line"
        done
    else
        log "WARNING: upstream.conf not found, will be created"
    fi
    
    if update_nginx_upstream "$NEW_PORT"; then
        log "Nginx upstream updated successfully to port $NEW_PORT"
        
        # Nginx를 통한 헬스체크
        if check_nginx_health; then
            log "Nginx health check passed - traffic is being routed to new environment"
        else
            log "ERROR: Nginx health check failed"
            
            # 실패한 새 환경 정리
            log "Stopping and removing failed new environment: $NEW_ENV"
            $DOCKER_COMPOSE_CMD -f docker-compose.$NEW_ENV.yml down 2>/dev/null || true
            
            error "Deployment failed: New environment failed Nginx health checks. Old environment preserved."
        fi
    else
        log "ERROR: Failed to update Nginx upstream configuration"
        
        # 실패한 새 환경 정리
        log "Stopping and removing failed new environment: $NEW_ENV"
        $DOCKER_COMPOSE_CMD -f docker-compose.$NEW_ENV.yml down 2>/dev/null || true
        
        error "Deployment failed: Nginx configuration update failed. Old environment preserved."
    fi
else
    log "Warning: Nginx not found, skipping Nginx configuration update"
    log "Make sure to configure your load balancer to point to port $NEW_PORT"
fi

# 이전 환경 정리 (새 환경이 완전히 준비되고 Nginx에서도 routing이 완료된 후)
log "Gracefully shutting down old environment..."
if docker ps --format "table {{.Names}}" | grep -q "moti-server-$CURRENT_ENV"; then
    log "Stopping old environment: $CURRENT_ENV"
    
    # 기존 컨테이너에 graceful shutdown 시간 제공
    log "Sending shutdown signal to old containers..."
    $DOCKER_COMPOSE_CMD -f docker-compose.$CURRENT_ENV.yml stop 2>/dev/null || true
    
    # 잠시 대기 후 완전히 제거
    sleep 10
    log "Removing old containers and networks..."
    $DOCKER_COMPOSE_CMD -f docker-compose.$CURRENT_ENV.yml down 2>/dev/null || true
    
    log "Old environment ($CURRENT_ENV) has been shut down successfully"
else
    log "No old environment found to clean up"
fi

# 성공 로그
log "ApplicationStart hook completed successfully"
log "New environment ($NEW_ENV) is running on port $NEW_PORT"

# SSL 인증서 관리 (배포 완료 후)
if [ -f "/opt/moti-server/scripts/ssl-manager.sh" ]; then
    log "Managing SSL certificates..."
    
    # 인증서 상태 확인
    if /opt/moti-server/scripts/ssl-manager.sh check; then
        log "SSL certificate is valid and up to date"
    else
        log "SSL certificate needs attention - attempting to issue/renew"
        
        # 인증서 발급 시도 (새 인증서이거나 만료가 임박한 경우)
        if /opt/moti-server/scripts/ssl-manager.sh issue; then
            log "SSL certificate successfully issued/renewed"
        else
            log "Warning: SSL certificate management failed, but deployment continues"
            log "Service is accessible via HTTP only"
        fi
    fi
    
    # 자동 갱신 크론잡 설정
    /opt/moti-server/scripts/ssl-manager.sh setup-auto
else
    log "SSL manager not available, skipping SSL setup"
fi

# 최종 상태 보고
log "Deployment completed successfully with zero downtime"
log "Service is now running on new environment: $NEW_ENV (port $NEW_PORT)"
log "HTTP access: http://localhost"

# HTTPS 접근 가능 여부 확인
if [ -f "/etc/letsencrypt/live/*/fullchain.pem" ] 2>/dev/null; then
    log "HTTPS access: https://localhost (SSL certificate active)"
else
    log "HTTPS access: Not configured (HTTP only)"
fi
