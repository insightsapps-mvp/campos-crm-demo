import { ArrowUpRight, Check, Eye, EyeOff, MessageCircle, Printer, RotateCcw, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { useT } from '@/i18n'
import { fmtUSDProp } from '@/lib/format'
import { WA_URL, cn } from '@/lib/utils'
import { useApp } from '@/store/app'
import type { Role } from '@/mock/types'

interface Modulo {
  n: number
  view: string
  rol: Role
  bullets: number
}

export const MODULOS: Modulo[] = [
  { n: 1, view: '/dashboard', rol: 'admin', bullets: 5 },
  { n: 2, view: '/mi-panel', rol: 'vendedor', bullets: 5 },
  { n: 3, view: '/metricas/velocidad', rol: 'admin', bullets: 4 },
  { n: 4, view: '/metricas/agendamiento', rol: 'admin', bullets: 4 },
  { n: 5, view: '/metricas/cierre', rol: 'admin', bullets: 4 },
  { n: 6, view: '/leads', rol: 'admin', bullets: 6 },
  { n: 7, view: '/whatsapp', rol: 'admin', bullets: 6 },
  { n: 8, view: '/automatizaciones', rol: 'admin', bullets: 5 },
  { n: 9, view: '/usuarios', rol: 'admin', bullets: 5 },
]

const TOTAL = 7000

function Inversion() {
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)
  const pagos = [
    { k: 'firma', pct: 50, monto: 3500 },
    { k: 'dia30', pct: 25, monto: 1750 },
    { k: 'dia60', pct: 25, monto: 1750 },
  ]
  return (
    <section className="card overflow-hidden" data-tour="inversion">
      <div className="p-5 sm:p-7">
        <div className="kicker text-accent">{t('prop.inv.kicker')}</div>
        <h2 className="mt-1 text-[22px] font-bold tracking-tight">{t('prop.inv.titulo')}</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line bg-surface2/60 px-4 py-3">
          <div className="min-w-0">
            <div className="label-up">{t('prop.inv.total')}</div>
            {!open && <div className="mono mt-1 text-[24px] font-bold tracking-widest text-fg2">••••••</div>}
            {open && <div className="mono mt-1 text-[15px] font-semibold text-ok">{t('prop.inv.revelado')}</div>}
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-[10px] border border-accent/40 bg-[rgba(59,130,246,.1)] px-4 text-[14px] font-semibold text-accent transition hover:bg-[rgba(59,130,246,.18)]"
            aria-expanded={open}
          >
            {open ? <EyeOff size={18} /> : <Eye size={18} />}
            {open ? t('prop.inv.ocultar') : t('prop.inv.ver')}
          </button>
        </div>

        <div className={cn('grid transition-[grid-template-rows,opacity] duration-[250ms] ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
          <div className="min-h-0 overflow-hidden">
            {open && (
              <div className="pt-6">
                <div className="mono font-bold leading-none tracking-tight text-fg" style={{ fontSize: 'clamp(40px, 8vw, 56px)' }}>
                  {fmtUSDProp(TOTAL, lang)}
                </div>
                <p className="mt-2 text-[14px] text-fg2">{t('prop.inv.bajada')}</p>

                <div className="mt-6 overflow-hidden rounded-[12px] border border-line">
                  {MODULOS.map((m) => (
                    <div key={m.n} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-[13.5px]">
                      <span className="min-w-0">
                        <span className="mono mr-2 text-fg2">{String(m.n).padStart(2, '0')}</span>
                        {t(`prop.m${m.n}.titulo`)}
                      </span>
                      <span className="shrink-0 text-[12px] font-semibold text-ok">{t('prop.incluido')}</span>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-surface2/70 px-4 py-3 text-[14px] font-bold">
                    <span>{t('prop.inv.proyecto')}</span>
                    <span className="mono">{fmtUSDProp(TOTAL, lang)}</span>
                  </div>
                </div>

                <h3 className="mt-7 text-[15px] font-semibold">{t('prop.inv.condiciones')}</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {pagos.map((p) => (
                    <div key={p.k} className="rounded-[12px] border border-line p-4">
                      <div className="mono text-[13px] font-semibold text-accent">{p.pct}%</div>
                      <div className="mt-1 text-[13.5px] font-medium">{t(`prop.pago.${p.k}`)}</div>
                      <div className="mono mt-2 text-[22px] font-bold">{fmtUSDProp(p.monto, lang)}</div>
                      <div className="mt-1 text-[12px] text-fg2">{t(`prop.pago.${p.k}Sub`)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[12px] border-2 border-accent/60 bg-[rgba(59,130,246,.08)] p-4 sm:p-5">
                  <div className="text-[14.5px] font-semibold">{t('prop.inv.descuento')}</div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="mono text-[16px] text-fg2 line-through">{fmtUSDProp(TOTAL, lang)}</span>
                    <span className="mono text-[28px] font-bold text-accent">{fmtUSDProp(5950, lang)}</span>
                    <span className="text-[13px] font-semibold text-ok">{t('prop.inv.ahorras', { v: fmtUSDProp(1050, lang) })}</span>
                  </div>
                </div>

                <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                  {['entregable', 'soporte', 'garantia'].map((k) => (
                    <li key={k} className="flex items-start gap-2 text-[13px]">
                      <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" />
                      {t(`prop.inv.${k}`)}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12.5px] text-muted">{t('prop.inv.nota')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Propuesta() {
  const { t } = useT()
  const abrirPreview = useApp((s) => s.abrirPreview)
  const destacado = useApp((s) => s.moduloDestacado)
  const limpiar = useApp((s) => s.limpiarDestacado)
  const refs = useRef<Record<number, HTMLDivElement | null>>({})
  const [glow, setGlow] = useState<number | null>(null)

  // vuelta desde "Ver en el demo": centrar y resaltar la tarjeta ~4.2s
  useEffect(() => {
    if (!destacado) return
    const n = destacado
    const t1 = setTimeout(() => {
      refs.current[n]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      setGlow(n)
    }, 120)
    const t2 = setTimeout(() => {
      setGlow(null)
      limpiar()
    }, 4300)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [destacado, limpiar])

  const circuito = [1, 2, 3, 4, 5, 6]

  return (
    <div className="mx-auto max-w-[1200px]">
      <span className="pill bg-[rgba(59,130,246,.12)] text-[10.5px] uppercase tracking-[0.1em] text-accent">{t('prop.badge')}</span>

      <header className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[36px]">{t('prop.h1')}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-fg2">{t('prop.bajada')}</p>
        </div>
        <div className="no-print flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={() => window.print()} className="w-full sm:w-auto">
            <Printer size={16} /> {t('prop.imprimir')}
          </Button>
          <a href={WA_URL} target="_blank" rel="noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong hover:shadow-glow sm:w-auto">
            <MessageCircle size={16} /> {t('cta.avanzarWhatsapp')}
          </a>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-2 text-[12.5px]">
        {['onboarding', 'plazo', 'entregable', 'soporte'].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5">
            <Check size={13} className="text-accent" /> {t(`prop.chip.${k}`)}
          </span>
        ))}
      </div>

      {/* Circuito */}
      <section className="mt-10" data-trailer="circuito">
        <div className="kicker text-accent">{t('prop.circuitoKicker')}</div>
        <h2 className="mt-1 text-[22px] font-bold tracking-tight">{t('prop.circuito')}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {circuito.map((n) => (
            <div key={n} className={cn('card p-5', n === 6 && 'border-accent/50 bg-[rgba(59,130,246,.08)]')}>
              <div className={cn('mono text-[11px] font-bold tracking-[0.12em]', n === 6 ? 'text-accent' : 'text-muted')}>
                {t('prop.paso')} {n}
              </div>
              <div className="mt-2 text-[16px] font-semibold">{t(`prop.c${n}.t`)}</div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg2">{t(`prop.c${n}.d`)}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
          <RotateCcw size={14} /> {t('prop.vuelve')}
        </p>
      </section>

      {/* Módulos */}
      <section className="mt-12" data-trailer="modulos">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="kicker text-accent">{t('prop.incluyeKicker')}</div>
            <h2 className="mt-1 text-[22px] font-bold tracking-tight">{t('prop.incluye')}</h2>
          </div>
          <span className="mono rounded-full border border-line px-3 py-1 text-[12.5px] font-semibold">{t('prop.nModulos')}</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((m) => (
            <div
              key={m.n}
              ref={(el) => (refs.current[m.n] = el)}
              className={cn(
                'card flex flex-col p-5 transition-all duration-500',
                glow === m.n && '-translate-y-1 border-accent ring-4 ring-accent/30 shadow-[0_12px_32px_-8px_rgba(59,130,246,.45)]',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="mono text-[12px] font-bold text-accent">{String(m.n).padStart(2, '0')}</span>
                <span className="text-[11px] font-semibold text-ok">{t('prop.incluido')}</span>
              </div>
              <h3 className="mt-2 text-[13.5px] font-bold uppercase tracking-[0.04em]">{t(`prop.m${m.n}.titulo`)}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg2">{t(`prop.m${m.n}.desc`)}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {Array.from({ length: m.bullets }, (_, i) => (
                  <li key={i} className="flex gap-2 text-[13px]">
                    <Check size={15} className="mt-0.5 shrink-0 text-accent" />
                    {t(`prop.m${m.n}.b${i + 1}`)}
                  </li>
                ))}
              </ul>
              <button
                className="no-print mt-4 inline-flex min-h-[44px] items-center gap-1.5 self-start text-[13.5px] font-semibold text-accent hover:underline"
                onClick={() => abrirPreview(m.n, m.view, `prop.m${m.n}.titulo`, m.rol)}
              >
                {t('prop.verDemo')} <ArrowUpRight size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <Inversion />
      </div>

      <section className="mt-10 pb-4 text-center">
        <a href={WA_URL} target="_blank" rel="noreferrer" className="no-print inline-flex h-14 w-full items-center justify-center gap-2 rounded-[12px] bg-accent text-[16px] font-semibold text-white hover:bg-accent-strong hover:shadow-glow">
          <MessageCircle size={19} /> {t('cta.avanzarWhatsapp')}
        </a>
        <p className="mt-4 text-[10px] text-muted">Powered by Insights</p>
      </section>
    </div>
  )
}
