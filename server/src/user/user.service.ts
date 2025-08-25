import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserFactory } from 'src/user/model/factory/user.factory';
import { User } from 'src/user/model/user.entity';
import {
  GetUserInfoQuery,
  GetUserInfoQueryResult,
} from 'src/user/query/getUesrInfo.query';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly userFactory: UserFactory,
  ) {}

  async getUserInfo(query: GetUserInfoQuery): Promise<GetUserInfoQueryResult> {
    const user = await this.userRepository.findOne({
      where: { id: query.userId },
      relations: ['toolCredentials'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      tools: user.toolCredentials
        .filter(
          (toolCredential) =>
            !toolCredential.expiresAt ||
            toolCredential.expiresAt?.getTime() > new Date().getTime(),
        )
        .map((tool) => ({
          type: tool.toolType,
          expiresAt: tool.expiresAt,
        })),
    };
  }
}
