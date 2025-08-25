import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export interface LoginCodeConstructorParams {
  id: string;
  code: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

@Entity({
  name: 'LoginCode',
})
export class LoginCode {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  id: string;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  userId: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
