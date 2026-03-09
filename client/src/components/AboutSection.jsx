'use client'

import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { TimelineContent } from '@/components/ui/timeline-animation'
import { VerticalCutReveal } from '@/components/ui/vertical-cut-reveal'
import { ArrowRight, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'

export default function AboutSection() {
  const sectionRef = useRef(null)

  const revealVariants = {
    visible: (i) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: { delay: i * 0.2, duration: 0.2 },
    }),
    hidden: {
      filter: 'blur(10px)',
      y: -20,
      opacity: 0,
    },
  }

  const scaleVariants = {
    visible: (i) => ({
      opacity: 1,
      filter: 'blur(0px)',
      transition: { delay: i * 0.4, duration: 0.5 },
    }),
    hidden: {
      filter: 'blur(10px)',
      opacity: 0,
    },
  }

  const social = [
    { href: 'https://www.facebook.com/', Icon: Facebook, label: 'Facebook' },
    { href: 'https://www.instagram.com/', Icon: Instagram, label: 'Instagram' },
    { href: 'https://www.linkedin.com/', Icon: Linkedin, label: 'LinkedIn' },
    { href: 'https://www.youtube.com/', Icon: Youtube, label: 'YouTube' },
  ]

  return (
    <section id="about" className="py-8 px-4 bg-[#f9f9f9]" ref={sectionRef}>
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          {/* Header with social */}
          <div className="flex justify-between items-center mb-8 w-[85%] absolute lg:top-4 md:top-0 sm:-top-2 -top-3 z-10">
            <div className="flex items-center gap-2 text-xl">
              <span className="text-red-500 animate-spin">✱</span>
              <TimelineContent
                as="span"
                animationNum={0}
                timelineRef={sectionRef}
                customVariants={revealVariants}
                className="text-sm font-medium text-gray-600"
              >
                ABOUT US
              </TimelineContent>
            </div>
            <div className="flex gap-4">
              {social.map(({ href, Icon, label }, i) => (
                <TimelineContent
                  key={label}
                  as="a"
                  animationNum={i}
                  timelineRef={sectionRef}
                  customVariants={revealVariants}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="md:w-8 md:h-8 sm:w-6 w-5 sm:h-6 h-5 border border-gray-200 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                </TimelineContent>
              ))}
            </div>
          </div>

          <TimelineContent
            as="figure"
            animationNum={4}
            timelineRef={sectionRef}
            customVariants={scaleVariants}
            className="relative group"
          >
            <svg className="w-full" width="100%" height="100%" viewBox="0 0 100 40">
              <defs>
                <clipPath id="clip-about-buildwise" clipPathUnits="objectBoundingBox">
                  <path
                    d="M0.0998072 1H0.422076H0.749756C0.767072 1 0.774207 0.961783 0.77561 0.942675V0.807325C0.777053 0.743631 0.791844 0.731953 0.799059 0.734076H0.969813C0.996268 0.730255 1.00088 0.693206 0.999875 0.675159V0.0700637C0.999875 0.0254777 0.985045 0.00477707 0.977629 0H0.902473C0.854975 0 0.890448 0.138535 0.850165 0.138535H0.0204424C0.00408849 0.142357 0 0.180467 0 0.199045V0.410828C0 0.449045 0.0136283 0.46603 0.0204424 0.469745H0.0523086C0.0696245 0.471019 0.0735527 0.497877 0.0733523 0.511146V0.915605C0.0723903 0.983121 0.090588 1 0.0998072 1Z"
                    fill="#D9D9D9"
                  />
                </clipPath>
              </defs>
              <image
                clipPath="url(#clip-about-buildwise)"
                preserveAspectRatio="xMidYMid slice"
                width="100%"
                height="100%"
                href="https://www.andacademy.com/resources/wp-content/uploads/2023/05/New-Project-32.webp"
              />
            </svg>
          </TimelineContent>

          {/* Stats */}
          <div className="flex flex-wrap lg:justify-start justify-between items-center py-3 text-sm">
            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={sectionRef}
              customVariants={revealVariants}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2 mb-2 sm:text-base text-xs">
                <span className="text-red-500 font-bold">50+</span>
                <span className="text-gray-600">engineers</span>
                <span className="text-gray-300">|</span>
              </div>
              <div className="flex items-center gap-2 mb-2 sm:text-base text-xs">
                <span className="text-red-500 font-bold">1,000+</span>
                <span className="text-gray-600">consultations</span>
              </div>
            </TimelineContent>
            <div className="lg:absolute right-0 bottom-16 flex lg:flex-col flex-row-reverse lg:gap-0 gap-4">
              <TimelineContent
                as="div"
                animationNum={6}
                timelineRef={sectionRef}
                customVariants={revealVariants}
                className="flex lg:text-4xl sm:text-3xl text-2xl items-center gap-2 mb-2"
              >
                <span className="text-red-500 font-semibold">100+</span>
                <span className="text-gray-600 uppercase">clients</span>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={7}
                timelineRef={sectionRef}
                customVariants={revealVariants}
                className="flex items-center gap-2 mb-2 sm:text-base text-xs"
              >
                <span className="text-red-500 font-bold">24/7</span>
                <span className="text-gray-600">booking</span>
                <span className="text-gray-300 lg:hidden block">|</span>
              </TimelineContent>
            </div>
          </div>
        </div>

        {/* Main content - child elements set their own color; change text-* below to change color */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="sm:text-4xl md:text-5xl text-2xl !leading-[110%] font-semibold text-gray-900 mb-8">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.1}
                staggerFrom="first"
                reverse={true}
                transition={{
                  type: 'spring',
                  stiffness: 250,
                  damping: 30,
                  delay: 0.3,
                }}
              >
                Engineering talent when and where you need it.
              </VerticalCutReveal>
            </h2>

            <TimelineContent
              as="div"
              animationNum={9}
              timelineRef={sectionRef}
              customVariants={revealVariants}
              className="grid md:grid-cols-2 gap-8 text-gray-600"
            >
              <TimelineContent
                as="div"
                animationNum={10}
                timelineRef={sectionRef}
                customVariants={revealVariants}
                className="sm:text-base text-xs"
              >
                <p className="leading-relaxed text-justify">
                  Buildwise connects businesses with vetted engineers for short-term rentals and consultations. We started to make expert talent accessible without long-term hires.
                </p>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={11}
                timelineRef={sectionRef}
                customVariants={revealVariants}
                className="sm:text-base text-xs"
              >
                <p className="leading-relaxed text-justify">
                  From design reviews to on-site support, our platform handles booking, messaging, and payments so you can focus on building. One place for engineering capacity.
                </p>
              </TimelineContent>
            </TimelineContent>
          </div>

          <div className="md:col-span-1">
            <div className="text-right">
              <TimelineContent
                as="div"
                animationNum={12}
                timelineRef={sectionRef}
                customVariants={revealVariants}
                className="text-red-500 text-2xl font-bold mb-2"
              >
                BUILDWISE
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={13}
                timelineRef={sectionRef}
                customVariants={revealVariants}
                className="text-gray-600 text-sm mb-8"
              >
                Engineering rental & consultation
              </TimelineContent>

              <TimelineContent
                as="div"
                animationNum={14}
                timelineRef={sectionRef}
                customVariants={revealVariants}
                className="mb-6"
              >
                <p className="text-gray-900 font-medium mb-4">
                  Ready to find the right engineer for your project?
                </p>
              </TimelineContent>

              <TimelineContent
                as="div"
                animationNum={15}
                timelineRef={sectionRef}
                customVariants={revealVariants}
              >
                <Link
                  to="/engineers"
                  className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-950 shadow-lg shadow-neutral-900 border border-neutral-700 hover:gap-4 transition-all duration-300 ease-in-out text-white px-5 py-3 rounded-lg font-semibold"
                >
                  BROWSE ENGINEERS <ArrowRight className="w-4 h-4" />
                </Link>
              </TimelineContent>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
