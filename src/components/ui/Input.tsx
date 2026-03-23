import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

const inputStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
}

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={cn(
          'w-full px-4 py-3 rounded-m text-base font-semibold outline-none placeholder:opacity-30',
          'focus:border-[var(--accent)] transition-colors',
          className
        )}
        style={inputStyle}
      />
      {hint && !error && <p className="text-xs" style={{ color: 'var(--muted)' }}>{hint}</p>}
      {error && <p className="text-xs font-semibold" style={{ color: 'var(--red)' }}>{error}</p>}
    </div>
  )
}

export function Textarea({ label, hint, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={cn(
          'w-full px-4 py-3 rounded-m text-base font-semibold outline-none placeholder:opacity-30 resize-none',
          className
        )}
        style={inputStyle}
      />
      {hint && <p className="text-xs" style={{ color: 'var(--muted)' }}>{hint}</p>}
    </div>
  )
}

export function Select({ label, className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          {label}
        </label>
      )}
      <select
        {...props}
        className={cn('w-full px-4 py-3 rounded-m text-base font-semibold outline-none', className)}
        style={inputStyle}
      >
        {children}
      </select>
    </div>
  )
}
