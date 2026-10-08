import { FileText, Lock, Mic, Paperclip, Send, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, Button, InfoPop } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { HOUR, vendedorById } from '@/mock/base'
import type { Adjunto, Lead, Mensaje } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'
import { fmtBytes, fmtDur } from './Bubble'

const L = () => useApp.getState().lang

interface Props {
  lead: Lead
  ventanaMs: number
  onPlantillas: () => void
}

/** Input del chat: texto, adjuntos, audio y "responder como" (admin) */
export function Composer({ lead, ventanaMs, onPlantillas }: Props) {
  const { t } = useT()
  const role = useApp((s) => s.role)
  const send = useData((s) => s.sendMessage)
  const abierta = ventanaMs > 0
  const admin = role === 'admin'
  const closer = vendedorById(lead.vendedorId)
  const [como, setComo] = useState<'closer' | 'admin'>('closer')
  const [txt, setTxt] = useState('')
  const [file, setFile] = useState<Adjunto | null>(null)
  const [rec, setRec] = useState<{ start: number; real: boolean } | null>(null)
  const [, setTick] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // limpiar al cambiar de conversación
  useEffect(() => {
    setTxt('')
    setFile(null)
    cancelarGrabacion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

  useEffect(() => {
    if (!rec) return
    const iv = setInterval(() => setTick((x) => x + 1), 250)
    return () => clearInterval(iv)
  }, [rec])

  const extra = (): Partial<Mensaje> => (admin ? { enviadoPor: 'admin', comoCloser: como === 'closer' } : {})

  const enviar = () => {
    if (!txt.trim() && !file) return
    send(lead.id, { es: txt.trim(), en: txt.trim() }, undefined, false, { ...extra(), ...(file ? { adjunto: file } : {}) })
    if (file) toast.success(tr('chat.archivoEnviado', L(), { n: file.nombre }))
    setTxt('')
    setFile(null)
  }

  const elegirArchivo = (f: File | undefined) => {
    if (!f) return
    if (f.size > 100 * 1024 * 1024) {
      toast.error(tr('chat.muyGrande', L()))
      return
    }
    const imagen = f.type.startsWith('image/')
    setFile({ tipo: imagen ? 'imagen' : 'archivo', nombre: f.name, size: f.size, url: URL.createObjectURL(f) })
  }

  const grabar = async () => {
    chunks.current = []
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('no-media')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      mr.start()
      mediaRef.current = mr
      setRec({ start: Date.now(), real: true })
    } catch {
      // sin micrófono o permiso denegado: se simula la grabación
      setRec({ start: Date.now(), real: false })
    }
  }

  function cancelarGrabacion() {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop()
    streamRef.current?.getTracks().forEach((tr2) => tr2.stop())
    mediaRef.current = null
    streamRef.current = null
    setRec(null)
  }

  const enviarAudio = () => {
    if (!rec) return
    const dur = Math.max(1, Math.round((Date.now() - rec.start) / 1000))
    const finalizar = (url?: string) => {
      send(lead.id, { es: '', en: '' }, undefined, false, { ...extra(), adjunto: { tipo: 'audio', nombre: 'audio.webm', duracion: dur, url } })
      toast.success(tr('chat.audioEnviado', L()))
    }
    const mr = mediaRef.current
    if (rec.real && mr) {
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' })
        finalizar(URL.createObjectURL(blob))
      }
      mr.stop()
      streamRef.current?.getTracks().forEach((tr2) => tr2.stop())
      mediaRef.current = null
      streamRef.current = null
    } else finalizar()
    setRec(null)
  }

  const segs = rec ? (Date.now() - rec.start) / 1000 : 0

  return (
    <div className="border-t border-line bg-surface p-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] sm:pb-2.5" data-tour="wa-composer">
      {/* ventana 24 h + responder como */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className={cn('flex items-center gap-1.5 text-[11.5px] font-medium', abierta ? 'text-ok' : 'text-warn')}>
          {abierta ? <ShieldCheck size={13} /> : <Lock size={13} />}
          {abierta ? t('wa.ventanaAbierta', { h: Math.max(1, Math.floor(ventanaMs / HOUR)) }) : t('wa.ventanaCerrada')}
        </span>
        {admin && closer && (
          <div className="flex items-center gap-1.5 text-[11.5px]" data-tour="responder-como">
            <span className="text-fg2">{t('chat.responderComo')}</span>
            <div className="inline-flex rounded-lg border border-line bg-surface2 p-0.5">
              {(['closer', 'admin'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setComo(c)}
                  className={cn('flex h-8 items-center gap-1.5 rounded-md px-2 font-semibold', como === c ? 'bg-surface text-fg shadow-sm ring-1 ring-line dark:bg-[#27272a]' : 'text-fg2')}
                >
                  {c === 'closer' ? <Avatar initials={closer.avatar} color={closer.color} size={18} /> : <Avatar initials="MC" color="#3b82f6" size={18} />}
                  {c === 'closer' ? closer.nombre.split(' ')[0] : t('chat.yoAdmin')}
                </button>
              ))}
            </div>
          </div>
        )}
        <InfoPop text={t('wa.ventanaTip')} label="" className="ml-auto h-8 min-w-[32px]" />
      </div>

      {/* adjunto pendiente */}
      {file && (
        <div className="mb-2 flex items-center gap-2.5 rounded-[10px] border border-line bg-surface2 p-2">
          {file.tipo === 'imagen' && file.url ? <img src={file.url} alt="" className="h-12 w-12 rounded-md object-cover" /> : <span className="grid h-12 w-10 place-items-center rounded-md bg-bad/90 text-[9px] font-bold text-white">{(file.nombre.split('.').pop() ?? '').toUpperCase().slice(0, 4)}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold">{file.nombre}</span>
            <span className="block text-[11px] text-fg2">{fmtBytes(file.size)} · {t('chat.agregarTexto')}</span>
          </span>
          <Button size="icon" variant="ghost" onClick={() => setFile(null)} aria-label={t('common.cancelar')}>
            <X size={16} />
          </Button>
        </div>
      )}

      {!abierta ? (
        <Button variant="primary" className="w-full" onClick={onPlantillas} data-trailer="wa-elegir-plantilla">
          <FileText size={16} /> {t('wa.elegirPlantilla')}
        </Button>
      ) : rec ? (
        <div className="flex items-center gap-2">
          <Button size="icon" variant="danger" onClick={cancelarGrabacion} aria-label={t('common.cancelar')}>
            <Trash2 size={17} />
          </Button>
          <div className="flex h-11 flex-1 items-center gap-2.5 rounded-[8px] border border-bad/30 bg-[rgba(248,113,113,.06)] px-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-bad" />
            <span className="mono text-[13px] font-semibold">{fmtDur(segs)}</span>
            <div className="flex h-6 flex-1 items-center gap-[2px] overflow-hidden">
              {Array.from({ length: 40 }, (_, i) => (
                <span key={i} className="w-[3px] shrink-0 rounded-full bg-bad/70" style={{ height: `${20 + Math.abs(Math.sin(segs * 6 + i * 0.7)) * 80}%` }} />
              ))}
            </div>
            <span className="hidden text-[11.5px] text-fg2 sm:inline">{t('chat.grabando')}</span>
          </div>
          <Button size="icon" variant="primary" onClick={enviarAudio} aria-label={t('wa.enviar')}>
            <Send size={17} />
          </Button>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 sm:gap-2">
          <input ref={fileRef} type="file" className="hidden" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={(e) => { elegirArchivo(e.target.files?.[0]); e.target.value = '' }} />
          <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} aria-label={t('chat.adjuntar')} title={t('chat.adjuntar')} data-tour="wa-adjuntar">
            <Paperclip size={18} />
          </Button>
          <Button size="icon" variant="ghost" onClick={onPlantillas} aria-label={t('wa.elegirPlantilla')} title={t('wa.elegirPlantilla')} data-trailer="wa-elegir-plantilla">
            <FileText size={18} />
          </Button>
          <textarea
            rows={1}
            className="input min-h-[44px] flex-1 resize-none py-2.5"
            placeholder={file ? t('chat.comentario') : t('wa.escribir')}
            value={txt}
            onChange={(e) => setTxt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar()
              }
            }}
          />
          {txt.trim() || file ? (
            <Button size="icon" variant="primary" onClick={enviar} aria-label={t('wa.enviar')}>
              <Send size={17} />
            </Button>
          ) : (
            <Button size="icon" variant="primary" onClick={grabar} aria-label={t('chat.grabarAudio')} title={t('chat.grabarAudio')} data-tour="wa-audio">
              <Mic size={18} />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
