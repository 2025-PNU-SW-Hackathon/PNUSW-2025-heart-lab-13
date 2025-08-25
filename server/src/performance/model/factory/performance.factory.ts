import { Injectable } from '@nestjs/common';
import { Factory } from 'src/common/factory';
import {
  Performance,
  PerformanceConstructorParams,
} from 'src/performance/model/performance.entity';

@Injectable()
export class PerformanceFactory extends Factory<
  Performance,
  PerformanceConstructorParams
> {
  create(
    params: Omit<
      PerformanceConstructorParams,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
  ): Performance {
    const id = this.generateId();
    const now = new Date();

    const performance = new Performance();
    performance.id = id;
    performance.user = params.user;
    performance.title = params.title || null;
    performance.startDate = params.startDate || null;
    performance.endDate = params.endDate || null;
    performance.description = params.description || null;
    performance.contribution = params.contribution || null;
    performance.outcome = params.outcome || null;
    performance.references = params.references || [];
    performance.createdAt = now;
    performance.updatedAt = now;
    performance.deletedAt = null;

    return performance;
  }

  reconstitute(params: PerformanceConstructorParams): Performance {
    const performance = new Performance();

    performance.id = params.id;
    performance.user = params.user;
    performance.title = params.title || null;
    performance.startDate = params.startDate || null;
    performance.endDate = params.endDate || null;
    performance.description = params.description || null;
    performance.contribution = params.contribution || null;
    performance.outcome = params.outcome || null;
    performance.references = params.references || [];
    performance.createdAt = params.createdAt;
    performance.updatedAt = params.updatedAt;
    performance.deletedAt = params.deletedAt || null;

    return performance;
  }
}
