import {
  EmailTemplate,
  EmailTemplateType,
} from 'src/email/interface/email-template.interface';
import { emailVerificationTemplate } from 'src/email/templates/email-verification.template';
import { notificationTemplate } from 'src/email/templates/notification.template';
import { passwordResetTemplate } from 'src/email/templates/password-reset.template';
import { signInCodeTemplate } from 'src/email/templates/sign-in-code.template';
import { welcomeTemplate } from 'src/email/templates/welcome.template';

export const emailTemplates: Record<EmailTemplateType, EmailTemplate> = {
  [EmailTemplateType.EMAIL_VERIFICATION]: emailVerificationTemplate,
  [EmailTemplateType.PASSWORD_RESET]: passwordResetTemplate,
  [EmailTemplateType.WELCOME]: welcomeTemplate,
  [EmailTemplateType.NOTIFICATION]: notificationTemplate,
  [EmailTemplateType.SIGN_IN_CODE]: signInCodeTemplate,
};

export * from './email-verification.template';
export * from './password-reset.template';
export * from './welcome.template';
export * from './notification.template';
export * from './sign-in-code.template';
