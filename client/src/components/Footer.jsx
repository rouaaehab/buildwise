import { Link } from 'react-router-dom'
import { Github, Linkedin, Twitter } from 'lucide-react'

const social = [
  { href: 'https://github.com/', label: 'GitHub', Icon: Github },
  { href: 'https://www.linkedin.com/', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://twitter.com/', label: 'X (Twitter)', Icon: Twitter },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 lg:px-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link to="/" className="text-xl font-bold tracking-tight">
              Buildwise
            </Link>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Book verified engineers for consultations and short-term projects.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {social.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Product
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/engineers" className="text-white/60 hover:text-white">
                  Browse engineers
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="text-white/60 hover:text-white">
                  How it works
                </a>
              </li>
              <li>
                <a href="#roadmap" className="text-white/60 hover:text-white">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Company
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#about" className="text-white/60 hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white/60 hover:text-white">
                  Contact
                </a>
              </li>
              <li>
                <Link to="/login" className="text-white/60 hover:text-white">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Get updates
            </h3>
            <p className="mt-4 text-sm text-white/60 leading-relaxed">
              Monthly product updates. No spam.
            </p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="you@company.com"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        
      </div>
    </footer>
  )
}

