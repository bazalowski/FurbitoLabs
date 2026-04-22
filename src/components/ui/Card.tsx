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
        'card hairline-top p-4 min-w-0 relative',
        onClick && 'card-glow cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
      style={{
        borderColor: highlighted ? 'var(--border-a)' : undefined,
        boxShadow: highlighted
          ? '0 1px 0 rgba(255,255,255,0.06) inset, 0 1px 2px rgba(0,0,0,0.35), 0 8px 22px var(--shadow-tint-strong)'
          : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
