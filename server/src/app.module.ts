import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ToolsModule } from './tools/tools.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from './email/email.module';
import githubConfig from 'src/config/github.config';
import jwtConfig from 'src/config/jwt.config';
import passwordConfig from 'src/config/password.config';
import databaseConfig from 'src/config/database.config';
import appConfig from 'src/config/app.config';
import { HelperModule } from 'src/helper/helper.module';
import { PerformanceModule } from './performance/performance.module';
import awsConfig from 'src/config/aws.config';
import sendGridConfig from 'src/config/sendGrid.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        githubConfig,
        jwtConfig,
        passwordConfig,
        databaseConfig,
        appConfig,
        awsConfig,
        sendGridConfig,
      ],
    }),
    AuthModule,
    UserModule,
    ToolsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        charset: 'utf8mb4',
        synchronize: configService.get<boolean>('database.synchronize', true),
        logging: configService.get<boolean>('database.logging', false),
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    HelperModule,
    PerformanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
