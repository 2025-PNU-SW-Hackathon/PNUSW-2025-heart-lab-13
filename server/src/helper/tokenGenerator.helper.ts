import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class TokenGeneratorHelper {
  constructor() {}

  generateToken(bits = 256) {
    const buf = randomBytes(bits / 8);
    // URL-safe
    const token = buf
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const hash = createHash('sha256').update(token).digest(); // Buffer

    return { token, hash };
  }
}
