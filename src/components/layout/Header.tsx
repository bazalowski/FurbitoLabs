'use client'

interface HeaderProps {
  title?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
}

export function Header({ title, left, right }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between pl-4 pr-[100px] gap-2 flex-shrink-0 relative"
      style={{
        height: 'var(--header-h)',
        background: 'var(--bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {left}
        {title && (
          typeof title === 'string'
            ? <h1 className="font-bebas text-2xl tracking-wider truncate">{title}</h1>
            : title
        )}
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
      <span aria-hidden="true" className="header-underline" />
    </header>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 select-none relative">
      <span
        aria-hidden="true"
        className="absolute -left-1 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: size + 12,
          height: size + 12,
          background: 'radial-gradient(circle at center, var(--comm-color, var(--accent)) 0%, transparent 65%)',
          opacity: 0.16,
          filter: 'blur(6px)',
        }}
      />
      <img
        src="/icons/icon.svg"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="relative"
        style={{ width: size, height: size, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.45))' }}
      />
      <span
        className="font-bebas text-2xl tracking-widest relative"
        style={{ color: 'var(--comm-color, var(--accent))', transform: 'skewX(-6deg)' }}
      >
        FUR<span style={{ color: 'var(--text)' }}>BITO</span>
      </span>
    </span>
  )
}
