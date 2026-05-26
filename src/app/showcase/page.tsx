'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ═══════════════════════════════════════════════════════
   效果展示页 — 供用户挑选视觉特效
   ═══════════════════════════════════════════════════════ */

// ─── 文字发光效果选项 ───
const GLOW_OPTIONS = [
  {
    id: 'soft-cool',
    name: '柔和冷光',
    desc: '当前使用中的效果 — 白色微蓝冷光，柔和低调',
    css: {
      textShadow: '0 0 20px rgba(255,255,255,0.12), 0 0 40px rgba(200,220,255,0.06), 0 0 80px rgba(180,200,255,0.03)',
    },
  },
  {
    id: 'neon-blue',
    name: '霓虹蓝',
    desc: '赛博朋克风 — 强烈蓝色霓虹发光，科技感十足',
    css: {
      textShadow: '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0fa, 0 0 82px #0fa, 0 0 92px #0fa, 0 0 102px #0fa, 0 0 151px #0fa',
    },
  },
  {
    id: 'warm-amber',
    name: '暖琥珀',
    desc: '温暖琥珀色调 — 适合高端、优雅的设计风格',
    css: {
      textShadow: '0 0 10px rgba(255,191,0,0.4), 0 0 30px rgba(255,160,0,0.2), 0 0 60px rgba(255,140,0,0.1)',
    },
  },
  {
    id: 'ice-purple',
    name: '冰紫极光',
    desc: '紫色调极光 — 神秘梦幻，适合创意/艺术类网站',
    css: {
      textShadow: '0 0 10px rgba(180,130,255,0.5), 0 0 30px rgba(140,80,255,0.3), 0 0 60px rgba(120,60,255,0.15), 0 0 100px rgba(100,40,255,0.08)',
    },
  },
  {
    id: 'mint-fresh',
    name: '薄荷清新',
    desc: '薄荷绿色调 — 清新现代，适合科技/环保主题',
    css: {
      textShadow: '0 0 10px rgba(0,255,170,0.4), 0 0 30px rgba(0,255,170,0.2), 0 0 60px rgba(0,255,170,0.1)',
    },
  },
  {
    id: 'rose-glow',
    name: '玫瑰柔光',
    desc: '玫瑰粉色调 — 柔和浪漫，适合个人品牌/时尚风格',
    css: {
      textShadow: '0 0 10px rgba(255,100,150,0.4), 0 0 30px rgba(255,80,130,0.2), 0 0 60px rgba(255,60,110,0.1)',
    },
  },
]

// ─── 标题悬停发光效果选项 ───
const HOVER_GLOW_OPTIONS = [
  {
    id: 'pulse-glow',
    name: '脉冲发光',
    desc: '悬停时文字从内部向外扩散光晕，像呼吸一样脉动',
    cssHover: {
      textShadow: '0 0 5px rgba(255,255,255,0.8), 0 0 15px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.4), 0 0 60px rgba(200,220,255,0.3)',
    },
  },
  {
    id: 'color-shift',
    name: '色彩流动',
    desc: '悬停时发光色从冷白渐变为青蓝，模拟霓虹灯效果',
    cssHover: {
      textShadow: '0 0 7px rgba(0,255,255,0.8), 0 0 15px rgba(0,255,255,0.6), 0 0 30px rgba(0,200,255,0.4), 0 0 60px rgba(0,150,255,0.2)',
    },
  },
  {
    id: 'golden-flare',
    name: '金色耀斑',
    desc: '悬停时金色光晕从文字中绽放，奢华而醒目',
    cssHover: {
      textShadow: '0 0 5px rgba(255,215,0,0.9), 0 0 15px rgba(255,200,0,0.6), 0 0 30px rgba(255,180,0,0.4), 0 0 60px rgba(255,160,0,0.2)',
    },
  },
  {
    id: 'electric-violet',
    name: '电光紫',
    desc: '悬停时紫电交加，强烈视觉冲击，适合赛博朋克风',
    cssHover: {
      textShadow: '0 0 5px rgba(180,100,255,0.9), 0 0 15px rgba(160,80,255,0.7), 0 0 30px rgba(140,60,255,0.5), 0 0 60px rgba(120,40,255,0.3)',
    },
  },
  {
    id: 'emerald-pulse',
    name: '翡翠脉冲',
    desc: '悬停时翡翠绿光晕从中心扩散，科技感与自然感兼具',
    cssHover: {
      textShadow: '0 0 5px rgba(0,255,136,0.9), 0 0 15px rgba(0,255,136,0.6), 0 0 30px rgba(0,255,100,0.4), 0 0 60px rgba(0,200,100,0.2)',
    },
  },
]

