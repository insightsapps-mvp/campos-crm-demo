import { BellRing, CalendarCheck2, CalendarX2, Check, IdCard, MessageCircle, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCloserId } from '@/components/layout/AppShell'
import { PreviewBanner } from '@/components/layout/Notices'
import { CancelarCitaModal } from '@/components/lead/LeadActions'
import { Avatar, Badge, Button, Card, CardHead, Empty, PageHeader, Select } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtFechaHora, fmtHora } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DAY, HOUR, vendedorById, vendedores } from '@/mock/base'
import type { Lead } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'
import { Calendario } from './agenda/Calendario'
import { AgendaEquipo, citaTone, itemsAgenda } from './dashboard/AgendaEquipo'

export default function Agenda() {
  const { t, lang } = useT()
  const closerId = useCloserId()
  const leads = useData((s) => s.leads)
  const autoMensajes = useData((s) => s.autoMensajes)
  const toggleSeg = useData((s) => s.toggleSeguimiento)
  const openLead = useUI((s) => s.openLead)
  const openChat = useUI((s) => s.openChat)
  const navigate = useNavigate()
  const [vid, setVid] = useState('')
  const [cancel, setCancel] = useState<Lead | null>(null)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const [dia, setDia] = useState(hoy.getTime())
  const quien = closerId ?? (vid || null)

  const items = useMemo(() => itemsAgenda(leads, dia, quien), [leads, dia, quien])

  const now = Date.now()
  const rec24 = autoMensajes.find((a) => a.id === 'am5')
  const recordatorios = useMemo(
    () =>
      leads
        .filter((l) => l.citaAt && l.citaAt > now && l.citaAt < now + 3 * DAY && (!quien || l.vendedorId === quien))
        .sort((a, b) => a.citaAt! - b.citaAt!)
        .slice(0, 8),
    [leads, quien, now],
  )
  const vencidos = useMemo(
    () => leads.flatMap((l) => (!quien || l.vendedorId === quien ? l.seguimientos.filter((s) => !s.hecho && s.at < now).map((s) => ({ l, s })) : [])).slice(0, 8),
    [leads, quien, now],
  )

  const chat = (l: Lead) => {
    openChat(l.id)
    navigate('/whatsapp')
  }

  return (
    <div>
      <PreviewBanner id="agenda" />
      <PageHeader
        kicker={t(closerId ? 'kicker.cartera' : 'kicker.equipo')}
        kickerTone={closerId ? 'cyan' : 'accent'}
        title={t(closerId ? 'agendaPag.tituloCloser' : 'agendaPag.titulo')}
        sub={t('agendaPag.sub')}
        right={
          !closerId && (
            <Select ariaLabel={t('filtro.vendedor')} value={vid} onChange={setVid} className="w-full sm:w-60">
              <option value="">{t('filtro.todosVendedores')}</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </Select>
          )
        }
      />

      {!closerId && !vid && (
        <Card className="mb-5">
          <CardHead icon={<CalendarCheck2 size={17} />} title={t('dash.agendaEquipo')} sub={t('dash.agendaEquipoSub')} />
          <AgendaEquipo leads={leads} />
        </Card>
      )}

      <Calendario
        leads={leads}
        quien={quien}
        dia={dia}
        onDia={(d) => {
          setDia(d)
          if (window.innerWidth < 1024) setTimeout(() => document.getElementById('agenda-detalle')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        }}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card id="agenda-detalle" className="scroll-mt-20">
          <CardHead title={new Date(dia).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })} sub={t('agendaPag.nItems', { n: items.length })} />
          {items.length === 0 ? (
            <Empty icon={<CalendarCheck2 size={26} />} title={t('agenda.sinItems')} />
          ) : (
            <div className="divide-y divide-line">
              {items.map((it, k) => {
                const v = vendedorById(it.lead.vendedorId)
                const futura = it.tipo === 'cita' && it.at > now
                return (
                  <div key={k} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="mono w-16 shrink-0 pt-0.5 text-[13px] font-bold">{fmtHora(it.at, lang)}</div>
                      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-[10px]', it.tipo === 'cita' ? 'bg-[rgba(59,130,246,.12)] text-accent' : 'bg-[rgba(167,139,250,.14)] text-violet')}>
                        {it.tipo === 'cita' ? <CalendarCheck2 size={17} /> : <BellRing size={17} />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{it.lead.nombre}</span>
                          <Badge tone={citaTone[it.estado]}>{t(`citaEstado.${it.estado}`)}</Badge>
                        </div>
                        <div className="text-[12.5px] text-fg2">
                          {it.tipo === 'cita' ? t('agendaPag.verVehiculo', { v: it.lead.vehiculoInteres }) : it.titulo}
                        </div>
                        {!closerId && v && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
                            <Avatar initials={v.avatar} color={v.color} size={18} /> {v.nombre}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-[76px] sm:pl-0">
                      <Button size="sm" variant="secondary" onClick={() => chat(it.lead)}><MessageCircle size={15} /> WhatsApp</Button>
                      <Button size="sm" variant="ghost" onClick={() => openLead(it.lead.id)} aria-label={t('leads.abrirFicha')}><IdCard size={15} /></Button>
                      {futura && <Button size="sm" variant="danger" onClick={() => setCancel(it.lead)}><CalendarX2 size={15} /> {t('lead.cancelarCita')}</Button>}
                      {it.tipo === 'seguimiento' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            const s = it.lead.seguimientos.find((x) => x.at === it.at)
                            if (s) toggleSeg(it.lead.id, s.id)
                            toast.success(tr('toast.seguimientoHecho', useApp.getState().lang))
                          }}
                        >
                          <Check size={15} /> {t('agendaPag.hecho')}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHead icon={<Zap size={16} />} title={t('agendaPag.recordatorios')} sub={t('agendaPag.recordatoriosSub')} />
            <div className="divide-y divide-line">
              {recordatorios.length === 0 && <Empty title={t('agendaPag.sinRecordatorios')} />}
              {recordatorios.map((l) => {
                const envio = l.citaAt! - 24 * HOUR
                return (
                  <button key={l.id} onClick={() => openLead(l.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface2/50">
                    <Zap size={15} className="shrink-0 text-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{l.nombre}</span>
                      <span className="block text-[11.5px] text-fg2">{t('agendaPag.citaEl', { f: fmtFechaHora(l.citaAt!, lang) })}</span>
                    </span>
                    <Badge tone={envio < now ? 'ok' : 'violet'}>{envio < now ? t('agendaPag.enviado24') : rec24?.activo ? t('agendaPag.programado24') : t('agendaPag.desactivado')}</Badge>
                  </button>
                )
              })}
            </div>
          </Card>
          <Card>
            <CardHead icon={<BellRing size={16} />} title={t('agendaPag.vencidos')} sub={t('agendaPag.vencidosSub')} />
            <div className="divide-y divide-line">
              {vencidos.length === 0 && <Empty title={t('agendaPag.sinVencidos')} />}
              {vencidos.map(({ l, s }) => (
                <button key={s.id} onClick={() => openLead(l.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface2/50">
                  <BellRing size={15} className="shrink-0 text-bad" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{l.nombre}</span>
                    <span className="block truncate text-[11.5px] text-fg2">{s.titulo[lang]} · {fmtFechaHora(s.at, lang)}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {cancel && <CancelarCitaModal lead={cancel} open={!!cancel} onClose={() => setCancel(null)} />}
    </div>
  )
}
