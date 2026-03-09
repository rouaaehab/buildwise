import { motion, useInView } from 'framer-motion'

const tagToMotion = {
  div: motion.div,
  span: motion.span,
  figure: motion.figure,
  a: motion.a,
  button: motion.button,
  p: motion.p,
}

export function TimelineContent({
  children,
  animationNum,
  timelineRef,
  className,
  as = 'div',
  customVariants,
  once = false,
  ...props
}) {
  const defaultVariants = {
    visible: (i) => ({
      filter: 'blur(0px)',
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.5, duration: 0.5 },
    }),
    hidden: {
      filter: 'blur(20px)',
      y: 0,
      opacity: 0,
    },
  }

  const variants = customVariants || defaultVariants
  const isInView = useInView(timelineRef, { once })
  const MotionTag = tagToMotion[as] || motion.div

  return (
    <MotionTag
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={animationNum}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  )
}
