export interface SignUpCommand {
  email: string;
  username: string;
  token: string;
}

export interface SignUpCommandResult {
  userId: string;
  username: string;
  email: string;
}
