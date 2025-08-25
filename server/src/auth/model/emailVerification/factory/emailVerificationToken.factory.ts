import { Injectable } from '@nestjs/common';
import { EMAIL_VERIFICATION_TOKEN_EXPIRES_IN } from 'src/auth/model/emailVerification/emailVerification.const';
import {
  EmailVerificationToken,
  EmailVerificationTokenConstructorParams,
} from 'src/auth/model/emailVerification/emailVerificationToken.entity';
import { Factory } from 'src/common/factory';

@Injectable()
export class EmailVerificationTokenFactory extends Factory<
  EmailVerificationToken,
  EmailVerificationTokenConstructorParams
> {
  create(
    params: Omit<
      EmailVerificationTokenConstructorParams,
      'id' | 'expiresAt' | 'createdAt'
    >,
  ): EmailVerificationToken {
    const emailVerificationToken = new EmailVerificationToken();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + EMAIL_VERIFICATION_TOKEN_EXPIRES_IN,
    ); // 10 minutes

    emailVerificationToken.id = this.generateId();
    emailVerificationToken.email = params.email;
    emailVerificationToken.token = params.token;
    emailVerificationToken.hash = params.hash;
    emailVerificationToken.expiresAt = expiresAt;
    emailVerificationToken.createdAt = now;

    return emailVerificationToken;
  }

  reconstitute(
    params: EmailVerificationTokenConstructorParams,
  ): EmailVerificationToken {
    const emailVerificationToken = new EmailVerificationToken();

    emailVerificationToken.id = params.id;
    emailVerificationToken.email = params.email;
    emailVerificationToken.token = params.token;
    emailVerificationToken.hash = params.hash;
    emailVerificationToken.expiresAt = params.expiresAt;
    emailVerificationToken.createdAt = params.createdAt;

    return emailVerificationToken;
  }
}
