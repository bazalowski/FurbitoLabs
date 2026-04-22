import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary:   { background: 'var(--accent)',    color: '#050d05' },
  secondary: { background: 'var(--card2)',     color: 'var(--text)',   border: '1px solid var(--border)' },
  danger:    { background: 'var(--red)',       color: '#fff' },
  ghost:     { background: 'transparent',      color: 'var(--muted)',  border: '1px solid var(--border)' },
}

const variantTone: Record<string, string> = {
  primary: 'accent',
  secondary: 'glass',
  danger: 'danger',
  ghost: 'glass',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-3 text-xs min-h-[48px]',
  md: 'px-4 py-3 text-sm min-h-[48px]',
  lg: 'px-5 py-3.5 text-base min-h-[52px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const showShine = variant === 'primary' || variant === 'danger'
  const showGloss = variant === 'primary' || variant === 'danger'

  return (
    <button
      {...props}
      disabled={disabled}
      data-tone={variantTone[variant]}
      className={cn(
        'btn-tone hairline-top rounded-m font-bold uppercase tracking-wider transition-all active:scale-[0.97] select-none cursor-pointer',
        sizeClasses[size],
        disabled && 'opacity-50 !cursor-not-allowed',
        className
      )}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', ...variantStyles[variant], ...style }}
    >
      {showGloss && <span className="gloss-overlay" aria-hidden="true" />}
      {showShine && <span className="shine-sweep" aria-hidden="true" />}
      <span className="relative z-[1] inline-flex items-center justify-center gap-1.5 w-full">
        {children}
      </span>
    </button>
  )
}
