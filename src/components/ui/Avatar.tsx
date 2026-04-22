'use client'

import { useState } from 'react'
import { initials } from '@/lib/utils'

export function isAvatarUrl(avatar: string | null | undefined): boolean {
  if (!avatar) return false
  return avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')
}

interface AvatarProps {
  name: string
  avatar?: string | null
  size: number
  communityColor?: string
  borderColor?: string
  borderWidth?: number
  fontSize?: number
  fontWeight?: number
  className?: string
  style?: React.CSSProperties
  boxShadow?: string
}

export function Avatar({
  name,
  avatar,
  size,
  communityColor = '#a8ff3e',
  borderColor,
  borderWidth = 2,
  fontSize,
  fontWeight = 700,
  className = '',
  style,
  boxShadow,
}: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const isUrl = isAvatarUrl(avatar) && !broken
  const border = borderColor ? `${borderWidth}px solid ${borderColor}` : undefined

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: fontSize ?? size * 0.38,
    fontWeight,
    background: communityColor + '22',
    color: communityColor,
    border,
    boxShadow,
    ...style,
  }

  if (isUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={baseStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar as string}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={baseStyle}
    >
      {avatar && !isAvatarUrl(avatar) ? avatar : initials(name)}
    </div>
  )
}
