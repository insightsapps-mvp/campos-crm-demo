import { ArrowLeft, ArrowRight, MessageCircle, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Modal } from '@/components/ui'
import { useT } from '@/i18n'
import { WA_URL } from '@/lib/utils'
import { useApp } from '@/store/app'
import { getTourSteps } from './tourSteps'

const PAD = 8
const R = 12

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 1024)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 1024)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

function visible(el: Element | null): el is HTMLElement {
  if (!el) return false
  const r = (el as HTMLElement).getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

/** path evenodd: pantalla completa menos un rectángulo redondeado */
function holePath(w: number, h: number, r: DOMRect) {
  const x = r.left - PAD
  const y = r.top - PAD
  const rw = r.width + PAD * 2
  const rh = r.height + PAD * 2
  const k = Math.min(R, rw / 2, rh / 2)
  return `M0 0H${w}V${h}H0Z M${x + k} ${y}H${x + rw - k}Q${x + rw} ${y} ${x + rw} ${y + k}V${y + rh - k}Q${x + rw} ${y + rh} ${x + rw - k} ${y + rh}H${x + k}Q${x} ${y + rh} ${x} ${y + rh - k}V${y + k}Q${x} ${y} ${x + k} ${y}Z`
}

export function Tour() {
  const open = useApp((s) => s.tourOpen)
  const setOpen = useApp((s) => s.setTourOpen)
  const role = useApp((s) => s.role)
  const lang = useApp((s) => s.lang)
  const trailer = useApp((s) => s.trailer)
  const isMobile = useIsMobile()
  const { t } = useT()
  const navigate = useNavigate()
  const navRef = useRef(navigate)
  navRef.current = navigate
  const { pathname } = useLocation()
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  const steps = useMemo(() => (open ? getTourSteps(role, lang, isMobile) : []), [role, lang, isMobile, open])
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [final, setFinal] = useState(false)
  const elRef = useRef<HTMLElement | null>(null)
  const timers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach((x) => clearTimeout(x))
    timers.current = []
  }, [])

  // arranca en el paso 1 al abrir; se reinicia si cambia el rol o el idioma estando abierto
  useEffect(() => {
    if (open) {
      setIdx(0)
      const st = useApp.getState()
      if (st.preview) st.cancelarPreview()
    }
  }, [open, role, lang])

  const step = steps[idx]

  // medir el target del paso
  useEffect(() => {
    if (!open || !step) return
    clearTimers()
    setRect(null)
    elRef.current = null
    if (step.route && !pathRef.current.startsWith(step.route.split('/').slice(0, 2).join('/'))) {
      const st = useApp.getState()
      if (st.viewAs) st.setViewAs(null)
      navRef.current(step.route)
    }
    if (!step.selectors.length) return
    const find = () => {
      for (const s of step.selectors) {
        const el = document.querySelector(s)
        if (visible(el)) return el
      }
      return null
    }
    const medir = () => {
      const el = elRef.current
      if (el) setRect(el.getBoundingClientRect())
    }
    const intentar = (retry: boolean) => {
      const el = find()
      if (el) {
        elRef.current = el
        el.scrollIntoView({ block: 'center' })
        timers.current.push(window.setTimeout(medir, 220))
      } else if (retry) {
        timers.current.push(window.setTimeout(() => intentar(false), 220))
      }
    }
    timers.current.push(window.setTimeout(() => intentar(true), 260))
    return clearTimers
  }, [open, step, clearTimers])

  // re-medir en resize/scroll (sin volver a hacer scrollIntoView)
  useEffect(() => {
    if (!open) return
    const h = () => {
      setSize({ w: window.innerWidth, h: window.innerHeight })
      if (elRef.current) setRect(elRef.current.getBoundingClientRect())
    }
    window.addEventListener('resize', h)
    window.addEventListener('scroll', h, true)
    return () => {
      window.removeEventListener('resize', h)
      window.removeEventListener('scroll', h, true)
    }
  }, [open])

  const teardown = useCallback(
    (showFinal: boolean) => {
      clearTimers()
      setRect(null)
      elRef.current = null
      setOpen(false)
      try {
        localStorage.setItem(`ccrm_tour_completed_${useApp.getState().role}`, '1')
      } catch {
        /* noop */
      }
      if (showFinal) setFinal(true)
    },
    [clearTimers, setOpen],
  )

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') teardown(true)
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, steps.length - 1))
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, teardown, steps.length])

  useEffect(() => {
    if (trailer && open) teardown(false)
  }, [trailer, open, teardown])

  const next = () => (idx >= steps.length - 1 ? teardown(true) : setIdx(idx + 1))
  const back = () => setIdx(Math.max(0, idx - 1))

  // posición del tooltip
  const tipW = Math.min(360, size.w - 24)
  let tipStyle: React.CSSProperties = { left: '50%', top: '50%', translate: '-50% -50%', width: tipW }
  if (rect) {
    const below = rect.bottom + PAD + 14
    const estH = 230
    let top = below + estH < size.h ? below : rect.top - PAD - 14 - estH
    if (top < 12) top = Math.max(12, Math.min(size.h - estH - 12, rect.bottom + 14))
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - tipW / 2), size.w - tipW - 12)
    tipStyle = { left, top, width: tipW }
  }

  const finalModal = (
    <Modal open={final} onClose={() => setFinal(false)} width={460} hideClose z={95} dataAttr="tour-final">
      <div className="p-6 text-center sm:p-8">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent text-white">
          <Sparkles size={22} />
        </span>
        <h3 className="mt-4 text-[20px] font-bold">{t('tour.final.t')}</h3>
        <p className="mt-2 text-[14px] text-fg2">{t('tour.final.b')}</p>
        <div className="mt-6 flex flex-col gap-2">
          <a href={WA_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-accent font-semibold text-white hover:bg-accent-strong">
            <MessageCircle size={17} /> {t('cta.quieroMiApp')}
          </a>
          <Button variant="secondary" size="lg" onClick={() => setFinal(false)}>
            {t('tour.final.explorar')}
          </Button>
        </div>
      </div>
    </Modal>
  )

  if (!open || !step) return finalModal

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[9000]" aria-live="polite">
          {/* overlay con agujero */}
          <div
            className="absolute inset-0 transition-[clip-path] duration-200"
            style={{ background: 'rgba(10,10,10,.55)', clipPath: rect ? `path(evenodd, "${holePath(size.w, size.h, rect)}")` : undefined }}
          />
          {rect && (
            <>
              <div
                className="pointer-events-none absolute rounded-[12px] border-2 border-accent transition-all duration-200"
                style={{
                  left: rect.left - PAD,
                  top: rect.top - PAD,
                  width: rect.width + PAD * 2,
                  height: rect.height + PAD * 2,
                  boxShadow: '0 0 0 4px rgba(59,130,246,.22), 0 0 28px rgba(59,130,246,.55)',
                }}
              />
              <div className="pointer-events-none absolute flex items-center gap-1.5" style={{ left: Math.min(rect.right + PAD - 6, size.w - 90), top: Math.max(4, rect.top - PAD - 9) }}>
                <span className="relative flex h-3 w-3">
                  <span className="ping-dot absolute inline-flex h-full w-full rounded-full bg-blue-500" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
                </span>
                <span className="rounded bg-blue-500 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white">{t('tour.miraAca')}</span>
              </div>
            </>
          )}
          <div className="anim-fade absolute rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:p-5" style={tipStyle} role="dialog">
            <span className="pill bg-[rgba(59,130,246,.14)] text-accent">
              {t('tour.paso', { a: idx + 1, b: steps.length })}
            </span>
            <h4 className="mt-2.5 text-[16px] font-bold leading-snug">{step.title}</h4>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg2">{step.body}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button onClick={() => teardown(true)} className="h-11 px-1 text-[12.5px] font-medium text-fg2 hover:text-fg">
                {t('tour.saltar')}
              </button>
              <div className="flex gap-2">
                <Button variant="secondary" size="icon" onClick={back} disabled={idx === 0} aria-label={t('common.anterior')}>
                  <ArrowLeft size={17} />
                </Button>
                <Button variant="primary" onClick={next}>
                  {idx >= steps.length - 1 ? t('tour.terminar') : t('common.siguiente')} <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {finalModal}
    </>
  )
}
