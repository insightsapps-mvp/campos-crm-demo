import { Calculator, CalendarDays, Sparkles, Timer, Trophy } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { C, ChartTip, Funnel, Legend, axisProps } from '@/components/charts'
import { PreviewBanner } from '@/components/layout/Notices'
import { RegistrarLlamadaBtn } from '@/components/lead/LeadActions'
import { Avatar, Badge, Card, CardHead, Empty, HBar, Kpi, LiveTimer, PageHeader } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtFechaHora, fmtHora, fmtMin, fmtPct, fmtRel, fmtUSD, isSameDay } from '@/lib/format'
import { distribucionVelocidad, evolucionSemanal, filtrarAsignados, ranking, type Filtros, type FilaRanking, type Stats } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { DAY, vendedorById } from '@/mock/base'
import type { Lead, Origen } from '@/mock/types'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'
import { FiltrosBar } from './Dashboard'

function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex gap-3 rounded-[12px] border border-line bg-surface p-4">
      <Calculator size={18} className="mt-0.5 shrink-0 text-accent" />
      <div className="text-[13px] leading-relaxed text-fg2">{children}</div>
    </div>
  )
}

function useMetric(fixed?: string) {
  const leads = useData((s) => s.leads)
  const [f, setF] = useState<Filtros>({ rango: '30d' })
  const ff = fixed ? { ...f, vendedorId: null } : f
  const { filas, equipo } = useMemo(() => ranking(leads, ff), [leads, ff.rango, ff.desde, ff.hasta, ff.bdc, ff.origen, ff.vendedorId]) // eslint-disable-line react-hooks/exhaustive-deps
  const cohorte = useMemo(() => filtrarAsignados(leads, fixed ? { ...ff, vendedorId: fixed } : ff), [leads, ff.rango, ff.desde, ff.hasta, ff.bdc, ff.origen, ff.vendedorId, fixed]) // eslint-disable-line react-hooks/exhaustive-deps
  const semanas = useMemo(() => evolucionSemanal(leads, fixed ?? f.vendedorId), [leads, fixed, f.vendedorId])
  const me = fixed ? filas.find((x) => x.vendedorId === fixed) : undefined
  return { leads, f, setF, filas, equipo, cohorte, semanas, me }
}

/** Barras horizontales por closer (o "vos vs equipo") con marcador del promedio */
function BarrasCloser({ filas, equipo, get, fmt, lower, color, fixed }: { filas: FilaRanking[]; equipo: Stats; get: (s: Stats) => number; fmt: (n: number) => string; lower?: boolean; color: string; fixed?: string }) {
  const { t } = useT()
  const navigate = useNavigate()
  const avg = get(equipo)
  const list = fixed ? filas.filter((x) => x.vendedorId === fixed) : [...filas].sort((a, b) => (lower ? get(a) - get(b) : get(b) - get(a)))
  const max = Math.max(avg, ...list.map(get)) * 1.08 || 1
  return (
    <div className="space-y-3 p-4 sm:p-5">
      {list.map((r) => {
        const v = vendedorById(r.vendedorId)!
        const val = get(r)
        const bad = lower ? val > avg * 1.05 : val < avg * 0.95
        return (
          <button key={r.vendedorId} disabled={!!fixed} onClick={() => navigate(`/vendedores/${r.vendedorId}`)} className="block w-full text-left">
            <div className="mb-1 flex items-center justify-between gap-2 text-[12.5px]">
              <span className="flex min-w-0 items-center gap-2">
                <Avatar initials={v.avatar} color={v.color} size={22} />
                <span className="truncate font-medium">{fixed ? t('metricas.vos') : v.nombre}</span>
              </span>
              <span className={cn('mono font-semibold', bad ? 'text-bad' : 'text-fg')}>{fmt(val)}</span>
            </div>
            <HBar value={val} max={max} marker={avg} color={bad ? C.bad : color} height={9} />
          </button>
        )
      })}
      {fixed && (
        <div>
          <div className="mb-1 flex items-center justify-between text-[12.5px]">
            <span className="font-medium text-fg2">{t('rank.promedioEquipo')}</span>
            <span className="mono font-semibold text-fg2">{fmt(avg)}</span>
          </div>
          <HBar value={avg} max={max} color="#71717a" height={9} />
        </div>
      )}
      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted">
        <span className="inline-block h-3 w-0.5 bg-fg/60" /> {t('metricas.marcador', { v: fmt(avg) })}
      </div>
    </div>
  )
}