// ─── WebGL 流体效果选项 ───
const FLUID_OPTIONS = [
  {
    id: 'smokey-current',
    name: '烟雾流体（当前使用）',
    desc: 'react-smokey-fluid-cursor — 基于 Navier-Stokes 的烟雾墨迹效果，跟随鼠标产生流畅的流体拖尾',
    config: {
      simResolution: 64, dyeResolution: 512, densityDissipation: 3.5,
      velocityDissipation: 3.0, pressure: 0.1, curl: 15,
      splatRadius: 0.15, splatForce: 4000, shading: true,
    },
    link: 'https://www.npmjs.com/package/react-smokey-fluid-cursor',
  },
  {
    id: 'ink-heavy',
    name: '浓墨重彩',
    desc: '加大密度和染料分辨率，颜色更饱和、拖尾更长，像浓墨在宣纸上晕开',
    config: {
      simResolution: 128, dyeResolution: 1024, densityDissipation: 1.5,
      velocityDissipation: 2.0, pressure: 0.2, curl: 25,
      splatRadius: 0.25, splatForce: 6000, shading: true,
    },
    link: '',
  },
  {
    id: 'light-whisp',
    name: '轻烟薄雾',
    desc: '极低密度、高消散率，鼠标经过留下转瞬即逝的轻烟痕迹',
    config: {
      simResolution: 64, dyeResolution: 512, densityDissipation: 6.0,
      velocityDissipation: 5.0, pressure: 0.05, curl: 8,
      splatRadius: 0.08, splatForce: 2000, shading: true,
    },
    link: '',
  },
  {
    id: 'webgl-fluid-simulation',
    name: 'WebGL Fluid Simulation',
    desc: 'PavelDoGreat 的经典开源流体模拟，色彩丰富、交互性强，可点击产生涟漪',
    link: 'https://paveldogreat.github.io/WebGL-Fluid-Simulation/',
    repo: 'https://github.com/PavelDoGreat/WebGL-Fluid-Simulation',
  },
  {
    id: 'cool-fluid',
    name: 'Cool Fluid',
    desc: '基于 WebGL 2.0 的另一种流体实现，性能更好，适合移动端',
    link: 'https://nicoloribaudo.ch/cool-fluid/',
    repo: 'https://github.com/NicoloRibaudo/cool-fluid',
  },
  {
    id: 'fluid-canvas',
    name: 'Fluid Canvas',
    desc: '轻量级 Canvas 2D 流体效果，不需要 WebGL，兼容性最好',
    link: 'https://fluid-canvas.js.org/',
    repo: 'https://github.com/dissimulate/Fluid-Canvas',
  },
]

