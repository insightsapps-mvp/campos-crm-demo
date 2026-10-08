import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { C, ChartTip, Legend, axisProps } from '@/components/charts'
import { Badge, HBar } from '@/components/ui'
import { useT } from '@/i18n'
import { fmtNum, fmtPct, fmtUSD } from '@/lib/format'
import { statsCampanas } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { DAY } from '@/mock/base'
import type { Lead } from '@/mock/types'

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0)

export interface Grupo {
  id: string
  items: { key: string; label: string; share: number; conv: number; n: number }[]
}

/** Características de los leads entrantes y su conversión a venta */
export function caracteristicas(rows: Lead[], t: (k: string) => string): Grupo[] {
  const total = rows.length || 1
  const mk = (id: string, keys: string[], get: (l: Lead) => string, label: (k: string) => string): Grupo => ({
    id,
    items: keys.map((k) => {
      const g = rows.filter((l) => get(l) === k)
      return { key: k, label: label(k), n: g.length, share: pct(g.length, total), conv: pct(g.filter((l) => l.estado === 'comprador').length, g.length) }
    }),
  })
  const buckets = (p: number) => (p < 1000 ? 'b0' : p < 3000 ? 'b1' : p < 6000 ? 'b2' : 'b3')
  const franja = (l: Lead) => {
    const h = new Date(l.creadoAt).getHours()
    return h < 12 ? 'manana' : h < 17 ? 'tarde' : 'noche'
  }
  return [
    mk('credito', ['bueno', 'regular', 'sin_historial', 'malo'], (l) => l.credito, (k) => t(`credito.${k}`)),
    mk('segmento', ['suv', 'sedan', 'pickup', 'usado'], (l) => l.segmento, (k) => t(`segmento.${k}`)),
    mk('presupuesto', ['b0', 'b1', 'b2', 'b3'], (l) => buckets(l.presupuesto), (k) => t(`presupuesto.${k}`)),
    mk('financiacion', ['financiado', 'contado', 'leasing'], (l) => l.financiacion, (k) => t(`financiacion.${k}`)),
    mk('tradeIn', ['si', 'no'], (l) => (l.tradeIn ? 'si' : 'no'), (k) => t(`tradeIn.${k}`)),
    mk('franja', ['manana', 'tarde', 'noche'], franja, (k) => t(`franja.${k}`)),
    mk('idioma', ['es', 'en'], (l) => l.idioma, (k) => t(`idioma.${k}`)),
  ]
}

