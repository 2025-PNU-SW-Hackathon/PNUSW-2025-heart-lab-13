import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailContentWriter } from './emailContent.writer';
import { EmailTemplateService } from './email-template.service';
import { SendGridProvider } from 'src/email/sendGrid.provider';

@Module({
  imports: [],
  providers: [
    EmailService,
    EmailContentWriter,
    EmailTemplateService,
    SendGridProvider,
  ],
  exports: [EmailService, EmailContentWriter, EmailTemplateService],
})
export class EmailModule {}
