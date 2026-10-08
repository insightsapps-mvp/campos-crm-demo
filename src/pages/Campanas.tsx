import { ChevronDown, Lightbulb, Megaphone, TrendingDown, TrendingUp } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { C, ChartTip, Legend, axisProps } from '@/components/charts'
import { PreviewBanner } from '@/components/layout/Notices'
import { Badge, Card, CardHead, HBar, Kpi, PageHeader, Select } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtNum, fmtPct, fmtUSD } from '@/lib/format'
import { statsCampanas } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { DAY, campanas } from '@/mock/base'
import { useData } from '@/store/data'
import { caracteristicas } from './dashboard/LeadsEntrantes'

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0)

export default function Campanas() {
  const { t, lang } = useT()
  const leads = useData((s) => s.leads)
  const [open, setOpen] = useState<string | null>('c1')
  const [filtroCamp, setFiltroCamp] = useState('')
  const stats = useMemo(() => statsCampanas(leads), [leads])
  const pagas = stats.filter((s) => s.gasto > 0)
  const gasto = pagas.reduce((s, c) => s + c.gasto, 0)
  const leadsAds = pagas.reduce((s, c) => s + c.leads, 0)
  const cal = pagas.reduce((s, c) => s + c.calificados, 0)
  const ventas = pagas.reduce((s, c) => s + c.ventas, 0)
  const ganancia = pagas.reduce((s, c) => s + c.ganancia, 0)

  const rows30 = useMemo(() => leads.filter((l) => l.creadoAt >= Date.now() - 30 * DAY), [leads])
  const anuncios = useMemo(() => {
    const m: Record<string, { anuncio: string; leads: number; cal: number; citas: number; ventas: number }[]> = {}
    for (const c of campanas)
      m[c.id] = c.anuncios.map((a) => {
        const ls = rows30.filter((l) => l.campanaId === c.id && l.anuncio === a)
        return { anuncio: a, leads: ls.length, cal: ls.filter((l) => l.calificado).length, citas: ls.filter((l) => l.citaAt).length, ventas: ls.filter((l) => l.estado === 'comprador').length }
      })
    return m
  }, [rows30])

  const grupos = useMemo(() => caracteristicas(rows30.filter((l) => !filtroCamp || (l.campanaId ?? l.origen) === filtroCamp), (k) => tr(k, lang)), [rows30, filtroCamp, lang])

  const peor = [...pagas].sort((a, b) => a.tasaCalif - b.tasaCalif)[0]
  const mejorRoi = [...pagas].sort((a, b) => b.roi - a.roi)[0]
  const masVentas = [...pagas].sort((a, b) => b.ventas - a.ventas)[0]

  const chart = stats.map((s) => ({ label: s.nombre.replace(/^(FB|Google|Marketplace|Web) · /, ''), calificados: s.calificados, noCalificados: s.noCalificados }))

  return (
    <div>
      <PreviewBanner id="campanas" />
      <PageHeader kicker={t('kicker.equipo')} title={t('camp.titulo')} sub={t('camp.sub')} />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Kpi label={t('camp.gasto')} value={fmtUSD(gasto, true)} icon={<Megaphone size={17} />} sub={t('entrantes.ult30')} />
        <Kpi label={t('camp.leadsAds')} value={fmtNum(leadsAds)} sub={t('camp.cpl', { v: fmtUSD(gasto / (leadsAds || 1)) })} />
        <Kpi label={t('entrantes.calificados')} value={fmtPct(pct(cal, leadsAds))} accent={C.velocidad} sub={t('camp.costoCal', { v: fmtUSD(gasto / (cal || 1)) })} />
        <Kpi label={t('camp.ventasAtrib')} value={String(ventas)} accent={C.cierre} sub={t('camp.costoVentaV', { v: fmtUSD(gasto / (ventas || 1)) })} />
        <Kpi label={t('camp.roi')} value={`${(ganancia / (gasto || 1)).toFixed(1)}x`} accent={C.cierre} sub={t('camp.roiSub')} />
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          { icon: TrendingDown, tone: 'bad', txt: t('camp.insightPeor', { c: peor.nombre, p: fmtPct(peor.tasaCalif) }) },
          { icon: TrendingUp, tone: 'ok', txt: t('camp.insightRoi', { c: mejorRoi.nombre, r: mejorRoi.roi.toFixed(1) }) },
          { icon: Lightbulb, tone: 'accent', txt: t('camp.insightVentas', { c: masVentas.nombre, n: masVentas.ventas, v: fmtUSD(masVentas.costoVenta) }) },
        ].map((i, k) => (
          <div key={k} className={cn('flex gap-3 rounded-[12px] border p-3.5 text-[13px] leading-snug', i.tone === 'bad' ? 'border-bad/30 bg-[rgba(248,113,113,.06)]' : i.tone === 'ok' ? 'border-ok/30 bg-[rgba(52,211,153,.06)]' : 'border-accent/30 bg-[rgba(59,130,246,.06)]')}>
            <i.icon size={18} className={cn('mt-0.5 shrink-0', i.tone === 'bad' ? 'text-bad' : i.tone === 'ok' ? 'text-ok' : 'text-accent')} />
            {i.txt}
          </div>
        ))}
      </div>

      <Card className="mb-5" data-tour="campanas-tabla">
        <CardHead title={t('camp.porCampana')} sub={t('camp.porCampanaSub')} />
        <div className="scroll-x">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead className="bg-surface2/50">
              <tr className="text-left">
                <th className="label-up px-4 py-2">{t('entrantes.fuente')}</th>
                <th className="label-up px-2 py-2 text-right">{t('camp.gasto')}</th>
                <th className="label-up px-2 py-2 text-right">Leads</th>
                <th className="label-up px-2 py-2">{t('entrantes.calificadosPct')}</th>
                <th className="label-up px-2 py-2 text-right">CPL</th>
                <th className="label-up px-2 py-2 text-right">{t('camp.costoCalCorto')}</th>
                <th className="label-up px-2 py-2 text-right">{t('rank.citas')}</th>
                <th className="label-up px-2 py-2 text-right">{t('rank.ventas')}</th>
                <th className="label-up px-2 py-2 text-right">{t('entrantes.costoVentaCorto')}</th>
                <th className="label-up px-2 py-2 text-right">{t('rank.ingresos')}</th>
                <th className="label-up px-4 py-2 text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <Fragment key={s.id}>
                  <tr className={cn('border-t border-line', anuncios[s.id] && 'cursor-pointer hover:bg-surface2/50')} onClick={() => anuncios[s.id] && setOpen(open === s.id ? null : s.id)}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 font-semibold">
                        {anuncios[s.id] && <ChevronDown size={14} className={cn('text-fg2 transition', open === s.id && 'rotate-180')} />}
                        {s.nombre}
                      </div>
                      <div className="text-[11.5px] text-fg2">{t(`origen.${s.origen}`)} · score {Math.round(s.scoreMedio)}</div>
                    </td>
                    <td className="mono px-2 py-2.5 text-right">{s.gasto ? fmtUSD(s.gasto, true) : '—'}</td>
                    <td className="mono px-2 py-2.5 text-right font-semibold">{s.leads}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16"><HBar value={s.tasaCalif} max={100} height={6} color={s.tasaCalif < 40 ? C.bad : C.velocidad} /></div>
                        <span className={cn('mono font-semibold', s.tasaCalif < 40 && 'text-bad')}>{fmtPct(s.tasaCalif)}</span>
                      </div>
                    </td>
                    <td className="mono px-2 py-2.5 text-right">{s.gasto ? fmtUSD(s.cpl) : '—'}</td>
                    <td className="mono px-2 py-2.5 text-right">{s.gasto ? fmtUSD(s.costoCalificado) : '—'}</td>
                    <td className="mono px-2 py-2.5 text-right">{s.citas}</td>
                    <td className="mono px-2 py-2.5 text-right font-semibold text-ok">{s.ventas}</td>
                    <td className="mono px-2 py-2.5 text-right">{s.gasto && s.ventas ? fmtUSD(s.costoVenta) : '—'}</td>
                    <td className="mono px-2 py-2.5 text-right">{fmtUSD(s.ingresos, true)}</td>
                    <td className="px-4 py-2.5 text-right">{s.gasto ? <Badge tone={s.roi >= 6 ? 'ok' : s.roi >= 3 ? 'warn' : 'bad'}>{s.roi.toFixed(1)}x</Badge> : <span className="text-[11.5px] text-muted">{t('entrantes.organico')}</span>}</td>
                  </tr>
                  {open === s.id &&
                    anuncios[s.id]?.map((a) => (
                      <tr key={a.anuncio} className="bg-surface2/40 text-[12.5px]">
                        <td className="py-2 pl-10 pr-4 text-fg2">↳ {a.anuncio}</td>
                        <td />
                        <td className="mono px-2 py-2 text-right">{a.leads}</td>
                        <td className="mono px-2 py-2">{fmtPct(pct(a.cal, a.leads))}</td>
                        <td colSpan={2} />
                        <td className="mono px-2 py-2 text-right">{a.citas}</td>
                        <td className="mono px-2 py-2 text-right text-ok">{a.ventas}</td>
                        <td colSpan={3} />
                      </tr>
                    ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHead title={t('camp.calidadVolumen')} right={<Legend items={[{ color: C.velocidad, label: t('entrantes.calificados') }, { color: '#52525b', label: t('entrantes.noCalificados') }]} />} />
          <div className="h-[340px] p-3 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout="vertical" margin={{ left: 8, right: 8, top: 4 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis type="category" dataKey="label" {...axisProps} width={120} tick={{ fontSize: 10.5, fill: 'var(--muted)' }} />
                <Tooltip cursor={{ fill: 'rgba(127,127,127,.08)' }} content={<ChartTip names={{ calificados: tr('entrantes.calificados', lang), noCalificados: tr('entrantes.noCalificados', lang) }} />} />
                <Bar dataKey="calificados" stackId="a" fill={C.velocidad} />
                <Bar dataKey="noCalificados" stackId="a" fill="#52525b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHead
            title={t('entrantes.caracteristicas')}
            sub={t('entrantes.caracteristicasSub')}
            right={
              <Select ariaLabel={t('camp.filtrar')} value={filtroCamp} onChange={setFiltroCamp} className="w-full sm:w-56">
                <option value="">{t('camp.todasCampanas')}</option>
                {stats.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </Select>
            }
          />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {grupos.slice(0, 6).map((g) => {
              const best = Math.max(...g.items.map((i) => i.conv))
              return (
                <div key={g.id} className="rounded-[10px] border border-line p-3">
                  <div className="label-up mb-2">{t(`grupo.${g.id}`)}</div>
                  <div className="space-y-2">
                    {g.items.map((i) => (
                      <div key={i.key}>
                        <div className="flex items-center justify-between gap-2 text-[12px]">
                          <span className="truncate text-fg2">{i.label}</span>
                          <span className="mono shrink-0"><b>{fmtPct(i.share)}</b><span className={cn('ml-2', i.conv === best && best > 0 ? 'font-semibold text-ok' : 'text-muted')}>→ {fmtPct(i.conv, 1)}</span></span>
                        </div>
                        <div className="mt-1"><HBar value={i.share} max={100} height={5} color={i.conv === best && best > 0 ? C.cierre : C.velocidad} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
