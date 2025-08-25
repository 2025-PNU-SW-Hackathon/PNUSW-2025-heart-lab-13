export type YearMonthValue = { year?: number; month?: string }

export function yearMonthToIso(value?: YearMonthValue): string | undefined {
  if (!value?.year || !value.month) return undefined

  const y = value.year
  const mIndex = parseInt(value.month, 10) - 1 // 0~11 범위
  if (Number.isNaN(mIndex) || mIndex < 0 || mIndex > 11) return undefined

  // 해당 연월의 "1일 00:00:00 UTC" 기준 ISO 문자열 생성
  return new Date(Date.UTC(y, mIndex, 1)).toISOString()
}

export const isEmptyYM = (v?: YearMonthValue) => v?.year == null && v?.month == null

export const isFilledYM = (v?: YearMonthValue) => v?.year != null && v?.month != null

export const isPartialYM = (v?: YearMonthValue) => !isEmptyYM(v) && !isFilledYM(v) // 뭔가는 있는데 둘 다 채워지진 않음
