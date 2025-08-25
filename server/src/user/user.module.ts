import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/model/user.entity';
import { UserFactory } from 'src/user/model/factory/user.factory';
import { ToolCredential } from 'src/user/model/toolCredential.entity';
import { ToolCredentialFactory } from 'src/user/model/factory/toolCredential.factory';

@Module({
  imports: [TypeOrmModule.forFeature([User, ToolCredential])],
  controllers: [UserController],
  providers: [UserService, UserFactory, ToolCredentialFactory],
  exports: [UserFactory, ToolCredentialFactory, TypeOrmModule],
})
export class UserModule {}
