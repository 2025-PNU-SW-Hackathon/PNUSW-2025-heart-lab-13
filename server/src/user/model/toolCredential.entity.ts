import { ToolType } from 'src/user/model/toolType.const';
import { User } from 'src/user/model/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface ToolCredentialConstructorParams {
  id: string;
  accessToken: string;
  refreshToken?: string;
  toolType: ToolType;
  user: User;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Entity()
export class ToolCredential {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 255 })
  accessToken: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken: string | null;

  @Column({ type: 'varchar', length: 50 })
  toolType: ToolType;

  @ManyToOne(() => User, (user) => user.toolCredentials, {
    onDelete: 'CASCADE',
    lazy: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
