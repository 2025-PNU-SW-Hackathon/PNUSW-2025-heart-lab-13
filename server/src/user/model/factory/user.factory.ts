import { Injectable } from '@nestjs/common';
import { Factory } from 'src/common/factory';
import { User, UserConstructorParams } from 'src/user/model/user.entity';

@Injectable()
export class UserFactory extends Factory<User, UserConstructorParams> {
  create(
    params: Omit<
      UserConstructorParams,
      'id' | 'toolCredentials' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
  ): User {
    const now = new Date();

    const user = new User();
    user.id = this.generateId();
    user.toolCredentials = [];
    user.createdAt = now;
    user.updatedAt = now;
    user.deletedAt = null;
    user.username = params.username;
    user.email = params.email;

    return user;
  }

  reconstitute(params: UserConstructorParams): User {
    const user = new User();
    user.id = params.id;
    user.username = params.username;
    user.email = params.email;
    user.toolCredentials = params.toolCredentials;
    user.createdAt = params.createdAt;
    user.updatedAt = params.updatedAt;
    user.deletedAt = params.deletedAt;

    return user;
  }
}
