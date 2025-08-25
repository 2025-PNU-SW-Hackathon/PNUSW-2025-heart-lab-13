export const ExceptionMessage = {
  GITHUB_AUTH_FAILED: 'GitHub authentication failed',

  //user
  USER_NOT_FOUND: 'User not found',
  INVALID_PASSWORD: 'Invalid password',
  USER_ALREADY_EXISTS: 'User already exists',
  USER_MUST_BE_PROVIDED: 'User must be provided',

  //github
  CANNOT_GET_GITHUB_ORGANIZATIONS: 'Cannot get GitHub organizations',
  GITHUB_IS_NOT_CONNECTED: 'GitHub is not connected',
  CANNOT_GET_GITHUB_PRS: 'Cannot get GitHub pull requests',
  CANNOT_GET_GITHUB_PR_DETAIL: 'Cannot get GitHub pull request detail',

  //email
  EMAIL_TEMPLATE_NOT_FOUND: 'Email template not found',

  EMAIL_VERIFICATION_TOKEN_NOT_FOUND: 'Email verification token not found',
  INVALID_EMAIL_VERIFICATION_TOKEN: 'Invalid email verification token',
  INVALID_LOGIN_CODE: 'Invalid login code',

  // performance
  PERFORMANCE_NOT_FOUND: 'Performance not found',
  INVALID_SOURCE_TYPE: 'Invalid source type',
  INVALID_SOURCE_ID: 'Invalid source ID',
} as const;
