import { CheckCheck, Clock, Pencil, Play, Save, Tag, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DevNotice, PreviewBanner } from '@/components/layout/Notices'
import { Badge, Button, Card, CardHead, Modal, PageHeader, Select, Tabs } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtFecha, fmtFechaHora, fmtRel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { HOUR } from '@/mock/base'
import { rellenar } from '@/mock/mensajes'
import type { AutoMensaje, Lead } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'
import { CalificacionYReparto, Toggle } from './auto/Reparto'

const L = () => useApp.getState().lang

function EditarTexto({ am, open, onClose }: { am: AutoMensaje; open: boolean; onClose: () => void }) {
  const { t, lang } = useT()
  const upd = useData((s) => s.updateAutoMensaje)
  const [txt, setTxt] = useState(am.texto[lang])
  useEffect(() => setTxt(am.texto[lang]), [am, lang, open])
  return (
    <Modal open={open} onClose={onClose} title={t('auto.editarTexto', { o: am.offset[lang] })} width={560}>
      <div className="space-y-3 p-5">
        <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={5} className="input h-auto py-3 leading-relaxed" />
        <div className="flex flex-wrap gap-1.5 text-[11.5px] text-fg2">
          {t('auto.variables')}
          {['{{nombre}}', '{{vehiculo}}', '{{vendedor}}', '{{fecha}}', '{{hora}}'].map((v) => (
            <button key={v} onClick={() => setTxt((x) => `${x} ${v}`)} className="mono rounded bg-surface2 px-1.5 py-0.5 hover:text-accent">{v}</button>
          ))}
        </div>
        <p className="text-[12px] text-warn">{t('auto.editarNota')}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>{t('common.cancelar')}</Button>
          <Button
            variant="primary"
            onClick={() => {
              upd(am.id, { texto: { ...am.texto, [lang]: txt } })
              toast.success(tr('toast.textoGuardado', L()))
              onClose()
            }}
          >
            <Save size={15} /> {t('common.guardar')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PlantillaSelect({ am }: { am: AutoMensaje }) {
  const { t, b } = useT()
  const plantillas = useData((s) => s.plantillas)
  const upd = useData((s) => s.updateAutoMensaje)
  return (
    <Select
      ariaLabel={t('auto.plantilla')}
      value={am.plantillaId}
      onChange={(id) => {
        const p = plantillas.find((x) => x.id === id)!
        upd(am.id, { plantillaId: id, texto: p.cuerpo })
        toast.success(tr('toast.plantillaCambiada', L()))
      }}
      className="h-10 text-[12.5px]"
    >
      {plantillas.map((p) => (
        <option key={p.id} value={p.id} disabled={p.estadoMeta !== 'aprobada' && p.id !== am.plantillaId}>
          {b(p.nombre)} {p.estadoMeta !== 'aprobada' ? `(${t(`meta.${p.estadoMeta}`)})` : ''}
        </option>
      ))}
    </Select>
  )
}

/* ─────────── Post-compra ─────────── */
function PostCompra() {
  const { t, b, lang } = useT()
  const autoMensajes = useData((s) => s.autoMensajes)
  const ejecuciones = useData((s) => s.ejecuciones)
  const leads = useData((s) => s.leads)
  const addEjecucion = useData((s) => s.addEjecucion)
  const openLead = useUI((s) => s.openLead)
  const pasos = autoMensajes.filter((a) => a.flujo === 'postcompra')
  const [step, setStep] = useState(-1)
  const [dia, setDia] = useState(0)
  const [lead, setLead] = useState<Lead | null>(null)
  const [edit, setEdit] = useState<AutoMensaje | null>(null)
  const timers = useRef<number[]>([])

  const limpiar = useCallback(() => {
    timers.current.forEach((x) => clearTimeout(x))
    timers.current = []
  }, [])
  useEffect(() => limpiar, [limpiar])

  const contar = (from: number, to: number, at: number) => {
    const steps = 7
    for (let i = 1; i <= steps; i++) timers.current.push(window.setTimeout(() => setDia(from + Math.round(((to - from) * i) / steps)), at + (1500 / steps) * i))
  }

  const simular = () => {
    limpiar()
    const candidatos = leads.filter((l) => l.estado === 'negociacion' || l.estado === 'cita_realizada')
    const l = candidatos[Math.floor(Math.random() * Math.min(10, candidatos.length))] ?? leads[0]
    setLead(l)
    setDia(0)
    setStep(0)
    const seq: [number, number][] = [[1, 700], [2, 1400], [3, 2900], [4, 3600], [5, 5100], [6, 5800]]
    for (const [s, at] of seq) timers.current.push(window.setTimeout(() => setStep(s), at))
    contar(0, 7, 1400)
    contar(7, 14, 3600)
    timers.current.push(
      window.setTimeout(() => {
        addEjecucion(l.id)
        toast.success(tr('toast.simOk', L(), { n: l.nombre }), { description: tr('toast.simDesc', L()) })
      }, 5900),
    )
  }

  const nodos = [
    { k: 'trigger', s: 0 },
    { k: 'm1', s: 1, am: pasos[0] },
    { k: 'w1', s: 2 },
    { k: 'm2', s: 3, am: pasos[1] },
    { k: 'w2', s: 4 },
    { k: 'm3', s: 5, am: pasos[2] },
  ]

  return (
    <div className="space-y-5">
      <DevNotice k="cola" />
      <Card data-trailer="flujo">
        <CardHead
          icon={<Zap size={16} />}
          title={t('auto.pc.titulo')}
          sub={t('auto.pc.sub')}
          right={
            <div className="flex w-full items-center gap-3 sm:w-auto">
              {step >= 0 && (
                <span className="mono rounded-lg bg-[rgba(59,130,246,.12)] px-3 py-2 text-[14px] font-bold text-accent">
                  {t('auto.dia')} {dia}
                </span>
              )}
              <Button variant="primary" onClick={simular} className="w-full sm:w-auto" data-trailer="simular-compra" data-tour="simular">
                <Play size={15} /> {t('auto.simular')}
              </Button>
            </div>
          }
        />
        {lead && step >= 0 && (
          <div className="border-b border-line bg-surface2/40 px-4 py-2.5 text-[12.5px] sm:px-5">
            {t('auto.simLead', { n: lead.nombre, v: lead.vehiculoInteres })}
          </div>
        )}
        <div className="scroll-x p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:min-w-[980px] lg:flex-row lg:items-stretch">
            {nodos.map((n, i) => {
              const activo = step === n.s
              const hecho = step > n.s
              const esWait = n.k.startsWith('w')
              return (
                <div key={n.k} className={cn('flex flex-col lg:flex-row lg:items-center', esWait ? 'lg:w-[110px] lg:shrink-0' : 'lg:flex-1')}>
                  {i > 0 && <div className={cn('mx-auto h-4 w-0.5 lg:mx-0 lg:h-0.5 lg:w-4 lg:shrink-0', hecho || activo ? 'bg-accent' : 'bg-line')} />}
                  {esWait ? (
                    <div className={cn('flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold transition lg:flex-col lg:rounded-[12px] lg:py-3', activo ? 'border-accent bg-[rgba(59,130,246,.12)] text-accent' : hecho ? 'border-accent/40 text-accent' : 'border-dashed border-line text-fg2')}>
                      <Clock size={14} className={activo ? 'animate-spin [animation-duration:2s]' : ''} /> {t('auto.espera7')}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'flex-1 rounded-[12px] border p-3.5 transition-all duration-300',
                        activo ? 'border-accent bg-[rgba(59,130,246,.1)] shadow-[0_0_24px_rgba(59,130,246,.35)]' : hecho ? 'border-accent/40' : 'border-line',
                      )}
                    >
                      {n.k === 'trigger' ? (
                        <>
                          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-accent"><Tag size={13} /> {t('auto.disparador')}</div>
                          <div className="mt-1.5 text-[14px] font-semibold">{t('auto.etiquetaComprador')}</div>
                          <div className="mt-1 text-[12px] text-fg2">{t('auto.reglaCancel')}</div>
                        </>
                      ) : (
                        n.am && (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{t('auto.mensaje')} {Math.ceil(n.s / 2)} · {b(n.am.offset)}</span>
                              <button onClick={() => setEdit(n.am!)} className="grid h-9 w-9 place-items-center rounded-lg text-fg2 hover:bg-surface2" aria-label={t('auto.editar')}><Pencil size={14} /></button>
                            </div>
                            <div className="mt-1 text-[13.5px] font-semibold">{t(`auto.pc.m${Math.ceil(n.s / 2)}`)}</div>
                            <div className="mt-2"><PlantillaSelect am={n.am} /></div>
                            {(hecho || activo) && lead && (
                              <div className="anim-rise mt-2.5 rounded-[10px] bg-[#d9fdd3] px-2.5 py-1.5 text-[12px] leading-snug text-zinc-900 dark:bg-[#005c4b] dark:text-white">
                                {rellenar(b(n.am.texto), lead)}
                                <div className="mt-0.5 flex justify-end"><CheckCheck size={13} className={hecho ? 'text-[#53bdeb]' : 'opacity-60'} /></div>
                              </div>
                            )}
                          </>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <Card>
        <CardHead title={t('auto.ejecuciones')} sub={t('auto.ejecucionesSub')} />
        <div className="scroll-x hidden sm:block">
          <table className="w-full min-w-[680px] text-[13px]">
            <thead className="bg-surface2/50">
              <tr className="text-left">
                <th className="label-up px-4 py-2">{t('auto.comprador')}</th>
                <th className="label-up px-2 py-2">{t('auto.fechaCompra')}</th>
                <th className="label-up px-2 py-2">{t('auto.pasoActual')}</th>
                <th className="label-up px-2 py-2">{t('auto.proximoEnvio')}</th>
                <th className="label-up px-4 py-2">{t('auto.estado')}</th>
              </tr>
            </thead>
            <tbody>
              {ejecuciones.map((e) => {
                const l = leads.find((x) => x.id === e.leadId)
                return (
                  <tr key={e.id} onClick={() => l && openLead(l.id)} className="cursor-pointer border-t border-line hover:bg-surface2/50">
                    <td className="px-4 py-2.5 font-semibold">{l?.nombre}<div className="text-[11.5px] font-normal text-fg2">{l?.vehiculoInteres}</div></td>
                    <td className="px-2 py-2.5 text-fg2">{fmtFecha(e.compradoAt, lang)} · {fmtRel(e.compradoAt, lang)}</td>
                    <td className="px-2 py-2.5"><span className="mono font-semibold">{e.paso}/3</span></td>
                    <td className="px-2 py-2.5 text-fg2">{e.proximoEnvio ? fmtFechaHora(e.proximoEnvio, lang) : '—'}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={e.estado === 'cancelado' ? 'bad' : e.estado === 'programado' ? 'violet' : 'ok'}>{t(`ejec.${e.estado}`)}</Badge>
                      {e.estado === 'cancelado' && <div className="mt-0.5 text-[11px] text-muted">{t('auto.canceladoMotivo')}</div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-line sm:hidden">
          {ejecuciones.map((e) => {
            const l = leads.find((x) => x.id === e.leadId)
            return (
              <button key={e.id} onClick={() => l && openLead(l.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{l?.nombre}</span>
                  <span className="block text-[12px] text-fg2">{t('auto.pasoActual')} {e.paso}/3 · {e.proximoEnvio ? fmtFecha(e.proximoEnvio, lang) : '—'}</span>
                </span>
                <Badge tone={e.estado === 'cancelado' ? 'bad' : e.estado === 'programado' ? 'violet' : 'ok'}>{t(`ejec.${e.estado}`)}</Badge>
              </button>
            )
          })}
        </div>
      </Card>
      {edit && <EditarTexto am={edit} open={!!edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

/* ─────────── Recordatorios de cita ─────────── */
function Recordatorios() {
  const { t, b, lang } = useT()
  const autoMensajes = useData((s) => s.autoMensajes)
  const upd = useData((s) => s.updateAutoMensaje)
  const plantillas = useData((s) => s.plantillas)
  const leads = useData((s) => s.leads)
  const [edit, setEdit] = useState<AutoMensaje | null>(null)
  const ejemplo = useMemo(() => leads.find((l) => l.citaAt && l.citaAt > Date.now()) ?? leads[0], [leads])
  const d = new Date(ejemplo.citaAt ?? Date.now() + 24 * HOUR)
  const vars = { fecha: d.toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' }), hora: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }
  const recs = autoMensajes.filter((a) => a.flujo === 'recordatorio')
  return (
    <div className="space-y-5">
      <DevNotice k="cola" />
      <p className="text-[13px] text-fg2">{t('auto.rec.intro')}</p>
      <div className="grid gap-4 md:grid-cols-2" data-tour="recordatorios">
        {recs.map((am) => {
          const p = plantillas.find((x) => x.id === am.plantillaId)
          const bloqueada = p?.estadoMeta !== 'aprobada'
          return (
            <Card key={am.id} className={cn(!am.activo && 'opacity-70')}>
              <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-accent">{b(am.offset)}</div>
                  <div className="truncate text-[13.5px] font-semibold">{t(`auto.rec.${am.id}`)}</div>
                </div>
                <Toggle
                  on={am.activo}
                  label={b(am.offset)}
                  onChange={(on) => {
                    if (on && bloqueada) {
                      toast.warning(tr('toast.plantillaNoAprobada', L()))
                      return
                    }
                    upd(am.id, { activo: on })
                    toast.success(tr(on ? 'toast.recActivado' : 'toast.recDesactivado', L()))
                  }}
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1"><PlantillaSelect am={am} /></div>
                  <Button size="icon" variant="secondary" onClick={() => setEdit(am)} aria-label={t('auto.editar')}><Pencil size={15} /></Button>
                </div>
                {bloqueada && <Badge tone="warn">{t('auto.rec.enRevision')}</Badge>}
                <div className="rounded-[10px] bg-[#0b141a] p-3">
                  <div className="ml-auto max-w-[92%] rounded-[10px] rounded-tr-sm bg-[#005c4b] px-3 py-2 text-[12.5px] leading-snug text-white">
                    {rellenar(b(am.texto), ejemplo, vars)}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      {edit && <EditarTexto am={edit} open={!!edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

type Tab = 'postcompra' | 'recordatorios' | 'reparto'

export default function Automatizaciones() {
  const { t } = useT()
  const [tab, setTab] = useState<Tab>('postcompra')
  return (
    <div>
      <PreviewBanner id="automatizaciones" />
      <PageHeader kicker={t('kicker.equipo')} title={t('auto.titulo')} sub={t('auto.sub')} />
      <div className="mb-5">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'postcompra', label: t('auto.tab.postcompra') },
            { value: 'recordatorios', label: t('auto.tab.recordatorios') },
            { value: 'reparto', label: t('auto.tab.reparto') },
          ]}
        />
      </div>
      {tab === 'postcompra' && <PostCompra />}
      {tab === 'recordatorios' && <Recordatorios />}
      {tab === 'reparto' && <CalificacionYReparto />}
    </div>
  )
}
