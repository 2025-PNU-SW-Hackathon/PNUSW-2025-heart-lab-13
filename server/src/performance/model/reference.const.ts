import { GetPullRequestDetailQueryResult } from 'src/tools/github/query/getPrDetail.query';

export const REFERENCE_SOURCE_TYPE = {
  GITHUB_PULL_REQUEST: 'GITHUB_PULL_REQUEST',
} as const;

export type ReferenceSourceType =
  (typeof REFERENCE_SOURCE_TYPE)[keyof typeof REFERENCE_SOURCE_TYPE];

export type ReferenceData = GetPullRequestDetailQueryResult;
