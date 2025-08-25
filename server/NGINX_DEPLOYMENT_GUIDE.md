# Nginx 기반 배포 가이드

## 개요

이 프로젝트는 ELB에서 Nginx로 전환하여 Blue/Green 배포를 수행합니다. CodeDeploy는 그대로 유지하면서 로드 밸런싱을 Nginx로 처리합니다.

## 아키텍처

```
Internet → Nginx (Port 80/443) → Blue/Green Container (Port 3001/3002)
```

- **Nginx**: 80번 포트(HTTP), 443번 포트(HTTPS)에서 외부 트래픽을 받아 내부 컨테이너로 프록시
- **SSL/TLS**: Let's Encrypt를 통한 자동 인증서 발급 및 갱신
- **Blue/Green 컨테이너**: 3001번 포트(blue), 3002번 포트(green)에서 번갈아 실행
- **CodeDeploy**: 배포 오케스트레이션 담당

## 주요 컴포넌트

### 1. Nginx 설정

#### `/nginx/nginx.conf`

- 메인 Nginx 설정 파일
- 80번 포트(HTTP)에서 리스닝, HTTPS로 리다이렉트
- Upstream 백엔드 설정
- Let's Encrypt ACME challenge 지원
- 헬스체크 엔드포인트 (`/nginx-health`)

#### `/nginx/ssl.conf`

- HTTPS/SSL 설정 파일
- 443번 포트에서 리스닝
- 현대적인 SSL/TLS 설정 (TLS 1.2/1.3)
- 보안 헤더 설정 (HSTS, XSS Protection 등)
- OCSP Stapling 지원

#### `/etc/nginx/conf.d/upstream.conf` (런타임 생성)

- 동적으로 업데이트되는 업스트림 설정
- Blue/Green 배포 시 새로운 포트로 업데이트

### 2. 배포 스크립트

#### `scripts/ssl-manager.sh` (새로 추가)

- `issue`: 새 SSL 인증서 발급
- `renew`: 기존 인증서 갱신
- `check`: 인증서 상태 확인
- `setup-auto`: 자동 갱신 크론잡 설정

#### `scripts/nginx-utils.sh`

- `update_nginx_upstream()`: Nginx 업스트림 설정 업데이트
- `check_nginx_health()`: Nginx 및 백엔드 헬스체크 (HTTP/HTTPS)

#### `scripts/application_start.sh` (수정됨)

- ELB 관련 코드 제거
- Nginx 기반 Blue/Green 배포 로직 추가
- 헬스체크 실패 시 자동 롤백

#### `scripts/before_install.sh` (수정됨)

