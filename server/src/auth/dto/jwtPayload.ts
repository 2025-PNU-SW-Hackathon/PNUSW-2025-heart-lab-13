export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number; // issued at time
  exp?: number; // expiration time
}