type TabKey = 'glow' | 'hover' | 'fluid'

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('glow')
  const [hoveredGlow, setHoveredGlow] = useState<string | null>(null)
  const [hoveredHover, setHoveredHover] = useState<string | null>(null)
  const [selectedGlow, setSelectedGlow] = useState<string>('soft-cool')
  const [selectedHover, setSelectedHover] = useState<string>('pulse-glow')
  const [selectedFluid, setSelectedFluid] = useState<string>('smokey-current')

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'glow', label: '文字发光', icon: '✦' },
    { key: 'hover', label: '悬停发光', icon: '◈' },
    { key: 'fluid', label: '流体效果', icon: '≋' },
  ]

  return (
    <div style={{
      background: '#0a0a0a',
      color: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '60px 24px 40px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          marginBottom: '12px',
          textShadow: '0 0 20px rgba(255,255,255,0.12), 0 0 40px rgba(200,220,255,0.06)',
        }}>
          效果展示 / Effect Showcase
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '14px',
          fontFamily: 'monospace',
          letterSpacing: '0.05em',
        }}>
          选择你喜欢的视觉效果，然后告诉我编号即可
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        padding: '24px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: activeTab === tab.key ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'monospace',
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{ marginRight: '8px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'glow' && (
            <motion.div
              key="glow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'monospace', marginBottom: '32px', letterSpacing: '0.1em' }}>
                TEXT GLOW EFFECTS — 点击选择
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '20px',
              }}>
                {GLOW_OPTIONS.map((opt, i) => (
                  <motion.div
                    key={opt.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedGlow(opt.id)}
                    onMouseEnter={() => setHoveredGlow(opt.id)}
                    onMouseLeave={() => setHoveredGlow(null)}
                    style={{
                      padding: '32px 28px',
                      borderRadius: '12px',
                      border: selectedGlow === opt.id
                        ? '2px solid rgba(255,255,255,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: selectedGlow === opt.id
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Selection indicator */}
                    {selectedGlow === opt.id && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#000',
                        fontWeight: 700,
                      }}>
                        ✓
                      </div>
                    )}
                    <div style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: 'rgba(255,255,255,0.2)',
                      marginBottom: '16px',
                      letterSpacing: '0.1em',
                    }}>
                      #{String(i + 1).padStart(2, '0')} {opt.id.toUpperCase()}
                    </div>
                    <h2 style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      marginBottom: '12px',
                      letterSpacing: '-0.02em',
                      ...opt.css,
                    }}>
                      {opt.name}
                    </h2>
                    <p style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.35)',
                      lineHeight: 1.6,
                    }}>
                      {opt.desc}
                    </p>
                    {/* Preview text */}
                    <div style={{
                      marginTop: '20px',
                      padding: '16px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                    }}>
                      <span style={{
                        fontSize: '42px',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        display: 'block',
                        marginBottom: '8px',
                        ...opt.css,
                      }}>
                        Creative
                      </span>
                      <span style={{
                        fontSize: '18px',
                        color: 'rgba(255,255,255,0.5)',
                        ...opt.css,
                      }}>
                        Developer & Designer
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'hover' && (
            <motion.div
              key="hover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'monospace', marginBottom: '32px', letterSpacing: '0.1em' }}>
                HOVER GLOW EFFECTS — 悬停预览，点击选择
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '20px',
              }}>
                {HOVER_GLOW_OPTIONS.map((opt, i) => {
                  const isHovered = hoveredHover === opt.id
                  return (
                    <motion.div
                      key={opt.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedHover(opt.id)}
                      onMouseEnter={() => setHoveredHover(opt.id)}
                      onMouseLeave={() => setHoveredHover(null)}
                      style={{
                        padding: '32px 28px',
                        borderRadius: '12px',
                        border: selectedHover === opt.id
                          ? '2px solid rgba(255,255,255,0.5)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: selectedHover === opt.id
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                      }}
                    >
                      {selectedHover === opt.id && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: '#000',
                          fontWeight: 700,
                        }}>
                          ✓
                        </div>
                      )}
                      <div style={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: 'rgba(255,255,255,0.2)',
                        marginBottom: '16px',
                        letterSpacing: '0.1em',
                      }}>
                        #{String(i + 1).padStart(2, '0')} {opt.id.toUpperCase()}
                      </div>
                      <h2 style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        marginBottom: '12px',
                        letterSpacing: '-0.02em',
                        transition: 'text-shadow 0.4s ease',
                        ...(isHovered ? opt.cssHover : { textShadow: 'none' }),
                      }}>
                        {opt.name}
                      </h2>
                      <p style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.35)',
                        lineHeight: 1.6,
                      }}>
                        {opt.desc}
                      </p>
                      {/* Hover preview area */}
                      <div style={{
                        marginTop: '20px',
                        padding: '20px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        textAlign: 'center',
                      }}>
                        <span style={{
                          fontSize: '48px',
                          fontWeight: 800,
                          letterSpacing: '-0.03em',
                          display: 'block',
                          marginBottom: '12px',
                          transition: 'text-shadow 0.4s ease',
                          ...(isHovered ? opt.cssHover : { textShadow: 'none' }),
                        }}>
                          Hover Me
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: 'rgba(255,255,255,0.3)',
                          fontFamily: 'monospace',
                          letterSpacing: '0.05em',
                        }}>
                          ← 悬停此处预览效果 →
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'fluid' && (
            <motion.div
              key="fluid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'monospace', marginBottom: '32px', letterSpacing: '0.1em' }}>
                FLUID EFFECT OPTIONS — 点击选择
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '20px',
              }}>
                {FLUID_OPTIONS.map((opt, i) => (
                  <motion.div
                    key={opt.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFluid(opt.id)}
                    style={{
                      padding: '28px',
                      borderRadius: '12px',
                      border: selectedFluid === opt.id
                        ? '2px solid rgba(255,255,255,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: selectedFluid === opt.id
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                    }}
                  >
                    {selectedFluid === opt.id && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#000',
                        fontWeight: 700,
                      }}>
                        ✓
                      </div>
                    )}
                    <div style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: 'rgba(255,255,255,0.2)',
                      marginBottom: '12px',
                      letterSpacing: '0.1em',
                    }}>
                      #{String(i + 1).padStart(2, '0')} {opt.id.toUpperCase()}
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      marginBottom: '10px',
                      letterSpacing: '-0.01em',
                    }}>
                      {opt.name}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.4)',
                      lineHeight: 1.7,
                      marginBottom: '16px',
                    }}>
                      {opt.desc}
                    </p>
                    {/* Config details */}
                    {opt.config && (
                      <div style={{
                        padding: '12px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.04)',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: 'rgba(255,255,255,0.25)',
                        lineHeight: 1.8,
                        whiteSpace: 'pre-wrap',
                        marginBottom: '12px',
                      }}>
                        {Object.entries(opt.config).map(([k, v]) => `${k}: ${v}`).join('\n')}
                      </div>
                    )}
                    {/* Demo link */}
                    {opt.link && (
                      <a
                        href={opt.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          color: 'rgba(255,255,255,0.5)',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.2s',
                        }}
                      >
                        在线演示 →
                      </a>
                    )}
                    {opt.repo && (
                      <a
                        href={opt.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          color: 'rgba(255,255,255,0.5)',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          marginLeft: '8px',
                          transition: 'all 0.2s',
                        }}
                      >
                        GitHub →
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection summary */}
        <div style={{
          marginTop: '60px',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.3)',
            marginBottom: '16px',
            letterSpacing: '0.1em',
          }}>
            YOUR SELECTIONS / 你的选择
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', marginBottom: '8px' }}>
                文字发光
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {GLOW_OPTIONS.find(o => o.id === selectedGlow)?.name}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)', marginTop: '4px' }}>
                id: {selectedGlow}
              </div>
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', marginBottom: '8px' }}>
                悬停发光
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {HOVER_GLOW_OPTIONS.find(o => o.id === selectedHover)?.name}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)', marginTop: '4px' }}>
                id: {selectedHover}
              </div>
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', marginBottom: '8px' }}>
                流体效果
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {FLUID_OPTIONS.find(o => o.id === selectedFluid)?.name}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)', marginTop: '4px' }}>
                id: {selectedFluid}
              </div>
            </div>
          </div>
          <p style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.25)',
            marginTop: '16px',
            fontFamily: 'monospace',
          }}>
            请将你选择的效果编号或 id 告诉我，我会应用到网站上
          </p>
        </div>
      </div>
    </div>
  )
}
