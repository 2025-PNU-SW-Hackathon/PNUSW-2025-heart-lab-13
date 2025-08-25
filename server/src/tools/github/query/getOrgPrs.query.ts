import { PrState } from 'src/tools/github/dto/getGithubOrgPrs.dto';

export interface GetOrganizationPullRequestsQuery {
  userId: string;
  orgName: string;
  startDate: Date | null;
  endDate: Date | null;
  page: number;
  limit: number;
}

export interface GetOrganizationPullRequestsQueryResultAssignee {
  id: number;
  name: string;
  avatarUrl: string;
}

export interface GetOrganizationPullRequestsQueryResultPr {
  id: number;
  number: number;
  url: string;
  title: string;
  description: string | null;
  assignees: GetOrganizationPullRequestsQueryResultAssignee[];
  createdAt: Date;
  updatedAt: Date;
  mergedAt: Date | null;
  closedAt: Date | null;
  state: PrState;
  sourceId: string;
}

export interface GetOrganizationPullRequestsQueryResult {
  count: number;
  prs: GetOrganizationPullRequestsQueryResultPr[];
}
