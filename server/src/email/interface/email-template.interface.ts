export interface EmailTemplateContext {
  [key: string]: any;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export enum EmailTemplateType {
  EMAIL_VERIFICATION = 'email-verification',
  PASSWORD_RESET = 'password-reset',
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
  SIGN_IN_CODE = 'sign-in-code',
}

export interface SendTemplateEmailInput {
  to: string | string[];
  templateType: EmailTemplateType;
  context: EmailTemplateContext;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}
