import { BellRing, CalendarCheck2, Phone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar, Badge, Segmented } from '@/components/ui'
import { useT } from '@/i18n'
import { isSameDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DAY, vendedores } from '@/mock/base'
import type { Lead } from '@/mock/types'
import { useUI } from '@/store/ui'

export type CitaEstado = 'confirmada' | 'pendiente' | 'realizada' | 'no_show'

export interface ItemAgenda {
  tipo: 'cita' | 'seguimiento'
  at: number
  lead: Lead
  estado: CitaEstado | 'vencido' | 'programado'
  titulo?: string
}

/** Estado visible de una cita (determinístico por lead) */
export function estadoCita(l: Lead): CitaEstado {
  if (l.citaRealizada === true) return 'realizada'
  if (l.citaRealizada === false) return 'no_show'
  const h = l.id.charCodeAt(l.id.length - 1)
  return h % 3 === 0 ? 'pendiente' : 'confirmada'
}

export const citaTone: Record<string, 'ok' | 'accent' | 'warn' | 'bad' | 'muted' | 'violet'> = {
  confirmada: 'accent',
  pendiente: 'warn',
  realizada: 'ok',
  no_show: 'bad',
  vencido: 'bad',
  programado: 'violet',
}

export function itemsAgenda(leads: Lead[], dia: number, vendedorId?: string | null): ItemAgenda[] {
  const out: ItemAgenda[] = []
  const now = Date.now()
  for (const l of leads) {
    if (!l.vendedorId || (vendedorId && l.vendedorId !== vendedorId)) continue
    if (l.citaAt && isSameDay(l.citaAt, dia)) out.push({ tipo: 'cita', at: l.citaAt, lead: l, estado: estadoCita(l) })
    for (const s of l.seguimientos)
      if (!s.hecho && isSameDay(s.at, dia)) out.push({ tipo: 'seguimiento', at: s.at, lead: l, estado: s.at < now ? 'vencido' : 'programado', titulo: s.titulo.es })
  }
  return out.sort((a, b) => a.at - b.at)
}

const H0 = 8
const H1 = 21

