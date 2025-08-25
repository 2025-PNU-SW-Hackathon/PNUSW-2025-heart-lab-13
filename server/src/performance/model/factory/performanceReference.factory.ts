import { Factory } from 'src/common/factory';
import {
  PerformanceReference,
  PerformanceReferenceConstructorParams,
} from 'src/performance/model/performanceReference.entity';

export class PerformanceReferenceFactory extends Factory<
  PerformanceReference,
  PerformanceReferenceConstructorParams
> {
  create(
    params: Omit<PerformanceReferenceConstructorParams, 'id' | 'createdAt'>,
  ): PerformanceReference {
    const id = this.generateId();
    const now = new Date();

    const reference = new PerformanceReference();

    reference.id = id;
    reference.sourceId = params.sourceId;
    reference.sourceType = params.sourceType;
    reference.createdAt = now;

    return reference;
  }

  reconstitute(
    params: PerformanceReferenceConstructorParams,
  ): PerformanceReference {
    const reference = new PerformanceReference();

    reference.id = params.id;
    reference.sourceId = params.sourceId;
    reference.sourceType = params.sourceType;
    reference.createdAt = params.createdAt;

    return reference;
  }
}
