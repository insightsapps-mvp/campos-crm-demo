import { Car, Check, CheckCheck, Download, FileText, Mic, Pause, Play, ShieldCheck, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '@/i18n'
import { fmtHora } from '@/lib/format'
import { cn } from '@/lib/utils'
import { vendedorById } from '@/mock/base'
import type { Adjunto, Lead, Mensaje } from '@/mock/types'

export const fmtBytes = (n?: number) => (!n ? '' : n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`)
export const fmtDur = (s = 0) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

/** texto corto para la lista de conversaciones */
export function previewMsg(m: Mensaje, t: (k: string) => string, b: (x: Mensaje['texto']) => string) {
  const txt = b(m.texto)
  if (!m.adjunto) return txt
  const icon = m.adjunto.tipo === 'audio' ? `🎤 ${t('chat.audio')} ${fmtDur(m.adjunto.duracion)}` : m.adjunto.tipo === 'imagen' ? `📷 ${t('chat.foto')}` : `📄 ${m.adjunto.nombre}`
  return txt ? `${icon} · ${txt}` : icon
}

export function Ticks({ m }: { m: Mensaje }) {
  if (m.direccion === 'in') return null
  if (m.estado === 'enviado') return <Check size={14} className="text-muted" />
  return <CheckCheck size={14} className={m.estado === 'leido' ? 'text-[#53bdeb]' : 'text-muted'} />
}

/** forma de onda determinística a partir del id */
function useBars(seed: string, n = 32) {
  return useMemo(() => {
    let h = 0
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return Array.from({ length: n }, () => {
      h = (h * 1103515245 + 12345) >>> 0
      return 0.25 + ((h >>> 16) % 1000) / 1333
    })
  }, [seed, n])
}

function AudioMsg({ a, id, out }: { a: Adjunto; id: string; out: boolean }) {
  const bars = useBars(id)
  const [playing, setPlaying] = useState(false)
  const [p, setP] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const dur = a.duracion ?? 10

  useEffect(() => {
    if (!playing) return
    if (a.url) {
      const el = audioRef.current
      if (!el) return
      el.play().catch(() => setPlaying(false))
      const up = () => setP(el.duration ? el.currentTime / el.duration : 0)
      const end = () => {
        setPlaying(false)
        setP(0)
      }
      el.addEventListener('timeupdate', up)
      el.addEventListener('ended', end)
      return () => {
        el.pause()
        el.removeEventListener('timeupdate', up)
        el.removeEventListener('ended', end)
      }
    }
    // audios mock: se simula la reproducción
    const start = Date.now() - p * dur * 1000
    const iv = setInterval(() => {
      const x = (Date.now() - start) / (dur * 1000)
      if (x >= 1) {
        setPlaying(false)
        setP(0)
      } else setP(x)
    }, 100)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  return (
    <div className="flex min-w-[220px] items-center gap-2.5 py-1">
      {a.url && <audio ref={audioRef} src={a.url} preload="metadata" />}
      <button
        onClick={() => setPlaying(!playing)}
        className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', out ? 'bg-emerald-700/20 text-emerald-900 dark:bg-white/15 dark:text-white' : 'bg-[#25d366] text-white')}
        aria-label="play"
      >
        {playing ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="flex h-7 items-center gap-[2px]">
          {bars.map((h, i) => (
            <span key={i} className={cn('w-[3px] rounded-full transition-colors', i / bars.length <= p ? (out ? 'bg-emerald-800 dark:bg-white' : 'bg-[#25d366]') : 'bg-current opacity-30')} style={{ height: `${h * 100}%` }} />
          ))}
        </div>
        <div className="mono flex items-center gap-1 text-[10.5px] opacity-70">
          <Mic size={10} /> {fmtDur(playing ? p * dur : dur)}
        </div>
      </div>
    </div>
  )
}

function Adj({ m }: { m: Mensaje }) {
  const { t } = useT()
  const a = m.adjunto!
  const out = m.direccion === 'out'
  if (a.tipo === 'audio') return <AudioMsg a={a} id={m.id} out={out} />
  if (a.tipo === 'imagen')
    return (
      <a href={a.url} target="_blank" rel="noreferrer" onClick={(e) => !a.url && e.preventDefault()} className="-mx-1.5 -mt-0.5 mb-1 block overflow-hidden rounded-[9px]">
        {a.url ? (
          <img src={a.url} alt={a.nombre} className="max-h-[260px] w-full max-w-[280px] object-cover" />
        ) : (
          <div className="grid h-[150px] w-[240px] place-items-center bg-gradient-to-br from-zinc-500 via-zinc-600 to-zinc-800 text-white/85">
            <div className="flex flex-col items-center gap-1 text-[11px]">
              <Car size={34} />
              {a.nombre}
            </div>
          </div>
        )}
      </a>
    )
  return (
    <a
      href={a.url}
      download={a.nombre}
      onClick={(e) => !a.url && e.preventDefault()}
      className={cn('-mx-0.5 mb-1 flex min-w-[220px] items-center gap-2.5 rounded-[9px] p-2', out ? 'bg-black/5 dark:bg-black/20' : 'bg-surface2')}
    >
      <span className="grid h-10 w-9 shrink-0 place-items-center rounded-md bg-bad/90 text-[9px] font-bold text-white">
        {(a.nombre.split('.').pop() ?? 'FILE').toUpperCase().slice(0, 4)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold">{a.nombre}</span>
        <span className="block text-[11px] opacity-70">
          {fmtBytes(a.size)} · {t('chat.documento')}
        </span>
      </span>
      <Download size={16} className="shrink-0 opacity-70" />
    </a>
  )
}

export function Bubble({ m, lead }: { m: Mensaje; lead: Lead }) {
  const { t, b, lang } = useT()
  const out = m.direccion === 'out'
  const txt = b(m.texto)
  const closer = vendedorById(lead.vendedorId)?.nombre.split(' ')[0] ?? ''
  return (
    <div className={cn('flex', out ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'anim-rise max-w-[82%] rounded-[12px] px-3 py-1.5 text-[13.5px] leading-snug shadow-sm sm:max-w-[70%]',
          out ? 'rounded-tr-sm bg-[#d9fdd3] text-zinc-900 dark:bg-[#005c4b] dark:text-white' : 'rounded-tl-sm border border-line bg-surface',
        )}
      >
        {m.enviadoPor === 'admin' && (
          <div className="mb-0.5 flex items-center gap-1 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300">
            <ShieldCheck size={10} /> {m.comoCloser ? t('chat.adminComo', { n: closer }) : t('chat.adminDirecto')}
          </div>
        )}
        {m.plantillaId && (
          <div className={cn('mb-0.5 flex items-center gap-1 text-[10.5px] font-semibold', out ? 'text-emerald-800 dark:text-emerald-200' : 'text-fg2')}>
            {m.auto ? <Zap size={10} /> : <FileText size={10} />} {t(m.auto ? 'wa.automatico' : 'wa.plantilla')}
          </div>
        )}
        {m.adjunto && <Adj m={m} />}
        {txt && <div className="whitespace-pre-wrap break-words">{txt}</div>}
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10.5px] opacity-70">
          {fmtHora(m.at, lang)} <Ticks m={m} />
        </div>
      </div>
    </div>
  )
}
