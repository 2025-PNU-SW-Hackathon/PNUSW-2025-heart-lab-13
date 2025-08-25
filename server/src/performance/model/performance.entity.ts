import { PerformanceReference } from 'src/performance/model/performanceReference.entity';
import { User } from 'src/user/model/user.entity';
import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';

export interface PerformanceConstructorParams {
  id: string;
  user: User;
  title: string | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  contribution: string | null;
  outcome: string | null;
  references: PerformanceReference[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Entity('Performance')
export class Performance {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  id: string;

  @ManyToOne(() => User, (user) => user.performances, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'varchar', length: 120, nullable: true })
  title: string | null;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  contribution: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  outcome: string | null;

  @OneToMany(() => PerformanceReference, (reference) => reference.performance, {
    cascade: true,
  })
  references: PerformanceReference[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
