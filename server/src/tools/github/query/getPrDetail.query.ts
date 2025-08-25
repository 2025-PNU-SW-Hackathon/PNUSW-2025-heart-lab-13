import { PrState } from 'src/tools/github/dto/getGithubOrgPrs.dto';

export interface GetPullRequestDetailQuery {
  userId: string;
  orgName: string;
  repoName: string;
  prNumber: number;
}

export interface GetPullRequestDetailQueryResultAssignee {
  id: number;
  name: string;
  avatarUrl: string;
}
export interface GetPullRequestDetailQueryResultLabel {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

export interface GetPullRequestDetailQueryResultBranch {
  label: string;
  ref: string;
}

export interface GetPullRequestDetailQueryResult {
  id: number;
  number: number;
  url: string;
  title: string;
  description: string | null;
  assignees: GetPullRequestDetailQueryResultAssignee[];
  createdAt: Date;
  updatedAt: Date;
  mergedAt: Date | null;
  closedAt: Date | null;
  state: PrState;
  labels: GetPullRequestDetailQueryResultLabel[];
  base: GetPullRequestDetailQueryResultBranch;
  head: GetPullRequestDetailQueryResultBranch;
  mergedBy: GetPullRequestDetailQueryResultAssignee | null;
  sourceId: string;
}
