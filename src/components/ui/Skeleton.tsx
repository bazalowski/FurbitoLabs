import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  height?: string | number
}

export function Skeleton({ className, height }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{ height: height ?? '1rem' }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-m p-4 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <Skeleton height={20} className="w-3/4" />
      <Skeleton height={14} className="w-1/2" />
      <Skeleton height={14} className="w-2/3" />
    </div>
  )
}
