import { Bell, CalendarPlus, CalendarX2, Check, MessageSquarePlus, Phone, StickyNote } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button, Modal, type Tone } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtFechaHora, fmtRel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DAY, vendedorById } from '@/mock/base'
import type { Lead, LeadEstado, Seguimiento } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'

export const estadoTone: Record<LeadEstado, Tone> = {
  nuevo: 'muted',
  asignado: 'warn',
  contactado: 'accent',
  agendado: 'violet',
  cita_realizada: 'cyan',
  negociacion: 'warn',
  comprador: 'ok',
  perdido: 'bad',
}

export function EstadoBadge({ e }: { e: LeadEstado }) {
  const { t } = useT()
  return (
    <Badge tone={estadoTone[e]} dot>
      {t(`estado.${e}`)}
    </Badge>
  )
}

const lang = () => useApp.getState().lang

/** Cambiar la etapa del pipeline (incluye negociación y cierre) */
export function EtapaSelector({ lead }: { lead: Lead }) {
  const { t } = useT()
  const setEstado = useData((s) => s.setEstado)
  const etapas: LeadEstado[] = ['contactado', 'agendado', 'cita_realizada', 'negociacion', 'comprador', 'perdido']
  const pick = (e: LeadEstado) => {
    if (e === lead.estado) return
    if (e === 'agendado' && !lead.citaAt) {
      toast.info(tr('lead.usaAgendar', lang()))
      return
    }
    setEstado(lead.id, e)
    if (e === 'comprador') toast.success(tr('toast.postCompraActivado', lang()), { description: tr('toast.postCompraDesc', lang()) })
    else toast.success(tr('toast.etapa', lang(), { e: tr(`estado.${e}`, lang()) }))
  }
  return (
    <div className="flex flex-wrap gap-1.5" data-tour="etapa">
      {etapas.map((e) => (
        <button
          key={e}
          onClick={() => pick(e)}
          className={cn(
            'min-h-[40px] rounded-full border px-3 text-[12px] font-semibold transition',
            lead.estado === e ? 'border-accent bg-[rgba(59,130,246,.14)] text-accent' : 'border-line bg-surface2 text-fg2 hover:text-fg',
          )}
        >
          {t(`estado.${e}`)}
        </button>
      ))}
    </div>
  )
}

