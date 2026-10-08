import { CalendarCheck2, Handshake, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { C, ChartTip, Legend, axisProps } from '@/components/charts'
import { EstadoBadge } from '@/components/lead/LeadActions'
import { Badge, Button, Card, CardHead, Empty, HBar, LiveTimer, Segmented } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtFechaHora, fmtMin, fmtPct, fmtRel, fmtUSD, isSameDay } from '@/lib/format'
import { evolucionMensual, evolucionSemanal, type Stats } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { DAY } from '@/mock/base'
import type { Lead } from '@/mock/types'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'

/** KPI personal con comparación "vs equipo" */
export function KpiVs({ label, value, team, good, color, sub }: { label: string; value: string; team: string; good: boolean | null; color?: string; sub?: string }) {
  const { t } = useT()
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5">
        {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
        <span className="label-up">{label}</span>
      </div>
      <div className="mono mt-2 font-bold leading-none" style={{ fontSize: 'clamp(26px, 6vw, 32px)' }}>
        {value}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-fg2">
        <span>
          {t('common.equipo')} <b className="mono">{team}</b>
        </span>
        {good !== null && <Badge tone={good ? 'ok' : 'bad'}>{t(good ? 'panel.mejor' : 'panel.peor')}</Badge>}
      </div>
      {sub && <div className="mt-1 text-[11.5px] text-muted">{sub}</div>}
    </div>
  )
}

export function KpisCloser({ me, team }: { me: Stats; team: Stats }) {
  const { t } = useT()
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" data-tour="panel-kpis">
        <KpiVs label={t('kpi.velocidad')} value={fmtMin(me.velMediana)} team={fmtMin(team.velMediana)} good={me.velMediana <= team.velMediana} color={C.velocidad} />
        <KpiVs label={t('kpi.agendamiento')} value={fmtPct(me.tasaAgenda)} team={fmtPct(team.tasaAgenda)} good={me.tasaAgenda >= team.tasaAgenda} color={C.agenda} />
        <KpiVs label={t('kpi.cierre')} value={fmtPct(me.tasaCierreCitas)} team={fmtPct(team.tasaCierreCitas)} good={me.tasaCierreCitas >= team.tasaCierreCitas} color={C.cierre} />
        <KpiVs label={t('kpi.respuesta')} value={fmtPct(me.tasaRespuesta)} team={fmtPct(team.tasaRespuesta)} good={me.tasaRespuesta >= team.tasaRespuesta} sub={t('kpi.sinResponder', { n: me.msgsSinResponder })} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { l: 'kpi.ventas', v: String(me.ventas), s: t('kpi.ventasMes', { n: me.ventasMes }) },
          { l: 'rank.cashSemana', v: fmtUSD(me.cashSemana), s: t('panel.ultimos7') },
          { l: 'rank.cashMes', v: fmtUSD(me.cashMes), s: t('panel.desde1') },
          { l: 'kpi.margen', v: fmtPct(me.margen, 1), s: t('kpi.ganancia', { v: fmtUSD(me.ganancia, true) }) },
        ].map((k) => (
          <div key={k.l} className="card p-3.5">
            <div className="label-up">{t(k.l)}</div>
            <div className="mono mt-1.5 text-[clamp(20px,5vw,26px)] font-bold leading-none text-ok">{k.v}</div>
            <div className="mt-1.5 truncate text-[11.5px] text-fg2">{k.s}</div>
          </div>
        ))}
      </div>
    </>
  )
}

