import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UrlBuilderHelper {
  constructor(private readonly configService: ConfigService) {}

  buildVerificationUrl(params: { email: string; token: string }): string {
    const baseUrl = this.configService.get<string>('app.serviceUrl');
    return `${baseUrl}/verify-email?email=${params.email}&token=${params.token}`;
  }
}
