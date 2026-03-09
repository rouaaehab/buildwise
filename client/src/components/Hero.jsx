import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Marquee } from '@/components/ui/marquee'

const teamAvatars = [
  { initials: 'SM', src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop' },
  { initials: 'JK', src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
  { initials: 'AL', src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop' },
  { initials: 'RC', src: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop' },
  { initials: 'MP', src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop' },
]

const stats = [
  { emoji: '👷', label: 'Verified engineers', value: '50+' },
  { emoji: '📐', label: 'Consultations completed', value: '1.2K+' },
  { emoji: '⭐', label: 'Client satisfaction', value: '4.9/5' },
]

function AvatarStack() {
  return (
    <div className="flex -space-x-3">
      {teamAvatars.map((member, i) => (
        <Avatar
          className="size-12 border-2 border-primary bg-neutral-800"
          key={member.initials}
          style={{ zIndex: teamAvatars.length - i }}
        >
          <AvatarImage alt={`Engineer ${i + 1}`} src={member.src} />
          <AvatarFallback className="bg-neutral-700 text-white text-xs">
            {member.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}

function StatsMarquee() {
  return (
    <Marquee
      className="border-white/10 border-y bg-black/30 py-2 backdrop-blur-sm [--duration:30s] [--gap:2rem]"
      pauseOnHover
      repeat={4}
    >
      {stats.map((stat) => (
        <div
          className="flex items-center gap-3 whitespace-nowrap"
          key={stat.label}
        >
          <span className="font-bold font-mono text-primary text-sm tracking-wide">
            {stat.value}
          </span>
          <span className="font-medium font-mono text-sm text-white/70 uppercase tracking-[0.15em]">
            {stat.label}
          </span>
          <span className="text-base">{stat.emoji}</span>
        </div>
      ))}
    </Marquee>
  )
}

export default function Hero() {
  return (
    <section className="relative flex min-h-screen w-full flex-col items-start justify-end">
      <div
        className="absolute inset-0 bg-center bg-cover h-full"
        style={{
          backgroundImage:
            'url(https://www.bmu.edu.in/wp-content/uploads/2025/02/Types-of-Engineering.webp)',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 text-white sm:px-8 lg:px-16">
        <div className="space-y-4">
          <AvatarStack />
          <StatsMarquee />
        </div>
      </div>
      <div className="relative z-10 w-full px-4 pb-16 sm:px-8 sm:pb-24 lg:px-16 lg:pb-32">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="w-full space-y-4 sm:w-1/2">
            <h1 className="font-medium text-4xl text-white leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Book <span className="text-primary">engineers</span>, ship{' '}
              <span className="text-primary">projects</span>
              <br />
              <span className="text-white">that's Buildwise</span>
            </h1>
            <Link
              to="/engineers"
              className="group inline-flex cursor-pointer items-center justify-center gap-0 rounded-full border-none bg-transparent px-0 py-5 font-normal text-lg shadow-none outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-white/50 hover:bg-transparent"
            >
              <span className="rounded-full bg-primary px-6 py-3 text-black duration-500 ease-in-out group-hover:bg-white group-hover:text-black group-hover:transition-colors">
                Browse engineers
              </span>
              <span className="relative flex h-fit cursor-pointer items-center overflow-hidden rounded-full bg-primary p-5 text-black duration-500 ease-in-out group-hover:bg-white group-hover:text-primary group-hover:transition-colors">
                <ArrowUpRight className="absolute h-5 w-5 -translate-x-1/2 transition-all duration-500 ease-in-out group-hover:translate-x-10" />
                <ArrowUpRight className="absolute h-5 w-5 -translate-x-10 transition-all duration-500 ease-in-out group-hover:-translate-x-1/2" />
              </span>
            </Link>
          </div>
          <div className="w-full sm:w-1/2">
            <p className="text-base text-primary italic sm:text-right md:text-2xl">
              Connect with verified engineers for consultations and short-term
              projects. Compare profiles, book calls, and get expert advice all
              in one place.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
