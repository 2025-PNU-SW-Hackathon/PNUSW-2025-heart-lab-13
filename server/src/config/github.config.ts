import { registerAs } from '@nestjs/config';

export default registerAs('github', () => ({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackUrl: process.env.GITHUB_CALLBACK_URL,
  apiBaseUrl: process.env.GITHUB_API_BASE_URL || 'https://api.github.com',
  timeout: parseInt(process.env.GITHUB_TIMEOUT as string, 10) || 5000,
  maxRedirects: parseInt(process.env.GITHUB_MAX_REDIRECTS as string, 10),
}));
