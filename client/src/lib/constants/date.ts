const CURRENT_YEAR = 2025
export const YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - i)

export const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')) //월 배열 (문자열 배열)
