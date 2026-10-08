import { AlertTriangle, BellRing, CalendarClock, CalendarDays, DollarSign, Download, Gauge, Handshake, Inbox, MessageSquareWarning, Percent, Timer, TrendingUp, Trophy, Users2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { C, ChartTip, Funnel, Legend, axisProps } from '@/components/charts'
import { PreviewBanner } from '@/components/layout/Notices'
import { Avatar, Button, Card, CardHead, Kpi, PageHeader, Segmented, Select } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtMin, fmtNum, fmtPct, fmtUSD, isSameDay } from '@/lib/format'
import { calcStats, evolucionSemanal, filtrarAsignados, rangoFechas, ranking, type Filtros, type RangoId } from '@/lib/metrics'
import { descargarCSV, cn } from '@/lib/utils'
import { DAY, vendedorById, vendedores } from '@/mock/base'
import type { Bdc, Origen } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'
import { AgendaEquipo, estadoCita } from './dashboard/AgendaEquipo'
import { LeadsEntrantes } from './dashboard/LeadsEntrantes'
import { BrechaChip, Ranking } from './dashboard/Ranking'

const ORIGENES: Origen[] = ['facebook', 'google', 'walkin', 'referido', 'web', 'marketplace']

export function FiltrosBar({ f, setF, showVendedor = true }: { f: Filtros; setF: (f: Filtros) => void; showVendedor?: boolean }) {
  const { t } = useT()
  const hoy = new Date().toISOString().slice(0, 10)
  return (
    <div className="flex flex-col gap-2.5">
      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        <Segmented
          size="sm"
          value={f.rango}
          onChange={(rango: RangoId) => setF({ ...f, rango, desde: rango === 'custom' ? Date.now() - 14 * DAY : undefined, hasta: rango === 'custom' ? Date.now() : undefined })}
          options={(['hoy', '7d', '30d', 'mes', 'custom'] as RangoId[]).map((r) => ({ value: r, label: t(`rango.${r}`) }))}
        />
      </div>
      {f.rango === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <input type="date" max={hoy} className="input h-10 w-auto" value={new Date(f.desde ?? Date.now()).toISOString().slice(0, 10)} onChange={(e) => setF({ ...f, desde: new Date(e.target.value + 'T00:00').getTime() })} />
          <span className="text-fg2">→</span>
          <input type="date" max={hoy} className="input h-10 w-auto" value={new Date(f.hasta ?? Date.now()).toISOString().slice(0, 10)} onChange={(e) => setF({ ...f, hasta: new Date(e.target.value + 'T23:59').getTime() })} />
        </div>
      )}
      <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-3', !showVendedor && 'sm:grid-cols-2')}>
        {showVendedor && (
          <Select ariaLabel={t('filtro.vendedor')} value={f.vendedorId ?? ''} onChange={(v) => setF({ ...f, vendedorId: v || null })}>
            <option value="">{t('filtro.todosVendedores')}</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
              </option>
            ))}
          </Select>
        )}
        <Select ariaLabel="BDC" value={f.bdc ?? ''} onChange={(v) => setF({ ...f, bdc: (v || null) as Bdc | null })}>
          <option value="">{t('filtro.todosBdc')}</option>
          <option value="BDC Norte">BDC Norte</option>
          <option value="BDC Sur">BDC Sur</option>
        </Select>
        <Select ariaLabel={t('filtro.origen')} value={f.origen ?? ''} onChange={(v) => setF({ ...f, origen: (v || null) as Origen | null })}>
          <option value="">{t('filtro.todosOrigenes')}</option>
          {ORIGENES.map((o) => (
            <option key={o} value={o}>
              {t(`origen.${o}`)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}

/** Período anterior de igual largo, para deltas */
export function prevFiltros(f: Filtros): Filtros {
  const [d, h] = rangoFechas(f)
  const len = h - d
  return { ...f, rango: 'custom', desde: d - len, hasta: d }
}

const SECCIONES = ['alertas', 'ranking', 'agenda', 'entrantes', 'capacitacion', 'evolucion'] as const

export default function Dashboard() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const leads = useData((s) => s.leads)
  const [f, setF] = useState<Filtros>({ rango: '30d' })

  const { filas, equipo } = useMemo(() => ranking(leads, f), [leads, f])
  const prev = useMemo(() => calcStats(filtrarAsignados(leads, prevFiltros(f))), [leads, f])
  const semanas = useMemo(() => evolucionSemanal(leads, f.vendedorId), [leads, f.vendedorId])

  const alertas = useMemo(() => {
    const now = Date.now()
    const sinContacto = leads.filter((l) => l.estado === 'asignado' && l.asignadoAt && now - l.asignadoAt > 30 * 60_000)
    const sinResp = leads.filter((l) => l.msgsSinResponder > 0 && l.vendedorId && ['contactado', 'agendado', 'negociacion'].includes(l.estado) && (l.primerContactoAt ?? 0) > now - 10 * DAY)
    const citasHoy = leads.filter((l) => l.citaAt && isSameDay(l.citaAt, now))
    const porConfirmar = citasHoy.filter((l) => l.citaAt! > now && estadoCita(l) === 'pendiente')
    const vencidos = leads.flatMap((l) => l.seguimientos.filter((s) => !s.hecho && s.at < now).map(() => l))
    const negociacion = leads.filter((l) => l.estado === 'negociacion')
    const peor = sinContacto.reduce<Record<string, number>>((acc, l) => ((acc[l.vendedorId!] = (acc[l.vendedorId!] ?? 0) + 1), acc), {})
    const peorId = Object.entries(peor).sort((a, b) => b[1] - a[1])[0]?.[0]
    return { sinContacto, sinResp, citasHoy, porConfirmar, vencidos, negociacion, peorId }
  }, [leads])

  const deltaVel = prev.velMediana ? ((equipo.velMediana - prev.velMediana) / prev.velMediana) * 100 : 0
  const deltaAg = equipo.tasaAgenda - prev.tasaAgenda
  const deltaCi = equipo.tasaCierreCitas - prev.tasaCierreCitas
  const deltaAsig = prev.asignados ? ((equipo.asignados - prev.asignados) / prev.asignados) * 100 : 0
  const sgn = (n: number, suf = '%') => `${n > 0 ? '+' : ''}${n.toFixed(Math.abs(n) < 10 ? 1 : 0)}${suf}`

  const exportar = () => {
    const L = useApp.getState().lang
    const head = ['#', tr('rank.closer', L), 'BDC', tr('rank.leads', L), tr('rank.velocidad', L) + ' (min)', tr('rank.respuesta', L) + ' %', tr('rank.sinRespCorto', L), tr('rank.agenda', L) + ' %', tr('rank.citas', L), tr('rank.cierre', L) + ' %', tr('rank.ventas', L), tr('rank.cashSemana', L), tr('rank.cashMes', L), tr('rank.ingresos', L), tr('rank.ganancia', L), tr('rank.margen', L) + ' %']
    const rows = filas.map((r) => {
      const v = vendedorById(r.vendedorId)!
      return [r.posicion, v.nombre, v.bdc, r.asignados, r.velMediana.toFixed(1), r.tasaRespuesta.toFixed(1), r.msgsSinResponder, r.tasaAgenda.toFixed(1), r.agendados, r.tasaCierreCitas.toFixed(1), r.ventas, r.cashSemana, r.cashMes, r.ingresos, r.ganancia, r.margen.toFixed(1)]
    })
    descargarCSV(`campos-crm-ranking-${f.rango}.csv`, [head, ...rows])
    toast.success(tr('toast.csvOk', L))
  }

  const goto = (id: string) => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const alertCards = [
    { k: 'sinContacto', n: alertas.sinContacto.length, icon: Timer, tone: 'bad', sub: alertas.peorId ? t('alerta.peor', { n: vendedorById(alertas.peorId)!.nombre.split(' ')[0] }) : '', go: () => navigate('/metricas/velocidad') },
    { k: 'sinResp', n: alertas.sinResp.length, icon: MessageSquareWarning, tone: 'warn', sub: t('alerta.sinRespSub'), go: () => navigate('/whatsapp') },
    { k: 'porConfirmar', n: alertas.porConfirmar.length, icon: CalendarClock, tone: 'warn', sub: t('alerta.porConfirmarSub', { n: alertas.citasHoy.length }), go: () => goto('agenda') },
    { k: 'vencidos', n: alertas.vencidos.length, icon: BellRing, tone: 'bad', sub: t('alerta.vencidosSub'), go: () => navigate('/agenda') },
    { k: 'negociacion', n: alertas.negociacion.length, icon: Handshake, tone: 'accent', sub: t('alerta.negociacionSub'), go: () => navigate('/leads?estado=negociacion') },
  ] as const

  const capacitacionTeam = [1, equipo.contactados / (equipo.asignados || 1), equipo.agendados / (equipo.contactados || 1), equipo.ventas / (equipo.agendados || 1)]

  return (
    <div>
      <PreviewBanner id="dashboard" />
      <PageHeader
        kicker={t('kicker.equipo')}
        title={t('dash.titulo')}
        sub={t('dash.sub')}
        right={
          <Button onClick={exportar} variant="secondary" className="w-full sm:w-auto">
            <Download size={16} /> {t('common.exportarCsv')}
          </Button>
        }
      />
      <Card className="mb-5 p-3 sm:p-4" data-tour="dash-filtros">
        <FiltrosBar f={f} setF={setF} />
      </Card>

      {/* navegación de secciones */}
      <div className="no-print sticky top-14 z-30 -mx-4 mb-5 border-b border-line bg-[var(--glass)] px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-16 lg:mx-0 lg:rounded-xl lg:border lg:px-2">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {SECCIONES.map((s) => (
            <button key={s} onClick={() => goto(s)} className="h-9 shrink-0 rounded-lg px-3 text-[12.5px] font-semibold text-fg2 hover:bg-surface2 hover:text-fg">
              {t(`dash.sec.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Alertas: que no se escape nada */}
      <section id="sec-alertas" className="mb-5 scroll-mt-32">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle size={15} className="text-warn" />
          <h2 className="text-[14px] font-semibold">{t('alerta.titulo')}</h2>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5" data-tour="dash-alertas">
          {alertCards.map((a) => (
            <button
              key={a.k}
              onClick={a.go}
              className={cn(
                'card flex min-h-[76px] items-center gap-3 p-3 text-left transition hover:border-accent/40',
                a.n > 0 && a.tone === 'bad' && 'border-bad/30',
              )}
            >
              <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-[10px]', a.tone === 'bad' ? 'bg-[rgba(248,113,113,.13)] text-bad' : a.tone === 'warn' ? 'bg-[rgba(245,158,11,.14)] text-warn' : 'bg-[rgba(59,130,246,.12)] text-accent')}>
                <a.icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="mono block text-[22px] font-bold leading-none">{a.n}</span>
                <span className="mt-1 block text-[12px] font-medium leading-tight">{t(`alerta.${a.k}`)}</span>
                {a.sub && <span className="block truncate text-[11px] text-muted">{a.sub}</span>}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" data-tour="dash-kpis" data-trailer="kpis">
        <Kpi label={t('kpi.asignados')} value={fmtNum(equipo.asignados)} delta={sgn(deltaAsig)} deltaGood={deltaAsig >= 0} sub={t('kpi.vsAnterior')} icon={<Inbox size={17} />} />
        <Kpi label={t('kpi.velocidad')} value={fmtMin(equipo.velMediana)} delta={sgn(deltaVel)} deltaGood={deltaVel <= 0} sub={t('kpi.vsAnterior')} icon={<Timer size={17} />} spark={semanas.map((s) => s.velocidad)} />
        <Kpi label={t('kpi.agendamiento')} value={fmtPct(equipo.tasaAgenda)} delta={sgn(deltaAg, ' pp')} deltaGood={deltaAg >= 0} sub={t('kpi.citasContactados')} icon={<CalendarDays size={17} />} accent={C.agenda} spark={semanas.map((s) => s.agendamiento)} />
        <Kpi label={t('kpi.cierre')} value={fmtPct(equipo.tasaCierreCitas)} delta={sgn(deltaCi, ' pp')} deltaGood={deltaCi >= 0} sub={t('kpi.sobreAsignados', { p: fmtPct(equipo.tasaCierreAsignados, 1) })} icon={<Trophy size={17} />} accent={C.cierre} spark={semanas.map((s) => s.cierre)} />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { l: 'kpi.ventas', v: fmtNum(equipo.ventas), s: t('kpi.ventasMes', { n: equipo.ventasMes }), i: TrendingUp, c: C.cierre },
          { l: 'kpi.cashMes', v: fmtUSD(equipo.cashMes, true), s: t('kpi.cashSemana', { v: fmtUSD(equipo.cashSemana, true) }), i: DollarSign, c: C.cierre },
          { l: 'kpi.margen', v: fmtPct(equipo.margen, 1), s: t('kpi.ganancia', { v: fmtUSD(equipo.ganancia, true) }), i: Percent, c: C.cierre },
          { l: 'kpi.respuesta', v: fmtPct(equipo.tasaRespuesta), s: t('kpi.sinResponder', { n: fmtNum(equipo.msgsSinResponder) }), i: Users2, c: C.velocidad },
        ].map((k) => (
          <div key={k.l} className="card p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="label-up">{t(k.l)}</span>
              <k.i size={15} style={{ color: k.c }} />
            </div>
            <div className="mono mt-1.5 text-[clamp(20px,5vw,26px)] font-bold leading-none">{k.v}</div>
            <div className="mt-1.5 truncate text-[11.5px] text-fg2">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Ranking */}
      <section id="sec-ranking" className="mb-6 scroll-mt-32">
        <Card data-tour="ranking">
          <CardHead
            icon={<Trophy size={17} />}
            title={t('dash.ranking')}
            sub={t('dash.rankingSub')}
            right={
              <span className="hidden items-center gap-3 text-[11.5px] text-fg2 md:flex">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-ok" /> {t('dash.sobrePromedio')}
                </span>
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle size={11} className="text-bad" /> {t('dash.bajoPromedio')}
                </span>
              </span>
            }
          />
          <Ranking filas={filas} equipo={equipo} />
        </Card>
      </section>

      {/* Agenda del equipo */}
      <section id="sec-agenda" className="mb-6 scroll-mt-32">
        <Card>
          <CardHead icon={<CalendarDays size={17} />} title={t('dash.agendaEquipo')} sub={t('dash.agendaEquipoSub')} right={<Button size="sm" variant="ghost" onClick={() => navigate('/agenda')}>{t('common.verTodo')}</Button>} />
          <AgendaEquipo leads={leads} />
        </Card>
      </section>

      {/* Leads entrantes */}
      <section id="sec-entrantes" className="mb-6 scroll-mt-32">
        <Card data-tour="entrantes">
          <CardHead icon={<Inbox size={17} />} title={t('dash.entrantes')} sub={t('dash.entrantesSub')} />
          <LeadsEntrantes leads={leads} />
        </Card>
      </section>

      {/* Dónde capacitar */}
      <section id="sec-capacitacion" className="mb-6 scroll-mt-32">
        <Card>
          <CardHead icon={<Gauge size={17} />} title={t('dash.capacitar')} sub={t('dash.capacitarSub')} />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
            {filas.map((r) => {
              const v = vendedorById(r.vendedorId)!
              return (
                <button key={r.vendedorId} onClick={() => navigate(`/vendedores/${r.vendedorId}`)} className="rounded-[12px] border border-line p-3.5 text-left transition hover:border-accent/40">
                  <div className="mb-3 flex items-center gap-2">
                    <Avatar initials={v.avatar} color={v.color} size={28} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{v.nombre}</span>
                    <BrechaChip b={r.brecha} />
                  </div>
                  <Funnel
                    compact
                    compare={capacitacionTeam}
                    stages={[
                      { key: 'a', label: t('embudo.asignado'), value: r.asignados },
                      { key: 'c', label: t('embudo.contactado'), value: r.contactados },
                      { key: 'g', label: t('embudo.agendado'), value: r.agendados },
                      { key: 'v', label: t('embudo.cerrado'), value: r.ventas },
                    ]}
                  />
                  {r.brecha === 'contacto' && <p className="mt-2.5 text-[11.5px] text-bad">{t('dash.brechaContactoTxt', { v: fmtMin(r.velMediana), e: fmtMin(equipo.velMediana) })}</p>}
                </button>
              )
            })}
          </div>
        </Card>
      </section>

      {/* Evolución */}
      <section id="sec-evolucion" className="scroll-mt-32">
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHead title={t('dash.evolucion')} sub={t('dash.evolucionSub')} right={<Legend items={[{ color: C.velocidad, label: t('metric.velocidad') }, { color: C.agenda, label: t('metric.agenda') }, { color: C.cierre, label: t('metric.cierre') }]} />} />
            <div className="h-[280px] p-3 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={semanas} margin={{ left: -14, right: 0, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis yAxisId="p" {...axisProps} unit="%" />
                  <YAxis yAxisId="m" orientation="right" {...axisProps} unit="m" />
                  <Tooltip content={<ChartTip names={{ velocidad: tr('metric.velocidad', lang), agendamiento: tr('metric.agenda', lang), cierre: tr('metric.cierre', lang) }} fmt={(v, k) => (k === 'velocidad' ? fmtMin(v) : fmtPct(v, 1))} />} />
                  <Line yAxisId="m" type="monotone" dataKey="velocidad" stroke={C.velocidad} strokeWidth={2.2} dot={false} />
                  <Line yAxisId="p" type="monotone" dataKey="agendamiento" stroke={C.agenda} strokeWidth={2.2} dot={false} />
                  <Line yAxisId="p" type="monotone" dataKey="cierre" stroke={C.cierre} strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <CardHead title={t('dash.ventasCash')} sub={t('dash.ventasCashSub')} />
            <div className="h-[280px] p-3 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={semanas} margin={{ left: -6, right: 0, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={(v) => fmtUSD(v, true)} />
                  <Tooltip cursor={{ fill: 'rgba(127,127,127,.08)' }} content={<ChartTip names={{ cash: tr('kpi.cash', lang) }} fmt={(v) => fmtUSD(v)} />} />
                  <Bar dataKey="cash" fill={C.cierre} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
