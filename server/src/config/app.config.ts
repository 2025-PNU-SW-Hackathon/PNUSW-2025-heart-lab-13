import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  domain: process.env.DOMAIN || 'localhost:3000',
  serviceUrl: process.env.SERVICE_URL || 'http://localhost:3000',
}));
