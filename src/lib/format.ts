import type { Lang } from '@/mock/types'

const loc = (l: Lang) => (l === 'es' ? 'es-US' : 'en-US')

export function fmtMin(min: number): string {
  if (!isFinite(min) || min <= 0) return '—'
  if (min < 1) return '<1 min'
  if (min < 60) return `${Math.round(min)} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h < 24) return `${h}h ${String(m).padStart(2, '0')}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

/** cronómetro: 4:07 / 1h 12m / 3h 40m */
export function fmtElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export const fmtUSD = (n: number, compact = false) => {
  if (compact && Math.abs(n) >= 10000) return `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`
  return `$${Math.round(n).toLocaleString('en-US')}`
}

/** Montos de la propuesta: "USD 7.000" (es) / "USD 7,000" (en) */
export const fmtUSDProp = (n: number, l: Lang) => `USD ${n.toLocaleString(l === 'es' ? 'de-DE' : 'en-US')}`

export const fmtPct = (n: number, dec = 0) => `${(isFinite(n) ? n : 0).toFixed(dec)}%`
export const fmtNum = (n: number) => Math.round(n).toLocaleString('en-US')

export const fmtFecha = (t: number, l: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(t).toLocaleDateString(loc(l), opts)

export const fmtHora = (t: number, l: Lang) => new Date(t).toLocaleTimeString(loc(l), { hour: 'numeric', minute: '2-digit' })

export const fmtFechaHora = (t: number, l: Lang) =>
  `${new Date(t).toLocaleDateString(loc(l), { weekday: 'short', day: 'numeric', month: 'short' })} · ${fmtHora(t, l)}`

export function fmtRel(t: number, l: Lang): string {
  const diff = Date.now() - t
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(loc(l), { numeric: 'auto' })
  const sign = diff > 0 ? -1 : 1
  if (abs < 60_000) return l === 'es' ? 'recién' : 'just now'
  if (abs < 3_600_000) return rtf.format(sign * Math.round(abs / 60_000), 'minute')
  if (abs < 86_400_000) return rtf.format(sign * Math.round(abs / 3_600_000), 'hour')
  return rtf.format(sign * Math.round(abs / 86_400_000), 'day')
}

export const isSameDay = (a: number, b: number) => {
  const x = new Date(a)
  const y = new Date(b)
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate()
}
