import { cn } from '@/lib/utils'

const buttonVariants = {
  default:
    'bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  outline:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}

function Button({ className, variant = 'default', asChild = false, ...props }) {
  const Comp = props.href ? 'a' : 'button'
  return (
    <Comp
      className={cn(
        'rounded-md px-4 py-2 text-sm whitespace-nowrap',
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Button }