export function LeadsEntrantes({ leads }: { leads: Lead[] }) {
  const { t, lang } = useT()
  const navigate = useNavigate()

  const data = useMemo(() => {
    const now = Date.now()
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const rows = leads.filter((l) => l.creadoAt >= now - 30 * DAY)
    const dias = Array.from({ length: 30 }, (_, i) => {
      const d0 = hoy.getTime() - (29 - i) * DAY
      const ls = rows.filter((l) => l.creadoAt >= d0 && l.creadoAt < d0 + DAY)
      const cal = ls.filter((l) => l.calificado).length
      return {
        label: new Date(d0).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { day: 'numeric', month: 'numeric' }),
        calificados: cal,
        noCalificados: ls.length - cal,
      }
    })
    const hoyRows = rows.filter((l) => l.creadoAt >= hoy.getTime())
    const campanas = statsCampanas(leads)
    const gasto = campanas.reduce((s, c) => s + c.gasto, 0)
    const ventas = rows.filter((l) => l.estado === 'comprador').length
    return {
      rows,
      dias,
      hoy: hoyRows.length,
      hoyCal: hoyRows.filter((l) => l.calificado).length,
      promedio: rows.length / 30,
      tasaCal: pct(rows.filter((l) => l.calificado).length, rows.length),
      cpl: gasto / Math.max(1, rows.filter((l) => l.campanaId).length),
      costoVenta: gasto / Math.max(1, rows.filter((l) => l.campanaId && l.estado === 'comprador').length),
      conv: pct(ventas, rows.length),
      campanas: campanas.sort((a, b) => b.leads - a.leads),
    }
  }, [leads, lang])

  const grupos = useMemo(() => caracteristicas(data.rows, t), [data.rows, t])
  const maxCampLeads = Math.max(...data.campanas.map((c) => c.leads))

  const mini = [
    { l: 'entrantes.hoy', v: fmtNum(data.hoy), s: t('entrantes.hoyCal', { n: data.hoyCal }) },
    { l: 'entrantes.promDiario', v: fmtNum(data.promedio), s: t('entrantes.ult30') },
    { l: 'entrantes.tasaCal', v: fmtPct(data.tasaCal), s: t('entrantes.segunReglas') },
    { l: 'entrantes.cpl', v: fmtUSD(data.cpl), s: t('entrantes.soloAnuncios') },
    { l: 'entrantes.costoVenta', v: fmtUSD(data.costoVenta), s: t('entrantes.leadAVenta', { p: fmtPct(data.conv, 1) }) },
  ]

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
        {mini.map((m, i) => (
          <div key={m.l} className={cn('rounded-[10px] border border-line bg-surface2/50 px-3 py-2.5', i === 0 && 'col-span-2 md:col-span-1')}>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">{t(m.l)}</div>
            <div className="mono mt-1 text-[22px] font-bold leading-none">{m.v}</div>
            <div className="mt-1 text-[11.5px] text-fg2">{m.s}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[13px] font-semibold">{t('entrantes.porDia')}</div>
            <Legend items={[{ color: C.velocidad, label: t('entrantes.calificados') }, { color: '#52525b', label: t('entrantes.noCalificados') }]} />
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dias} margin={{ left: -18, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" {...axisProps} interval={4} />
                <YAxis {...axisProps} />
                <Tooltip cursor={{ fill: 'rgba(127,127,127,.08)' }} content={<ChartTip names={{ calificados: t('entrantes.calificados'), noCalificados: t('entrantes.noCalificados') }} />} />
                <Bar dataKey="calificados" stackId="a" fill={C.velocidad} radius={[0, 0, 0, 0]} />
                <Bar dataKey="noCalificados" stackId="a" fill="#52525b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-[13px] font-semibold">{t('entrantes.deDonde')}</div>
            <button onClick={() => navigate('/metricas/campanas')} className="inline-flex h-9 items-center gap-1 text-[12.5px] font-semibold text-accent">
              {t('entrantes.verCampanas')} <ArrowRight size={14} />
            </button>
          </div>
          <div className="scroll-x rounded-[10px] border border-line">
            <table className="w-full min-w-[620px] text-[12.5px]">
              <thead className="bg-surface2/60">
                <tr className="text-left">
                  <th className="label-up px-3 py-2">{t('entrantes.fuente')}</th>
                  <th className="label-up px-2 py-2 text-right">Leads</th>
                  <th className="label-up px-2 py-2">{t('entrantes.calificadosPct')}</th>
                  <th className="label-up px-2 py-2 text-right">{t('rank.citas')}</th>
                  <th className="label-up px-2 py-2 text-right">{t('rank.ventas')}</th>
                  <th className="label-up px-2 py-2 text-right">{t('entrantes.costoVentaCorto')}</th>
                  <th className="label-up px-3 py-2 text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.campanas.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.nombre}</div>
                      <div className="mt-1 w-28">
                        <HBar value={c.leads} max={maxCampLeads} height={4} color="#52525b" />
                      </div>
                    </td>
                    <td className="mono px-2 py-2 text-right font-semibold">{c.leads}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <HBar value={c.tasaCalif} max={100} height={6} color={c.tasaCalif < 40 ? C.bad : C.velocidad} />
                        </div>
                        <span className={cn('mono font-semibold', c.tasaCalif < 40 && 'text-bad')}>{fmtPct(c.tasaCalif)}</span>
                      </div>
                    </td>
                    <td className="mono px-2 py-2 text-right">{c.citas}</td>
                    <td className="mono px-2 py-2 text-right font-semibold text-ok">{c.ventas}</td>
                    <td className="mono px-2 py-2 text-right">{c.gasto ? fmtUSD(c.costoVenta) : '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {c.gasto ? <Badge tone={c.roi >= 6 ? 'ok' : c.roi >= 3 ? 'warn' : 'bad'}>{c.roi.toFixed(1)}x</Badge> : <span className="text-[11.5px] text-muted">{t('entrantes.organico')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[13px] font-semibold">{t('entrantes.caracteristicas')}</div>
        <p className="mb-3 text-[12px] text-fg2">{t('entrantes.caracteristicasSub')}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {grupos.map((g) => {
            const best = Math.max(...g.items.map((i) => i.conv))
            return (
              <div key={g.id} className="rounded-[10px] border border-line p-3">
                <div className="label-up mb-2">{t(`grupo.${g.id}`)}</div>
                <div className="space-y-2">
                  {g.items.map((i) => (
                    <div key={i.key}>
                      <div className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="truncate text-fg2">{i.label}</span>
                        <span className="mono shrink-0">
                          <b>{fmtPct(i.share)}</b>
                          <span className={cn('ml-2', i.conv === best && best > 0 ? 'font-semibold text-ok' : 'text-muted')}>→ {fmtPct(i.conv, 1)}</span>
                        </span>
                      </div>
                      <div className="mt-1">
                        <HBar value={i.share} max={100} height={5} color={i.conv === best && best > 0 ? C.cierre : C.velocidad} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="flex flex-col justify-center rounded-[10px] border border-dashed border-line p-3 text-[12px] text-fg2">
            <span className="mono font-semibold text-fg">% → %</span>
            {t('entrantes.leyenda')}
          </div>
        </div>
      </div>
    </div>
  )
}