- Nginx 설치 및 초기 설정
- Certbot (Let's Encrypt) 설치
- SSL 설정 파일 배포
- 업스트림 설정 파일 생성

### 3. GitHub Actions

#### `.github/workflows/deploy.yml` (수정됨)

- ALB Target Group ARN 제거
- Nginx 설정 파일 배포 번들에 포함

## SSL/TLS 설정

### Let's Encrypt 인증서

이 프로젝트는 Let's Encrypt를 사용하여 무료 SSL 인증서를 자동으로 발급하고 관리합니다.

#### 지원 도메인

- **Production**: `api.moti.work`
- **Stage**: `api.stage.moti.work`

#### 인증서 발급 프로세스

1. **HTTP-01 Challenge**: `.well-known/acme-challenge/` 경로를 통한 도메인 검증
2. **자동 발급**: 배포 시 자동으로 인증서 발급 시도
3. **Nginx 설정 업데이트**: 인증서 발급 후 HTTPS 설정 활성화
4. **자동 갱신**: 매일 새벽 2시에 인증서 상태 확인 및 갱신

#### SSL 설정 특징

- **TLS 1.2/1.3**: 최신 TLS 프로토콜 지원
- **강화된 암호화**: 안전한 암호화 스위트 사용
- **HSTS**: HTTP Strict Transport Security 헤더
- **보안 헤더**: XSS Protection, Content-Type Options 등
- **OCSP Stapling**: 인증서 검증 성능 향상

### SSL 관리 명령어

```bash
# 새 인증서 발급
/opt/moti-server/scripts/ssl-manager.sh issue

# 인증서 갱신
/opt/moti-server/scripts/ssl-manager.sh renew

# 인증서 상태 확인
/opt/moti-server/scripts/ssl-manager.sh check

# 자동 갱신 설정
/opt/moti-server/scripts/ssl-manager.sh setup-auto
```

## 배포 플로우

1. **GitHub Actions**: Docker 이미지 빌드 및 ECR 푸시
2. **CodeDeploy 시작**: S3에서 배포 번들 다운로드
3. **BeforeInstall**: Nginx, Certbot 설치 및 초기 설정
4. **ApplicationStart**:
   - 새로운 컨테이너 시작 (Blue/Green)
   - 컨테이너 헬스체크
   - Nginx 업스트림 업데이트
   - Nginx 헬스체크 (HTTP/HTTPS)
   - SSL 인증서 발급/갱신
   - 기존 컨테이너 종료
5. **ValidateService**: HTTP/HTTPS 엔드포인트 최종 검증

## 헬스체크

### 컨테이너 헬스체크

```bash
curl -f http://localhost:$NEW_PORT/health
```

### Nginx 헬스체크

```bash
# Nginx HTTP 헬스체크
curl -f http://localhost/nginx-health

# Nginx HTTPS 헬스체크
curl -f https://localhost/nginx-health

# HTTP 백엔드 연결 헬스체크
curl -f http://localhost/health

# HTTPS 백엔드 연결 헬스체크
curl -f https://localhost/health
```

### SSL 인증서 헬스체크

```bash
# 인증서 만료일 확인
openssl x509 -enddate -noout -in /etc/letsencrypt/live/DOMAIN/fullchain.pem

# 인증서 자동 갱신 테스트
certbot renew --dry-run
```

## 실패 시 롤백

- 새 컨테이너가 헬스체크에 실패하면 자동으로 제거
- Nginx 설정 업데이트 실패 시 배포 중단
- 기존 환경은 보존되어 서비스 중단 방지

## 수동 운영

### Nginx 상태 확인

```bash
systemctl status nginx
nginx -t  # 설정 검증
```

### 현재 업스트림 확인

```bash
cat /etc/nginx/conf.d/upstream.conf
```

### SSL 인증서 상태 확인

```bash
# 인증서 목록
certbot certificates

# 특정 도메인 인증서 상태
/opt/moti-server/scripts/ssl-manager.sh check
```

### 수동 업스트림 변경

```bash
# 3002번 포트로 변경
echo "upstream backend { server 127.0.0.1:3002; }" > /etc/nginx/conf.d/upstream.conf
nginx -t && systemctl reload nginx
```

### 수동 SSL 인증서 갱신

```bash
# 인증서 갱신
/opt/moti-server/scripts/ssl-manager.sh renew

# 강제 갱신 (테스트용)
certbot renew --force-renewal
```

### 로그 확인

```bash
# Nginx 로그
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# SSL 관리 로그
tail -f /var/log/ssl-management.log

# 배포 로그
tail -f /var/log/codedeploy-deployment.log

# Let's Encrypt 로그
tail -f /var/log/letsencrypt/letsencrypt.log
```

## 환경 변수 (제거됨)

다음 환경 변수들은 더 이상 필요하지 않습니다:

- `ALB_TARGET_GROUP_ARN`

## 마이그레이션 가이드

### ELB에서 Nginx로 전환 시 체크리스트

1. **인프라 변경**:
   - [ ] ALB 대신 Nginx가 설치된 EC2 인스턴스 사용
   - [ ] 80번 포트(HTTP), 443번 포트(HTTPS)가 외부에 노출되도록 보안그룹 설정
   - [ ] 도메인 DNS A 레코드가 EC2 인스턴스 IP를 가리키도록 설정
   - [ ] ALB Target Group 삭제 (선택사항)

2. **코드 변경**:
   - [ ] `nginx/` 디렉토리 추가 (nginx.conf, ssl.conf)
   - [ ] `scripts/nginx-utils.sh` 추가
   - [ ] `scripts/ssl-manager.sh` 추가
   - [ ] `scripts/application_start.sh` 수정
   - [ ] `scripts/before_install.sh` 수정
   - [ ] `scripts/validate_service.sh` 수정
   - [ ] GitHub Actions workflow 수정

3. **환경 변수 정리**:
   - [ ] GitHub Secrets에서 `ALB_TARGET_GROUP_ARN` 제거

4. **테스트**:
   - [ ] 로컬에서 Nginx 설정 테스트
   - [ ] Stage 환경에서 배포 테스트
   - [ ] Blue/Green 스위칭 테스트
   - [ ] SSL 인증서 발급/갱신 테스트
   - [ ] HTTP → HTTPS 리다이렉트 테스트
   - [ ] 헬스체크 실패 시 롤백 테스트

## 장단점

### 장점

- **비용 절감**: ALB 비용 제거
- **단순성**: 단일 인스턴스에서 모든 것 관리
- **제어권**: Nginx 설정 완전 제어 가능
- **성능**: 로컬 프록시로 인한 지연시간 감소
- **보안**: 무료 SSL 인증서 자동 관리
- **SEO**: HTTPS 지원으로 검색 엔진 최적화

### 단점

- **단일 장애점**: EC2 인스턴스 장애 시 서비스 중단
- **확장성**: 수동 스케일링 필요
- **고가용성**: 단일 인스턴스로 인한 HA 제한
- **SSL 의존성**: Let's Encrypt 서비스 의존

## 트러블슈팅

### 자주 발생하는 문제

1. **Nginx 설정 오류**

   ```bash
   nginx -t  # 설정 검증
   systemctl status nginx
   ```

2. **업스트림 연결 실패**

   ```bash
   # 컨테이너 상태 확인
   docker ps
   # 포트 확인
   netstat -tlnp | grep :300
   ```

3. **SSL 인증서 문제**

   ```bash
   # Let's Encrypt 로그 확인
   tail -f /var/log/letsencrypt/letsencrypt.log
   # DNS 설정 확인
   nslookup your-domain.com
   # 도메인 접근성 확인
   curl -I http://your-domain.com/.well-known/acme-challenge/test
   ```

4. **배포 실패**
   ```bash
   # CodeDeploy 로그 확인
   tail -f /var/log/codedeploy-deployment.log
   # Nginx 에러 로그 확인
   tail -f /var/log/nginx/error.log
   # SSL 관리 로그 확인
   tail -f /var/log/ssl-management.log
   ```

### SSL 관련 문제해결

1. **인증서 발급 실패**
   - DNS 설정이 올바른지 확인
   - 80번 포트가 외부에서 접근 가능한지 확인
   - 도메인이 이미 다른 곳에서 사용 중인지 확인

2. **HTTPS 접속 불가**
   - 443번 포트 방화벽 설정 확인
   - 인증서 파일 존재 여부 확인
   - Nginx SSL 설정 문법 확인

3. **인증서 갱신 실패**
   - 크론잡 설정 확인: `crontab -l`
   - 수동 갱신 테스트: `certbot renew --dry-run`
   - 로그 파일에서 에러 메시지 확인
