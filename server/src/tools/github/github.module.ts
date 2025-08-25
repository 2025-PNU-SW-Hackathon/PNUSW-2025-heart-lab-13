import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GithubAdapter } from 'src/tools/github/github.adapter';
import { GithubController } from 'src/tools/github/github.controller';
import { GithubService } from 'src/tools/github/github.service';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [GithubController],
  providers: [GithubService, GithubAdapter],
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('github.timeout', 5000),
        maxRedirects: configService.get<number>('github.maxRedirects', 5),
        baseURL: configService.get<string>('github.apiBaseUrl'),
      }),
    }),
    UserModule,
  ],
  exports: [GithubService],
})
export class GithubModule {}
