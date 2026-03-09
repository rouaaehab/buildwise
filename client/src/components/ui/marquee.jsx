import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Horizontal marquee. Uses CSS animation (--duration, --gap).
 * repeat = number of duplicate content strips for seamless loop.
 */
export function Marquee({
  className,
  children,
  repeat = 2,
  pauseOnHover = false,
  ...props
}) {
  const [paused, setPaused] = useState(false)
  return (
    <div
      className={cn('overflow-hidden', className)}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
      {...props}
    >
      <div
        className={cn(
          'flex w-max animate-marquee gap-[var(--gap,1rem)]',
          paused && 'animation-paused'
        )}
        style={{ ['--duration']: '30s' }}
      >
        {Array.from({ length: repeat }, (_, i) => (
          <div key={i} className="flex shrink-0 gap-[var(--gap,1rem)]">
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}
