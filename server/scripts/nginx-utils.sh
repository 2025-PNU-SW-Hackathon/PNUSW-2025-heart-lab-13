#!/bin/bash

# 현재 SSL 설정에서 도메인 추출 함수
get_current_ssl_domain() {
    if [ -f "/etc/nginx/conf.d/ssl.ssl.conf" ]; then
        # server_name에서 도메인 추출 (기본값 _ 제외)
        local domain=$(grep "server_name" /etc/nginx/conf.d/ssl.ssl.conf | grep -v "server_name _;" | sed 's/.*server_name \([^;]*\);.*/\1/' | head -1)
        if [ -n "$domain" ] && [ "$domain" != "_" ]; then
            echo "$domain"
        fi
    fi
}

# 도메인 변경 감지 함수
is_domain_changed() {
    local new_domain=$1
    local current_domain=$(get_current_ssl_domain)
    
    if [ -z "$new_domain" ]; then
        return 1  # 새 도메인이 없으면 변경 없음
    fi
    
    if [ -z "$current_domain" ]; then
        return 0  # 현재 도메인이 없으면 변경으로 간주
    fi
    
    if [ "$new_domain" != "$current_domain" ]; then
        log "Domain change detected: $current_domain -> $new_domain"
        return 0  # 도메인이 다르면 변경됨
    fi
    
    return 1  # 도메인이 같으면 변경 없음
}

# Nginx 설정 업데이트 함수
update_nginx_upstream() {
    local new_port=$1
    local upstream_file="/etc/nginx/conf.d/upstream.conf"
    
    log "Updating Nginx upstream to point to port $new_port"
    
    # 기존 upstream.conf 파일 백업 (있다면)
    if [ -f "$upstream_file" ]; then
        cp "$upstream_file" "${upstream_file}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 새로운 upstream 설정 생성
    cat > "$upstream_file" << EOF
# Upstream configuration for Blue/Green deployment
# Updated: $(date)
upstream backend {
    server 127.0.0.1:$new_port;
}
EOF
    
    log "Upstream configuration updated to port $new_port"
    log "Upstream file content:"
    cat "$upstream_file" | while read line; do
        log "  $line"
    done
    
    # Nginx 설정 테스트
    log "Testing Nginx configuration..."
    if nginx -t; then
        log "Nginx configuration test passed"
        
        # Nginx 리로드 (graceful restart)
        if systemctl reload nginx; then
            log "Nginx successfully reloaded with new upstream configuration"
            return 0
        else
            log "ERROR: Failed to reload Nginx"
            return 1
        fi
    else
        log "ERROR: Nginx configuration test failed"
        log "Nginx configuration details:"
        nginx -t 2>&1 | while read line; do
            log "  $line"
        done
        
        # 설정 파일 상태 확인
        log "Checking configuration file status:"
        log "  Main config: $(ls -la /etc/nginx/nginx.conf 2>/dev/null || echo 'NOT FOUND')"
        log "  SSL configs: $(ls -la /etc/nginx/conf.d/*.ssl.conf 2>/dev/null || echo 'NONE')"
        log "  Old SSL config: $(ls -la /etc/nginx/conf.d/ssl.conf 2>/dev/null || echo 'NOT FOUND')"
        
        return 1
    fi
}

# 도메인별 Nginx 설정 업데이트 함수
update_nginx_domain_config() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        log "No domain specified, keeping default configuration"
        return 0
    fi
    
    log "Updating Nginx configuration for domain: $domain"
    
    # HTTP 서버 블록의 server_name을 실제 도메인으로 업데이트 (기본값 _ 일 때만)
    if grep -q "server_name _;" /etc/nginx/nginx.conf; then
        sed -i "s/server_name _;/server_name $domain;/g" /etc/nginx/nginx.conf
        log "HTTP server_name updated for domain: $domain"
    fi
    
    # SSL 설정 파일에서 도메인 이름과 server_name 업데이트
    # 이 함수가 호출될 때는 이미 configure_nginx_ssl에서 도메인이 설정되었으므로
    # 추가적인 도메인 교체는 수행하지 않음 (중복 교체 방지)
    if [ -f "/etc/nginx/conf.d/ssl.ssl.conf" ]; then
        log "SSL configuration already configured for domain: $domain"
    fi
    
    log "Nginx domain configuration completed for $domain"
    
    return 0
}

