import { Injectable } from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import {
  EmailTemplateContext,
  EmailTemplateType,
  SendTemplateEmailInput,
} from './interface/email-template.interface';

@Injectable()
export class EmailContentWriter {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  /**
   * 템플릿 기반으로 이메일 컨텐츠를 생성합니다
   */
  generateEmailContent(input: SendTemplateEmailInput) {
    // 공통 컨텍스트와 사용자 컨텍스트를 병합
    const context: EmailTemplateContext = {
      ...this.emailTemplateService.getCommonContext(),
      ...input.context,
    };

    // 템플릿 렌더링
    const renderedContent = this.emailTemplateService.renderTemplate(
      input.templateType,
      context,
    );

    return {
      to: input.to,
      subject: renderedContent.subject,
      html: renderedContent.html,
      text: renderedContent.text,
      from: input.from,
      replyTo: input.replyTo,
      cc: input.cc,
      bcc: input.bcc,
    };
  }

  /**
   * 이메일 회원가입 컨텐츠 생성
   */
  createEmailVerificationContent(params: {
    to: string;
    verificationUrl: string;
    expirationTime: number;
  }) {
    return this.generateEmailContent({
      to: params.to,
      templateType: EmailTemplateType.EMAIL_VERIFICATION,
      context: {
        verificationUrl: params.verificationUrl,
        expirationTime: params.expirationTime || 30,
      },
    });
  }

  createSignInCodeContent(params: {
    to: string;
    code: string;
    expirationTime: number;
  }) {
    return this.generateEmailContent({
      to: params.to,
      templateType: EmailTemplateType.SIGN_IN_CODE,
      context: {
        code: params.code,
        expirationTime: params.expirationTime || 5,
      },
    });
  }

  /**
   * 비밀번호 재설정용 컨텐츠 생성
   */
  createPasswordResetContent(params: {
    to: string;
    username: string;
    resetUrl: string;
    expirationTime: number;
  }) {
    return this.generateEmailContent({
      to: params.to,
      templateType: EmailTemplateType.PASSWORD_RESET,
      context: {
        username: params.username,
        resetUrl: params.resetUrl,
        expirationTime: params.expirationTime,
      },
    });
  }

  /**
   * 환영 메시지용 컨텐츠 생성
   */
  createWelcomeContent(params: {
    to: string;
    username: string;
    homeUrl: string;
  }) {
    return this.generateEmailContent({
      to: params.to,
      templateType: EmailTemplateType.WELCOME,
      context: {
        username: params.username,
        homeUrl: params.homeUrl,
      },
    });
  }

  /**
   * 일반 알림용 컨텐츠 생성
   */
  createNotificationContent(params: {
    to: string;
    username: string;
    notificationTitle: string;
    notificationMessage: string;
    notificationType?: string;
    actionUrl?: string;
    actionText?: string;
    additionalInfo?: string;
  }) {
    return this.generateEmailContent({
      to: params.to,
      templateType: EmailTemplateType.NOTIFICATION,
      context: {
        username: params.username,
        notificationTitle: params.notificationTitle,
        notificationMessage: params.notificationMessage,
        notificationType: params.notificationType || '일반',
        actionUrl: params.actionUrl,
        actionText: params.actionText || '자세히 보기',
        additionalInfo: params.additionalInfo,
      },
    });
  }
}
