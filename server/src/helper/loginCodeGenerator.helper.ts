import { Injectable } from '@nestjs/common';

@Injectable()
export class LoginCodeGeneratorHelper {
  constructor() {}

  // 숫자나 대문자 조합의 여섯자리 코드 생성
  generateCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
}
