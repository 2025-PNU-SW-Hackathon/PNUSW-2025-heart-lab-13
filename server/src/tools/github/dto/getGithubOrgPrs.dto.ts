export const PR_STATE = {
  OPEN: 'open',
  CLOSED: 'closed',
  MERGED: 'merged',
} as const;

export type PrState = (typeof PR_STATE)[keyof typeof PR_STATE];

export interface GetGithubPrsResAssignee {
  id: number;
  login: string;
  avatar_url: string;
}

export interface GetGithubOrgPrsResItem {
  id: number;
  number: number;
  html_url: string;
  repository_url: string;
  title: string;
  body: string;
  state: PrState;
  assignees: GetGithubPrsResAssignee[];
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  closed_at?: string; // ISO 8601 date string, optional
  merged_at?: string; // ISO 8601 date string, optional
  [key: string]: any; // To allow additional properties
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GetGithubOrgPrsRes {
  items: GetGithubOrgPrsResItem[];
  total_count: number;
  incomplete_results: boolean;
}
