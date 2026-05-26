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
  ExternalLink,
} from 'lucide-react'
import { SmokeyFluidCursor } from 'react-smokey-fluid-cursor'

/* ═══════════════════════════════════════════════════════
   📝 内容配置区 — 所有文字和链接都在这里修改
   ═══════════════════════════════════════════════════════ */

const SITE_CONFIG = {
  // 导航栏
  nav: {
    logo: 'YN',                    // 左上角 logo 文字
    logoSuffix: '.',               // logo 后缀（浅色）
    items: [
      { label: 'About', href: '#about' },
      { label: 'Projects', href: '#projects' },
    ],
    // Q3 FIX: "Get in Touch" CTA 导航到 #contact，不再与 nav items 重复
    cta: { label: 'Get in Touch', href: '#contact' },
  },

  // Hero 区域
  hero: {
    badge: 'Available for work',
    title1: 'Creative',
    title2: 'Developer',
    subtitle: 'Designing and building digital experiences at the intersection of art and technology.',
  },

  // 跑马灯
  marquee: ['DESIGN', 'DEVELOP', 'CREATE', 'INNOVATE', 'BUILD', 'EXPLORE'],

  // About 区域
  about: {
    sectionLabel: '01 — About',
    title1: 'Crafting digital',
    title2: 'experiences',
    description1: "I'm a creative developer with a passion for building beautiful, functional, and accessible digital products. I believe great design is invisible — it just works.",
    description2: "My approach combines technical precision with creative exploration, always pushing the boundaries of what's possible on the web. Every project is an opportunity to create something meaningful.",
    stats: [
      { number: '3+', label: 'Years Experience' },
      { number: '20+', label: 'Projects Completed' },
      { number: '10+', label: 'Happy Clients' },
    ],
    skills: [
      { icon: 'Code2', name: 'Frontend Development', desc: 'React, Next.js, TypeScript, Tailwind CSS' },
      { icon: 'Palette', name: 'UI/UX Design', desc: 'Figma, Design Systems, Prototyping' },
      { icon: 'Layers', name: 'Full Stack', desc: 'Node.js, Python, Databases, APIs' },
      { icon: 'Sparkles', name: 'Creative Coding', desc: 'WebGL, Shaders, Generative Art' },
    ],
  },

  // Projects 区域 — Q1 FIX: 改善排版
  projects: {
    sectionLabel: '02 — Projects',
    title1: 'Selected',
    title2: 'works',
    items: [
      {
        title: 'Project Aurora',
        category: 'Web Application',
        description: 'A next-generation creative platform that empowers artists and designers to collaborate in real-time. Built with WebSocket technology and a custom rendering engine.',
        tags: ['React', 'WebSocket', 'Canvas API'],
        year: '2025',
        url: '#',
        image: '', // 可选：项目图片 URL
      },
      {
        title: 'Nebula Dashboard',
        category: 'Data Visualization',
        description: 'An immersive analytics dashboard that transforms complex datasets into intuitive visual narratives. Features real-time updates and interactive 3D charts.',
        tags: ['Next.js', 'Three.js', 'D3.js'],
        year: '2025',
        url: '#',
        image: '',
      },
      {
        title: 'Echo Studio',
        category: 'Creative Tool',
        description: 'A browser-based audio visualization tool that generates real-time graphics from sound. Combines Web Audio API with generative art algorithms.',
        tags: ['WebGL', 'Web Audio', 'GLSL'],
        year: '2024',
        url: '#',
        image: '',
      },
      {
        title: 'Flux Engine',
        category: 'Open Source',
        description: 'An open-source motion design library for the web. Provides declarative APIs for creating complex animations and transitions with minimal code.',
        tags: ['TypeScript', 'Animation', 'Open Source'],
        year: '2024',
        url: '#',
        image: '',
      },
    ],
  },

  // Philosophy 区域
  philosophy: {
    label: 'Philosophy',
    quote: 'The best interface is no interface. The best design feels like it was always there, quietly making life better.',
    attribution: 'DESIGN PRINCIPLE',
  },

  // Contact 区域
  contact: {
    sectionLabel: '03 — Contact',
    title1: "Let's work",
    title2: 'together',
    description: "Have a project in mind or just want to chat? I'm always open to discussing new ideas and opportunities.",
    email: 'hello@yourdomain.com',
    links: [
      { icon: 'Github', label: 'GitHub', href: 'https://github.com/yourusername' },
      { icon: 'Twitter', label: 'Twitter', href: 'https://twitter.com/yourusername' },
      { icon: 'Mail', label: 'Email', href: 'mailto:hello@yourdomain.com' },
    ],
  },

  // Footer
  footer: {
    name: 'Your Name',
    credit: 'Built with Next.js & Tailwind CSS',
  },
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Code2,
  Palette,
  Layers,
  Sparkles,
  Github,
  Twitter,
  Mail,
}

