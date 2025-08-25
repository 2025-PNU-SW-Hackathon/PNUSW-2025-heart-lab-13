import { Injectable } from '@nestjs/common';
import { LOGIN_CODE_EXPIRES_IN } from 'src/auth/model/loginCode/loginCode.const';
import {
  LoginCode,
  LoginCodeConstructorParams,
} from 'src/auth/model/loginCode/loginCode.entity';
import { Factory } from 'src/common/factory';

@Injectable()
export class LoginCodeFactory extends Factory<
  LoginCode,
  LoginCodeConstructorParams
> {
  create(
    params: Omit<LoginCodeConstructorParams, 'id' | 'expiresAt' | 'createdAt'>,
  ): LoginCode {
    const loginCode = new LoginCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOGIN_CODE_EXPIRES_IN);

    loginCode.id = this.generateId();
    loginCode.code = params.code;
    loginCode.userId = params.userId;
    loginCode.expiresAt = expiresAt;
    loginCode.createdAt = now;

    return loginCode;
  }

  reconstitute(params: LoginCodeConstructorParams): LoginCode {
    const loginCode = new LoginCode();

    loginCode.id = params.id;
    loginCode.code = params.code;
    loginCode.userId = params.userId;
    loginCode.expiresAt = params.expiresAt;
    loginCode.createdAt = params.createdAt;

    return loginCode;
  }
}
