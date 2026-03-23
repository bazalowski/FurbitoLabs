'use client'

import { useEffect, useRef, useState } from 'react'

// Singleton toast via event
const TOAST_EVENT = 'furbito:toast'

export function showToast(message: string, duration = 2500) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, duration } }))
}

export function ToastProvider() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handler = (e: CustomEvent<{ message: string; duration: number }>) => {
      setMessage(e.detail.message)
      setVisible(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), e.detail.duration)
    }

    window.addEventListener(TOAST_EVENT as any, handler)
    return () => window.removeEventListener(TOAST_EVENT as any, handler)
  }, [])

  return (
    <div className={`toast ${visible ? 'show' : ''}`}>
      {message}
    </div>
  )
}