const horaCorta = (t: number) => {
  const d = new Date(t)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** reparte las citas en carriles para que los chips no se pisen (~1.3 h de ancho por chip) */
function carriles(its: ItemAgenda[]) {
  const fin: number[] = []
  return its.map((it) => {
    const d = new Date(it.at)
    const h = d.getHours() + d.getMinutes() / 60
    let lane = fin.findIndex((f) => f <= h)
    if (lane === -1) {
      lane = fin.length
      fin.push(0)
    }
    fin[lane] = h + 1.35
    return { it, lane }
  })
}

export function AgendaEquipo({ leads }: { leads: Lead[] }) {
  const { t, lang } = useT()
  const openLead = useUI((s) => s.openLead)
  const [vista, setVista] = useState<'hoy' | 'manana' | 'semana'>('hoy')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dia = vista === 'manana' ? hoy.getTime() + DAY : hoy.getTime()
  const items = useMemo(() => itemsAgenda(leads, dia), [leads, dia])
  const now = Date.now()

  const resumen = {
    citas: items.filter((i) => i.tipo === 'cita').length,
    confirmadas: items.filter((i) => i.estado === 'confirmada').length,
    pendientes: items.filter((i) => i.estado === 'pendiente').length,
    noShows: items.filter((i) => i.estado === 'no_show').length,
    vencidos: items.filter((i) => i.estado === 'vencido').length,
    seguimientos: items.filter((i) => i.tipo === 'seguimiento').length,
  }

  const semana = useMemo(() => {
    const dias = Array.from({ length: 7 }, (_, i) => hoy.getTime() + i * DAY)
    return vendedores.map((v) => ({
      v,
      dias: dias.map((d) => {
        const its = itemsAgenda(leads, d, v.id)
        return { citas: its.filter((i) => i.tipo === 'cita').length, seg: its.filter((i) => i.tipo === 'seguimiento').length }
      }),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, hoy.getTime()])

  const pos = (t0: number) => {
    const d = new Date(t0)
    const h = d.getHours() + d.getMinutes() / 60
    return Math.min(100, Math.max(0, ((h - H0) / (H1 - H0)) * 100))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <Segmented
          size="sm"
          value={vista}
          onChange={setVista}
          options={[
            { value: 'hoy', label: t('agenda.hoy') },
            { value: 'manana', label: t('agenda.manana') },
            { value: 'semana', label: t('agenda.semana') },
          ]}
        />
        {vista !== 'semana' && (
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="accent">{t('agenda.nCitas', { n: resumen.citas })}</Badge>
            <Badge tone="ok">{t('agenda.nConfirmadas', { n: resumen.confirmadas })}</Badge>
            <Badge tone="warn">{t('agenda.nPendientes', { n: resumen.pendientes })}</Badge>
            {resumen.noShows > 0 && <Badge tone="bad">{t('agenda.nNoShow', { n: resumen.noShows })}</Badge>}
            <Badge tone="violet">{t('agenda.nSeguimientos', { n: resumen.seguimientos })}</Badge>
            {resumen.vencidos > 0 && <Badge tone="bad">{t('agenda.nVencidos', { n: resumen.vencidos })}</Badge>}
          </div>
        )}
      </div>

      {vista === 'semana' ? (
        <div className="scroll-x p-4 sm:p-5">
          <table className="w-full min-w-[640px] text-[12.5px]">
            <thead>
              <tr>
                <th className="label-up py-2 text-left">{t('rank.closer')}</th>
                {Array.from({ length: 7 }, (_, i) => (
                  <th key={i} className="label-up py-2 text-center">
                    {new Date(hoy.getTime() + i * DAY).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', day: 'numeric' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {semana.map(({ v, dias }) => (
                <tr key={v.id} className="border-t border-line">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2 whitespace-nowrap font-medium">
                      <Avatar initials={v.avatar} color={v.color} size={26} /> {v.nombre}
                    </div>
                  </td>
                  {dias.map((d, i) => (
                    <td key={i} className="py-2 text-center">
                      <div className={cn('mono mx-auto flex h-10 w-14 flex-col items-center justify-center rounded-lg', d.citas ? 'bg-[rgba(59,130,246,.12)]' : 'bg-surface2')}>
                        <span className={cn('text-[14px] font-bold', d.citas ? 'text-accent' : 'text-muted')}>{d.citas}</span>
                        {d.seg > 0 && <span className="text-[10px] text-violet">+{d.seg} seg.</span>}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* timeline por closer (≥1024) */}
          <div className="hidden p-5 lg:block" data-tour="agenda-equipo">
            <div className="relative ml-[200px] mr-[150px] h-6">
              {Array.from({ length: H1 - H0 + 1 }, (_, i) => (
                <span key={i} className="mono absolute -translate-x-1/2 text-[10.5px] text-muted" style={{ left: `${(i / (H1 - H0)) * 100}%` }}>
                  {((H0 + i - 1) % 12) + 1}
                  {H0 + i < 12 ? 'a' : 'p'}
                </span>
              ))}
            </div>
            {vendedores.map((v) => {
              const its = items.filter((i) => i.lead.vendedorId === v.id)
              const citas = carriles(its.filter((i) => i.tipo === 'cita'))
              const nLanes = Math.max(1, ...citas.map((c) => c.lane + 1))
              const segs = its.filter((i) => i.tipo === 'seguimiento')
              const venc = segs.filter((i) => i.estado === 'vencido').length
              return (
                <div key={v.id} className="flex items-center border-t border-line py-1.5">
                  <div className="flex w-[200px] shrink-0 items-center gap-2 pr-3">
                    <Avatar initials={v.avatar} color={v.color} size={28} />
                    <span className="truncate text-[13px] font-medium">{v.nombre}</span>
                  </div>
                  <div className="relative flex-1 rounded-lg bg-surface2/60" style={{ height: nLanes * 27 + 6 }}>
                    {Array.from({ length: H1 - H0 }, (_, i) => (
                      <span key={i} className="absolute inset-y-0 w-px bg-line" style={{ left: `${(i / (H1 - H0)) * 100}%` }} />
                    ))}
                    {vista === 'hoy' && <span className="absolute inset-y-0 z-[1] w-0.5 bg-bad/70" style={{ left: `${pos(now)}%` }} />}
                    {citas.map(({ it, lane }, k) => (
                      <button
                        key={k}
                        onClick={() => openLead(it.lead.id)}
                        title={`${it.lead.nombre} · ${it.lead.vehiculoInteres}`}
                        style={{ left: `min(${pos(it.at)}%, calc(100% - 118px))`, top: 3 + lane * 27 }}
                        className={cn(
                          'absolute z-[2] flex h-[23px] max-w-[132px] items-center gap-1 truncate rounded-md border px-1.5 text-[11px] font-semibold shadow-sm transition hover:z-10 hover:scale-105',
                          it.tipo === 'seguimiento' && it.estado === 'vencido' && 'border-bad/40 bg-[rgba(248,113,113,.14)] text-bad',
                          it.tipo === 'seguimiento' && it.estado !== 'vencido' && 'border-violet/40 bg-[rgba(167,139,250,.16)] text-violet',
                          it.tipo === 'cita' && it.estado === 'confirmada' && 'border-accent/50 bg-[rgba(59,130,246,.16)] text-accent',
                          it.tipo === 'cita' && it.estado === 'pendiente' && 'border-warn/50 bg-[rgba(245,158,11,.16)] text-warn',
                          it.tipo === 'cita' && it.estado === 'realizada' && 'border-ok/40 bg-[rgba(52,211,153,.15)] text-ok',
                          it.tipo === 'cita' && it.estado === 'no_show' && 'border-bad/40 bg-[rgba(248,113,113,.14)] text-bad line-through',
                        )}
                      >
                        {it.tipo === 'cita' ? <CalendarCheck2 size={11} /> : <BellRing size={11} />}
                        <span className="mono">{horaCorta(it.at)}</span>
                        <span className="truncate">{it.lead.nombre.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex w-[150px] shrink-0 flex-col items-end gap-0.5 pl-3 text-[11.5px]">
                    <span className="mono font-semibold">{t('agenda.nCitas', { n: citas.length })}</span>
                    <span className="text-violet">{t('agenda.nSeguimientos', { n: segs.length })}</span>
                    {venc > 0 ? <span className="font-semibold text-bad">{t('agenda.nVencidos', { n: venc })}</span> : <span className="text-muted">{t('agenda.alDia')}</span>}
                  </div>
                </div>
              )
            })}
            <div className="mt-3 flex flex-wrap gap-3 text-[11.5px] text-fg2">
              {(['confirmada', 'pendiente', 'realizada', 'no_show'] as const).map((k) => (
                <Badge key={k} tone={citaTone[k]}>
                  {t(`citaEstado.${k}`)}
                </Badge>
              ))}
            </div>
          </div>

          {/* lista agrupada (<1024) */}
          <div className="space-y-3 p-4 sm:p-5 lg:hidden">
            {vendedores.map((v) => {
              const its = items.filter((i) => i.lead.vendedorId === v.id)
              return (
                <div key={v.id} className="rounded-[12px] border border-line">
                  <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                    <Avatar initials={v.avatar} color={v.color} size={26} />
                    <span className="flex-1 truncate text-[13px] font-semibold">{v.nombre}</span>
                    <span className="mono text-[12px] text-fg2">{its.length}</span>
                  </div>
                  {its.length === 0 ? (
                    <div className="px-3 py-2.5 text-[12.5px] text-muted">{t('agenda.sinItems')}</div>
                  ) : (
                    its.map((it, k) => (
                      <button key={k} onClick={() => openLead(it.lead.id)} className="flex min-h-[48px] w-full items-center gap-2.5 border-t border-line px-3 py-2 text-left first:border-t-0">
                        <span className="mono w-12 shrink-0 text-[12px] font-semibold">{horaCorta(it.at)}</span>
                        {it.tipo === 'cita' ? <CalendarCheck2 size={14} className="shrink-0 text-accent" /> : <Phone size={14} className="shrink-0 text-violet" />}
                        <span className="min-w-0 flex-1 truncate text-[13px]">
                          {it.lead.nombre} <span className="text-fg2">· {it.tipo === 'cita' ? it.lead.vehiculoInteres : t('agenda.seguimiento')}</span>
                        </span>
                        <Badge tone={citaTone[it.estado]}>{t(`citaEstado.${it.estado}`)}</Badge>
                      </button>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
