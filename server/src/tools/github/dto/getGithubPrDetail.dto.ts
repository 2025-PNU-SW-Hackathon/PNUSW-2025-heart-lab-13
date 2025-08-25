import { PrState } from 'src/tools/github/dto/getGithubOrgPrs.dto';

export interface GetGithubPrDetailAssignee {
  id: number;
  login: string;
  avatar_url: string;
}

export interface GetGithubPrDetailLabel {
  id: number;
  name: string;
  description?: string; // Optional, as labels may not always have a description
  color: string; // Hex color code for the label
}

export interface GetGithubPrDetailBranch {
  label: string; // The label of the branch, e.g., "main"
  ref: string;
}

export interface GetGithubPrDetailRes {
  html_url: string;
  id: number;
  number: number;
  title: string;
  created_at: string;
  updated_at: string;
  state: PrState;
  body: string | null;
  assignees: GetGithubPrDetailAssignee[];
  closed_at?: string | null; // ISO 8601 date string, optional
  merged_at?: string | null; // ISO 8601 date string, optional
  labels?: GetGithubPrDetailLabel[];
  merged_by?: GetGithubPrDetailAssignee | null; // The user who merged the PR, optional
  head: GetGithubPrDetailBranch;
  base: GetGithubPrDetailBranch;
  [key: string]: any; // To allow additional properties
}
