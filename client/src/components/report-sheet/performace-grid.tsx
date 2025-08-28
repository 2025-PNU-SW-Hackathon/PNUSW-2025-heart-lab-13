// components/performance/PerformanceGrid.tsx
import { useState } from 'react'
import PerformanceCard from './performance-card'
import { PerformanceCategory } from '@/src/lib/types/perfomance'

interface PerformanceGridProps {
  categories: PerformanceCategory[]
  onCategoryToggle?: (id: string, isExpanded: boolean) => void
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const gridClasses = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
}

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6'
}

export default function PerformanceGrid({
  categories,
  onCategoryToggle,
  columns = 3,
  gap = 'md',
  className = ''
}: PerformanceGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleToggle = (id: string, isExpanded: boolean) => {
    setActiveId(isExpanded ? id : null)
    onCategoryToggle?.(id, isExpanded)
  }
  return (
    <div
      className={`grid ${gridClasses[columns]} ${gapClasses[gap]} auto-rows-min items-start ${className}`}
    >
      {categories.map((category) => (
        <PerformanceCard
          key={category.id}
          category={category}
          onToggle={handleToggle}
          isActive={activeId === category.id}
        />
      ))}
    </div>
  )
}
