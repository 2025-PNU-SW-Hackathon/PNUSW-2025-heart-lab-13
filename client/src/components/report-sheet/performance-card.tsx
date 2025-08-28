// components/performance/PerformanceCard.tsx
import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { PerformanceCategory } from '@/src/lib/types/perfomance'

interface PerformanceCardProps {
  category: PerformanceCategory
  onToggle?: (id: string, isExpanded: boolean) => void
  className?: string
  isActive?: boolean
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-100',
  gray: 'bg-gray-50 border-gray-100',
  green: 'bg-green-50 border-green-100',
  yellow: 'bg-yellow-50 border-yellow-100',
  red: 'bg-red-50 border-red-100'
}
interface PerformanceCardProps {
  category: PerformanceCategory
  onToggle?: (id: string, isExpanded: boolean) => void
  className?: string
}

export default function PerformanceCard({
  category,
  onToggle,
  className = '',
  isActive
}: PerformanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(category.isExpanded || false)

  const handleToggle = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onToggle?.(category.id, newExpanded)
  }

  const colorClass = colorClasses[category.color || 'gray']
  const shouldExpand = isExpanded && !!category.description?.trim()

  return (
    <div
      className={`rounded-lg border transition-all duration-200 hover:shadow-md ${colorClass} ${className} ${shouldExpand ? 'h-fit' : ''} ${isActive ? 'shadow-[5px_7px_12px_-3px_rgba(109,170,247,0.50)]' : ''}`}
    >
      {/* 헤더 */}
      <div className="py-4 px-[25px]">
        {/* 제목 */}
        <div className="mb-3">
          <h3 className="text-black text-lg font-medium">{category.title}</h3>
        </div>

        {/* 점수 */}
        <div className="mb-8">
          <span className="text-black text-4xl font-semibold">{category.score}</span>
          <span className="text-black text-4xl font-semibold">/{category.maxScore}</span>
        </div>

        {/* 아이콘 (확장되었을 때만) */}
        {isExpanded && category.icon && (
          <div className="flex  mb-4">
            <div className="w-12 h-12 flex items-center justify-center">{category.icon}</div>
          </div>
        )}

        {/* 설명 (확장되었을 때만) */}
        {isExpanded && category.description && (
          <div className="text-sm text-gray-600 leading-relaxed mb-4">{category.description}</div>
        )}

        {/* 토글 버튼 - 수평 중앙 정렬 */}
        <div className="flex justify-center">
          <button
            onClick={handleToggle}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors"
            aria-label={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
