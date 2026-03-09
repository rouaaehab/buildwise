import { cn } from '@/lib/utils'

function Avatar({ className, style, children, ...props }) {
  return (
    <span
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </span>
  )
}

function AvatarImage({ className, alt, src, ...props }) {
  return (
    <img
      alt={alt}
      src={src}
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }) {
  return (
    <span
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted',
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