/** Modal para agendar cita: día + horario + vehículo; dispara confirmación por WhatsApp */
export function AgendarCitaModal({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const { t, lang: L } = useT()
  const agendar = useData((s) => s.agendarCita)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dias = Array.from({ length: 6 }, (_, i) => hoy.getTime() + (i + (new Date().getHours() >= 18 ? 1 : 0)) * DAY)
  const horas = ['10:00', '11:30', '13:00', '15:00', '16:30', '18:00']
  const [dia, setDia] = useState(dias[0])
  const [hora, setHora] = useState(horas[3])
  const at = (() => {
    const [h, m] = hora.split(':').map(Number)
    const d = new Date(dia)
    d.setHours(h, m, 0, 0)
    return d.getTime()
  })()
  const pasado = at < Date.now()
  const confirmar = () => {
    agendar(lead.id, at)
    toast.success(tr('toast.citaAgendada', lang(), { n: lead.nombre.split(' ')[0] }), { description: tr('toast.citaAgendadaDesc', lang()) })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={t('lead.agendarTitulo', { n: lead.nombre })} width={480}>
      <div className="space-y-4 p-5">
        <div>
          <div className="label-up mb-2">{t('lead.dia')}</div>
          <div className="grid grid-cols-3 gap-2">
            {dias.map((d) => (
              <button key={d} onClick={() => setDia(d)} className={cn('min-h-[48px] rounded-[10px] border text-[12.5px] font-semibold capitalize', dia === d ? 'border-accent bg-[rgba(59,130,246,.12)] text-accent' : 'border-line bg-surface2')}>
                {new Date(d).toLocaleDateString(L === 'es' ? 'es-US' : 'en-US', { weekday: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="label-up mb-2">{t('lead.horario')}</div>
          <div className="grid grid-cols-3 gap-2">
            {horas.map((h) => (
              <button key={h} onClick={() => setHora(h)} className={cn('mono min-h-[44px] rounded-[10px] border text-[13px] font-semibold', hora === h ? 'border-accent bg-[rgba(59,130,246,.12)] text-accent' : 'border-line bg-surface2')}>
                {h}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-[10px] border border-line bg-surface2/60 p-3 text-[12.5px] text-fg2">
          <div className="font-semibold text-fg">{lead.vehiculoInteres}</div>
          {t('lead.agendarNota')}
        </div>
        {pasado && <p className="text-[12.5px] text-bad">{t('lead.horarioPasado')}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancelar')}
          </Button>
          <Button variant="primary" onClick={confirmar} disabled={pasado}>
            <CalendarPlus size={16} /> {t('lead.confirmarCita')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function CancelarCitaModal({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const { t, lang: L } = useT()
  const cancelar = useData((s) => s.cancelarCita)
  if (!lead.citaAt) return null
  return (
    <Modal open={open} onClose={onClose} title={t('lead.cancelarTitulo')} width={440}>
      <div className="space-y-4 p-5">
        <p className="text-[13.5px]">{t('lead.cancelarTexto', { n: lead.nombre, f: fmtFechaHora(lead.citaAt, L) })}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('common.volver')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              cancelar(lead.id)
              toast.success(tr('toast.citaCancelada', lang()), { description: tr('toast.citaCanceladaDesc', lang()) })
              onClose()
            }}
          >
            <CalendarX2 size={16} /> {t('lead.cancelarCita')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/** Botones de cita (agendar / cancelar) — usados en el chat y en el drawer */
export function CitaButtons({ lead, compact }: { lead: Lead; compact?: boolean }) {
  const { t, lang: L } = useT()
  const [ag, setAg] = useState(false)
  const [ca, setCa] = useState(false)
  const futura = lead.citaAt && lead.citaAt > Date.now()
  return (
    <>
      <div className="flex flex-wrap items-center gap-2" data-tour="cita-btns">
        <Button size="sm" variant="primary" onClick={() => setAg(true)} data-trailer="agendar">
          <CalendarPlus size={15} /> {futura ? t('lead.reprogramar') : t('lead.agendarCita')}
        </Button>
        <Button size="sm" variant="danger" onClick={() => setCa(true)} disabled={!futura} title={!futura ? t('lead.sinCita') : undefined}>
          <CalendarX2 size={15} /> {t('lead.cancelarCita')}
        </Button>
        {futura && !compact && <Badge tone="violet">{fmtFechaHora(lead.citaAt!, L)}</Badge>}
      </div>
      <AgendarCitaModal lead={lead} open={ag} onClose={() => setAg(false)} />
      <CancelarCitaModal lead={lead} open={ca} onClose={() => setCa(false)} />
    </>
  )
}

export function NotasBlock({ lead, autorId }: { lead: Lead; autorId: string }) {
  const { t, b, lang: L } = useT()
  const addNota = useData((s) => s.addNota)
  const [txt, setTxt] = useState('')
  const guardar = () => {
    if (!txt.trim()) return
    addNota(lead.id, txt.trim(), autorId)
    setTxt('')
    toast.success(tr('toast.notaOk', lang()))
  }
  return (
    <div data-tour="notas">
      <div className="flex gap-2">
        <textarea
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          rows={2}
          placeholder={t('lead.notaPlaceholder')}
          className="input h-auto min-h-[64px] flex-1 resize-none py-2.5"
        />
        <Button variant="secondary" size="icon" onClick={guardar} aria-label={t('lead.agregarNota')} className="h-auto self-stretch">
          <MessageSquarePlus size={17} />
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {lead.notas.length === 0 && <div className="text-[12.5px] text-muted">{t('lead.sinNotas')}</div>}
        {lead.notas.map((n) => {
          const autor = n.autorId === 'admin' ? 'Miguel Campos' : vendedorById(n.autorId)?.nombre ?? '—'
          return (
            <div key={n.id} className="rounded-[10px] border border-line bg-surface2/50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <StickyNote size={11} /> {autor} · {fmtRel(n.at, L)}
              </div>
              <div className="mt-0.5 text-[13px]">{b(n.texto)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SeguimientoModal({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const { t } = useT()
  const add = useData((s) => s.addSeguimiento)
  const [titulo, setTitulo] = useState('')
  const [cuando, setCuando] = useState<'2h' | 'manana' | '3d' | '7d'>('manana')
  const [canal, setCanal] = useState<Seguimiento['canal']>('whatsapp')
  const [rec, setRec] = useState(true)
  const at = () => {
    const now = Date.now()
    if (cuando === '2h') return now + 2 * 3600_000
    const d = new Date(now + (cuando === 'manana' ? 1 : cuando === '3d' ? 3 : 7) * DAY)
    d.setHours(10, 0, 0, 0)
    return d.getTime()
  }
  const guardar = () => {
    const tt = titulo.trim() || tr('lead.seguimientoDefault', lang())
    add(lead.id, { at: at(), titulo: { es: tt, en: tt }, canal, recordatorio: rec })
    toast.success(tr('toast.seguimientoOk', lang()), { description: rec ? tr('toast.seguimientoRec', lang()) : undefined })
    setTitulo('')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={t('lead.nuevoSeguimiento')} width={460}>
      <div className="space-y-4 p-5">
        <input className="input" placeholder={t('lead.seguimientoPlaceholder')} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <div>
          <div className="label-up mb-2">{t('lead.cuando')}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['2h', 'manana', '3d', '7d'] as const).map((c) => (
              <button key={c} onClick={() => setCuando(c)} className={cn('min-h-[44px] rounded-[10px] border text-[12.5px] font-semibold', cuando === c ? 'border-accent bg-[rgba(59,130,246,.12)] text-accent' : 'border-line bg-surface2')}>
                {t(`lead.cuando.${c}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="label-up mb-2">{t('lead.canal')}</div>
          <div className="grid grid-cols-3 gap-2">
            {(['whatsapp', 'llamada', 'visita'] as const).map((c) => (
              <button key={c} onClick={() => setCanal(c)} className={cn('min-h-[44px] rounded-[10px] border text-[12.5px] font-semibold', canal === c ? 'border-accent bg-[rgba(59,130,246,.12)] text-accent' : 'border-line bg-surface2')}>
                {t(`canal.${c}`)}
              </button>
            ))}
          </div>
        </div>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-[13px]">
          <input type="checkbox" checked={rec} onChange={(e) => setRec(e.target.checked)} className="h-4 w-4 accent-[#3b82f6]" />
          <Bell size={15} className="text-accent" /> {t('lead.recordatorio')}
        </label>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancelar')}
          </Button>
          <Button variant="primary" onClick={guardar}>
            <Check size={16} /> {t('common.guardar')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function SeguimientosBlock({ lead }: { lead: Lead }) {
  const { t, b, lang: L } = useT()
  const toggle = useData((s) => s.toggleSeguimiento)
  const [open, setOpen] = useState(false)
  return (
    <div data-tour="seguimientos">
      <div className="space-y-2">
        {lead.seguimientos.length === 0 && <div className="text-[12.5px] text-muted">{t('lead.sinSeguimientos')}</div>}
        {lead.seguimientos.map((s) => {
          const vencido = !s.hecho && s.at < Date.now()
          return (
            <button key={s.id} onClick={() => toggle(lead.id, s.id)} className={cn('flex min-h-[48px] w-full items-center gap-2.5 rounded-[10px] border px-3 py-2 text-left', vencido ? 'border-bad/30 bg-[rgba(248,113,113,.06)]' : 'border-line bg-surface2/50')}>
              <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-md border', s.hecho ? 'border-ok bg-ok text-white' : 'border-line')}>{s.hecho && <Check size={13} />}</span>
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate text-[13px] font-medium', s.hecho && 'text-muted line-through')}>{b(s.titulo)}</span>
                <span className={cn('block text-[11.5px]', vencido ? 'text-bad' : 'text-fg2')}>
                  {fmtFechaHora(s.at, L)} · {t(`canal.${s.canal}`)} {s.recordatorio && '· 🔔'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <Button size="sm" variant="secondary" className="mt-2.5" onClick={() => setOpen(true)}>
        <Bell size={15} /> {t('lead.agendarSeguimiento')}
      </Button>
      <SeguimientoModal lead={lead} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export function RegistrarLlamadaBtn({ lead, size = 'sm' }: { lead: Lead; size?: 'sm' | 'md' }) {
  const { t } = useT()
  const reg = useData((s) => s.registrarLlamada)
  return (
    <Button
      size={size}
      variant="secondary"
      onClick={(e) => {
        e.stopPropagation()
        reg(lead.id)
        toast.success(tr(lead.primerContactoAt ? 'toast.llamadaOk' : 'toast.llamadaPrimer', lang(), { n: lead.nombre.split(' ')[0] }))
      }}
    >
      <Phone size={15} /> {t('lead.registrarLlamada')}
    </Button>
  )
}
