import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailContentWriter } from './emailContent.writer';
import { SendTemplateEmailInput } from './interface/email-template.interface';
import { MailDataRequired, MailService } from '@sendgrid/mail';
import { SENDGRID_CLIENT } from 'src/email/sendGrid.provider';

export interface SendMailInput {
  to: string | string[];
  subject: string;
  text?: string; // 선택
  html?: string; // 선택(있으면 HTML 우선)
  from?: string; // 기본값: env SES_FROM
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

@Injectable()
export class EmailService {
  constructor(
    @Inject(SENDGRID_CLIENT)
    private readonly sendGridClient: MailService,
    private readonly config: ConfigService,
    private readonly emailContentWriter: EmailContentWriter,
  ) {}

  /**
   * 템플릿을 사용하여 이메일을 발송합니다
   */
  async sendTemplateEmail(input: SendTemplateEmailInput) {
    const emailContent = this.emailContentWriter.generateEmailContent(input);
    return this.sendMail(emailContent);
  }

  /**
   * 이메일 인증 메일을 발송합니다
   */
  async sendEmailVerification(params: {
    to: string;
    verificationUrl: string;
    expirationTime: number;
  }) {
    const content =
      this.emailContentWriter.createEmailVerificationContent(params);
    return this.sendMail(content);
  }

  async sendSignInCode(params: {
    to: string;
    code: string;
    expirationTime: number;
  }) {
    const content = this.emailContentWriter.createSignInCodeContent(params);
    return this.sendMail(content);
  }

  /**
   * 비밀번호 재설정 메일을 발송합니다
   */
  async sendPasswordReset(params: {
    to: string;
    username: string;
    resetUrl: string;
    expirationTime: number;
  }) {
    const content = this.emailContentWriter.createPasswordResetContent(params);
    return this.sendMail(content);
  }

  /**
   * 환영 메시지를 발송합니다
   */
  async sendWelcomeEmail(params: { to: string; username: string }) {
    const content = this.emailContentWriter.createWelcomeContent({
      ...params,
      homeUrl: this.config.get<string>('app.serviceUrl') as string,
    });
    return this.sendMail(content);
  }

  /**
   * 일반 알림 메일을 발송합니다
   */
  async sendNotification(params: {
    to: string;
    username: string;
    notificationTitle: string;
    notificationMessage: string;
    notificationType?: string;
    actionUrl?: string;
    actionText?: string;
    additionalInfo?: string;
  }) {
    const content = this.emailContentWriter.createNotificationContent(params);
    return this.sendMail(content);
  }

  /**
   * 이메일을 발송합니다
   */
  private async sendMail(input: SendMailInput) {
    const from =
      input.from || (this.config.get<string>('sendGrid.from') as string);
    const to = Array.isArray(input.to) ? input.to : [input.to];
    const cc = input.cc
      ? Array.isArray(input.cc)
        ? input.cc
        : [input.cc]
      : [];
    const bcc = input.bcc
      ? Array.isArray(input.bcc)
        ? input.bcc
        : [input.bcc]
      : [];
    const replyTo = input.replyTo;

    // HTML이 있으면 Html로, 없으면 Text로 본문 구성
    const Body = input.html ? { html: input.html } : { text: input.text ?? '' };

    const data: MailDataRequired = {
      from,
      to,
      subject: input.subject,
      ...Body,
      cc,
      bcc,
      replyTo,
    };

    return this.sendGridClient.send(data);
  }
}
