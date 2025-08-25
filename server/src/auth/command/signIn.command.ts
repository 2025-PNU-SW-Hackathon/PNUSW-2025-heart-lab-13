export interface SignInCommand {
  email: string;
  code: string;
}

export interface SignInCommandResult {
  accessToken: string;
}
