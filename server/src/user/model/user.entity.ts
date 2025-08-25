import { ToolCredential } from 'src/user/model/toolCredential.entity';
import { Performance } from 'src/performance/model/performance.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface UserConstructorParams {
  id: string;
  username: string;
  email: string;
  toolCredentials: ToolCredential[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => ToolCredential, (toolCredential) => toolCredential.user, {
    cascade: true,
  })
  toolCredentials: ToolCredential[];

  @OneToMany(() => Performance, (performance) => performance.user, {
    cascade: true,
  })
  performances: Performance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
