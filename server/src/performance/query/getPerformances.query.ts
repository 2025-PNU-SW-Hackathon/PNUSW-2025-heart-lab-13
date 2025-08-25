import { ReferenceSourceType } from 'src/performance/model/reference.const';

export interface GetPerformancesQuery {
  userId: string;
  startDate: Date | null;
  endDate: Date | null;
  page: number;
  limit: number;
}

export interface GetPerformancesQueryResultPerformanceReference {
  id: string;
  sourceType: ReferenceSourceType;
  sourceId: string;
}

export interface GetPerformancesQueryResultPerformance {
  id: string;
  title: string | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  contribution: string | null;
  outcome: string | null;
  references: GetPerformancesQueryResultPerformanceReference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GetPerformancesQueryResult {
  count: number;
  performances: GetPerformancesQueryResultPerformance[];
}
