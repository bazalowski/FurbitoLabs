'use client'

interface HeaderProps {
  title?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
}

export function Header({ title, left, right }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between pl-4 pr-[100px] gap-2 flex-shrink-0"
      style={{
        height: 'var(--header-h)',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
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
    </header>
  )
}

export function Logo() {
  return (
    <span className="font-bebas text-2xl tracking-widest" style={{ color: 'var(--comm-color, var(--accent))' }}>
      FUR<span style={{ color: 'var(--text)' }}>BITO</span>
    </span>
  )
}
