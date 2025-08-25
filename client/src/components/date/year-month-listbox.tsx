'use client'

import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { YEARS, MONTHS } from '@/src/lib/constants/date'
import { YearMonthValue } from '@/src/lib/utils/date'

const yearPlaceholder = 'YYYY'
const monthPlaceholder = 'MM'

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

interface YearMonthListboxProps {
  value: YearMonthValue
  onChange: (next: YearMonthValue) => void
  disabled?: boolean
  // 날짜 범위 제한을 위한 props 추가
  isFromField?: boolean
  isToField?: boolean
  fromValue?: YearMonthValue
  toValue?: YearMonthValue
}

export function YearMonthListbox({
  value,
  onChange,
  disabled = false,
  isFromField = false,
  isToField = false,
  fromValue = {},
  toValue = {}
}: YearMonthListboxProps) {
  const { year, month } = value

  // 연도가 선택 가능한지 확인
  const isYearSelectable = (yearValue: number) => {
    if (isFromField && toValue.year) {
      return yearValue <= toValue.year
    }
    if (isToField && fromValue.year) {
      return yearValue >= fromValue.year
    }
    return true
  }

  // 월이 선택 가능한지 확인
  const isMonthSelectable = (yearValue: number, monthValue: string) => {
    if (isFromField && toValue.year && toValue.month) {
      if (yearValue < toValue.year) return true
      if (yearValue === toValue.year) {
        return parseInt(monthValue) <= parseInt(toValue.month)
      }
      return false
    }
    if (isToField && fromValue.year && fromValue.month) {
      if (yearValue > fromValue.year) return true
      if (yearValue === fromValue.year) {
        return parseInt(monthValue) >= parseInt(fromValue.month)
      }
      return false
    }
    return true
  }

  return (
    <div className="w-fill flex items-center justify-center" aria-label="연월 선택">
      {/* Year */}
      <div className="relative">
        <Listbox
          value={year ?? null}
          onChange={(y: number) => onChange({ year: y, month })}
          disabled={disabled}
        >
          {({ open }) => (
            <div className="relative">
              <Listbox.Button className="no-underline flex items-center justify-between rounded border border-main-gray  px-[8px] py-2 text-sm w-[65px]">
                {year ?? yearPlaceholder}
                <ChevronUpDownIcon className="absolute right-[2px] h-4 w-4 flex-none" />
              </Listbox.Button>
              <Transition as={Fragment} show={open}>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border-gray-300 bg-white shadow focus:outline-none">
                  {YEARS.map((y) => {
                    const selectable = isYearSelectable(y)
                    return (
                      <Listbox.Option
                        key={y}
                        value={y}
                        disabled={!selectable}
                        className={({ active }) =>
                          classNames(
                            'no-underline select-none px-[5px] py-[5px] text-sm flex items-center',
                            selectable ? 'cursor-pointer' : 'cursor-not-allowed',
                            active && selectable && 'bg-gray-100',
                            !selectable && 'text-gray-400'
                          )
                        }
                      >
                        {({ selected }) => (
                          <div className="relative w-full px-[2px]">
                            {/* 배경 바: 항상 같은 자리에, 선택 시에만 보이게 */}
                            <div
                              className={`
                            absolute inset-0 bg-gray-100 transition-opacity
                            ${selected ? 'opacity-100' : 'opacity-0'}
                          `}
                              aria-hidden
                            />
                            {/* 내용: z-10로 위에 올림 */}
                            <span className="relative z-10 tabular-nums">{y}</span>
                          </div>
                        )}
                      </Listbox.Option>
                    )
                  })}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>
      </div>
      {/* Month */}
      <div className="w-fit">
        <Listbox
          value={month ?? null}
          onChange={(m: string) => onChange({ year, month: m })}
          disabled={disabled}
        >
          {({ open }) => (
            <div className="relative">
              <Listbox.Button className="no-underline flex items-center rounded border border-main-gray px-[8px] py-2 text-sm w-[65px]">
                {month ?? monthPlaceholder}
                <ChevronUpDownIcon className="absolute right-[2px] h-4 w-4 flex-none" />
              </Listbox.Button>
              <Transition as={Fragment} show={open}>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border-gray-300 bg-white shadow focus:outline-none">
                  {MONTHS.map((m) => {
                    const selectable = year ? isMonthSelectable(year, m) : true
                    return (
                      <Listbox.Option
                        key={m}
                        value={m}
                        disabled={!selectable}
                        className={({ active }) =>
                          classNames(
                            'no-underline select-none px-[5px] py-[5px] text-sm flex items-center',
                            selectable ? 'cursor-pointer' : 'cursor-not-allowed',
                            active && selectable && 'w-full px-[2px] bg-gray-100',
                            !selectable && 'text-gray-400'
                          )
                        }
                      >
                        {({ selected }) => (
                          <div className="relative w-full px-[2px]">
                            {/* 배경 바: 항상 같은 자리에, 선택 시에만 보이게 */}
                            <div
                              className={`
                              absolute inset-0 bg-gray-100 transition-opacity
                              ${selected ? 'opacity-100' : 'opacity-0'}
                            `}
                              aria-hidden
                            />
                            {/* 내용: z-10로 위에 올림 */}
                            <span className="relative z-10 tabular-nums">
                              {String(m).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </Listbox.Option>
                    )
                  })}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>
      </div>
    </div>
  )
}
