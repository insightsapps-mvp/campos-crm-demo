import { ArrowLeft, Bell, Eye, FileText, IdCard, MessageCircle, Search, Send, StickyNote } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Bubble, Ticks, previewMsg } from '@/components/chat/Bubble'
import { Composer } from '@/components/chat/Composer'
import { useCloserId } from '@/components/layout/AppShell'
import { DevNotice, PreviewBanner } from '@/components/layout/Notices'
import { CitaButtons, EstadoBadge, EtapaSelector, NotasBlock, SeguimientoModal, SeguimientosBlock } from '@/components/lead/LeadActions'
import { Avatar, Badge, Button, Drawer, Empty, InfoPop, Modal, PageHeader, TapPop } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtFechaHora, fmtRel, fmtUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import { HOUR, campanas, vendedorById, vendedores } from '@/mock/base'
import { rellenar } from '@/mock/mensajes'
import type { Lead, Mensaje, Plantilla } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'

const L = () => useApp.getState().lang

function PlantillaPicker({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const { t, b, lang } = useT()
  const plantillas = useData((s) => s.plantillas)
  const send = useData((s) => s.sendMessage)
  const [sel, setSel] = useState<Plantilla | null>(null)
  const vars = useMemo(() => {
    const d = new Date(lead.citaAt ?? Date.now() + 24 * HOUR)
    return {
      fecha: d.toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' }),
      hora: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
  }, [lead.citaAt, lang])
  const enviar = () => {
    if (!sel) return
    send(lead.id, { es: rellenar(sel.cuerpo.es, lead, vars), en: rellenar(sel.cuerpo.en, lead, vars) }, sel.id)
    toast.success(tr('toast.plantillaEnviada', L()))
    setSel(null)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={t('wa.elegirPlantilla')} width={560}>
      <div className="space-y-3 p-4 sm:p-5" data-trailer="wa-plantillas">
        <DevNotice k="plantillas" />
        <div className="grid gap-2">
          {plantillas.map((p) => {
            const ok = p.estadoMeta === 'aprobada'
            const row = (
              <button
                key={p.id}
                onClick={() => ok && setSel(p)}
                className={cn(
                  'flex min-h-[52px] w-full items-center gap-3 rounded-[10px] border px-3 py-2 text-left transition',
                  sel?.id === p.id ? 'border-accent bg-[rgba(59,130,246,.1)]' : 'border-line bg-surface2/40',
                  !ok && 'cursor-help opacity-60',
                )}
              >
                <FileText size={16} className={ok ? 'text-accent' : 'text-muted'} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{b(p.nombre)}</span>
                  <span className="block text-[11px] uppercase tracking-wide text-muted">{p.categoria}</span>
                </span>
                <Badge tone={p.estadoMeta === 'aprobada' ? 'ok' : p.estadoMeta === 'revision' ? 'warn' : 'bad'}>{t(`meta.${p.estadoMeta}`)}</Badge>
              </button>
            )
            return ok ? row : (
              <TapPop key={p.id} trigger={row}>
                {t(p.estadoMeta === 'revision' ? 'wa.enRevisionTip' : 'wa.rechazadaTip')}
              </TapPop>
            )
          })}
        </div>
        {sel && (
          <div className="rounded-[12px] border border-line bg-[#0b141a] p-3">
            <div className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">{t('wa.preview')}</div>
            <div className="ml-auto max-w-[90%] rounded-[10px] rounded-tr-sm bg-[#005c4b] px-3 py-2 text-[13px] leading-snug text-white">
              {rellenar(b(sel.cuerpo), lead, vars)}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {sel.variables.map((v) => (
                <span key={v} className="mono rounded bg-white/10 px-1.5 py-0.5 text-[10.5px] text-zinc-300">{`{{${v}}}`}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>{t('common.cancelar')}</Button>
          <Button variant="primary" disabled={!sel} onClick={enviar}><Send size={15} /> {t('wa.enviarPlantilla')}</Button>
        </div>
      </div>
    </Modal>
  )
}

function Ficha({ lead }: { lead: Lead }) {
  const { t } = useT()
  const role = useApp((s) => s.role)
  const camp = campanas.find((c) => c.id === lead.campanaId)
  const v = vendedorById(lead.vendedorId)
  return (
    <div className="space-y-5 p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{lead.nombre}</span>
          <EstadoBadge e={lead.estado} />
        </div>
        <div className="mono text-[12px] text-fg2">{lead.telefono}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={lead.calificado ? 'ok' : 'muted'}>Score {lead.score}</Badge>
          <Badge>{lead.vehiculoInteres}</Badge>
          <Badge>Down {fmtUSD(lead.presupuesto)}</Badge>
          <Badge>{t(`credito.${lead.credito}`)}</Badge>
        </div>
        <div className="mt-2 text-[12px] text-fg2">
          {t(`origen.${lead.origen}`)}
          {camp && ` · ${camp.nombre}`}
        </div>
        {role === 'admin' && v && (
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            <Avatar initials={v.avatar} color={v.color} size={22} /> {v.nombre}
          </div>
        )}
      </div>
      <div>
        <div className="label-up mb-2">{t('lead.cita')}</div>
        <CitaButtons lead={lead} compact />
        {lead.citaAt && lead.citaAt > Date.now() && <div className="mt-2 text-[12.5px] text-violet">{fmtFechaHora(lead.citaAt, useApp.getState().lang)}</div>}
      </div>
      <div>
        <div className="label-up mb-2">{t('lead.etapa')}</div>
        <EtapaSelector lead={lead} />
      </div>
      <div>
        <div className="label-up mb-2">{t('lead.seguimientos')}</div>
        <SeguimientosBlock lead={lead} />
      </div>
      <div>
        <div className="label-up mb-2">{t('lead.notas')}</div>
        <NotasBlock lead={lead} autorId={role === 'admin' ? 'admin' : lead.vendedorId ?? 'admin'} />
      </div>
    </div>
  )
}

type Filtro = 'mias' | 'abiertas' | 'sin_responder' | 'con_cita'

export default function WhatsApp() {
  const { t, b, lang } = useT()
  const role = useApp((s) => s.role)
  const closerId = useCloserId()
  const leads = useData((s) => s.leads)
  const mensajes = useData((s) => s.mensajes)
  const chatLeadId = useUI((s) => s.chatLeadId)
  const openChat = useUI((s) => s.openChat)
  const [filtro, setFiltro] = useState<Filtro>('mias')
  const [vid, setVid] = useState('')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(chatLeadId)
  const [mobileChat, setMobileChat] = useState(!!chatLeadId)
  const [picker, setPicker] = useState(false)
  const [ficha, setFicha] = useState(false)
  const [seg, setSeg] = useState(false)
  const [nota, setNota] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatLeadId) {
      setSel(chatLeadId)
      setMobileChat(true)
      openChat(null)
    }
  }, [chatLeadId, openChat])

  const porLead = useMemo(() => {
    const m = new Map<string, Mensaje[]>()
    for (const x of mensajes) {
      const a = m.get(x.leadId)
      if (a) a.push(x)
      else m.set(x.leadId, [x])
    }
    for (const a of m.values()) a.sort((p, q2) => p.at - q2.at)
    return m
  }, [mensajes])

  const convs = useMemo(() => {
    const ids = [...porLead.keys()]
    if (sel && !porLead.has(sel)) ids.push(sel)
    return ids
      .map((id) => leads.find((l) => l.id === id))
      .filter((l): l is Lead => !!l)
      .filter((l) => (closerId ? l.vendedorId === closerId : !vid || l.vendedorId === vid))
      .map((l) => {
        const ms = porLead.get(l.id) ?? []
        const last = ms[ms.length - 1]
        const lastIn = [...ms].reverse().find((m) => m.direccion === 'in')
        const abierta = !!lastIn && lastIn.at + 24 * HOUR > Date.now()
        return { lead: l, last, abierta, pendiente: !!last && last.direccion === 'in' }
      })
      .filter(
        (c) =>
          filtro === 'mias' ||
          (filtro === 'abiertas' && c.abierta) ||
          (filtro === 'sin_responder' && c.pendiente) ||
          (filtro === 'con_cita' && c.lead.citaAt && c.lead.citaAt > Date.now()),
      )
      .filter((c) => !q || c.lead.nombre.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b2) => (b2.last?.at ?? 0) - (a.last?.at ?? 0))
  }, [porLead, leads, closerId, vid, filtro, q, sel])

  useEffect(() => {
    if (!sel && convs.length) setSel(convs[0].lead.id)
  }, [convs, sel])

  const lead = leads.find((l) => l.id === sel) ?? null
  const hilo = (sel && porLead.get(sel)) || []
  const lastIn = [...hilo].reverse().find((m) => m.direccion === 'in')
  const ventanaMs = lastIn ? lastIn.at + 24 * HOUR - Date.now() : -1

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [sel, hilo.length])

  const pendientes = convs.filter((c) => c.pendiente).length
  const porCloser = useMemo(() => {
    const m: Record<string, number> = {}
    for (const id of porLead.keys()) {
      const l = leads.find((x) => x.id === id)
      if (l?.vendedorId) m[l.vendedorId] = (m[l.vendedorId] ?? 0) + 1
    }
    return m
  }, [porLead, leads])
  const closerChat = lead ? vendedorById(lead.vendedorId) : undefined

  const ChatHeader = lead && (
    <div className="border-b border-line">
      <div className="flex items-center gap-2.5 px-3 py-2.5 sm:px-4">
        <button onClick={() => setMobileChat(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-fg2 sm:hidden" aria-label={t('common.volver')}>
          <ArrowLeft size={19} />
        </button>
        <Avatar initials={lead.nombre.split(' ').map((p) => p[0]).join('').slice(0, 2)} color="#25d366" size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold">{lead.nombre}</span>
            <span className="hidden sm:inline"><EstadoBadge e={lead.estado} /></span>
          </div>
          <div className="truncate text-[11.5px] text-fg2">{lead.vehiculoInteres} · {lead.telefono}</div>
        </div>
        {!closerId && closerChat && (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-warn/30 bg-[rgba(245,158,11,.08)] py-1 pl-1 pr-2.5 text-[11.5px] font-semibold text-warn md:inline-flex" data-tour="wa-supervision">
            <Avatar initials={closerChat.avatar} color={closerChat.color} size={20} />
            <Eye size={12} /> {t('chat.chatDe', { n: closerChat.nombre.split(' ')[0] })}
          </span>
        )}
        <button onClick={() => setFicha(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-fg2 hover:bg-surface2 xl:hidden" aria-label={t('wa.ficha')}>
          <IdCard size={18} />
        </button>
      </div>
      {/* acciones rápidas del closer */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2.5 sm:px-4" data-tour="wa-acciones">
        <CitaButtons lead={lead} compact />
        <Button size="sm" variant="secondary" onClick={() => setNota(true)}><StickyNote size={15} /> {t('wa.nota')}</Button>
        <Button size="sm" variant="secondary" onClick={() => setSeg(true)}><Bell size={15} /> {t('wa.seguimiento')}</Button>
      </div>
    </div>
  )

  const Burbujas = (
    <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><circle cx=%222%22 cy=%222%22 r=%221%22 fill=%22%23888%22 opacity=%22.08%22/></svg>')] px-3 py-4 sm:px-5">
      {hilo.length === 0 && <Empty icon={<MessageCircle size={26} />} title={t('wa.sinMensajes')} sub={t('wa.sinMensajesSub')} />}
      {hilo.map((m, i) => {
        const showDay = i === 0 || new Date(hilo[i - 1].at).toDateString() !== new Date(m.at).toDateString()
        return (
          <div key={m.id}>
            {showDay && (
              <div className="my-3 text-center">
                <span className="rounded-md bg-surface2 px-2.5 py-1 text-[11px] text-fg2">{new Date(m.at).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </div>
            )}
            <Bubble m={m} lead={lead!} />
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )

  const Input = lead && <Composer lead={lead} ventanaMs={ventanaMs} onPlantillas={() => setPicker(true)} />

  return (
    <div>
      <PreviewBanner id="whatsapp" />
      <PageHeader
        kicker={t(closerId ? 'kicker.cartera' : 'kicker.equipo')}
        kickerTone={closerId ? 'cyan' : 'accent'}
        title={t('wa.titulo')}
        sub={t(closerId ? 'wa.subCloser' : 'wa.sub')}
        right={
          <div className="flex items-center gap-2 rounded-[10px] border border-ok/30 bg-[rgba(52,211,153,.07)] px-3 py-2 text-[12.5px]">
            <span className="relative flex h-2 w-2"><span className="ping-dot absolute h-full w-full rounded-full bg-ok" /><span className="relative h-2 w-2 rounded-full bg-ok" /></span>
            <span className="mono font-semibold">+1 (305) 555-0142</span>
            <span className="text-fg2">· {t('wa.apiOficial')} ·</span>
            <span className="font-semibold text-ok">{t('wa.conectado')}</span>
            <InfoPop text={`${tr('dev.numero.titulo', lang)} · ${tr('dev.numero.texto', lang)}`} label="" className="h-8 min-w-[32px]" />
          </div>
        }
      />
      <DevNotice k="whatsapp" className="mb-4" />

      <div className="card grid h-[calc(100dvh-210px)] min-h-[560px] overflow-hidden sm:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr_340px]">
        {/* lista */}
        <aside className={cn('flex min-h-0 flex-col border-line sm:border-r', mobileChat && 'hidden sm:flex')}>
          <div className="space-y-2 border-b border-line p-3">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input h-10 pl-9" placeholder={t('common.buscar')} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="no-scrollbar flex gap-1 overflow-x-auto">
              {(['mias', 'abiertas', 'sin_responder', 'con_cita'] as Filtro[]).map((f) => (
                <button key={f} onClick={() => setFiltro(f)} className={cn('h-9 flex-1 whitespace-nowrap rounded-lg px-1 text-[11.5px] font-semibold', filtro === f ? 'bg-[rgba(59,130,246,.14)] text-accent' : 'text-fg2 hover:bg-surface2')}>
                  {t(f === 'mias' ? (closerId ? 'wa.f.mias' : 'wa.f.todas') : `wa.f.${f}`)}
                  {f === 'sin_responder' && pendientes > 0 && <span className="mono ml-1 rounded-full bg-bad px-1.5 text-[10px] text-white">{pendientes}</span>}
                </button>
              ))}
            </div>
            {!closerId && (
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" data-tour="wa-closers">
                <button onClick={() => setVid('')} className={cn('h-9 shrink-0 rounded-full border px-3 text-[12px] font-semibold', !vid ? 'border-accent bg-[rgba(59,130,246,.12)] text-accent' : 'border-line text-fg2')}>
                  {t('chat.todosClosers')}
                </button>
                {vendedores.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVid(v.id)}
                    className={cn('flex h-9 shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[12px] font-semibold', vid === v.id ? 'border-accent bg-[rgba(59,130,246,.12)] text-accent' : 'border-line text-fg2')}
                  >
                    <Avatar initials={v.avatar} color={v.color} size={22} />
                    {v.nombre.split(' ')[0]}
                    <span className="mono text-[10.5px] opacity-70">{porCloser[v.id] ?? 0}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {convs.length === 0 && <Empty title={t('wa.sinConvs')} />}
            {convs.map((c, i) => {
              const v = vendedorById(c.lead.vendedorId)
              return (
                <button
                  key={c.lead.id}
                  data-trailer={i === 0 ? 'wa-conv-first' : undefined}
                  onClick={() => { setSel(c.lead.id); setMobileChat(true) }}
                  className={cn('flex min-h-[68px] w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left transition', sel === c.lead.id ? 'bg-[rgba(59,130,246,.08)]' : 'hover:bg-surface2/60')}
                >
                  <Avatar initials={c.lead.nombre.split(' ').map((p) => p[0]).join('').slice(0, 2)} color={c.pendiente ? '#f59e0b' : '#25d366'} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-[13.5px]', c.pendiente ? 'font-bold' : 'font-semibold')}>{c.lead.nombre}</span>
                      <span className={cn('shrink-0 text-[11px]', c.pendiente ? 'font-semibold text-warn' : 'text-muted')}>{c.last ? fmtRel(c.last.at, lang) : ''}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      {c.last && c.last.direccion === 'out' && <Ticks m={c.last} />}
                      <span className="truncate text-[12px] text-fg2">{c.last ? previewMsg(c.last, t, b) : t('wa.sinMensajes')}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted">
                      {!closerId && v && <span className="truncate">{v.nombre}</span>}
                      {c.abierta && <span className="font-semibold text-ok">● {t('chat.abierta')}</span>}
                    </span>
                  </span>
                  {c.pendiente && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warn" />}
                </button>
              )
            })}
          </div>
        </aside>

        {/* chat (≥640 inline) */}
        <section className="hidden min-h-0 flex-col sm:flex">
          {lead ? (
            <>
              {ChatHeader}
              {Burbujas}
              {Input}
            </>
          ) : (
            <Empty icon={<MessageCircle size={28} />} title={t('wa.elegiConv')} />
          )}
        </section>

        {/* ficha (≥1280) */}
        <aside className="hidden min-h-0 overflow-y-auto border-l border-line xl:block">{lead && <Ficha lead={lead} />}</aside>
      </div>

      {/* chat mobile a pantalla completa (sobre la bottom-nav) */}
      {lead && mobileChat && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] top-14 z-40 flex flex-col bg-bg sm:hidden">
          {ChatHeader}
          {Burbujas}
          <div className="[&>div]:pb-2.5">{Input}</div>
        </div>
      )}

      {lead && (
        <>
          <Drawer open={ficha} onClose={() => setFicha(false)} title={<span className="font-semibold">{t('wa.ficha')}</span>}>
            <Ficha lead={lead} />
          </Drawer>
          <PlantillaPicker lead={lead} open={picker} onClose={() => setPicker(false)} />
          <SeguimientoModal lead={lead} open={seg} onClose={() => setSeg(false)} />
          <Modal open={nota} onClose={() => setNota(false)} title={t('wa.notaDe', { n: lead.nombre })} width={480}>
            <div className="p-5">
              <NotasBlock lead={lead} autorId={role === 'admin' ? 'admin' : lead.vendedorId ?? 'admin'} />
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}
