import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { ReferenceBuilder } from 'src/performance/reference.builder';
import { UserModule } from 'src/user/user.module';
import { PerformanceFactory } from 'src/performance/model/factory/performance.factory';
import { PerformanceReferenceFactory } from 'src/performance/model/factory/performanceReference.factory';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Performance } from 'src/performance/model/performance.entity';
import { PerformanceReference } from 'src/performance/model/performanceReference.entity';
import { GithubModule } from 'src/tools/github/github.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([Performance, PerformanceReference]),
    GithubModule,
  ],
  controllers: [PerformanceController],
  providers: [
    PerformanceService,
    ReferenceBuilder,
    PerformanceFactory,
    PerformanceReferenceFactory,
  ],
  exports: [TypeOrmModule],
})
export class PerformanceModule {}
