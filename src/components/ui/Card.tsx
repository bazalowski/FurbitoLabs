import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  highlighted?: boolean
}

export function Card({ children, className, style, onClick, highlighted }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-m p-4 min-w-0',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
      style={{
        background: 'var(--card)',
        border: `1px solid ${highlighted ? 'var(--border-a)' : 'var(--border)'}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
