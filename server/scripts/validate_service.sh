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

success() {
    echo "[SUCCESS] $1" | tee -a /var/log/codedeploy-deployment.log
}

log "Starting ValidateService hook..."

cd /opt/moti-server

# 활성 환경 확인
get_active_environment() {
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "moti-server-blue.*Up"; then
        echo "blue"
    elif docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "moti-server-green.*Up"; then
        echo "green"
    else
        echo "none"
    fi
}

active_env=$(get_active_environment)

if [ "$active_env" = "none" ]; then
    error "No active environment found"
fi

log "Active environment: $active_env"

# 포트 결정
if [ "$active_env" = "blue" ]; then
    port=3001
else
    port=3002
fi

# 서비스 검증
log "Validating service on port $port..."

# 컨테이너 상태 확인
container_name="moti-server-$active_env"
container_status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container_name" | awk '{print $2, $3, $4}' || echo "")

if [ -z "$container_status" ]; then
    error "Container $container_name is not found in running containers"
fi

log "Container $container_name status: $container_status"

# Up 상태인지 확인
if ! echo "$container_status" | grep -q "Up"; then
    error "Container $container_name is not in Up state. Status: $container_status"
fi

# Unhealthy 상태 경고
if echo "$container_status" | grep -q "(unhealthy)"; then
    log "Warning: Container $container_name is running but marked as unhealthy"
    log "This may indicate the health check is failing, but we'll continue validation"
elif echo "$container_status" | grep -q "(healthy)"; then
    log "Container $container_name is healthy"
else
    log "Container $container_name health status is unknown (health check may not be configured)"
fi

log "Container $container_name is running"

# 헬스체크 엔드포인트 확인
max_attempts=5
attempt=1

log "Testing both direct container access and Nginx proxy (HTTP/HTTPS)..."

while [ $attempt -le $max_attempts ]; do
    log "Service validation attempt $attempt/$max_attempts"
    
    # 직접 컨테이너 헬스체크
    if curl -f http://localhost:$port/health >/dev/null 2>&1; then
        success "Direct container health check passed"
        
        # Nginx를 통한 헬스체크 (80번 포트)
        if curl -f http://localhost/health >/dev/null 2>&1; then
            success "Nginx HTTP proxy health check passed"
            
            # Nginx 자체 헬스체크
            if curl -f http://localhost/nginx-health >/dev/null 2>&1; then
                success "Nginx HTTP server health check passed"
            else
                log "Warning: Nginx HTTP health endpoint not responding, but proxy is working"
            fi
            
            # HTTPS 헬스체크 (SSL 인증서가 있는 경우)
            if [ -f "/etc/letsencrypt/live/*/fullchain.pem" ] 2>/dev/null; then
                log "SSL certificate detected, testing HTTPS endpoints..."
                
                if curl -f -k https://localhost/health >/dev/null 2>&1; then
                    success "Nginx HTTPS proxy health check passed"
                    
                    if curl -f -k https://localhost/nginx-health >/dev/null 2>&1; then
                        success "Nginx HTTPS server health check passed"
                    else
                        log "Warning: Nginx HTTPS health endpoint not responding, but proxy is working"
                    fi
                else
                    log "Warning: HTTPS proxy check failed, but HTTP is working"
                fi
            else
                log "No SSL certificate found, skipping HTTPS validation"
            fi
            
            # 추가 검증: 응답 내용 확인
            response=$(curl -s http://localhost/health)
            if echo "$response" | grep -q "status.*ok"; then
                success "Health endpoint is responding correctly through Nginx"
                log "Health response: $response"
            else
                log "Warning: Health endpoint responding but format may be unexpected"
                log "Response: $response"
            fi
            
            # 컨테이너 로그 확인 (최근 10줄)
            log "Recent container logs:"
            docker logs --tail 10 $container_name | tee -a /var/log/codedeploy-deployment.log
            
            # HTTP to HTTPS 리다이렉트 테스트
            log "Testing HTTP to HTTPS redirect..."
            redirect_response=$(curl -I -s http://localhost/ 2>/dev/null || echo "FAILED")
            if echo "$redirect_response" | grep -q "301"; then
                success "HTTP to HTTPS redirect is working"
                redirect_url=$(echo "$redirect_response" | grep -i "location:" | sed 's/location: //i' | tr -d '\r')
                log "Redirect URL: $redirect_url"
            else
                log "Warning: HTTP to HTTPS redirect may not be configured"
            fi
            
            success "ValidateService hook completed successfully"
            exit 0
        else
            log "Warning: Direct container health check passed but Nginx HTTP proxy failed"
            log "This may indicate Nginx configuration issues"
        fi
    else
        log "Direct container health check failed"
    fi
    
    log "Service validation failed, retrying in 10 seconds..."
    sleep 10
    attempt=$((attempt + 1))
done

# 실패 시 디버깅 정보 수집
error_info() {
    log "=== DEBUGGING INFORMATION ==="
    log "Container status:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep moti-server || log "No moti-server containers found"
    
    log "All running containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}" || log "Failed to get container list"
    
    log "Container logs (last 50 lines):"
    docker logs --tail 50 $container_name 2>&1 | tee -a /var/log/codedeploy-deployment.log
    
    log "Port status:"
    netstat -tlnp | grep :$port || log "Port $port is not listening"
    netstat -tlnp | grep :80 || log "Port 80 (Nginx) is not listening"
    
    log "Nginx status:"
    systemctl status nginx || log "Failed to get Nginx status"
    
    log "Nginx configuration test:"
    nginx -t 2>&1 || log "Nginx configuration test failed"
    
    log "Nginx upstream configuration:"
    cat /etc/nginx/conf.d/upstream.conf 2>/dev/null || log "Upstream configuration not found"
    
    log "Health check endpoint tests:"
    log "Direct container test:"
    curl -v http://localhost:$port/health 2>&1 || log "Direct container health endpoint not accessible"
    log "Nginx HTTP proxy test:"
    curl -v http://localhost/health 2>&1 || log "Nginx HTTP proxy health endpoint not accessible"
    log "Nginx HTTP health test:"
    curl -v http://localhost/nginx-health 2>&1 || log "Nginx HTTP health endpoint not accessible"
    
    # HTTPS 테스트 (인증서가 있는 경우)
    if [ -f "/etc/letsencrypt/live/*/fullchain.pem" ] 2>/dev/null; then
        log "HTTPS endpoint tests:"
        log "Nginx HTTPS proxy test:"
        curl -v -k https://localhost/health 2>&1 || log "Nginx HTTPS proxy health endpoint not accessible"
        log "Nginx HTTPS health test:"
        curl -v -k https://localhost/nginx-health 2>&1 || log "Nginx HTTPS health endpoint not accessible"
    else
        log "No SSL certificate found, skipping HTTPS tests"
    fi
    
    log "=== END DEBUGGING INFORMATION ==="
}

error_info
error "Service validation failed after $max_attempts attempts"
