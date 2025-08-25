import {
  ReferenceData,
  ReferenceSourceType,
} from 'src/performance/model/reference.const';

export interface GetPerformanceQuery {
  userId: string;
  id: string;
}

export interface GetPerformanceQueryResultReference {
  id: string;
  sourceType: ReferenceSourceType;
  sourceId: string;
  data: ReferenceData;
}

export interface GetPerformanceQueryResult {
  id: string;
  title: string | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  contribution: string | null;
  outcome: string | null;
  references: GetPerformanceQueryResultReference[];
  createdAt: Date;
  updatedAt: Date;
}
