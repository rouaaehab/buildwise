import { Link } from 'react-router-dom'
import { AnimatedRoadmap } from '@/components/ui/hero-section-5'
// Replace with your image: add it to src/assets/ and update the path below (e.g. roadmap-map.png)
import mapImageSrc from '@/assets/pyramid.png'

const milestonesData = [
  { id: 1, name: 'Sign up', status: 'complete', position: { top: '70%', left: '5%' } },
  { id: 2, name: 'Browse engineers', status: 'complete', position: { top: '15%', left: '20%' } },
  { id: 3, name: 'Book a call', status: 'in-progress', position: { top: '45%', left: '65%' } },
  { id: 4, name: 'Start your project', status: 'pending', position: { top: '10%', right: '-15%' } },
]

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="w-full bg-black text-white">
      <div className="container mx-auto flex flex-col items-center px-4 py-16 text-center md:py-24">
        <h2 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          Stay ahead with a{' '}
          <span className="rounded-md bg-primary/20 p-2">clear</span> project plan
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-white/60 md:text-xl">
          From sign-up to delivery—find engineers, book consultations, and hit every milestone.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/engineers"
            className="inline-flex h-11 items-center justify-center rounded-md bg-white px-8 text-base font-medium text-black transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Get started – it&apos;s free
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/15 bg-white/[0.06] px-8 text-base font-medium text-white transition-colors hover:bg-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            See how it works
          </a>
        </div>
      </div>

      <AnimatedRoadmap
        milestones={milestonesData}
        mapImageSrc={mapImageSrc}
        aria-label="Animated roadmap showing your journey from sign-up to project delivery."
      />
    </section>
  )
}
export { mapImageSrc }