import { motion } from 'framer-motion'
import pyramidImage from '@/assets/engineer.jpeg'

const steps = [
  {
    title: 'Tell us what you need',
    body: "Describe your project, budget, and timeline so we know what kind of engineer you're looking for.",
  },
  {
    title: 'Browse verified engineers',
    body: 'Explore detailed profiles with skills, experience, portfolios, and reviews from other clients.',
  },
  {
    title: 'Book a consultation',
    body: 'Pick a time that works for you, share documents, and get a Zoom link automatically.',
  },
  {
    title: 'Chat, iterate, and ship',
    body: 'Use built‑in chat, follow‑up bookings, and ratings to keep your project moving.',
  },
]

export default function HowItWorks() {
  // const [isHovered, setIsHovered] = useState(false)
  // const phoneTransform = isHovered
  //   ? 'rotateY(-18deg) rotateX(8deg) translateZ(30px) scale(1.04)'
  //   : 'rotateY(-38deg) rotateX(22deg) translateZ(0px) scale(1)'
  // const phoneShadow = isHovered
  //   ? '0 35px 60px -15px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 40px rgba(52,211,153,0.15)'
  //   : '0 25px 50px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)'

  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto flex max-w-8xl flex-col gap-10 px-4 py-16 sm:px-8 lg:px-16 lg:flex-row lg:items-center">
        <div className="w-full space-y-6 lg:w-1/2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black">
            How Buildwise works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            From idea to engineered reality in a few clicks
          </h2>
          <p className="text-sm text-gray-600">
            Whether you&apos;re planning a renovation, a new build, or solving a tricky
            technical issue, Buildwise makes it simple to find the right engineer,
            book a call, and keep everything in one place.
          </p>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end min-h-[420px]">
          <motion.div
            className="relative mx-auto w-[min(980px,85vw)] flex items-center justify-center"
            style={{ perspective: '1200px' }}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="relative rounded-2xl overflow-hidden"
              style={{
                transformStyle: 'preserve-3d',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
              }}
              whileHover={{
                rotateY: 6,
                rotateX: -4,
                scale: 1.02,
                boxShadow:
                  '0 35px 60px -15px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06), 0 0 60px -10px rgba(34,197,94,0.2)',
                transition: { duration: 0.35, ease: 'easeOut' },
              }}
            >
              <img
                src={pyramidImage}
                alt="Engineers and project journey"
                className="h-100% w-100% object-cover aspect-[15/12]"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