/** Leads esperando primer contacto, con cronómetro en vivo */
export function EsperandoContacto({ leads }: { leads: Lead[] }) {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const openChat = useUI((s) => s.openChat)
  const openLead = useUI((s) => s.openLead)
  const lista = leads.filter((l) => l.estado === 'asignado' && l.asignadoAt).sort((a, b) => a.asignadoAt! - b.asignadoAt!)
  return (
    <Card data-tour="esperando">
      <CardHead title={t('panel.esperando')} sub={t('panel.esperandoSub')} right={<Badge tone={lista.length ? 'warn' : 'ok'}>{lista.length}</Badge>} />
      {lista.length === 0 ? (
        <Empty title={t('panel.todoContactado')} />
      ) : (
        <div className="divide-y divide-line">
          {lista.slice(0, 8).map((l) => (
            <div key={l.id} className="flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:px-5">
              <button onClick={() => openLead(l.id)} className="min-w-0 flex-1 text-left">
                <div className="truncate font-semibold">{l.nombre}</div>
                <div className="truncate text-[12px] text-fg2">
                  {l.vehiculoInteres} · {t(`origen.${l.origen}`)} · {fmtRel(l.asignadoAt!, lang)}
                </div>
              </button>
              <div className="flex items-center gap-2">
                <LiveTimer since={l.asignadoAt!} />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    openChat(l.id)
                    navigate('/whatsapp')
                  }}
                  className="bg-[#25d366] hover:bg-[#1ebe5b]"
                >
                  <MessageCircle size={15} /> {t('panel.contactarWa')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function ProximasCitas({ leads }: { leads: Lead[] }) {
  const { t, lang } = useT()
  const openLead = useUI((s) => s.openLead)
  const now = Date.now()
  const lista = leads
    .filter((l) => l.citaAt && l.citaAt > now - 2 * 3600_000 && (isSameDay(l.citaAt, now) || isSameDay(l.citaAt, now + DAY)))
    .sort((a, b) => a.citaAt! - b.citaAt!)
  return (
    <Card>
      <CardHead icon={<CalendarCheck2 size={16} />} title={t('panel.proximasCitas')} sub={t('panel.hoyManana')} />
      {lista.length === 0 ? (
        <Empty title={t('panel.sinCitas')} />
      ) : (
        <div className="divide-y divide-line">
          {lista.map((l) => (
            <button key={l.id} onClick={() => openLead(l.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface2/50 sm:px-5">
              <span className="mono w-24 shrink-0 text-[12.5px] font-semibold">{fmtFechaHora(l.citaAt!, lang).split('·')[1] ?? ''}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold">{l.nombre}</span>
                <span className="block truncate text-[12px] text-fg2">
                  {isSameDay(l.citaAt!, now) ? t('common.hoy') : t('common.manana')} · {l.vehiculoInteres}
                </span>
              </span>
              <EstadoBadge e={l.estado} />
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

/** Propuestas de cierre abiertas (negociación) */
export function Negociaciones({ leads }: { leads: Lead[] }) {
  const { t, b, lang } = useT()
  const openLead = useUI((s) => s.openLead)
  const lista = leads.filter((l) => l.estado === 'negociacion').sort((a, b2) => (b2.citaAt ?? 0) - (a.citaAt ?? 0))
  return (
    <Card>
      <CardHead icon={<Handshake size={16} />} title={t('panel.negociaciones')} sub={t('panel.negociacionesSub')} right={<Badge tone="warn">{lista.length}</Badge>} />
      {lista.length === 0 ? (
        <Empty title={t('panel.sinNegociaciones')} />
      ) : (
        <div className="divide-y divide-line">
          {lista.slice(0, 6).map((l) => (
            <button key={l.id} onClick={() => openLead(l.id)} className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-surface2/50 sm:px-5">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[13.5px] font-semibold">{l.nombre}</span>
                <span className="mono shrink-0 text-[12px] text-fg2">{l.vehiculoInteres}</span>
              </span>
              {l.notas[0] ? <span className="line-clamp-1 text-[12px] text-fg2">📝 {b(l.notas[0].texto)}</span> : <span className="text-[12px] text-muted">{t('panel.citaRealizada', { f: l.citaAt ? fmtRel(l.citaAt, lang) : '—' })}</span>}
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

export function EvolucionCloser({ vendedorId }: { vendedorId: string }) {
  const { t, lang } = useT()
  const leads = useData((s) => s.leads)
  const [modo, setModo] = useState<'semanal' | 'mensual'>('semanal')
  const data = useMemo(() => (modo === 'semanal' ? evolucionSemanal(leads, vendedorId, 8) : evolucionMensual(leads, vendedorId)), [leads, vendedorId, modo])
  return (
    <Card>
      <CardHead
        title={t('panel.evolucion')}
        right={
          <Segmented size="sm" value={modo} onChange={setModo} options={[{ value: 'semanal', label: t('panel.semanal') }, { value: 'mensual', label: t('panel.mensual') }]} />
        }
      />
      <div className="px-4 pt-3 sm:px-5">
        <Legend items={[{ color: C.velocidad, label: t('metric.velocidad') }, { color: C.agenda, label: t('metric.agenda') }, { color: C.cierre, label: t('metric.cierre') }]} />
      </div>
      <div className="h-[240px] p-3 lg:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -14, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis yAxisId="p" {...axisProps} unit="%" />
            <YAxis yAxisId="m" orientation="right" {...axisProps} unit="m" />
            <Tooltip content={<ChartTip names={{ velocidad: tr('metric.velocidad', lang), agendamiento: tr('metric.agenda', lang), cierre: tr('metric.cierre', lang) }} fmt={(v, k) => (k === 'velocidad' ? fmtMin(v) : fmtPct(v, 1))} />} />
            <Line yAxisId="m" type="monotone" dataKey="velocidad" stroke={C.velocidad} strokeWidth={2.2} dot={modo === 'mensual'} />
            <Line yAxisId="p" type="monotone" dataKey="agendamiento" stroke={C.agenda} strokeWidth={2.2} dot={modo === 'mensual'} />
            <Line yAxisId="p" type="monotone" dataKey="cierre" stroke={C.cierre} strokeWidth={2.2} dot={modo === 'mensual'} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

/** Barras comparativas closer vs promedio del equipo */
export function VsEquipo({ me, team }: { me: Stats; team: Stats }) {
  const { t } = useT()
  const rows = [
    { l: 'metric.velocidad', a: me.velMediana, b: team.velMediana, f: fmtMin, color: C.velocidad, lower: true },
    { l: 'kpi.respuesta', a: me.tasaRespuesta, b: team.tasaRespuesta, f: (n: number) => fmtPct(n), color: C.velocidad },
    { l: 'metric.agenda', a: me.tasaAgenda, b: team.tasaAgenda, f: (n: number) => fmtPct(n), color: C.agenda },
    { l: 'metric.cierre', a: me.tasaCierreCitas, b: team.tasaCierreCitas, f: (n: number) => fmtPct(n), color: C.cierre },
    { l: 'kpi.margen', a: me.margen, b: team.margen, f: (n: number) => fmtPct(n, 1), color: C.cierre },
  ]
  return (
    <div className="space-y-4">
      {rows.map((r) => {
        const max = Math.max(r.a, r.b) * 1.15 || 1
        const good = r.lower ? r.a <= r.b : r.a >= r.b
        return (
          <div key={r.l}>
            <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
              <span className="font-medium">{t(r.l)}</span>
              <span className="mono">
                <b className={cn(good ? 'text-ok' : 'text-bad')}>{r.f(r.a)}</b>
                <span className="text-fg2"> · {t('common.equipo')} {r.f(r.b)}</span>
              </span>
            </div>
            <HBar value={r.a} max={max} color={good ? r.color : C.bad} marker={r.b} height={10} />
          </div>
        )
      })}
    </div>
  )
}
