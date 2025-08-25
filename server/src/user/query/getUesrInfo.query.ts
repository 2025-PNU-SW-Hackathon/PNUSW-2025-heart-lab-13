import { ToolType } from 'src/user/model/toolType.const';

export interface GetUserInfoQuery {
  userId: string;
}

export interface GetUserInfoQueryResultTool {
  type: ToolType;
  expiresAt: Date | null;
}

export interface GetUserInfoQueryResult {
  userId: string;
  email: string;
  username: string;
  tools: GetUserInfoQueryResultTool[];
}
