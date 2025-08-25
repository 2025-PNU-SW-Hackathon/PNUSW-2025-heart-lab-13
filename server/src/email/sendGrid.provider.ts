import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGridClient from '@sendgrid/mail';

export const SENDGRID_CLIENT = 'SENDGRID_CLIENT';

export const SendGridProvider: Provider = {
  provide: SENDGRID_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const apiKey = config.get<string>('sendGrid.apiKey') as string;

    const sgClient = SendGridClient;
    sgClient.setApiKey(apiKey);

    return sgClient;
  },
};
