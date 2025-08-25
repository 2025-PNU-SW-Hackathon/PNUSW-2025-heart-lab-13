import { registerAs } from '@nestjs/config';

export default registerAs('password', () => ({
  saltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS as string, 10) || 10,
}));
