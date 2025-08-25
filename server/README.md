<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

### AWS CodeDeploy 기반 자동 배포

이 프로젝트는 AWS CodeDeploy와 GitHub Actions를 활용하여 Docker 컨테이너의 자동화된 Blue/Green 배포를 수행합니다.

#### 주요 특징

- **S3 기반 배포**: 배포 번들을 S3에 저장하여 Private 리포지토리 지원
- **Secrets Manager 통합**: 민감한 환경 변수를 안전하게 관리
- **Blue/Green 배포**: 무중단 배포 전략
- **ALB 자동 전환**: 타겟 그룹을 통한 트래픽 전환
- **자동 헬스체크**: 배포 검증 및 자동 롤백

#### 배포 프로세스

1. **브랜치별 자동 배포**:
   - `stage` 브랜치 → Stage 환경 자동 배포
   - `main/master` 브랜치 → Production 환경 자동 배포

2. **배포 단계**:
   1. Docker 이미지 빌드 및 ECR 푸시
   2. 배포 정보를 포함한 S3 번들 생성
   3. CodeDeploy를 통한 S3 기반 배포
   4. EC2에서 ECR 이미지 pull 및 Blue/Green 배포
   5. 헬스체크 및 ALB 타겟 그룹 전환
   6. 이전 컨테이너 정리

#### 설정 가이드

**1. AWS 리소스 설정**:
상세한 설정 방법은 [CODEDEPLOY_SETUP_GUIDE.md](./CODEDEPLOY_SETUP_GUIDE.md)를 참조하세요.

**2. GitHub Repository Secrets**:
```
AWS_ACCESS_KEY_ID: GitHub Actions용 AWS 액세스 키
AWS_SECRET_ACCESS_KEY: GitHub Actions용 AWS 시크릿 키
AWS_DEFAULT_REGION: AWS 리전 (예: ap-northeast-2)
ECR_REPOSITORY_NAME: ECR 리포지토리 이름
CODEDEPLOY_APPLICATION_NAME: moti-server
S3_DEPLOYMENT_BUCKET: 배포 번들 저장용 S3 버킷
DEPLOYMENT_GROUP_NAME: CodeDeploy 배포 그룹 이름
ALB_TARGET_GROUP_ARN: ALB 타겟 그룹 ARN (Stage/Production 공통)
SLACK_WEBHOOK_URL: Slack 알림용 웹훅 URL (선택사항)
```

**3. AWS Secrets Manager 설정**:

각 환경별로 Secrets Manager에 다음 시크릿을 설정해야 합니다:

**Stage Environment (`moti/stage`):**
```json
{
  "GITHUB_CLIENT_ID": "stage-github-client-id",
  "GITHUB_CLIENT_SECRET": "stage-github-client-secret",
  "PASSWORD_SALT_ROUNDS": "10",
  "JWT_SECRET": "stage-jwt-secret-key",
  "DATABASE_HOST": "stage-db-host",
  "DATABASE_USERNAME": "stage-db-user",
  "DATABASE_PASSWORD": "stage-db-password",
  "DATABASE_NAME": "stage-db-name"
}
```

**Production Environment (`moti/production`):**
```json
{
  "GITHUB_CLIENT_ID": "prod-github-client-id",
  "GITHUB_CLIENT_SECRET": "prod-github-client-secret",
  "PASSWORD_SALT_ROUNDS": "12",
  "JWT_SECRET": "prod-jwt-secret-key",
  "DATABASE_HOST": "prod-db-host",
  "DATABASE_USERNAME": "prod-db-user",
  "DATABASE_PASSWORD": "prod-db-password",
  "DATABASE_NAME": "prod-db-name"
}
```

#### 로컬 개발 환경

환경 변수 설정 (`.env` 파일):

```bash
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=moti_dev
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=true
GITHUB_CLIENT_ID=your-dev-github-client-id
GITHUB_CLIENT_SECRET=your-dev-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
JWT_SECRET=your-dev-jwt-secret-key
JWT_EXPIRES_IN=1d
PASSWORD_SALT_ROUNDS=10
```
#### 배포 구조

**파일 구조**:
- `/opt/moti-server/deployment-info.json`: 배포 환경 정보
- `/opt/moti-server/docker-image.txt`: Docker 이미지 URI
- `/opt/moti-server/.env`: 런타임 환경 변수 (Secrets Manager에서 생성)
- `/opt/moti-server/scripts/`: CodeDeploy 훅 스크립트

**데이터 소스 우선순위**:
1. **배포 정보**: S3 배포 번들의 `deployment-info.json`
2. **Docker 이미지**: S3 배포 번들의 `docker-image.txt` 
3. **민감한 환경 변수**: AWS Secrets Manager
4. **ALB 설정**: 배포 정보에 포함된 Target Group ARN

**환경 결정 로직**:
1. 배포 정보 파일에서 환경 확인
2. Docker 이미지 태그에서 환경 추론 (`:stage`, `:production`)
3. 기본값: `stage`

#### 배포 명령어

**자동 배포**:

```bash
# Stage 환경에 배포
git checkout stage
git push origin stage

# Production 환경에 배포
git checkout main
git push origin main
```

**수동 배포** (EC2 서버에서 직접 실행):

```bash
# 수동 배포는 지원되지 않습니다.
# 모든 배포는 GitHub Actions를 통해 실행됩니다.

# 배포 상태 확인 (CodeDeploy)
aws deploy get-deployment --deployment-id <deployment-id>

# 컨테이너 상태 확인
docker ps
sudo docker-compose ps

# 배포 로그 확인
sudo tail -f /var/log/codedeploy-deployment.log
```

#### 헬스체크 엔드포인트

애플리케이션은 `/health` 엔드포인트를 제공합니다:

```bash
curl http://localhost:3000/health
```

응답 예시:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

#### 모니터링

- **컨테이너 상태**: `docker ps`
- **애플리케이션 로그**: `docker logs moti-server-blue` 또는 `docker logs moti-server-green`
- **배포 로그**: `sudo tail -f /var/log/codedeploy-deployment.log`
- **시스템 리소스**: `docker stats`
- **환경 변수 확인**: `cat /opt/moti-server/.env` (권한 있는 사용자만)

#### 트러블슈팅

**배포 실패 시**:

1. GitHub Actions 로그 확인
2. CodeDeploy 콘솔에서 배포 상태 확인
3. EC2에서 배포 로그 확인: `/var/log/codedeploy-deployment.log`
4. Secrets Manager 설정 확인
5. ALB Target Group 상태 확인

**일반적인 문제**:

- **환경 변수 누락**: Secrets Manager 설정 확인
- **Docker 이미지 Pull 실패**: ECR 권한 및 이미지 존재 여부 확인
- **헬스체크 실패**: 애플리케이션 시작 로그 및 환경 변수 확인
- **ALB 연결 실패**: Target Group ARN 및 보안 그룹 설정 확인
2. EC2 서버의 Docker 로그 확인
3. 헬스체크 엔드포인트 응답 확인
4. 필요시 수동 롤백 실행

**롤백 방법**:

```bash
./deploy.sh rollback
```

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
