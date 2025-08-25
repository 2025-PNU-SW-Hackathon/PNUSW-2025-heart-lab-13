import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export interface EmailVerificationTokenConstructorParams {
  id: string;
  email: string;
  token: string;
  hash: Buffer;
  expiresAt: Date;
  createdAt: Date;
}

@Entity({
  name: 'EmailVerificationToken',
})
export class EmailVerificationToken {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'blob' })
  hash: Buffer;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
