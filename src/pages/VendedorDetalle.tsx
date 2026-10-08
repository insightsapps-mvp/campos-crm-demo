import { ArrowLeft, LayoutDashboard, MessageCircle, Shuffle } from 'lucide-react'
import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Funnel } from '@/components/charts'
import { PreviewBanner } from '@/components/layout/Notices'
import { EstadoBadge } from '@/components/lead/LeadActions'
import { Avatar, Badge, Button, Card, CardHead, Empty, LiveTimer } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtRel } from '@/lib/format'
import { ranking } from '@/lib/metrics'
import { vendedorById } from '@/mock/base'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'
import { BrechaChip, useEntrarPanel } from './dashboard/Ranking'
import { EvolucionCloser, KpisCloser, Negociaciones, ProximasCitas, VsEquipo } from './closer/parts'

export default function VendedorDetalle() {
  const { id = '' } = useParams()
  const { t, b, lang } = useT()
  const navigate = useNavigate()
  const entrar = useEntrarPanel()
  const leads = useData((s) => s.leads)
  const mensajes = useData((s) => s.mensajes)
  const asignar = useData((s) => s.asignar)
  const openLead = useUI((s) => s.openLead)
  const openChat = useUI((s) => s.openChat)
  const v = vendedorById(id)
  const { filas, equipo } = useMemo(() => ranking(leads, { rango: '30d' }), [leads])
  const mine = useMemo(() => leads.filter((l) => l.vendedorId === id), [leads, id])
  if (!v) return <Navigate to="/dashboard" replace />
  const me = filas.find((f) => f.vendedorId === id)!
  const sinContacto = mine.filter((l) => l.estado === 'asignado').sort((a, c) => a.asignadoAt! - c.asignadoAt!)
  const convIds = [...new Set(mensajes.filter((m) => mine.some((l) => l.id === m.leadId)).sort((a, c) => c.at - a.at).map((m) => m.leadId))].slice(0, 5)
  const mejor = filas.find((f) => f.vendedorId !== id)!

  const reasignar = () => {
    const L = useApp.getState().lang
    if (!sinContacto.length) {
      toast.info(tr('vend.nadaReasignar', L))
      return
    }
    asignar(sinContacto.map((l) => l.id), mejor.vendedorId)
    toast.success(tr('toast.asignado', L, { n: sinContacto.length, v: vendedorById(mejor.vendedorId)!.nombre }))
  }

  const verChat = (lid: string) => {
    useApp.getState().setViewAs(id)
    openChat(lid)
    navigate('/whatsapp')
  }

  return (
    <div>
      <PreviewBanner id="vendedor" />
      <button onClick={() => navigate('/dashboard')} className="mb-3 inline-flex h-10 items-center gap-1.5 text-[13px] font-semibold text-fg2 hover:text-fg">
        <ArrowLeft size={15} /> {t('vend.volver')}
      </button>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3.5">
          <Avatar initials={v.avatar} color={v.color} size={56} />
          <div className="min-w-0">
            <div className="kicker text-accent">{t('kicker.equipo')}</div>
            <h1 className="text-[22px] font-bold tracking-tight sm:text-[26px]">{v.nombre}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-fg2">
              {v.bdc} · <span className="mono font-semibold text-fg">#{me.posicion}</span> {t('panel.deN', { n: filas.length })}
              <BrechaChip b={me.brecha} />
              <span>· {t('vend.ultimoAcceso', { r: fmtRel(v.ultimoAcceso, lang) })}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" onClick={() => entrar(id)} data-tour="ver-como">
            <LayoutDashboard size={16} /> {t('rank.entrarPanel')}
          </Button>
          <Button variant="secondary" onClick={reasignar}>
            <Shuffle size={16} /> {t('vend.reasignar', { n: sinContacto.length })}
          </Button>
        </div>
      </div>

      <KpisCloser me={me} team={equipo} />

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title={t('vend.vsEquipo')} sub={t('vend.vsEquipoSub')} />
          <div className="p-4 sm:p-5">
            <VsEquipo me={me} team={equipo} />
          </div>
        </Card>
        <Card>
          <CardHead title={t('vend.embudo')} sub={t('dash.capacitarSub')} />
          <div className="p-4 sm:p-5">
            <Funnel
              compare={[1, equipo.contactados / (equipo.asignados || 1), equipo.agendados / (equipo.contactados || 1), equipo.ventas / (equipo.agendados || 1)]}
              stages={[
                { key: 'a', label: t('embudo.asignado'), value: me.asignados },
                { key: 'c', label: t('embudo.contactado'), value: me.contactados },
                { key: 'g', label: t('embudo.agendado'), value: me.agendados },
                { key: 'v', label: t('embudo.cerrado'), value: me.ventas },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHead title={t('vend.sinContacto')} sub={t('vend.sinContactoSub')} right={<Badge tone={sinContacto.length ? 'bad' : 'ok'}>{sinContacto.length}</Badge>} />
          {sinContacto.length === 0 ? (
            <Empty title={t('panel.todoContactado')} />
          ) : (
            <div className="divide-y divide-line">
              {sinContacto.map((l) => (
                <button key={l.id} onClick={() => openLead(l.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface2/50 sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{l.nombre}</span>
                    <span className="block truncate text-[12px] text-fg2">{l.vehiculoInteres}</span>
                  </span>
                  <LiveTimer since={l.asignadoAt!} />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHead icon={<MessageCircle size={16} />} title={t('vend.conversaciones')} />
          {convIds.length === 0 ? (
            <Empty title={t('wa.sinConvs')} />
          ) : (
            <div className="divide-y divide-line">
              {convIds.map((lid) => {
                const l = mine.find((x) => x.id === lid)!
                const last = mensajes.filter((m) => m.leadId === lid).sort((a, c) => c.at - a.at)[0]
                return (
                  <button key={lid} onClick={() => verChat(lid)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface2/50 sm:px-5">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold">{l.nombre}</span>
                        <EstadoBadge e={l.estado} />
                      </span>
                      <span className="block truncate text-[12px] text-fg2">
                        {last.direccion === 'in' ? '← ' : '→ '}
                        {b(last.texto)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">{fmtRel(last.at, lang)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </Card>

        <ProximasCitas leads={mine} />
        <Negociaciones leads={mine} />
      </div>
      <div className="mt-5">
        <EvolucionCloser vendedorId={id} />
      </div>
    </div>
  )
}