/* ═══════════════════════════════════════════════════════
   Q4/Q5 FIX: 平滑滚动 + 动画触发工具函数
   先跳到目标上方，再平滑滚动下去，确保触发 scroll 动画
   ═══════════════════════════════════════════════════════ */

function scrollToElement(id: string) {
  const el = document.getElementById(id)
  if (el) {
    // 先瞬间跳到目标上方一段距离，再平滑滚动到目标
    // 这样可以确保目标元素"离开视口再进入"，从而触发 useInView 动画
    const offset = 200
    const targetTop = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top: targetTop, behavior: 'instant' as ScrollBehavior })
    // 短暂延迟后平滑滚动到实际位置
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

/* ═══════════════════════════════════════════════════════
   1. CUSTOM CURSOR — Q2 FIX: 增强悬停可点击元素时的视觉反馈
   - 可点击元素：dot 变大 + 变色，ring 变大 + 颜色加深 + 显示 "VIEW" 文字
   - 不可点击时：保持小 dot + 细 ring
   ═══════════════════════════════════════════════════════ */

function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const [hovering, setHovering] = useState(false)
  const [hoverLabel, setHoverLabel] = useState('')
  const [hidden, setHidden] = useState(true)
  const [clicking, setClicking] = useState(false)

  useEffect(() => {
    let ringX = 0, ringY = 0
    let mouseX = 0, mouseY = 0
    let raf: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      setHidden(false)
      if (dotRef.current) {
        const dotSize = hovering ? 12 : 8
        dotRef.current.style.transform = `translate(${mouseX - dotSize / 2}px, ${mouseY - dotSize / 2}px)`
      }
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      if (ringRef.current) {
        const ringSize = hovering ? 56 : 40
        const scale = clicking ? 0.85 : hovering ? 1.2 : 1
        ringRef.current.style.transform = `translate(${ringX - ringSize / 2}px, ${ringY - ringSize / 2}px) scale(${scale})`
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate(${ringX - 20}px, ${ringY + 32}px)`
      }
      raf = requestAnimationFrame(animate)
    }

    const getHoverInfo = (target: HTMLElement): { isHoverable: boolean; label: string } => {
      // 检查元素本身或最近的交互父元素
      const interactiveEl = target.closest('a, button, [data-cursor="pointer"]') as HTMLElement | null
      if (!interactiveEl) return { isHoverable: false, label: '' }

      // 根据元素类型决定标签文字
      if (interactiveEl.tagName === 'A') {
        const href = interactiveEl.getAttribute('href') || ''
        if (href.startsWith('#')) return { isHoverable: true, label: 'GO' }
        if (href.startsWith('mailto:')) return { isHoverable: true, label: 'MAIL' }
        return { isHoverable: true, label: 'VIEW' }
      }
      if (interactiveEl.tagName === 'BUTTON') return { isHoverable: true, label: 'TAP' }
      if (interactiveEl.dataset.cursor === 'pointer') return { isHoverable: true, label: 'VIEW' }

      return { isHoverable: true, label: '' }
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const { isHoverable, label } = getHoverInfo(target)
      if (isHoverable) {
        setHovering(true)
        setHoverLabel(label)
      }
    }
    const onOut = () => {
      setHovering(false)
      setHoverLabel('')
    }
    const onLeave = () => setHidden(true)
    const onEnter = () => setHidden(false)
    const onMouseDown = () => setClicking(true)
    const onMouseUp = () => setClicking(false)

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      cancelAnimationFrame(raf)
    }
  }, [hovering, clicking])

  return (
    <>
      {/* Dot — 悬停时变大变亮 */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: hovering ? 12 : 8,
          height: hovering ? 12 : 8,
          borderRadius: '50%',
          backgroundColor: hovering ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)',
          opacity: hidden ? 0 : 1,
          transition: 'width 0.25s ease, height 0.25s ease, background-color 0.25s ease, opacity 0.2s',
          mixBlendMode: 'difference',
        }}
      />
      {/* Ring — 悬停时变大变亮 */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          width: hovering ? 56 : 40,
          height: hovering ? 56 : 40,
          borderRadius: '50%',
          border: hovering
            ? '1.5px solid rgba(255,255,255,0.5)'
            : '1.5px solid rgba(255,255,255,0.2)',
          opacity: hidden ? 0 : hovering ? 0.6 : 0.25,
          transition: 'width 0.3s ease, height 0.3s ease, border-color 0.3s ease, opacity 0.3s ease',
        }}
      />
      {/* Label — 悬停时显示动作文字 */}
      <span
        ref={labelRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          fontSize: '9px',
          fontFamily: 'monospace',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.6)',
          opacity: hovering && hoverLabel ? 1 : 0,
          transition: 'opacity 0.25s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {hoverLabel}
      </span>
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   2. SPLIT TEXT — Character-by-character reveal on scroll
   Q4/Q5 FIX: once=false 让动画每次进入视口都触发
   ═══════════════════════════════════════════════════════ */

function SplitText({ children, className = '', delay = 0, once = false }: { children: string; className?: string; delay?: number; once?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once, margin: '-50px' })

  return (
    <span ref={ref} className={className} aria-label={children}>
      {children.split('').map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
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
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.35)
    y.set((e.clientY - centerY) * 0.35)
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
    const distX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const distY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    rotateY.set(distX * 8)
    rotateX.set(-distY * 8)
  }, [rotateX, rotateY])

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
  }, [rotateX, rotateY])

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   Navigation — Q3 FIX: 移除 nav items 中重复的 "Contact"
   Q4 FIX: 点击导航后强制触发目标区域动画
   ═══════════════════════════════════════════════════════ */

function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50)

      // 检测当前所在区域
      const sections = ['about', 'projects', 'contact']
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 200 && rect.bottom > 200) {
            setActiveSection(id)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    const id = href.replace('#', '')
    scrollToElement(id)
    setMenuOpen(false)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <MagneticHover>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="text-sm font-mono tracking-widest uppercase text-foreground/70 hover:text-foreground transition-colors"
              data-cursor="pointer"
            >
              {SITE_CONFIG.nav.logo}<span className="text-foreground/30">{SITE_CONFIG.nav.logoSuffix}</span>
            </a>
          </MagneticHover>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {SITE_CONFIG.nav.items.map((item) => (
              <MagneticHover key={item.label}>
                <motion.a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`text-sm transition-colors duration-300 tracking-wide relative ${
                    activeSection === item.href.replace('#', '')
                      ? 'text-foreground'
                      : 'text-foreground/50 hover:text-foreground'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-cursor="pointer"
                >
                  {item.label}
                  <motion.span
                    className="absolute -bottom-1 left-0 h-px bg-foreground/60"
                    initial={{ width: 0 }}
                    animate={{ width: activeSection === item.href.replace('#', '') ? '100%' : 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              </MagneticHover>
            ))}
            {/* Q3 FIX: "Get in Touch" 作为唯一 CTA 指向 contact，不再与 nav items 重复 */}
            <MagneticHover>
              <motion.a
                href={SITE_CONFIG.nav.cta.href}
                onClick={(e) => handleNavClick(e, SITE_CONFIG.nav.cta.href)}
                className={`text-sm px-5 py-2 border rounded-full transition-all duration-300 ${
                  activeSection === 'contact'
                    ? 'border-foreground/40 bg-foreground/[0.08] text-foreground'
                    : 'border-foreground/20 text-foreground/70 hover:text-foreground hover:border-foreground/50 hover:bg-foreground/[0.05]'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-cursor="pointer"
              >
                {SITE_CONFIG.nav.cta.label}
              </motion.a>
            </MagneticHover>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-foreground/70 hover:text-foreground transition-colors"
            data-cursor="pointer"
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
            className="fixed inset-0 z-[99] bg-background/95 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-8">
              {[...SITE_CONFIG.nav.items, { label: SITE_CONFIG.nav.cta.label, href: SITE_CONFIG.nav.cta.href }].map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-3xl font-light text-foreground/70 hover:text-foreground transition-colors"
                  data-cursor="pointer"
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
   Hero Section
   ═══════════════════════════════════════════════════════ */

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -120])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92])

  const gridY1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const gridY2 = useTransform(scrollYProgress, [0, 1], [0, -80])
  const cornerY = useTransform(scrollYProgress, [0, 1], [0, -150])
  const lineY = useTransform(scrollYProgress, [0, 1], [0, -60])
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

      <motion.div style={{ y: gridY1 }} className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-foreground/[0.03]" />
        <div className="absolute left-2/4 top-0 bottom-0 w-px bg-foreground/[0.02]" />
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-foreground/[0.03]" />
      </motion.div>

      <motion.div style={{ y: gridY2 }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 right-0 h-px bg-foreground/[0.04]" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-foreground/[0.03]" />
      </motion.div>

      <motion.div style={{ y: cornerY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 left-8 w-10 h-10 border-l-2 border-t-2 border-foreground/[0.08]" />
        <div className="absolute top-8 right-8 w-10 h-10 border-r-2 border-t-2 border-foreground/[0.08]" />
        <div className="absolute bottom-8 left-8 w-10 h-10 border-l-2 border-b-2 border-foreground/[0.08]" />
        <div className="absolute bottom-8 right-8 w-10 h-10 border-r-2 border-b-2 border-foreground/[0.08]" />
      </motion.div>

      <motion.div style={{ y: lineY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[15%] w-32 h-32 rounded-full border border-foreground/[0.03]" />
        <div className="absolute bottom-[25%] left-[10%] w-24 h-24 rounded-full border border-foreground/[0.04]" />
        <div className="absolute top-[60%] right-[25%] w-16 h-16 rounded-full border border-foreground/[0.02]" />
      </motion.div>

      <motion.div style={{ y: gridY2 }} className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
        <div className="flex gap-8 animate-scroll-horizontal items-center" style={{ width: 'max-content' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shrink-0 w-[300px] h-[200px] rounded-lg overflow-hidden" style={{
              background: `linear-gradient(${135 + i * 45}deg, rgba(255,255,255,0.05) 0%, rgba(200,220,255,0.02) 50%, rgba(255,255,255,0.05) 100%)`
            }} />
          ))}
        </div>
      </motion.div>

      <motion.div style={{ opacity: heroOpacity, y: heroY, scale: heroScale }} className="relative z-[10] text-center px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-foreground/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse-dot" />
            {SITE_CONFIG.hero.badge}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9]"
        >
          <SplitText className="gradient-text text-glow">{SITE_CONFIG.hero.title1}</SplitText>
          <br />
          <SplitText className="text-foreground text-glow">{SITE_CONFIG.hero.title2}</SplitText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 text-lg md:text-xl text-foreground/50 max-w-xl mx-auto font-light leading-[1.8]"
        >
          {SITE_CONFIG.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <MagneticHover>
            <a
              href="#about"
              onClick={(e) => { e.preventDefault(); scrollToElement('about') }}
              className="flex flex-col items-center gap-2 text-foreground/30 hover:text-foreground/60 transition-colors"
              data-cursor="pointer"
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
  const items = SITE_CONFIG.marquee
  const doubled = [...items, ...items]

  return (
    <div className="py-10 border-y border-border overflow-hidden relative z-[10]">
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
   Reveal Section — Q4/Q5 FIX: once=false 让动画可重复触发
   ═══════════════════════════════════════════════════════ */

function RevealSection({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: '-80px' })

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`relative z-[10] ${className}`}
    >
      {children}
    </motion.section>
  )
}

/* ═══════════════════════════════════════════════════════
   Q5 FIX: 通用滚动动画组件 — 每个元素独立的滚动触发
   ═══════════════════════════════════════════════════════ */

function ScrollReveal({ children, className = '', delay = 0, direction = 'up' }: {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: '-60px' })

  const directionMap = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
  }
  const offset = directionMap[direction]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: offset.x, y: offset.y }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   Parallax Wrapper
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
   About Section — Q5 FIX: 给每个子元素添加 ScrollReveal
   ═══════════════════════════════════════════════════════ */

function AboutSection() {
  return (
    <RevealSection id="about" className="py-32 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="mb-16">
            <span className="text-xs font-mono tracking-[0.3em] uppercase text-foreground/30">{SITE_CONFIG.about.sectionLabel}</span>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          <ParallaxLayer speed={0.2}>
            <ScrollReveal delay={0.1}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8 text-glow">
                <SplitText once={false}>{SITE_CONFIG.about.title1}</SplitText>
                <br />
                <span className="text-foreground/30"><SplitText once={false}>{SITE_CONFIG.about.title2}</SplitText></span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-foreground/50 text-lg leading-relaxed mb-6">
                {SITE_CONFIG.about.description1}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <p className="text-foreground/50 text-lg leading-relaxed">
                {SITE_CONFIG.about.description2}
              </p>
            </ScrollReveal>
          </ParallaxLayer>

          <div className="flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-8 mb-12">
              {SITE_CONFIG.about.stats.map((stat, i) => (
                <ScrollReveal key={stat.label} delay={0.1 + i * 0.1}>
                  <ParallaxLayer speed={0.1}>
                    <div className="text-center md:text-left">
                      <div className="text-3xl md:text-4xl font-bold tracking-tight">{stat.number}</div>
                      <div className="text-xs text-foreground/30 mt-1 font-mono tracking-wider uppercase">{stat.label}</div>
                    </div>
                  </ParallaxLayer>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={0.3}>
              <div className="h-px bg-border mb-12" />
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SITE_CONFIG.about.skills.map((skill, i) => {
                const Icon = ICON_MAP[skill.icon] || Code2
                return (
                  <ScrollReveal key={skill.name} delay={0.1 + i * 0.08}>
                    <TiltCard>
                      <div className="group p-4 rounded-lg border border-border/50 hover:border-foreground/20 transition-all duration-500 hover:bg-foreground/[0.02]">
                        <Icon size={20} className="text-foreground/30 group-hover:text-foreground/60 transition-colors mb-3" />
                        <div className="text-sm font-medium mb-1">{skill.name}</div>
                        <div className="text-xs text-foreground/30">{skill.desc}</div>
                      </div>
                    </TiltCard>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  )
}

/* ═══════════════════════════════════════════════════════
   Projects Section — Q1 FIX: 改善排版布局
   大屏：横向卡片列表（带数字编号 + 标题 + 描述 + 标签 + 年份 + 箭头）
   移动端：垂直堆叠
   ═══════════════════════════════════════════════════════ */

function ProjectsSection() {
  return (
    <RevealSection id="projects" className="py-32 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="mb-16">
            <span className="text-xs font-mono tracking-[0.3em] uppercase text-foreground/30">{SITE_CONFIG.projects.sectionLabel}</span>
          </div>
        </ScrollReveal>

        <ParallaxLayer speed={0.15}>
          <ScrollReveal delay={0.1}>
            <div className="mb-20">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] text-glow">
                <SplitText once={false}>{SITE_CONFIG.projects.title1}</SplitText>
                <br />
                <span className="text-foreground/30"><SplitText once={false}>{SITE_CONFIG.projects.title2}</SplitText></span>
              </h2>
            </div>
          </ScrollReveal>
        </ParallaxLayer>

        <div className="space-y-0">
          {SITE_CONFIG.projects.items.map((project, index) => (
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
    url: string
    image?: string
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
    const newX = (e.clientX - centerX) * 0.04
    const newY = (e.clientY - centerY) * 0.04
    x.set(newX)
    y.set(newY)
  }, [x, y])

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  const handleClick = () => {
    if (project.url && project.url !== '#') {
      window.open(project.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <ScrollReveal delay={index * 0.08} direction="left">
      <motion.div
        ref={ref}
        style={{ x: springX, y: springY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="group py-8 md:py-10 border-b border-border/50 hover:border-foreground/20 transition-all duration-500"
        data-cursor="pointer"
      >
        {/* Q1 FIX: 更清晰的排版结构 */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
          {/* 左侧：编号 + 标题 */}
          <div className="flex items-start gap-4 md:w-[40%] shrink-0">
            <span className="text-xs font-mono text-foreground/15 mt-1.5 shrink-0 tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight group-hover:text-foreground transition-colors duration-500">
                {project.title}
              </h3>
              <span className="text-[11px] font-mono text-foreground/25 mt-1.5 block tracking-wider uppercase">
                {project.category}
              </span>
            </div>
          </div>

          {/* 中间：描述 + 标签 */}
          <div className="md:w-[45%] md:pt-0 pl-8 md:pl-0">
            <p className="text-sm text-foreground/35 leading-relaxed group-hover:text-foreground/55 transition-colors duration-500">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 border border-border/40 rounded-full text-foreground/25 group-hover:text-foreground/45 group-hover:border-foreground/15 transition-all duration-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 右侧：年份 + 箭头 */}
          <div className="md:w-[15%] flex items-center md:justify-end gap-3 pl-8 md:pl-0 md:pt-1">
            <span className="text-xs font-mono text-foreground/15 tracking-wider">{project.year}</span>
            <motion.div
              whileHover={{ x: 4, y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="ml-auto md:ml-0"
            >
              <ArrowUpRight size={18} className="text-foreground/15 group-hover:text-foreground/50 transition-colors duration-500" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </ScrollReveal>
  )
}

/* ═══════════════════════════════════════════════════════
   Philosophy Section — Q5 FIX: 添加 ScrollReveal
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
    <section ref={ref} className="py-32 md:py-40 px-6 relative z-[10]">
      <motion.div style={{ scale, opacity }} className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <span className="text-xs font-mono tracking-[0.3em] uppercase text-foreground/30 block mb-12">
            {SITE_CONFIG.philosophy.label}
          </span>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <blockquote className="text-2xl md:text-4xl lg:text-5xl font-light tracking-tight leading-[1.2] text-foreground/70 text-glow">
            &ldquo;{SITE_CONFIG.philosophy.quote}&rdquo;
          </blockquote>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <div className="mt-8 text-sm font-mono text-foreground/20 tracking-wider">— {SITE_CONFIG.philosophy.attribution}</div>
        </ScrollReveal>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   Contact Section — Q3 FIX: 移除重复的 "Contact" 链接
   Q5 FIX: 添加 ScrollReveal 到每个子元素
   ═══════════════════════════════════════════════════════ */

function ContactSection() {
  return (
    <RevealSection id="contact" className="py-32 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="mb-16">
            <span className="text-xs font-mono tracking-[0.3em] uppercase text-foreground/30">{SITE_CONFIG.contact.sectionLabel}</span>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          <ParallaxLayer speed={0.15}>
            <ScrollReveal delay={0.1}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8 text-glow">
                <SplitText once={false}>{SITE_CONFIG.contact.title1}</SplitText>
                <br />
                <span className="text-foreground/30"><SplitText once={false}>{SITE_CONFIG.contact.title2}</SplitText></span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-foreground/50 text-lg leading-relaxed max-w-md">
                {SITE_CONFIG.contact.description}
              </p>
            </ScrollReveal>
          </ParallaxLayer>

          <div className="flex flex-col justify-center">
            <ScrollReveal delay={0.15}>
              <MagneticHover>
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="group inline-flex items-center gap-4 mb-12 text-2xl md:text-3xl font-light text-foreground/60 hover:text-foreground transition-colors duration-500"
                  data-cursor="pointer"
                >
                  {SITE_CONFIG.contact.email}
                  <motion.div
                    whileHover={{ x: 6, y: -6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <ArrowUpRight size={24} className="text-foreground/20 group-hover:text-foreground/60 transition-colors" />
                  </motion.div>
                </a>
              </MagneticHover>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <div className="h-px bg-border mb-8" />
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="flex items-center gap-6">
                {SITE_CONFIG.contact.links.map((link, i) => {
                  const Icon = ICON_MAP[link.icon] || Mail
                  return (
                    <ScrollReveal key={link.label} delay={0.3 + i * 0.08} direction="right">
                      <MagneticHover>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 text-sm text-foreground/30 hover:text-foreground/70 transition-colors duration-300"
                          data-cursor="pointer"
                        >
                          <Icon size={18} />
                          <span className="hidden sm:inline font-mono tracking-wider text-xs uppercase">{link.label}</span>
                        </a>
                      </MagneticHover>
                    </ScrollReveal>
                  )
                })}
              </div>
            </ScrollReveal>
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
    <footer className="py-8 px-6 border-t border-border/30 relative z-[10]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs font-mono text-foreground/20 tracking-wider">
          &copy; {new Date().getFullYear()} {SITE_CONFIG.footer.name}. All rights reserved.
        </span>
        <span className="text-xs font-mono text-foreground/15 tracking-wider">
          {SITE_CONFIG.footer.credit}
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
    <>
      <CustomCursor />
      <SmokeyFluidCursor
        simRes={64}
        dyeRes={512}
        densityDissipation={3.5}
        velocityDissipation={3.0}
        curl={15}
        splatRadius={0.15}
        splatForce={4000}
        transparent={true}
      />
      <Navigation />
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ProjectsSection />
      <PhilosophySection />
      <ContactSection />
      <Footer />
    </>
  )
}