# SSL 인증서 상태 확인 및 Nginx 설정 조정
configure_nginx_ssl() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        log "No domain specified, disabling SSL configuration"
        # SSL 설정 비활성화
        if [ -f "/etc/nginx/conf.d/ssl.ssl.conf" ]; then
            mv /etc/nginx/conf.d/ssl.ssl.conf /etc/nginx/conf.d/ssl.ssl.conf.disabled 2>/dev/null || true
            log "SSL configuration disabled (no domain)"
        fi
        return 0
    fi
    
    # 도메인 변경 확인
    local domain_changed=false
    if is_domain_changed "$domain"; then
        domain_changed=true
        log "Domain configuration needs to be updated"
    fi
    
    # 인증서 파일 경로 확인
    local cert_path="/etc/letsencrypt/live/$domain/fullchain.pem"
    local key_path="/etc/letsencrypt/live/$domain/privkey.pem"
    
    if [ -f "$cert_path" ] && [ -f "$key_path" ]; then
        log "SSL certificate found for $domain - enabling HTTPS"
        
        # 도메인이 변경되었거나 기존 SSL 설정이 없으면 새로 설정
        if [ "$domain_changed" = true ] || [ ! -f "/etc/nginx/conf.d/ssl.ssl.conf" ]; then
            # 기존 SSL 설정 제거 (도메인 변경 대비)
            if [ -f "/etc/nginx/conf.d/ssl.ssl.conf" ]; then
                rm -f /etc/nginx/conf.d/ssl.ssl.conf
                log "Existing SSL configuration removed for clean setup"
            fi
            
            # SSL 설정 활성화 (템플릿에서 항상 새로 복사)
            if [ -f "/opt/moti-server/nginx/ssl.conf" ]; then
                log "Copying fresh SSL template and configuring for domain: $domain"
                cp /opt/moti-server/nginx/ssl.conf /etc/nginx/conf.d/ssl.ssl.conf
                
                # 도메인 플레이스홀더 교체 (원본 템플릿에서 교체하므로 항상 성공)
                sed -i "s/DOMAIN_NAME/$domain/g" /etc/nginx/conf.d/ssl.ssl.conf
                sed -i "s/server_name _;/server_name $domain;/g" /etc/nginx/conf.d/ssl.ssl.conf
                log "SSL configuration updated with domain: $domain"
            elif [ -f "/etc/nginx/conf.d/ssl.ssl.conf.disabled" ]; then
                # disabled 파일이 있는 경우, 도메인이 이미 변경된 상태일 수 있으므로 원본 템플릿 사용
                if [ -f "/opt/moti-server/nginx/ssl.conf" ]; then
                    cp /opt/moti-server/nginx/ssl.conf /etc/nginx/conf.d/ssl.ssl.conf
                    sed -i "s/DOMAIN_NAME/$domain/g" /etc/nginx/conf.d/ssl.ssl.conf
                    sed -i "s/server_name _;/server_name $domain;/g" /etc/nginx/conf.d/ssl.ssl.conf
                    log "SSL configuration restored from template for domain: $domain"
                else
                    mv /etc/nginx/conf.d/ssl.ssl.conf.disabled /etc/nginx/conf.d/ssl.ssl.conf
                    log "SSL configuration enabled from disabled state"
                fi
            fi
        else
            log "SSL configuration already exists and domain unchanged for: $domain"
        fi
        
        # 도메인 설정 업데이트
        update_nginx_domain_config "$domain"
        
        return 0
    else
        log "SSL certificate not found for $domain - running HTTP-only mode"
        
        # SSL 설정 비활성화
        if [ -f "/etc/nginx/conf.d/ssl.ssl.conf" ]; then
            mv /etc/nginx/conf.d/ssl.ssl.conf /etc/nginx/conf.d/ssl.ssl.conf.disabled 2>/dev/null || true
            log "SSL configuration disabled (no certificate)"
        fi
        
        # HTTP 설정만 업데이트 (기본값 _ 일 때만)
        if grep -q "server_name _;" /etc/nginx/nginx.conf; then
            sed -i "s/server_name _;/server_name $domain;/g" /etc/nginx/nginx.conf
            log "HTTP server_name updated for domain: $domain"
        fi
        
        return 0
    fi
}

# Nginx 헬스체크 함수
check_nginx_health() {
    local max_retries=10
    local retry_count=0
    
    log "Checking Nginx health and upstream connectivity..."
    
    while [ $retry_count -lt $max_retries ]; do
        # Nginx 자체 헬스체크 (HTTP)
        if curl -f http://localhost/nginx-health >/dev/null 2>&1; then
            log "Nginx HTTP health check passed"
            
            # 백엔드 연결 확인 (HTTP)
            if curl -f http://localhost/health >/dev/null 2>&1; then
                log "Backend health check through Nginx HTTP passed"
                
                # SSL이 설정되어 있다면 HTTPS도 체크
                if [ -f "/etc/nginx/conf.d/ssl.ssl.conf" ] && ls /etc/letsencrypt/live/*/fullchain.pem 1> /dev/null 2>&1; then
                    log "SSL certificate detected, checking HTTPS endpoints..."
                    
                    # HTTPS 헬스체크
                    if curl -f -k https://localhost/nginx-health >/dev/null 2>&1; then
                        log "Nginx HTTPS health check passed"
                        
                        # HTTPS 백엔드 연결 확인
                        if curl -f -k https://localhost/health >/dev/null 2>&1; then
                            log "Backend health check through Nginx HTTPS passed"
                        else
                            log "Backend health check through Nginx HTTPS failed"
                        fi
                    else
                        log "Warning: Nginx HTTPS health check failed, but HTTP is working"
                    fi
                else
                    log "No SSL certificate found, skipping HTTPS health checks"
                fi
                
                return 0
            else
                log "Backend health check through Nginx failed (attempt $((retry_count + 1))/$max_retries)"
            fi
        else
            log "Nginx health check failed (attempt $((retry_count + 1))/$max_retries)"
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            sleep 10
        fi
    done
    
    log "ERROR: Nginx or backend health check failed after $max_retries attempts"
    return 1
}
