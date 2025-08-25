#!/bin/bash

# EC2 서버 초기 설정 스크립트 (CodeDeploy 기반 - Amazon Linux)
# 이 스크립트는 Amazon Linux EC2 인스턴스에서 한 번만 실행하면 됩니다.

set -e

echo "🚀 Amazon Linux EC2 서버 초기 설정을 시작합니다..."

# 시스템 업데이트
echo "📦 시스템 패키지 업데이트..."
sudo yum update -y

# 필수 패키지 설치
echo "📚 필수 패키지 설치..."
sudo yum install -y git curl unzip ruby wget

# Docker 설치
echo "🐳 Docker 설치..."
sudo yum install -y docker
sudo usermod -aG docker $USER
sudo systemctl start docker
sudo systemctl enable docker

# Docker Compose 설치
echo "🔧 Docker Compose 설치..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# AWS CLI 설치
echo "☁️ AWS CLI 설치..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# CodeDeploy Agent 설치
echo "📋 CodeDeploy Agent 설치..."
cd /home/ec2-user
wget https://aws-codedeploy-ap-northeast-2.s3.ap-northeast-2.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo systemctl start codedeploy-agent
sudo systemctl enable codedeploy-agent

# 배포 디렉토리 생성 및 권한 설정
echo "📁 배포 디렉토리 설정..."
sudo mkdir -p /opt/moti-server
sudo chown -R ec2-user:ec2-user /opt/moti-server

# 로그 디렉토리 생성
echo "📝 로그 디렉토리 생성..."
sudo mkdir -p /var/log/moti-server
sudo chown -R ec2-user:ec2-user /var/log/moti-server

# CodeDeploy 로그 파일 생성
sudo touch /var/log/codedeploy-deployment.log
sudo chown ec2-user:ec2-user /var/log/codedeploy-deployment.log

# crontab 설정 (로그 로테이션)
echo "⏰ 로그 로테이션 설정..."
(crontab -l 2>/dev/null; echo "0 2 * * * docker system prune -f") | crontab -

echo "✅ Amazon Linux EC2 서버 초기 설정이 완료되었습니다!"
echo ""
echo "다음 단계:"
echo "1. EC2 인스턴스에 IAM 역할(EC2CodeDeployInstanceProfile)을 연결하세요"
echo "2. EC2 인스턴스에 다음 태그를 설정하세요:"
echo "   - Environment: stage (또는 production)"
echo "3. GitHub Repository에서 다음 시크릿을 설정하세요:"
echo "   - AWS_ACCESS_KEY_ID: GitHub Actions용 AWS 액세스 키"
echo "   - AWS_SECRET_ACCESS_KEY: GitHub Actions용 AWS 시크릿 키"
echo "   - AWS_DEFAULT_REGION: AWS 리전 (예: ap-northeast-2)"
echo "   - ECR_REPOSITORY_NAME: ECR 리포지토리 이름"
echo "   - CODEDEPLOY_APPLICATION_NAME: moti-server"
echo "4. GitHub Environment(stage/production)에서 다음 시크릿을 설정하세요:"
echo "   - STAGE_DEPLOYMENT_GROUP_NAME: stage"
echo "   - PROD_DEPLOYMENT_GROUP_NAME: production"
echo "   - ALB_TARGET_GROUP_ARN: ALB 타겟 그룹 ARN (선택사항)"
echo "   - SLACK_WEBHOOK: Slack 웹훅 URL (선택사항)"
echo "5. 로그아웃 후 다시 로그인하여 Docker 그룹 권한을 적용하세요"
echo "6. AWS 리소스 설정: CODEDEPLOY_SETUP_GUIDE.md를 참조하세요"
echo "7. stage 브랜치에 코드를 푸시하여 배포를 테스트하세요"
