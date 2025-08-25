import { ReferenceSourceType } from 'src/performance/model/reference.const';

export interface UpsertPerformanceCommandPerformanceReference {
  sourceType: ReferenceSourceType;
  sourceId: string;
}

export interface UpsertPerformanceCommandPerformance {
  id: string | null;
  title: string | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  contribution: string | null;
  outcome: string | null;
  references: UpsertPerformanceCommandPerformanceReference[];
}

export interface UpsertPerformanceCommand {
  userId: string;
  performance: UpsertPerformanceCommandPerformance;
}

export interface UpsertPerformanceCommandResultPerformanceReference {
  id: string;
  sourceType: ReferenceSourceType;
  sourceId: string;
}

export interface UpsertPerformanceCommandResult {
  id: string;
  title: string | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  contribution: string | null;
  outcome: string | null;
  references: UpsertPerformanceCommandResultPerformanceReference[];
  createdAt: Date;
  updatedAt: Date;
}
