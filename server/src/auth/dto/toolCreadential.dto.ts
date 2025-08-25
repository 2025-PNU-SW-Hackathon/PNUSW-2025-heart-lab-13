export interface ToolCredentialDto extends Express.User {
  userId: string;
  accessToken: string;
  refreshToken?: string; // GitHub OAuth는 refresh token을 제공하지 않으므로 optional로 설정
}
