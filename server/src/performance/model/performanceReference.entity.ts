import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Performance } from 'src/performance/model/performance.entity';
import { ReferenceSourceType } from 'src/performance/model/reference.const';

export interface PerformanceReferenceConstructorParams {
  id: string;
  sourceType: ReferenceSourceType;
  sourceId: string;
  createdAt: Date;
}

@Entity('PerformanceReference')
export class PerformanceReference {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  id: string;

  @ManyToOne(() => Performance, (performance) => performance.references, {
    onDelete: 'CASCADE',
  })
  performance: Performance;

  @Column({ type: 'varchar', length: 50 })
  sourceType: ReferenceSourceType;

  @Column({ type: 'varchar', length: 120 })
  sourceId: string;

  @CreateDateColumn()
  createdAt: Date;
}
