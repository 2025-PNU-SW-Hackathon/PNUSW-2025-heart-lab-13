#!/bin/bash

set -e

# 로그 함수
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/codedeploy-deployment.log
}

error() {
    echo "[ERROR] $1" | tee -a /var/log/codedeploy-deployment.log
}

log "Starting ApplicationStop hook..."

cd /opt/moti-server

# ApplicationStop의 역할: 배포 시작 시 정리 작업만 수행
# Blue/Green 로직은 ApplicationStart에서 처리하므로 여기서는 최소한만 처리

# 오래된 Docker 이미지 정리 (디스크 공간 확보)
log "Cleaning up old Docker images to free disk space..."
docker image prune -f 2>/dev/null || true

# 중단된 컨테이너가 있다면 정리
log "Cleaning up any stopped containers..."
docker container prune -f 2>/dev/null || true

# 사용하지 않는 네트워크 정리
log "Cleaning up unused networks..."
docker network prune -f 2>/dev/null || true

log "ApplicationStop hook completed successfully (cleanup only)"
