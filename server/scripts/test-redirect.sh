#!/bin/bash

# HTTP to HTTPS 리다이렉트 테스트 스크립트

# 로그 함수
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# 리다이렉트 테스트 함수
test_redirect() {
    local domain=${1:-"localhost"}
    local test_path=${2:-"/health"}
    
    log "Testing HTTP to HTTPS redirect for domain: $domain"
    
    # HTTP 요청으로 리다이렉트 확인
    log "Testing: http://$domain$test_path"
    
    response=$(curl -I -s http://$domain$test_path 2>/dev/null || echo "FAILED")
    
    if echo "$response" | grep -q "301"; then
        redirect_url=$(echo "$response" | grep -i "location:" | sed 's/location: //i' | tr -d '\r')
        log "✓ HTTP 301 redirect detected"
        log "  Redirect to: $redirect_url"
        
        # HTTPS 엔드포인트 테스트
        if echo "$redirect_url" | grep -q "https://"; then
            log "✓ Redirecting to HTTPS correctly"
            
            # HTTPS 접근 테스트 (자체 서명 인증서 허용)
            https_response=$(curl -I -s -k "$redirect_url" 2>/dev/null || echo "FAILED")
            
            if echo "$https_response" | grep -q "200"; then
                log "✓ HTTPS endpoint is accessible"
                log "✓ HTTP to HTTPS redirect working correctly!"
                return 0
            else
                log "✗ HTTPS endpoint is not accessible"
                log "  Response: $https_response"
                return 1
            fi
        else
            log "✗ Not redirecting to HTTPS"
            return 1
        fi
    elif echo "$response" | grep -q "200"; then
        log "✗ No redirect detected - serving content over HTTP"
        log "  This may be intentional for health checks"
        return 1
    else
        log "✗ Unexpected response or connection failed"
        log "  Response: $response"
        return 1
    fi
}

# 다양한 경로 테스트
test_endpoints() {
    local domain=${1:-"localhost"}
    
    log "=== HTTP to HTTPS Redirect Test ==="
    log "Testing domain: $domain"
    log "=========================================="
    
    # 루트 경로 테스트
    log "\n1. Testing root path redirect..."
    test_redirect "$domain" "/"
    
    # 헬스체크 경로는 리다이렉트되지 않을 수 있음
    log "\n2. Testing health check path..."
    response=$(curl -I -s http://$domain/nginx-health 2>/dev/null || echo "FAILED")
    if echo "$response" | grep -q "200"; then
        log "✓ Health check available over HTTP (expected for monitoring)"
    else
        log "ℹ Health check may be redirected or unavailable"
    fi
    
    # API 경로 테스트
    log "\n3. Testing API path redirect..."
    test_redirect "$domain" "/api/test"
    
    # Let's Encrypt challenge 경로 테스트 (리다이렉트되지 않아야 함)
    log "\n4. Testing Let's Encrypt challenge path..."
    response=$(curl -I -s http://$domain/.well-known/acme-challenge/test 2>/dev/null || echo "FAILED")
    if echo "$response" | grep -q "404\|200"; then
        log "✓ ACME challenge path available over HTTP (required for SSL)"
    else
        log "ℹ ACME challenge path may be redirected (check SSL setup)"
    fi
    
    log "\n=========================================="
    log "Test completed"
}

# 메인 실행 로직
main() {
    case "${1:-}" in
        "test")
            domain=${2:-"localhost"}
            test_endpoints "$domain"
            ;;
        "check")
            domain=${2:-"localhost"}
            path=${3:-"/"}
            test_redirect "$domain" "$path"
            ;;
        *)
            echo "Usage: $0 {test|check} [domain] [path]"
            echo "  test [domain]      - Run comprehensive redirect tests"
            echo "  check [domain] [path] - Check specific path redirect"
            echo ""
            echo "Examples:"
            echo "  $0 test localhost"
            echo "  $0 test api.moti.work"
            echo "  $0 check localhost /health"
            exit 1
            ;;
    esac
}

main "$@"
