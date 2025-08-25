import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Factory } from 'src/common/factory';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';
import {
  ToolCredential,
  ToolCredentialConstructorParams,
} from 'src/user/model/toolCredential.entity';

@Injectable()
export class ToolCredentialFactory extends Factory<
  ToolCredential,
  ToolCredentialConstructorParams
> {
  create(
    params: Omit<
      ToolCredentialConstructorParams,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): ToolCredential {
    const now = new Date();

    const toolCredential = new ToolCredential();
    toolCredential.id = this.generateId();
    toolCredential.createdAt = now;
    toolCredential.updatedAt = now;
    toolCredential.accessToken = params.accessToken;
    toolCredential.refreshToken = params.refreshToken || null;
    toolCredential.expiresAt = params.expiresAt || null;
    toolCredential.toolType = params.toolType;
    toolCredential.user = params.user;
    if (!toolCredential.user) {
      throw new UnprocessableEntityException(
        ExceptionMessage.USER_MUST_BE_PROVIDED,
      );
    }

    return toolCredential;
  }

  reconstitute(params: ToolCredentialConstructorParams): ToolCredential {
    const toolCredential = new ToolCredential();
    toolCredential.id = params.id;
    toolCredential.accessToken = params.accessToken;
    toolCredential.refreshToken = params.refreshToken || null;
    toolCredential.toolType = params.toolType;
    toolCredential.user = params.user;
    toolCredential.expiresAt = params.expiresAt || null;
    toolCredential.createdAt = params.createdAt;
    toolCredential.updatedAt = params.updatedAt;

    return toolCredential;
  }
}
