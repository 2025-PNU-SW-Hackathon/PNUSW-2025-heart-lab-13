export const YEARS = Array.from({ length: 8 }, (_, i) => 2018 + i) //연도 배열

export const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')) //월 배열 (문자열 배열)
