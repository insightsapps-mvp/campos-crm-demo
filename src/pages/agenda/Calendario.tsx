import { BellRing, CalendarCheck2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Segmented } from '@/components/ui'
import { useT } from '@/i18n'
import { isSameDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DAY } from '@/mock/base'
import type { Lead } from '@/mock/types'
import { useUI } from '@/store/ui'
import { itemsAgenda, type ItemAgenda } from '../dashboard/AgendaEquipo'

type Vista = 'semana' | 'mes'

const H0 = 8
const H1 = 21
const ROW = 52 // px por hora

const horaCorta = (t: number) => {
  const d = new Date(t)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
const inicioDia = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
/** lunes de la semana de t */
const inicioSemana = (t: number) => {
  const d = new Date(inicioDia(t))
  const dow = (d.getDay() + 6) % 7
  return d.getTime() - dow * DAY
}

/** color por tipo/estado: citas en azul (confirmadas), ámbar (por confirmar), verde (realizadas), rojo (no-show); seguimientos en violeta, rojo si vencidos */
function chipCls(it: ItemAgenda) {
  if (it.tipo === 'seguimiento')
    return it.estado === 'vencido' ? 'border-bad/50 bg-[rgba(248,113,113,.16)] text-bad' : 'border-violet/50 bg-[rgba(167,139,250,.16)] text-violet'
  if (it.estado === 'pendiente') return 'border-warn/50 bg-[rgba(245,158,11,.16)] text-warn'
  if (it.estado === 'realizada') return 'border-ok/50 bg-[rgba(52,211,153,.15)] text-ok'
  if (it.estado === 'no_show') return 'border-bad/50 bg-[rgba(248,113,113,.14)] text-bad line-through'
  return 'border-accent/60 bg-[rgba(59,130,246,.18)] text-accent'
}

export function Calendario({ leads, quien, dia, onDia }: { leads: Lead[]; quien: string | null; dia: number; onDia: (d: number) => void }) {
  const { t, lang } = useT()
  const openLead = useUI((s) => s.openLead)
  const loc = lang === 'es' ? 'es-US' : 'en-US'
  const [vista, setVista] = useState<Vista>(() => (window.innerWidth < 768 ? 'mes' : 'semana'))
  const [ref, setRef] = useState(() => inicioDia(Date.now()))
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // días visibles
  const dias = useMemo(() => {
    if (vista === 'semana') {
      const s = inicioSemana(ref)
      return Array.from({ length: 7 }, (_, i) => s + i * DAY)
    }
    const d = new Date(ref)
    const primero = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
    const s = inicioSemana(primero)
    return Array.from({ length: 42 }, (_, i) => s + i * DAY)
  }, [vista, ref])

  const porDia = useMemo(() => dias.map((d) => itemsAgenda(leads, d, quien)), [dias, leads, quien])

  const mover = (dir: number) => {
    const d = new Date(ref)
    if (vista === 'semana') setRef(ref + dir * 7 * DAY)
    else setRef(new Date(d.getFullYear(), d.getMonth() + dir, 1).getTime())
  }
  const irHoy = () => {
    setRef(inicioDia(Date.now()))
    onDia(inicioDia(Date.now()))
  }

  const titulo =
    vista === 'semana'
      ? `${new Date(dias[0]).toLocaleDateString(loc, { day: 'numeric', month: 'short' })} – ${new Date(dias[6]).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })}`
      : new Date(ref).toLocaleDateString(loc, { month: 'long', year: 'numeric' })

  const totCitas = porDia.flat().filter((i) => i.tipo === 'cita').length
  const totSeg = porDia.flat().filter((i) => i.tipo === 'seguimiento').length
  const pos = (at: number) => {
    const d = new Date(at)
    const h = Math.min(H1 - 0.5, Math.max(H0, d.getHours() + d.getMinutes() / 60))
    return (h - H0) * ROW
  }

  return (
    <Card className="mb-5 overflow-hidden" data-tour="calendario">
      {/* barra */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => mover(-1)} aria-label={t('common.anterior')}>
            <ChevronLeft size={18} />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => mover(1)} aria-label={t('common.siguiente')}>
            <ChevronRight size={18} />
          </Button>
          <Button size="sm" variant="secondary" onClick={irHoy}>
            {t('common.hoy')}
          </Button>
        </div>
        <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold capitalize sm:text-[16px]">{titulo}</h3>
        <div className="hidden items-center gap-3 text-[11.5px] text-fg2 md:flex">
          <span className="inline-flex items-center gap-1">
            <CalendarCheck2 size={13} className="text-accent" /> {t('cal.nReuniones', { n: totCitas })}
          </span>
          <span className="inline-flex items-center gap-1">
            <BellRing size={13} className="text-violet" /> {t('cal.nSeguimientos', { n: totSeg })}
          </span>
        </div>
        <Segmented
          size="sm"
          value={vista}
          onChange={setVista}
          options={[
            { value: 'semana', label: t('cal.semana') },
            { value: 'mes', label: t('cal.mes') },
          ]}
        />
      </div>

      {vista === 'semana' ? (
        <div className="scroll-x">
          <div className="min-w-[760px]">
            {/* cabecera de días */}
            <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-line">
              <div />
              {dias.map((d, i) => {
                const esHoy = isSameDay(d, now)
                const sel = isSameDay(d, dia)
                return (
                  <button key={d} onClick={() => onDia(d)} className={cn('flex flex-col items-center gap-0.5 border-l border-line py-2 transition hover:bg-surface2/60', sel && 'bg-[rgba(59,130,246,.07)]')}>
                    <span className={cn('text-[11px] font-semibold uppercase', esHoy ? 'text-accent' : 'text-fg2')}>{new Date(d).toLocaleDateString(loc, { weekday: 'short' })}</span>
                    <span className={cn('mono grid h-8 w-8 place-items-center rounded-full text-[15px] font-bold', esHoy && 'bg-accent text-white')}>{new Date(d).getDate()}</span>
                    <span className="text-[10.5px] text-muted">{porDia[i].length || ''}</span>
                  </button>
                )
              })}
            </div>
            {/* grilla horaria */}
            <div className="relative grid max-h-[560px] grid-cols-[52px_repeat(7,1fr)] overflow-y-auto">
              <div className="relative" style={{ height: (H1 - H0) * ROW }}>
                {Array.from({ length: H1 - H0 }, (_, i) => (
                  <span key={i} className="mono absolute right-2 -translate-y-1/2 text-[10.5px] text-muted" style={{ top: i * ROW }}>
                    {i === 0 ? '' : `${H0 + i}:00`}
                  </span>
                ))}
              </div>
              {dias.map((d, di) => {
                const its = porDia[di]
                const esHoy = isSameDay(d, now)
                // columnas para eventos superpuestos (misma media hora)
                const slots: Record<number, number> = {}
                return (
                  <div key={d} className={cn('relative border-l border-line', esHoy && 'bg-[rgba(59,130,246,.035)]')} style={{ height: (H1 - H0) * ROW }} onClick={() => onDia(d)}>
                    {Array.from({ length: H1 - H0 }, (_, i) => (
                      <div key={i} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * ROW }} />
                    ))}
                    {esHoy && (
                      <div className="absolute inset-x-0 z-[3] h-0.5 bg-bad" style={{ top: pos(now) }}>
                        <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-bad" />
                      </div>
                    )}
                    {its.map((it, k) => {
                      const slot = Math.round(pos(it.at) / (ROW / 2))
                      const col = (slots[slot] = (slots[slot] ?? -1) + 1)
                      const ancho = col > 0 ? 'calc(50% - 4px)' : 'calc(100% - 6px)'
                      return (
                        <button
                          key={k}
                          onClick={(e) => {
                            e.stopPropagation()
                            openLead(it.lead.id)
                          }}
                          title={`${it.lead.nombre} · ${it.tipo === 'cita' ? it.lead.vehiculoInteres : it.titulo}`}
                          className={cn('absolute z-[2] overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition hover:z-10 hover:shadow-lg', chipCls(it))}
                          style={{ top: pos(it.at) + 1, height: it.tipo === 'cita' ? ROW - 4 : ROW / 2 - 2, left: col > 0 ? '50%' : 3, width: ancho }}
                        >
                          <span className="flex items-center gap-1 font-semibold">
                            {it.tipo === 'cita' ? <CalendarCheck2 size={10} className="shrink-0" /> : <BellRing size={10} className="shrink-0" />}
                            <span className="mono">{horaCorta(it.at)}</span>
                          </span>
                          <span className="block truncate font-medium text-fg">{it.lead.nombre}</span>
                          {it.tipo === 'cita' && <span className="block truncate opacity-80">{it.lead.vehiculoInteres}</span>}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-7 border-b border-line">
            {dias.slice(0, 7).map((d) => (
              <div key={d} className="py-2 text-center text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                {new Date(d).toLocaleDateString(loc, { weekday: 'short' })}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dias.map((d, i) => {
              const its = porDia[i]
              const mesActual = new Date(d).getMonth() === new Date(ref).getMonth()
              const esHoy = isSameDay(d, now)
              const sel = isSameDay(d, dia)
              const citas = its.filter((x) => x.tipo === 'cita').length
              const segs = its.length - citas
              return (
                <button
                  key={d}
                  onClick={() => onDia(d)}
                  className={cn(
                    'flex min-h-[64px] flex-col items-stretch gap-1 border-b border-r border-line p-1 text-left transition hover:bg-surface2/60 sm:min-h-[104px] sm:p-1.5',
                    !mesActual && 'opacity-40',
                    sel && 'bg-[rgba(59,130,246,.08)] ring-1 ring-inset ring-accent/50',
                  )}
                >
                  <span className={cn('mono grid h-6 w-6 place-items-center self-end rounded-full text-[12px] font-bold sm:self-start', esHoy && 'bg-accent text-white')}>{new Date(d).getDate()}</span>
                  {/* mobile: puntos */}
                  <span className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                    {citas > 0 && <span className="mono rounded bg-[rgba(59,130,246,.18)] px-1 text-[10px] font-bold text-accent">{citas}</span>}
                    {segs > 0 && <span className="mono rounded bg-[rgba(167,139,250,.18)] px-1 text-[10px] font-bold text-violet">{segs}</span>}
                  </span>
                  {/* desktop: chips */}
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {its.slice(0, 3).map((it, k) => (
                      <span key={k} className={cn('truncate rounded border px-1 py-0.5 text-[10.5px] font-medium', chipCls(it))}>
                        <span className="mono">{horaCorta(it.at)}</span> {it.lead.nombre.split(' ')[0]}
                      </span>
                    ))}
                    {its.length > 3 && <span className="px-1 text-[10.5px] text-fg2">{t('cal.masN', { n: its.length - 3 })}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line px-4 py-2.5 text-[11.5px] text-fg2">
        {[
          ['bg-accent', 'cal.leg.confirmada'],
          ['bg-warn', 'cal.leg.porConfirmar'],
          ['bg-ok', 'cal.leg.realizada'],
          ['bg-violet', 'cal.leg.seguimiento'],
          ['bg-bad', 'cal.leg.vencido'],
        ].map(([c, k]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm', c)} /> {t(k)}
          </span>
        ))}
        <span className="ml-auto hidden text-muted sm:inline">{t('cal.tip')}</span>
      </div>
    </Card>
  )
}
