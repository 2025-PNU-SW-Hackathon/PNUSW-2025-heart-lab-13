#!/bin/bash

# SSL 인증서 관리 스크립트

set -e

# 로그 함수
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/ssl-management.log
}

error() {
    echo "[ERROR] $1" | tee -a /var/log/ssl-management.log
    exit 1
}

# 도메인 이름 확인
get_domain_name() {
    # 환경별 도메인 설정
    if [ -f "/opt/moti-server/deployment-info.json" ]; then
        local environment=$(cat /opt/moti-server/deployment-info.json | jq -r '.environment // empty' 2>/dev/null)
        
        case "$environment" in
            "production")
                echo "api.moti.work"
                ;;
            "stage")
                echo "api.stage.moti.work"
                ;;
            *)
                echo ""
                ;;
        esac
    else
        echo ""
    fi
}

# SSL 인증서 발급
issue_certificate() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        error "Domain name is required for SSL certificate"
    fi
    
    log "Issuing SSL certificate for domain: $domain"
    
    # Let's Encrypt challenge를 위한 디렉토리 생성
    mkdir -p /var/www/certbot
    chown -R nginx:nginx /var/www/certbot
    
    # 기존 SSL 설정 비활성화 (첫 발급 시)
    if [ ! -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
        log "First time certificate issuance - temporarily disabling SSL configuration"
        mv /etc/nginx/conf.d/ssl.ssl.conf /etc/nginx/conf.d/ssl.ssl.conf.disabled 2>/dev/null || true
        systemctl reload nginx
    fi
    
    # 인증서 발급
    log "Running certbot for domain: $domain"
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email admin@moti.work \
        --agree-tos \
        --no-eff-email \
        --domains $domain \
        --non-interactive \
        --expand \
        --keep-until-expiring
    
    if [ $? -eq 0 ]; then
        log "Certificate issued successfully for $domain"
        
        # SSL 설정에서 도메인 이름 업데이트
        log "Updating SSL configuration with domain: $domain"
        
        # SSL 설정 파일이 비활성화되어 있다면 원본 템플릿에서 새로 생성
        if [ -f "/etc/nginx/conf.d/ssl.ssl.conf.disabled" ]; then
            rm -f /etc/nginx/conf.d/ssl.ssl.conf.disabled
            log "Removed old disabled SSL configuration"
        fi
        
        # 기존 SSL 설정 파일이 있다면 제거 (도메인 변경 대비)
        if [ -f "/etc/nginx/conf.d/ssl.ssl.conf" ]; then
            rm -f /etc/nginx/conf.d/ssl.ssl.conf
            log "Removed existing SSL configuration for clean setup"
        fi
        
        # 원본 템플릿에서 새로 복사 및 설정
        if [ -f "/opt/moti-server/nginx/ssl.conf" ]; then
            cp /opt/moti-server/nginx/ssl.conf /etc/nginx/conf.d/ssl.ssl.conf
            log "SSL configuration file created from template"
            
            # 도메인 플레이스홀더 교체 (원본 템플릿에서 교체하므로 항상 성공)
            sed -i "s/DOMAIN_NAME/$domain/g" /etc/nginx/conf.d/ssl.ssl.conf
            sed -i "s/server_name _;/server_name $domain;/g" /etc/nginx/conf.d/ssl.ssl.conf
            log "SSL configuration updated with domain: $domain"
        else
            log "ERROR: SSL template not found at /opt/moti-server/nginx/ssl.conf"
            return 1
        fi
        
        # Nginx 설정 테스트 및 리로드
        if nginx -t; then
            systemctl reload nginx
            log "Nginx reloaded with SSL configuration"
        else
            error "Nginx configuration test failed after SSL setup"
        fi
        
        log "SSL certificate setup completed successfully"
    else
        error "Failed to issue SSL certificate for $domain"
    fi
}

# SSL 인증서 갱신
renew_certificate() {
    log "Renewing SSL certificates..."
    
    # 인증서 갱신
    certbot renew --webroot --webroot-path=/var/www/certbot --quiet
    
    if [ $? -eq 0 ]; then
        log "Certificate renewal completed"
        # Nginx 리로드 (인증서가 갱신된 경우에만)
        systemctl reload nginx
        log "Nginx reloaded after certificate renewal"
    else
        log "Certificate renewal failed or no renewal needed"
    fi
}

# 인증서 상태 확인
check_certificate() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        error "Domain name is required for certificate check"
    fi
    
    if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
        log "Certificate exists for $domain"
        
        # 만료일 확인
        expiry_date=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$domain/fullchain.pem | cut -d= -f2)
        log "Certificate expires on: $expiry_date"
        
        # 만료까지 남은 일수 계산
        expiry_epoch=$(date -d "$expiry_date" +%s)
        current_epoch=$(date +%s)
        days_remaining=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        log "Days remaining until expiry: $days_remaining"
        
        if [ $days_remaining -lt 30 ]; then
            log "Warning: Certificate expires in less than 30 days"
            return 1
        fi
        
        return 0
    else
        log "No certificate found for $domain"
        return 1
    fi
}

# 자동 갱신 크론잡 설정
setup_auto_renewal() {
    log "Setting up automatic certificate renewal"
    
    # 크론잡 추가 (매일 새벽 2시에 체크)
    cron_job="0 2 * * * /opt/moti-server/scripts/ssl-manager.sh renew >> /var/log/ssl-management.log 2>&1"
    
    # 기존 크론잡 확인
    if ! crontab -l 2>/dev/null | grep -q "ssl-manager.sh"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        log "Auto-renewal cron job added"
    else
        log "Auto-renewal cron job already exists"
    fi
}

# 메인 실행 로직
main() {
    case "${1:-}" in
        "issue")
            domain=$(get_domain_name)
            if [ -z "$domain" ]; then
                error "Could not determine domain name from deployment info"
            fi
            issue_certificate "$domain"
            setup_auto_renewal
            ;;
        "renew")
            renew_certificate
            ;;
        "check")
            domain=$(get_domain_name)
            if [ -z "$domain" ]; then
                error "Could not determine domain name from deployment info"
            fi
            check_certificate "$domain"
            ;;
        "setup-auto")
            setup_auto_renewal
            ;;
        *)
            echo "Usage: $0 {issue|renew|check|setup-auto}"
            echo "  issue      - Issue new SSL certificate"
            echo "  renew      - Renew existing certificates"
            echo "  check      - Check certificate status"
            echo "  setup-auto - Setup automatic renewal cron job"
            exit 1
            ;;
    esac
}

main "$@"
