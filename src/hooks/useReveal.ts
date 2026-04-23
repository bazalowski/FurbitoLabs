'use client'

import { useEffect, useRef } from 'react'

/**
 * Dispara una animación de entrada la primera vez que el elemento entra
 * en el viewport. Una vez revelado, desconecta el observer: las celebraciones
 * entran pero no viven.
 *
 * Uso:
 *   const ref = useReveal<HTMLDivElement>()
 *   return <div ref={ref} className="is-reveal">...</div>
 *
 * La clase CSS (`is-reveal` o `is-reveal-pop`) define la animación. El hook solo
 * añade `is-revealed` cuando el elemento cruza el umbral.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  options: { threshold?: number; rootMargin?: string; delay?: number } = {},
) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-revealed')
      return
    }

    const { threshold = 0.2, rootMargin = '0px', delay = 0 } = options
    const obs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (delay > 0) {
            window.setTimeout(() => el.classList.add('is-revealed'), delay)
          } else {
            el.classList.add('is-revealed')
          }
          obs.disconnect()
          break
        }
      },
      { threshold, rootMargin },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [options])

  return ref
}
