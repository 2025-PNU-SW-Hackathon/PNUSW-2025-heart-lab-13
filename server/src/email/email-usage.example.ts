/**
 * 이메일 템플릿 시스템 사용 예시
 *
 * 이 파일은 새로운 이메일 템플릿 시스템을 사용하는 방법을 보여줍니다.
 */

import { Injectable } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTemplateType } from './interface/email-template.interface';

@Injectable()
export class EmailUsageExample {
  constructor(private readonly emailService: EmailService) {}

  /**
   * 1. 이메일 인증 메일 발송 예시
   */
  async sendEmailVerificationExample() {
    await this.emailService.sendEmailVerification({
      to: 'user@example.com',
      verificationUrl: 'https://app.moti.work/verify?token=abc123',
      expirationTime: 30, // 30분
    });
  }

  /**
   * 2. 인증 코드를 사용한 이메일 인증 발송 예시
   */
  async sendEmailVerificationWithCodeExample() {
    await this.emailService.sendEmailVerification({
      to: 'user@example.com',
      verificationUrl: 'https://app.moti.work/verify?token=abc123',
      expirationTime: 30,
    });
  }

  /**
   * 3. 비밀번호 재설정 메일 발송 예시
   */
  async sendPasswordResetExample() {
    await this.emailService.sendPasswordReset({
      to: 'user@example.com',
      username: '홍길동',
      resetUrl: 'https://app.moti.work/reset-password?token=xyz789',
      expirationTime: 15, // 15분
    });
  }

  /**
   * 4. 환영 메시지 발송 예시
   */
  async sendWelcomeEmailExample() {
    await this.emailService.sendWelcomeEmail({
      to: 'user@example.com',
      username: '홍길동',
    });
  }

  /**
   * 5. 일반 알림 메일 발송 예시
   */
  async sendNotificationExample() {
    await this.emailService.sendNotification({
      to: 'user@example.com',
      username: '홍길동',
      notificationTitle: '새로운 PR이 생성되었습니다',
      notificationMessage:
        'your-project 저장소에 새로운 풀 리퀘스트가 생성되었습니다.',
      notificationType: 'GitHub',
      actionUrl: 'https://github.com/your-org/your-project/pull/123',
      actionText: 'PR 확인하기',
      additionalInfo: 'PR 작성자: @developer123',
    });
  }

  /**
   * 6. 템플릿을 직접 사용하는 방법 (고급 사용법)
   */
  async sendCustomTemplateExample() {
    await this.emailService.sendTemplateEmail({
      to: 'user@example.com',
      templateType: EmailTemplateType.EMAIL_VERIFICATION,
      context: {
        username: '홍길동',
        verificationUrl: 'https://app.moti.work/verify?token=abc123',
        expirationTime: 30,
        // 추가 커스텀 변수들
        companyName: 'Moti Corp',
        supportPhone: '02-1234-5678',
      },
    });
  }

  /**
   * 7. 복수의 수신자에게 발송하는 예시
   */
  async sendToMultipleRecipientsExample() {
    await this.emailService.sendTemplateEmail({
      to: ['user1@example.com', 'user2@example.com'],
      templateType: EmailTemplateType.NOTIFICATION,
      context: {
        username: '팀원들',
        notificationTitle: '시스템 점검 안내',
        notificationMessage:
          '내일 오전 2시부터 4시까지 시스템 점검이 예정되어 있습니다.',
        notificationType: '시스템',
        actionUrl: 'https://moti.com/maintenance',
        actionText: '자세한 내용 보기',
      },
    });
  }
}
