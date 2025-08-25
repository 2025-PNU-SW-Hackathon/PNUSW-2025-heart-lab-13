import { YearMonthValue } from '../utils/date'

export interface OrgPullsOptions {
  fromYM?: YearMonthValue
  toYM?: YearMonthValue
  startDate?: string | Date
  endDate?: string | Date
}

export interface FetchGithubPullsOptions {
  startDate?: string // ISO 8601
  endDate?: string // ISO 8601
  page?: number
  limit?: number
}
