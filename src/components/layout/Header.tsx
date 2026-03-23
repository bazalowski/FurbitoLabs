'use client'

interface HeaderProps {
  title?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
}

export function Header({ title, left, right }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 gap-2 flex-shrink-0"
      style={{ height: 'var(--header-h)' }}
    >
      <div className="flex items-center gap-2">
        {left}
        {title && (
          typeof title === 'string'
            ? <h1 className="font-bebas text-2xl tracking-wider">{title}</h1>
            : title
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  )
}

export function Logo() {
  return (
    <span className="font-bebas text-2xl tracking-widest" style={{ color: 'var(--comm-color, var(--accent))' }}>
      FURB<span style={{ color: 'var(--text)' }}>ITO</span>
    </span>
  )
}
