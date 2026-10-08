import { MessageCircle, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { tr, useT } from '@/i18n'
import { fmtMin } from '@/lib/format'
import { ranking } from '@/lib/metrics'
import { WA_URL } from '@/lib/utils'
import { KEVIN_ID } from '@/mock/base'
import type { Role } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'

export interface TrailerScene {
  view?: string
  role?: Role
  selector?: string
  click?: string[]
  position?: 'bl' | 'br' | 'tl'
  chapter: number
  title: string
  body: string
  duration: number
  cta?: boolean
  scroll?: number[]
}

const SCENES: TrailerScene[] = [
  { view: '/propuesta', role: 'admin', chapter: 1, title: 'trailer.s1.t', body: 'trailer.s1.b', duration: 8000, scroll: [0, 520, 1100, 1700], selector: '[data-trailer="modulos"]' },
  { view: '/dashboard', role: 'admin', chapter: 2, title: 'trailer.s2.t', body: 'trailer.s2.b', duration: 6500, selector: '[data-trailer="kpis"]' },
  { view: '/dashboard', chapter: 3, title: 'trailer.s3.t', body: 'trailer.s3.b', duration: 6000, selector: '[data-trailer="rank-velocidad"]', click: ['[data-trailer="rank-velocidad"]'] },
  { view: '/dashboard', chapter: 4, title: 'trailer.s4.t', body: 'trailer.s4.b', duration: 6500, selector: '[data-trailer="row-kevin"]' },
  { view: '/metricas/velocidad', chapter: 5, title: 'trailer.s5.t', body: 'trailer.s5.b', duration: 6500, selector: '[data-trailer="sin-contacto"]' },
  { view: '/metricas/cierre', chapter: 6, title: 'trailer.s6.t', body: 'trailer.s6.b', duration: 6500, selector: '[data-trailer="embudo"]' },
  { view: '/leads', chapter: 7, title: 'trailer.s7.t', body: 'trailer.s7.b', duration: 8000, selector: '[data-trailer="asignar-masivo"]', click: ['[data-trailer="leads-check-all"]', '[data-trailer="asignar-masivo"]'] },
  { view: '/whatsapp', chapter: 8, title: 'trailer.s8.t', body: 'trailer.s8.b', duration: 8500, selector: '[data-trailer="wa-plantillas"]', click: ['[data-trailer="wa-conv-first"]', '[data-trailer="wa-elegir-plantilla"]'] },
  { view: '/automatizaciones', chapter: 9, title: 'trailer.s9.t', body: 'trailer.s9.b', duration: 9000, selector: '[data-trailer="flujo"]', click: ['[data-trailer="simular-compra"]'] },
  { view: '/mi-panel', role: 'vendedor', chapter: 10, title: 'trailer.s10.t', body: 'trailer.s10.b', duration: 7000, selector: '[data-tour="panel-kpis"]' },
  { view: '/propuesta', role: 'admin', chapter: 11, title: 'trailer.s11.t', body: 'trailer.s11.b', duration: 8000, cta: true },
]

const find = (s?: string) => {
  if (!s) return null
  const els = Array.from(document.querySelectorAll(s)) as HTMLElement[]
  return els.find((e) => e.getBoundingClientRect().width > 0) ?? null
}

export function Trailer() {
  const active = useApp((s) => s.trailer)
  const { t, lang } = useT()
  const navigate = useNavigate()
  const navRef = useRef(navigate) // navigate vive en un ref, fuera de las deps del motor
  navRef.current = navigate
  const [i, setI] = useState(0)
  const [ring, setRing] = useState<DOMRect | null>(null)
  const [cursor, setCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, press: false })
  const [progress, setProgress] = useState(0)
  const timers = useRef<number[]>([])

  const kevin = useMemo(() => {
    const { filas } = ranking(useData.getState().leads, { rango: '30d' })
    return fmtMin(filas.find((f) => f.vendedorId === KEVIN_ID)?.velMediana ?? 0)
  }, [])

  const clear = () => {
    timers.current.forEach((x) => clearTimeout(x))
    timers.current = []
  }
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const salir = useCallback(() => {
    clear()
    const st = useApp.getState()
    st.setTrailer(false)
    st.logout()
    navRef.current('/login')
  }, [])

  // arranque
  useEffect(() => {
    if (!active) return
    if (window.innerWidth < 1024) {
      useApp.getState().setTrailer(false)
      return
    }
    const st = useApp.getState()
    st.markWelcome()
    if (!st.authed) st.login('admin')
    setI(0)
    const h = (e: KeyboardEvent) => e.key === 'Escape' && salir()
    const r = () => window.innerWidth < 1024 && salir()
    window.addEventListener('keydown', h)
    window.addEventListener('resize', r)
    return () => {
      window.removeEventListener('keydown', h)
      window.removeEventListener('resize', r)
      clear()
    }
  }, [active, salir])

  // motor de escenas
  useEffect(() => {
    if (!active) return
    clear()
    const sc = SCENES[i]
    setRing(null)
    setProgress(0)
    const st = useApp.getState()
    let delay = 0
    if (sc.role && st.role !== sc.role) {
      st.setRole(sc.role)
      delay = 90 // esperar el cambio de rol antes de navegar
    }
    later(() => {
      if (sc.view) navRef.current(sc.view)
      window.scrollTo({ top: 0 })
    }, delay)

    const base = delay + 700
    let tt = base
    // scroll suave (escena propuesta)
    sc.scroll?.forEach((y, k) => later(() => window.scrollTo({ top: y, behavior: 'smooth' }), base + k * 1700))

    const moverA = (el: HTMLElement) => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      later(() => {
        const r = el.getBoundingClientRect()
        setCursor({ x: r.left + r.width / 2, y: r.top + r.height / 2, press: false })
      }, 450)
    }

    for (const sel of sc.click ?? []) {
      later(() => {
        const el = find(sel)
        if (el) moverA(el)
      }, tt)
      later(() => {
        setCursor((c) => ({ ...c, press: true }))
        find(sel)?.click()
      }, tt + 1400)
      later(() => setCursor((c) => ({ ...c, press: false })), tt + 1650)
      tt += 1900
    }
    if (sc.selector) {
      later(() => {
        const el = find(sc.selector)
        if (!el) return
        if (!sc.click?.length && !sc.scroll) moverA(el)
        later(() => setRing(el.getBoundingClientRect()), 650)
      }, tt)
    }
    const tick = 100
    for (let k = 1; k <= sc.duration / tick; k++) later(() => setProgress((k * tick) / sc.duration), k * tick)
    later(() => setI((x) => (x + 1) % SCENES.length), sc.duration)
    return clear
  }, [active, i])

  // seguir el elemento resaltado si hay scroll
  useEffect(() => {
    if (!active) return
    const h = () => {
      const el = find(SCENES[i].selector)
      if (el && ring) setRing(el.getBoundingClientRect())
    }
    window.addEventListener('scroll', h, true)
    return () => window.removeEventListener('scroll', h, true)
  }, [active, i, ring])

  if (!active) return null
  const sc = SCENES[i]

  return createPortal(
    <>
      {/* bloquea la interacción del usuario mientras corre */}
      <div className="fixed inset-0 z-[9990]" />
      {ring && (
        <div
          className="pointer-events-none fixed z-[9991] rounded-[14px] transition-all duration-500"
          style={{
            left: ring.left - 8,
            top: ring.top - 8,
            width: ring.width + 16,
            height: ring.height + 16,
            boxShadow: '0 0 0 3px #3b82f6, 0 0 0 10px rgba(59,130,246,.22), 0 0 48px rgba(59,130,246,.45)',
          }}
          data-trailer-ring
        />
      )}
      {/* cursor virtual */}
      <div className="pointer-events-none fixed z-[9993] transition-[left,top] duration-[900ms] ease-[cubic-bezier(.4,.1,.2,1)]" style={{ left: cursor.x, top: cursor.y }}>
        <svg width="26" height="26" viewBox="0 0 24 24" className="drop-shadow-[0_4px_10px_rgba(59,130,246,.6)]" style={{ scale: cursor.press ? '0.85' : '1', transition: 'scale .15s' }}>
          <path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        {cursor.press && <span className="absolute -left-3 -top-3 h-8 w-8 animate-ping rounded-full bg-accent/50" />}
      </div>
      {/* caption de vidrio */}
      <div className="fixed bottom-8 left-8 z-[9992] w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[rgba(9,9,11,.72)] p-5 text-white shadow-2xl backdrop-blur-xl">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-blue-400">
          {t('trailer.ch', { n: sc.chapter })} / {SCENES.length}
        </div>
        <div className="mt-1.5 text-[20px] font-bold leading-tight">{t(sc.title)}</div>
        <div className="mt-1 text-[14px] leading-snug text-zinc-300">{tr(sc.body, lang, { kevin })}</div>
        {sc.cta && (
          <a href={WA_URL} target="_blank" rel="noreferrer" className="pointer-events-auto relative z-[9994] mt-4 inline-flex h-11 items-center gap-2 rounded-[10px] bg-accent px-4 text-[14px] font-semibold text-white hover:bg-accent-strong">
            <MessageCircle size={16} /> {t('cta.quieroMiCrm')}
          </a>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div className="h-full bg-accent transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <button onClick={salir} className="fixed right-6 top-6 z-[9994] inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-[rgba(9,9,11,.75)] px-4 text-[13px] font-semibold text-white backdrop-blur-xl hover:bg-black">
        <X size={16} /> {t('trailer.salir')} · Esc
      </button>
    </>,
    document.body,
  )
}
