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

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-2.5 text-xs min-h-[44px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-5 py-3 text-base min-h-[48px]',
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
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        'rounded-m font-bold uppercase tracking-wider transition-all active:scale-[0.97]',
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
    >
      {children}
    </button>
  )
}
