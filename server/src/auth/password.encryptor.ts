import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordEncryptor {
  constructor(private readonly configService: ConfigService) {}

  async encrypt(password: string): Promise<string> {
    const saltOrRounds =
      this.configService.get<number>('password.saltRounds') || 10;

    return await bcrypt.hash(password, saltOrRounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
