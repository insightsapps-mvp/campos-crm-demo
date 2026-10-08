import { CalendarCheck2, CheckCircle2, CircleDot, MessageCircle, Phone, Sparkles, StickyNote, UserCheck, XCircle } from 'lucide-react'
import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, Badge, Drawer, Select } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtFechaHora, fmtMin, fmtRel, fmtUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import { campanas, vendedorById, vendedores } from '@/mock/base'
import type { Evento } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'
import { previewMsg } from '@/components/chat/Bubble'
import { CitaButtons, EstadoBadge, EtapaSelector, NotasBlock, RegistrarLlamadaBtn, SeguimientosBlock } from './LeadActions'

const evIcon: Partial<Record<Evento['tipo'], typeof CircleDot>> = {
  asignado: UserCheck,
  reasignado: UserCheck,
  contacto: MessageCircle,
  llamada: Phone,
  cita: CalendarCheck2,
  cita_realizada: CheckCircle2,
  comprador: Sparkles,
  perdido: XCircle,
  no_show: XCircle,
  cita_cancelada: XCircle,
  nota: StickyNote,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-4">
      <h4 className="label-up mb-3">{title}</h4>
      {children}
    </section>
  )
}

export function LeadDrawer() {
  const leadId = useUI((s) => s.leadId)
  const openLead = useUI((s) => s.openLead)
  const openChat = useUI((s) => s.openChat)
  const lead = useData((s) => s.leads.find((l) => l.id === leadId))
  const mensajes = useData((s) => s.mensajes)
  const asignar = useData((s) => s.asignar)
  const role = useApp((s) => s.role)
  const { t, b, lang } = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const close = useCallback(() => {
    openLead(null)
    if (pathname.startsWith('/leads/')) navigate('/leads', { replace: true })
  }, [openLead, pathname, navigate])

  if (!lead) return null
  const v = vendedorById(lead.vendedorId)
  const camp = campanas.find((c) => c.id === lead.campanaId)
  const msgs = mensajes.filter((m) => m.leadId === lead.id).slice(-3)
  const autorId = role === 'admin' ? 'admin' : lead.vendedorId ?? 'admin'

  const evText = (e: Evento) => {
    const vn = vendedorById(e.vendedorId)?.nombre ?? ''
    switch (e.tipo) {
      case 'asignado':
        return t('ev.asignado', { v: vn })
      case 'reasignado':
        return t('ev.reasignado', { v: vn })
      case 'contacto':
        return e.minutos !== undefined ? t('ev.contactoMin', { m: fmtMin(e.minutos) }) : t('ev.contacto')
      case 'llamada':
        return e.minutos !== undefined ? t('ev.llamadaMin', { m: fmtMin(e.minutos) }) : t('ev.llamada')
      default:
        return t(`ev.${e.tipo}`)
    }
  }

  return (
    <Drawer
      open={!!lead}
      onClose={close}
      title={
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold">{lead.nombre}</div>
            <div className="mono truncate text-[12px] text-fg2">{lead.telefono}</div>
          </div>
          <EstadoBadge e={lead.estado} />
        </div>
      }
    >
      <div className="space-y-3 px-5 py-4">
        <div className="grid grid-cols-2 gap-2 text-[12.5px]">
          <div className="rounded-[10px] bg-surface2/60 p-2.5">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">{t('lead.vehiculo')}</div>
            <div className="font-semibold">{lead.vehiculoInteres}</div>
          </div>
          <div className="rounded-[10px] bg-surface2/60 p-2.5">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">{t('lead.score')}</div>
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="mono">{lead.score}/100</span>
              <Badge tone={lead.calificado ? 'ok' : 'muted'}>{t(lead.calificado ? 'lead.calificado' : 'lead.noCalificado')}</Badge>
            </div>
          </div>
          <div className="col-span-2 rounded-[10px] bg-surface2/60 p-2.5">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">{t('lead.origen')}</div>
            <div className="font-semibold">
              {t(`origen.${lead.origen}`)}
              {camp && <span className="font-normal text-fg2"> · {camp.nombre}</span>}
            </div>
            {lead.anuncio && <div className="text-[11.5px] text-fg2">{t('lead.anuncio')}: {lead.anuncio}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11.5px]">
          <Badge>{t('grupo.credito')}: {t(`credito.${lead.credito}`)}</Badge>
          <Badge>Down {fmtUSD(lead.presupuesto)}</Badge>
          <Badge>{t(`financiacion.${lead.financiacion}`)}</Badge>
          <Badge>{t(lead.tradeIn ? 'tradeIn.si' : 'tradeIn.no')}</Badge>
          <Badge>{t(`idioma.${lead.idioma}`)}</Badge>
        </div>
        {lead.venta && (
          <div className="rounded-[10px] border border-ok/30 bg-[rgba(52,211,153,.07)] p-3 text-[12.5px]">
            <div className="font-semibold text-ok">{t('lead.ventaCerrada')}</div>
            <div className="mono mt-1 flex flex-wrap gap-x-4">
              <span>{t('rank.ingresos')}: {fmtUSD(lead.venta.precio)}</span>
              <span>Cash: {fmtUSD(lead.venta.cash)}</span>
              <span>{t('rank.ganancia')}: {fmtUSD(lead.venta.ganancia)}</span>
            </div>
          </div>
        )}
      </div>

      <Section title={t('lead.responsable')}>
        {role === 'admin' ? (
          <Select
            ariaLabel={t('lead.responsable')}
            value={lead.vendedorId ?? ''}
            onChange={(id) => {
              if (!id) return
              asignar([lead.id], id)
              toast.success(tr('toast.asignado', useApp.getState().lang, { n: 1, v: vendedorById(id)!.nombre }))
            }}
          >
            <option value="">{t('lead.sinAsignar')}</option>
            {vendedores.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre} · {x.bdc}
              </option>
            ))}
          </Select>
        ) : (
          v && (
            <div className="flex items-center gap-2 text-[13px]">
              <Avatar initials={v.avatar} color={v.color} size={28} /> {v.nombre} · {v.bdc}
            </div>
          )
        )}
      </Section>

      <Section title={t('lead.acciones')}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                openChat(lead.id)
                close()
                navigate('/whatsapp')
              }}
              className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#25d366]/15 px-3 text-[13px] font-semibold text-[#25d366] sm:h-9"
            >
              <MessageCircle size={15} /> WhatsApp
            </button>
            <RegistrarLlamadaBtn lead={lead} />
          </div>
          <CitaButtons lead={lead} />
        </div>
      </Section>

      <Section title={t('lead.etapa')}>
        <EtapaSelector lead={lead} />
      </Section>

      <Section title={t('lead.seguimientos')}>
        <SeguimientosBlock lead={lead} />
      </Section>

      <Section title={t('lead.notas')}>
        <NotasBlock lead={lead} autorId={autorId} />
      </Section>

      {msgs.length > 0 && (
        <Section title={t('lead.conversacion')}>
          <div className="space-y-1.5">
            {msgs.map((m) => (
              <div key={m.id} className={cn('max-w-[85%] rounded-[10px] px-3 py-1.5 text-[12.5px]', m.direccion === 'out' ? 'ml-auto bg-[rgba(59,130,246,.14)]' : 'bg-surface2')}>
                {previewMsg(m, t, b)}
                <div className="mt-0.5 text-right text-[10px] text-muted">{fmtRel(m.at, lang)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title={t('lead.historial')}>
        <ol className="relative space-y-3 border-l border-line pl-4">
          {[...lead.historial].reverse().map((e) => {
            const Icon = evIcon[e.tipo] ?? CircleDot
            return (
              <li key={e.id} className="relative">
                <span className="absolute -left-[25px] top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full border border-line bg-surface text-accent">
                  <Icon size={10} />
                </span>
                <div className="text-[13px] font-medium">{evText(e)}</div>
                {e.detalle && <div className="text-[12px] text-fg2">{b(e.detalle)}</div>}
                <div className="text-[11px] text-muted">{fmtFechaHora(e.at, lang)}</div>
              </li>
            )
          })}
        </ol>
      </Section>
    </Drawer>
  )
}