/* ─────────── Velocidad ─────────── */
export function MetricaVelocidad({ fixed }: { fixed?: string }) {
  const { t, lang } = useT()
  const { f, setF, filas, equipo, cohorte, me, leads } = useMetric(fixed)
  const openLead = useUI((s) => s.openLead)
  const dist = useMemo(() => distribucionVelocidad(cohorte), [cohorte])
  const sinContacto = useMemo(
    () => leads.filter((l) => l.estado === 'asignado' && l.asignadoAt && (!fixed || l.vendedorId === fixed) && (!f.vendedorId || l.vendedorId === f.vendedorId)).sort((a, b) => a.asignadoAt! - b.asignadoAt!),
    [leads, fixed, f.vendedorId],
  )
  const s = me ?? equipo
  return (
    <div>
      {!fixed && <PreviewBanner id="velocidad" />}
      {!fixed && <PageHeader kicker={t('kicker.equipo')} title={t('nav.velocidad')} sub={t('metricas.velSub')} />}
      <Formula>{t('metricas.velFormula')}</Formula>
      {!fixed && <Card className="mb-5 p-3 sm:p-4"><FiltrosBar f={f} setF={setF} /></Card>}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t('metricas.mediana')} value={fmtMin(s.velMediana)} icon={<Timer size={17} />} sub={fixed ? `${t('common.equipo')} ${fmtMin(equipo.velMediana)}` : undefined} />
        <Kpi label={t('metricas.promedio')} value={fmtMin(s.velPromedio)} sub={t('metricas.promedioSub')} />
        <Kpi label={t('metricas.menos5')} value={fmtPct(dist[0].value)} accent={C.cierre} />
        <Kpi label={t('metricas.sinContactarAhora')} value={String(sinContacto.length)} accent={C.bad} sub={sinContacto[0] ? t('metricas.masViejo', { v: fmtMin((Date.now() - sinContacto[0].asignadoAt!) / 60000) }) : undefined} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title={t('metricas.porCloser')} sub={t('metricas.medianaMin')} />
          <BarrasCloser filas={filas} equipo={equipo} get={(x) => x.velMediana} fmt={fmtMin} lower color={C.velocidad} fixed={fixed} />
        </Card>
        <Card>
          <CardHead title={t('metricas.distribucion')} sub={t('metricas.distribucionSub')} />
          <div className="h-[45vh] max-h-[320px] min-h-[220px] p-3 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist.map((d) => ({ ...d, label: t(`metricas.bucket.${d.id}`) }))} margin={{ left: -18, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} unit="%" />
                <Tooltip cursor={{ fill: 'rgba(127,127,127,.08)' }} content={<ChartTip names={{ value: tr('metricas.leads', lang) }} fmt={(v) => fmtPct(v, 1)} />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={C.velocidad} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="mt-5" data-trailer="sin-contacto">
        <CardHead title={t('metricas.sinContactoTitulo')} sub={t('metricas.sinContactoSub')} right={<Badge tone="bad">{sinContacto.length}</Badge>} />
        {sinContacto.length === 0 ? (
          <Empty title={t('panel.todoContactado')} />
        ) : (
          <div className="divide-y divide-line">
            {sinContacto.map((l) => {
              const v = vendedorById(l.vendedorId)
              return (
                <div key={l.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                  <button onClick={() => openLead(l.id)} className="min-w-0 flex-1 text-left">
                    <div className="truncate font-semibold">
                      {l.nombre} <span className="font-normal text-fg2">— {t('metricas.sinContactoLinea', { t: fmtMin((Date.now() - l.asignadoAt!) / 60000) })}</span>
                    </div>
                    <div className="truncate text-[12px] text-fg2">
                      {t('metricas.asignadoA', { v: v?.nombre ?? '—' })} · {l.vehiculoInteres} · {fmtRel(l.asignadoAt!, lang)}
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <LiveTimer since={l.asignadoAt!} />
                    <RegistrarLlamadaBtn lead={l} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

/* ─────────── Agendamiento ─────────── */
export function MetricaAgendamiento({ fixed }: { fixed?: string }) {
  const { t, lang } = useT()
  const { f, setF, filas, equipo, cohorte, semanas, me, leads } = useMetric(fixed)
  const openLead = useUI((s) => s.openLead)
  const s = me ?? equipo
  const porBdc = useMemo(
    () => (['BDC Norte', 'BDC Sur'] as const).map((b) => {
      const c = cohorte.filter((l) => l.bdc === b && l.primerContactoAt)
      return { label: b, value: c.length ? (c.filter((l) => l.citaAt).length / c.length) * 100 : 0 }
    }),
    [cohorte],
  )
  const porOrigen = useMemo(
    () => (['facebook', 'google', 'web', 'marketplace', 'walkin', 'referido'] as Origen[]).map((o) => {
      const c = cohorte.filter((l) => l.origen === o && l.primerContactoAt)
      return { label: tr(`origen.${o}`, lang), value: c.length ? Math.round((c.filter((l) => l.citaAt).length / c.length) * 1000) / 10 : 0 }
    }),
    [cohorte, lang],
  )
  const realizadas = useMemo(
    () => filas.filter((r) => !fixed || r.vendedorId === fixed).map((r) => ({ label: vendedorById(r.vendedorId)!.nombre.split(' ')[0], realizadas: r.citasRealizadas, noShow: r.noShows })),
    [filas, fixed],
  )
  const semana = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const d = hoy.getTime() + i * DAY
      return { d, citas: leads.filter((l) => l.citaAt && isSameDay(l.citaAt, d) && (!fixed || l.vendedorId === fixed) && (!f.vendedorId || l.vendedorId === f.vendedorId)).sort((a, b) => a.citaAt! - b.citaAt!) }
    })
  }, [leads, fixed, f.vendedorId])
  return (
    <div>
      {!fixed && <PreviewBanner id="agendamiento" />}
      {!fixed && <PageHeader kicker={t('kicker.equipo')} title={t('nav.agendamiento')} sub={t('metricas.agSub')} />}
      <Formula>{t('metricas.agFormula')}</Formula>
      {!fixed && <Card className="mb-5 p-3 sm:p-4"><FiltrosBar f={f} setF={setF} /></Card>}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t('kpi.agendamiento')} value={fmtPct(s.tasaAgenda)} accent={C.agenda} icon={<CalendarDays size={17} />} sub={fixed ? `${t('common.equipo')} ${fmtPct(equipo.tasaAgenda)}` : undefined} />
        <Kpi label={t('metricas.citas')} value={String(s.agendados)} sub={t('metricas.deContactados', { n: s.contactados })} />
        <Kpi label={t('metricas.realizadas')} value={String(s.citasRealizadas)} accent={C.cierre} />
        <Kpi label={t('metricas.noShow')} value={fmtPct(s.agendados ? (s.noShows / s.agendados) * 100 : 0)} accent={C.bad} sub={t('metricas.nNoShow', { n: s.noShows })} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title={t('metricas.porCloser')} sub={t('metricas.tasaAgenda')} />
          <BarrasCloser filas={filas} equipo={equipo} get={(x) => x.tasaAgenda} fmt={(n) => fmtPct(n)} color={C.agenda} fixed={fixed} />
        </Card>
        <Card>
          <CardHead title={t('metricas.realizadasVsNoShow')} right={<Legend items={[{ color: C.cierre, label: t('metricas.realizadas') }, { color: C.bad, label: 'No-show' }]} />} />
          <div className="h-[300px] p-3 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realizadas} margin={{ left: -18, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" {...axisProps} interval={0} tick={{ fontSize: 10.5, fill: 'var(--muted)' }} />
                <YAxis {...axisProps} />
                <Tooltip cursor={{ fill: 'rgba(127,127,127,.08)' }} content={<ChartTip names={{ realizadas: tr('metricas.realizadas', lang), noShow: 'No-show' }} />} />
                <Bar dataKey="realizadas" stackId="a" fill={C.cierre} />
                <Bar dataKey="noShow" stackId="a" fill={C.bad} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        {!fixed && (
          <Card>
            <CardHead title={t('metricas.porBdcOrigen')} />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <div className="space-y-3">
                {porBdc.map((b) => (
                  <div key={b.label}>
                    <div className="mb-1 flex justify-between text-[12.5px]"><span>{b.label}</span><span className="mono font-semibold">{fmtPct(b.value)}</span></div>
                    <HBar value={b.value} max={100} color={C.agenda} />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {porOrigen.map((b) => (
                  <div key={b.label}>
                    <div className="mb-1 flex justify-between text-[12.5px]"><span>{b.label}</span><span className="mono font-semibold">{fmtPct(b.value)}</span></div>
                    <HBar value={b.value} max={100} color={C.agenda} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
        <Card>
          <CardHead title={t('metricas.evolucionAg')} />
          <div className="h-[260px] p-3 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={semanas} margin={{ left: -14, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} unit="%" />
                <Tooltip content={<ChartTip names={{ agendamiento: tr('metric.agenda', lang) }} fmt={(v) => fmtPct(v, 1)} />} />
                <Line type="monotone" dataKey="agendamiento" stroke={C.agenda} strokeWidth={2.4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="mt-5">
        <CardHead icon={<CalendarDays size={16} />} title={t('metricas.calendario')} sub={t('metricas.calendarioSub')} />
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-7">
          {semana.map(({ d, citas }, i) => (
            <div key={d} className="min-h-[120px] bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold capitalize">{i === 0 ? t('common.hoy') : new Date(d).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', day: 'numeric' })}</span>
                <span className="mono text-[11px] text-fg2">{citas.length}</span>
              </div>
              <div className="space-y-1">
                {citas.slice(0, 6).map((l) => (
                  <button key={l.id} onClick={() => openLead(l.id)} className="flex w-full items-center gap-1.5 truncate rounded-md bg-[rgba(167,139,250,.12)] px-2 py-1.5 text-left text-[11.5px]">
                    <span className="mono shrink-0 font-semibold text-violet">{fmtHora(l.citaAt!, lang)}</span>
                    <span className="truncate">{l.nombre.split(' ')[0]}</span>
                  </button>
                ))}
                {citas.length > 6 && <div className="text-[11px] text-muted">+{citas.length - 6}</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ─────────── Cierre ─────────── */
export function MetricaCierre({ fixed }: { fixed?: string }) {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const { f, setF, filas, equipo, me, leads } = useMetric(fixed)
  const openLead = useUI((s) => s.openLead)
  const s = me ?? equipo
  const ventas = useMemo(
    () => leads.filter((l: Lead) => l.estado === 'comprador' && l.cerradoAt && (!fixed || l.vendedorId === fixed) && (!f.vendedorId || l.vendedorId === f.vendedorId)).sort((a, b) => b.cerradoAt! - a.cerradoAt!).slice(0, 10),
    [leads, fixed, f.vendedorId],
  )
  return (
    <div>
      {!fixed && <PreviewBanner id="cierre" />}
      {!fixed && <PageHeader kicker={t('kicker.equipo')} title={t('nav.cierre')} sub={t('metricas.ciSub')} />}
      <Formula>{t('metricas.ciFormula')}</Formula>
      {!fixed && <Card className="mb-5 p-3 sm:p-4"><FiltrosBar f={f} setF={setF} /></Card>}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t('kpi.cierre')} value={fmtPct(s.tasaCierreCitas)} accent={C.cierre} icon={<Trophy size={17} />} sub={fixed ? `${t('common.equipo')} ${fmtPct(equipo.tasaCierreCitas)}` : undefined} />
        <Kpi label={t('metricas.cierreAsign')} value={fmtPct(s.tasaCierreAsignados, 1)} accent={C.cierre} />
        <Kpi label={t('kpi.ventas')} value={String(s.ventas)} sub={fmtUSD(s.ingresos, true)} />
        <Kpi label={t('kpi.cashMes')} value={fmtUSD(s.cashMes, true)} accent={C.cierre} sub={t('kpi.cashSemana', { v: fmtUSD(s.cashSemana, true) })} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card data-trailer="embudo">
          <CardHead title={t(fixed ? 'metricas.miEmbudo' : 'metricas.embudoEquipo')} sub={t('metricas.embudoSub')} />
          <div className="p-4 sm:p-6">
            <Funnel
              stages={[
                { key: 'a', label: t('embudo.asignado'), value: s.asignados },
                { key: 'c', label: t('embudo.contactado'), value: s.contactados },
                { key: 'g', label: t('embudo.agendado'), value: s.agendados },
                { key: 'r', label: t('embudo.citaRealizada'), value: s.citasRealizadas },
                { key: 'v', label: t('embudo.cerrado'), value: s.ventas },
              ]}
              compare={fixed ? [1, equipo.contactados / (equipo.asignados || 1), equipo.agendados / (equipo.contactados || 1), equipo.citasRealizadas / (equipo.agendados || 1), equipo.ventas / (equipo.citasRealizadas || 1)] : undefined}
            />
          </div>
        </Card>
        <Card>
          <CardHead title={t('metricas.porCloser')} sub={t('metricas.cierreSobreCitas')} />
          <BarrasCloser filas={filas} equipo={equipo} get={(x) => x.tasaCierreCitas} fmt={(n) => fmtPct(n)} color={C.cierre} fixed={fixed} />
        </Card>
      </div>
      {!fixed && (
        <Card className="mt-5">
          <CardHead title={t('metricas.tablaCierre')} />
          <div className="scroll-x">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="bg-surface2/50">
                <tr className="text-left">
                  <th className="label-up px-4 py-2">{t('rank.closer')}</th>
                  <th className="label-up px-3 py-2 text-right">{t('metricas.cierreAsign')}</th>
                  <th className="label-up px-3 py-2 text-right">{t('metricas.cierreSobreCitas')}</th>
                  <th className="label-up px-3 py-2 text-right">{t('kpi.ventas')}</th>
                  <th className="label-up px-3 py-2 text-right">{t('rank.ingresos')}</th>
                  <th className="label-up px-4 py-2 text-right">vs {t('common.equipo')}</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((r) => {
                  const v = vendedorById(r.vendedorId)!
                  const diff = r.tasaCierreCitas - equipo.tasaCierreCitas
                  return (
                    <tr key={r.vendedorId} className="border-t border-line">
                      <td className="px-4 py-2.5"><span className="flex items-center gap-2 font-medium"><Avatar initials={v.avatar} color={v.color} size={24} /> {v.nombre}</span></td>
                      <td className="mono px-3 py-2.5 text-right">{fmtPct(r.tasaCierreAsignados, 1)}</td>
                      <td className="mono px-3 py-2.5 text-right font-semibold">{fmtPct(r.tasaCierreCitas)}</td>
                      <td className="mono px-3 py-2.5 text-right">{r.ventas}</td>
                      <td className="mono px-3 py-2.5 text-right">{fmtUSD(r.ingresos, true)}</td>
                      <td className="px-4 py-2.5 text-right"><Badge tone={diff >= 0 ? 'ok' : 'bad'}>{diff >= 0 ? '+' : ''}{diff.toFixed(1)} pp</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Card className="mt-5">
        <CardHead icon={<Sparkles size={16} />} title={t('metricas.ultimasVentas')} sub={t('metricas.ultimasVentasSub')} />
        <div className="divide-y divide-line">
          {ventas.map((l) => {
            const v = vendedorById(l.vendedorId)
            return (
              <div key={l.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                <button onClick={() => openLead(l.id)} className="min-w-0 flex-1 text-left">
                  <div className="truncate font-semibold">{l.nombre} <span className="font-normal text-fg2">· {l.vehiculoInteres}</span></div>
                  <div className="truncate text-[12px] text-fg2">{v?.nombre} · {fmtFechaHora(l.cerradoAt!, lang)} · {fmtRel(l.cerradoAt!, lang)}</div>
                </button>
                <div className="flex items-center gap-2">
                  <span className="mono text-[13px] font-semibold">{fmtUSD(l.venta!.precio)}</span>
                  <button onClick={() => navigate('/automatizaciones')} className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[rgba(52,211,153,.13)] px-3 text-[11.5px] font-semibold text-ok">
                    {t('estado.comprador')} → {t('metricas.verAutomatizacion')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
