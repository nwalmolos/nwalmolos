'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from 'framer-motion'
import {
  ArrowDown,
  Github,
  Twitter,
  Mail,
  Menu,
  X,
  ArrowUpRight,
  Sparkles,
  Layers,
  Code2,
  Palette,
} from 'lucide-react'
import { SmokeyFluidCursor } from 'react-smokey-fluid-cursor'

/* ═══════════════════════════════════════════════════════
   1. CUSTOM CURSOR — 自定义光标 (dot + ring)
   ═══════════════════════════════════════════════════════ */

function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [hovering, setHovering] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    // Smooth follow for ring using lerp
    let ringX = 0, ringY = 0
    let mouseX = 0, mouseY = 0
    let raf: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      setHidden(false)

      // Dot follows instantly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`
      }
    }

    const animate = () => {
      // Ring follows with lerp (smooth delay)
      ringX += (mouseX - ringX) * 0.15
      ringY += (mouseY - ringY) * 0.15
      if (ringRef.current) {
        const scale = hovering ? 1.8 : 1
        const opacity = hovering ? 0.5 : 0.3
        ringRef.current.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(${scale})`
        ringRef.current.style.opacity = String(opacity)
      }
      raf = requestAnimationFrame(animate)
    }

    // Detect hoverable elements
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.dataset.cursor === 'pointer'
      ) {
        setHovering(true)
      }
    }
    const onOut = () => setHovering(false)
    const onLeave = () => setHidden(true)
    const onEnter = () => setHidden(false)

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      cancelAnimationFrame(raf)
    }
  }, [hovering])

  return (
    <>
      {/* Dot — the actual cursor point */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#fff',
          opacity: hidden ? 0 : 1,
          transition: 'opacity 0.2s, width 0.3s, height 0.3s',
        }}
      />
      {/* Ring — the delayed follow ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.3)',
          opacity: hidden ? 0 : 0.3,
          transition: 'opacity 0.3s, border-color 0.3s',
        }}
      />
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   2. SPLIT TEXT — Character-by-character reveal on scroll
   ═══════════════════════════════════════════════════════ */

function SplitText({ children, className = '', delay = 0 }: { children: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <span ref={ref} className={className} aria-label={children}>
      {children.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.03,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="inline-block"
          style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════
   3. MAGNETIC HOVER — 磁力吸附物理效果
   ═══════════════════════════════════════════════════════ */

function MagneticHover({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring physics for smooth return
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distX = e.clientX - centerX
    const distY = e.clientY - centerY
    // Magnetic strength: 0.35 = moderate pull
    x.set(distX * 0.35)
    y.set(distY * 0.35)
  }, [x, y])

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   TILT CARD — 3D 倾斜物理效果
   ═══════════════════════════════════════════════════════ */

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20, mass: 0.5 })
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20, mass: 0.5 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distX = (e.clientX - centerX) / (rect.width / 2)
    const distY = (e.clientY - centerY) / (rect.height / 2)
    rotateY.set(distX * 8)  // max 8deg
    rotateX.set(-distY * 8) // max 8deg
  }, [rotateX, rotateY])

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
  }, [rotateX, rotateY])

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformPerspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   Navigation — 带磁力效果
   ═══════════════════════════════════════════════════════ */

function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navItems = [
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <MagneticHover>
            <a href="#" className="text-sm font-mono tracking-widest uppercase text-foreground/70 hover:text-foreground transition-colors">
              YN<span className="text-foreground/30">.</span>
            </a>
          </MagneticHover>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <MagneticHover key={item.label}>
                <a
                  href={item.href}
                  className="text-sm text-foreground/50 hover:text-foreground transition-colors duration-300 tracking-wide"
                >
                  {item.label}
                </a>
              </MagneticHover>
            ))}
            <MagneticHover>
              <a
                href="#contact"
                className="text-sm px-5 py-2 border border-foreground/20 rounded-full text-foreground/70 hover:text-foreground hover:border-foreground/50 hover:bg-foreground/[0.05] transition-all duration-300"
              >
                Get in Touch
              </a>
            </MagneticHover>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-foreground/70 hover:text-foreground transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-30 bg-background/95 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-8">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-light text-foreground/70 hover:text-foreground transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   Hero Section — 多层视差滚动
   ═══════════════════════════════════════════════════════ */

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  // Multiple parallax layers at different speeds
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -120])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92])

  // Decorative layers — each moves at different speed
  const gridY1 = useTransform(scrollYProgress, [0, 1], [0, -200])   // fast layer
  const gridY2 = useTransform(scrollYProgress, [0, 1], [0, -80])    // medium layer
  const cornerY = useTransform(scrollYProgress, [0, 1], [0, -150])  // corner marks
  const lineY = useTransform(scrollYProgress, [0, 1], [0, -60])     // slowest

  // Glow position parallax
  const glowX = useTransform(scrollYProgress, [0, 0.5], [50, -50])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ── Parallax background glow ── */}
      <motion.div
        style={{ x: glowX }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <div className="w-[800px] h-[800px] rounded-full bg-foreground/[0.02] blur-[120px]" />
      </motion.div>

      {/* ── Fast parallax: vertical grid lines ── */}
      <motion.div style={{ y: gridY1 }} className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-foreground/[0.03]" />
        <div className="absolute left-2/4 top-0 bottom-0 w-px bg-foreground/[0.02]" />
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-foreground/[0.03]" />
      </motion.div>

      {/* ── Medium parallax: horizontal lines ── */}
      <motion.div style={{ y: gridY2 }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 right-0 h-px bg-foreground/[0.04]" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-foreground/[0.03]" />
      </motion.div>

      {/* ── Slow parallax: corner marks ── */}
      <motion.div style={{ y: cornerY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 left-8 w-10 h-10 border-l-2 border-t-2 border-foreground/[0.08]" />
        <div className="absolute top-8 right-8 w-10 h-10 border-r-2 border-t-2 border-foreground/[0.08]" />
        <div className="absolute bottom-8 left-8 w-10 h-10 border-l-2 border-b-2 border-foreground/[0.08]" />
        <div className="absolute bottom-8 right-8 w-10 h-10 border-r-2 border-b-2 border-foreground/[0.08]" />
      </motion.div>

      {/* ── Slowest parallax: subtle floating circles ── */}
      <motion.div style={{ y: lineY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[15%] w-32 h-32 rounded-full border border-foreground/[0.03]" />
        <div className="absolute bottom-[25%] left-[10%] w-24 h-24 rounded-full border border-foreground/[0.04]" />
        <div className="absolute top-[60%] right-[25%] w-16 h-16 rounded-full border border-foreground/[0.02]" />
      </motion.div>

      {/* ── Horizontal scrolling showcase ── */}
      <motion.div style={{ y: gridY2 }} className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
        <div className="flex gap-8 animate-scroll-horizontal items-center" style={{ width: 'max-content' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shrink-0 w-[300px] h-[200px] rounded-lg overflow-hidden" style={{
              background: `linear-gradient(${135 + i * 45}deg, 
                rgba(255,255,255,0.05) 0%, 
                rgba(200,220,255,0.02) 50%, 
                rgba(255,255,255,0.05) 100%)`
            }} />
          ))}
        </div>
      </motion.div>

      {/* ── Main hero content ── */}
      <motion.div style={{ opacity: heroOpacity, y: heroY, scale: heroScale }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Top label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-foreground/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse-dot" />
            Available for work
          </span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9]"
        >
          <SplitText className="gradient-text text-glow">Creative</SplitText>
          <br />
          <SplitText className="text-foreground text-glow">Developer</SplitText>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 text-lg md:text-xl text-foreground/50 max-w-xl mx-auto font-light leading-[1.8]"
        >
          Designing and building digital experiences
          <br className="hidden sm:block" />
          at the intersection of art and technology.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <MagneticHover>
            <a
              href="#about"
              className="flex flex-col items-center gap-2 text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase">Scroll</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowDown size={16} />
              </motion.div>
            </a>
          </MagneticHover>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   Marquee Section
   ═══════════════════════════════════════════════════════ */

function MarqueeSection() {
  const items = ['DESIGN', 'DEVELOP', 'CREATE', 'INNOVATE', 'BUILD', 'EXPLORE']
  const doubled = [...items, ...items]

  return (
    <div className="py-10 border-y border-border overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {doubled.map((item, i) => (
          <span key={i} className="text-xs font-mono tracking-[0.5em] text-foreground/[0.08] flex items-center shrink-0 px-8">
            {item}
            <span className="ml-8 w-1 h-1 rounded-full bg-foreground/[0.06]" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   Reveal Section
   ═══════════════════════════════════════════════════════ */

function RevealSection({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/* ═══════════════════════════════════════════════════════
   Parallax Wrapper — 给任意区域加视差
   ═══════════════════════════════════════════════════════ */

function ParallaxLayer({ children, speed = 0.5, className = '' }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * -100])

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   About Section — 带3D倾斜卡片
   ═══════════════════════════════════════════════════════ */

function AboutSection() {
  const stats = [
    { number: '3+', label: 'Years Experience' },
    { number: '20+', label: 'Projects Completed' },
    { number: '10+', label: 'Happy Clients' },
  ]

  const skills = [
    { icon: Code2, name: 'Frontend Development', desc: 'React, Next.js, TypeScript, Tailwind CSS' },
    { icon: Palette, name: 'UI/UX Design', desc: 'Figma, Design Systems, Prototyping' },
    { icon: Layers, name: 'Full Stack', desc: 'Node.js, Python, Databases, APIs' },
    { icon: Sparkles, name: 'Creative Coding', desc: 'WebGL, Shaders, Generative Art' },
  ]

  return (
    <RevealSection id="about" className="py-32 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-xs font-mono tracking-[0.3em] uppercase text-foreground/30">01 — About</span>
        </div>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          {/* Left: text with parallax */}
          <ParallaxLayer speed={0.2}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8">
              Crafting digital
              <br />
              <span className="text-foreground/30">experiences</span>
            </h2>
            <p className="text-foreground/50 text-lg leading-relaxed mb-6">
              I&apos;m a creative developer with a passion for building beautiful, functional, and accessible digital products. I believe great design is invisible — it just works.
            </p>
            <p className="text-foreground/50 text-lg leading-relaxed">
              My approach combines technical precision with creative exploration, always pushing the boundaries of what&apos;s possible on the web. Every project is an opportunity to create something meaningful.
            </p>
          </ParallaxLayer>

          {/* Right: stats + tilt cards */}
          <div className="flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-8 mb-12">
              {stats.map((stat) => (
                <ParallaxLayer key={stat.label} speed={0.1}>
                  <div className="text-center md:text-left">
                    <div className="text-3xl md:text-4xl font-bold tracking-tight">{stat.number}</div>
                    <div className="text-xs text-foreground/30 mt-1 font-mono tracking-wider uppercase">{stat.label}</div>
                  </div>
                </ParallaxLayer>
              ))}
            </div>

            <div className="h-px bg-border mb-12" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {skills.map((skill) => (
                <TiltCard key={skill.name}>
                  <div className="group p-4 rounded-lg border border-border/50 hover:border-foreground/20 transition-all duration-500 hover:bg-foreground/[0.02]">
                    <skill.icon
                      size={20}
                      className="text-foreground/30 group-hover:text-foreground/60 transition-colors mb-3"
                    />
                    <div className="text-sm font-medium mb-1">{skill.name}</div>
                    <div className="text-xs text-foreground/30">{skill.desc}</div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  )
}

/* ═══════════════════════════════════════════════════════
   Projects Section — 带磁力+视差
   ═══════════════════════════════════════════════════════ */

function ProjectsSection() {
  const projects = [
    {
      title: 'Project Aurora',
      category: 'Web Application',
      description: 'A next-generation creative platform that empowers artists and designers to collaborate in real-time. Built with WebSocket technology and a custom rendering engine.',
      tags: ['React', 'WebSocket', 'Canvas API'],
      year: '2025',
    },
    {
      title: 'Nebula Dashboard',
      category: 'Data Visualization',
      description: 'An immersive analytics dashboard that transforms complex datasets into intuitive visual narratives. Features real-time updates and interactive 3D charts.',
      tags: ['Next.js', 'Three.js', 'D3.js'],
      year: '2025',
    },
    {
      title: 'Echo Studio',
      category: 'Creative Tool',
      description: 'A browser-based audio visualization tool that generates real-time graphics from sound. Combines Web Audio API with generative art algorithms.',
      tags: ['WebGL', 'Web Audio', 'GLSL'],
      year: '2024',
    },
    {
      title: 'Flux Engine',
      category: 'Open Source',
      description: 'An open-source motion design library for the web. Provides declarative APIs for creating complex animations and transitions with minimal code.',
      tags: ['TypeScript', 'Animation', 'Open Source'],
      year: '2024',
    },
  ]

  return (
    <RevealSection id="projects" className="py-32 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-xs font-mono tracking-[0.3em] uppercase text-foreground/30">02 — Projects</span>
        </div>

        <ParallaxLayer speed={0.15}>
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-glow">
              <SplitText>Selected</SplitText>
              <br />
              <span className="text-foreground/30"><SplitText>works</SplitText></span>
            </h2>
          </div>
        </ParallaxLayer>

        <div className="space-y-0">
          {projects.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} />
          ))}
        </div>
      </div>
    </RevealSection>
  )
}

function ProjectCard({
  project,
  index,
}: {
  project: {
    title: string
    category: string
    description: string
    tags: string[]
    year: string
  }
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 30, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 200, damping: 30, mass: 0.5 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distX = e.clientX - centerX
    const distY = e.clientY - centerY
    // Only update if movement is significant enough
    const newX = distX * 0.06
    const newY = distY * 0.06
    // Dead zone: ignore micro-movements that cause oscillation
    if (Math.abs(newX - x.get()) < 0.5 && Math.abs(newY - y.get()) < 0.5) return
    x.set(newX)
    y.set(newY)
  }, [x, y])

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <motion.div
        ref={ref}
        style={{ x: springX, y: springY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group py-8 md:py-10 border-b border-border/50 hover:border-foreground/20 transition-all duration-500 cursor-pointer"
        data-cursor="pointer"
      >
        <div className="grid md:grid-cols-12 gap-4 md:gap-8 items-start">
          {/* Left: Index + Title */}
          <div className="md:col-span-5 flex items-start gap-4">
            <span className="text-xs font-mono text-foreground/20 mt-1.5 shrink-0">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-xl md:text-2xl font-semibold tracking-tight group-hover:text-foreground/80 transition-colors">
                {project.title}
              </h3>
              <span className="text-xs font-mono text-foreground/30 mt-1 block">{project.category}</span>
            </div>
          </div>

          {/* Middle: Description */}
          <div className="md:col-span-5">
            <p className="text-sm text-foreground/40 leading-relaxed group-hover:text-foreground/60 transition-colors">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 border border-border/50 rounded-full text-foreground/30 group-hover:text-foreground/50 group-hover:border-foreground/20 transition-all"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Year + Arrow */}
          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <span className="text-xs font-mono text-foreground/20">{project.year}</span>
            <motion.div
              whileHover={{ x: 4, y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <ArrowUpRight size={18} className="text-foreground/20 group-hover:text-foreground/60 transition-colors" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   Philosophy Section — 带视差
   ═══════════════════════════════════════════════════════ */

function PhilosophySection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.5, 1, 1, 0.5])

  return (
    <section ref={ref} className="py-32 md:py-40 px-6">
      <motion.div style={{ scale, opacity }} className="max-w-4xl mx-auto text-center">
        <span className="text-xs font-mono tracking-[0.3em] uppercase text-foreground/30 block mb-12">
          Philosophy
        </span>
        <blockquote className="text-2xl md:text-4xl lg:text-5xl font-light tracking-tight leading-[1.2] text-foreground/70">
          &ldquo;The best interface is no interface. The best design feels like it was always there, quietly making life better.&rdquo;
        </blockquote>
        <div className="mt-8 text-sm font-mono text-foreground/20 tracking-wider">— DESIGN PRINCIPLE</div>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   Contact Section — 带磁力+视差
   ═══════════════════════════════════════════════════════ */

function ContactSection() {
  const links = [
    { icon: Github, label: 'GitHub', href: 'https://github.com/yourusername' },
    { icon: Twitter, label: 'Twitter', href: 'https://twitter.com/yourusername' },
    { icon: Mail, label: 'Email', href: 'mailto:hello@yourdomain.com' },
  ]

  return (
    <RevealSection id="contact" className="py-32 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-xs font-mono tracking-[0.3em] uppercase text-foreground/30">03 — Contact</span>
        </div>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          <ParallaxLayer speed={0.15}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8 text-glow">
              <SplitText>Let's work</SplitText>
              <br />
              <span className="text-foreground/30"><SplitText>together</SplitText></span>
            </h2>
            <p className="text-foreground/50 text-lg leading-relaxed max-w-md">
              Have a project in mind or just want to chat? I&apos;m always open to discussing new ideas and opportunities.
            </p>
          </ParallaxLayer>

          <div className="flex flex-col justify-center">
            <MagneticHover>
              <a
                href="mailto:hello@yourdomain.com"
                className="group inline-flex items-center gap-4 mb-12 text-2xl md:text-3xl font-light text-foreground/60 hover:text-foreground transition-colors duration-500"
                data-cursor="pointer"
              >
                hello@yourdomain.com
                <motion.div
                  whileHover={{ x: 6, y: -6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <ArrowUpRight size={24} className="text-foreground/20 group-hover:text-foreground/60 transition-colors" />
                </motion.div>
              </a>
            </MagneticHover>

            <div className="h-px bg-border mb-8" />

            <div className="flex items-center gap-6">
              {links.map((link) => (
                <MagneticHover key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-sm text-foreground/30 hover:text-foreground/70 transition-colors duration-300"
                    data-cursor="pointer"
                  >
                    <link.icon size={18} />
                    <span className="hidden sm:inline font-mono tracking-wider text-xs uppercase">{link.label}</span>
                  </a>
                </MagneticHover>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  )
}

/* ═══════════════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-border/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs font-mono text-foreground/20 tracking-wider">
          &copy; {new Date().getFullYear()} Your Name. All rights reserved.
        </span>
        <span className="text-xs font-mono text-foreground/15 tracking-wider">
          Built with Next.js &amp; Tailwind CSS
        </span>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════ */

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col bg-background cursor-none">
      <CustomCursor />
      <SmokeyFluidCursor
        config={{
          simResolution: 64,
          dyeResolution: 512,
          captureResolution: 512,
          densityDissipation: 3.5,
          velocityDissipation: 3.0,
          pressure: 0.1,
          pressureIteration: 10,
          curl: 15,
          splatRadius: 0.15,
          splatForce: 4000,
          shading: true,
          colorUpdateSpeed: 3,
          paused: false,
          backColor: { r: 0, g: 0, b: 0 },
          transparent: true,
          id: 'fluid-canvas',
        }}
      />
      <Navigation />
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ProjectsSection />
      <PhilosophySection />
      <ContactSection />
      <Footer />
    </main>
  )
}
