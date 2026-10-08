import type { ReactNode } from 'react'
import { useT } from '@/i18n'

export const C = {
  velocidad: '#3b82f6',
  agenda: '#a78bfa',
  cierre: '#34d399',
  bad: '#f87171',
  warn: '#f59e0b',
  cyan: '#22d3ee',
  muted: '#71717a',
}

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11, fill: 'var(--muted)' },
} as const

interface TipProps {
  active?: boolean
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }[]
  label?: string | number
  fmt?: (v: number, key: string) => string
  names?: Record<string, string>
}

export function ChartTip({ active, payload, label, fmt, names }: TipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-[#18181b] px-3 py-2 text-[12px] text-zinc-100 shadow-xl">
      {label !== undefined && <div className="mb-1 font-semibold text-zinc-300">{label}</div>}
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-400">{names?.[String(p.dataKey)] ?? p.name}</span>
          <span className="mono ml-auto pl-3 font-semibold">{fmt ? fmt(Number(p.value), String(p.dataKey)) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Legend({ items }: { items: { color: string; label: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-fg2">
      {items.map((i, k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

/** Embudo de barras horizontales; marca la etapa con la mayor caída vs el promedio */
export function Funnel({
  stages, compare, compact,
}: {
  stages: { key: string; label: string; value: number }[]
  compare?: number[] // conversiones del equipo (0-1) por etapa i (i>0)
  compact?: boolean
}) {
  const { t } = useT()
  const max = stages[0]?.value || 1
  const conv = stages.map((s, i) => (i === 0 ? 1 : s.value / (stages[i - 1].value || 1)))
  let worst = -1
  if (compare) {
    let worstGap = 0.06
    conv.forEach((c, i) => {
      if (i === 0) return
      const gap = (compare[i] ?? c) - c
      if (gap / (compare[i] || 1) > worstGap) {
        worstGap = gap / (compare[i] || 1)
        worst = i
      }
    })
  }
  const colors = ['#3b82f6', '#60a5fa', '#a78bfa', '#34d399']
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      {stages.map((s, i) => (
        <div key={s.key}>
          <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
            <span className={i === worst ? 'font-semibold text-bad' : 'text-fg2'}>
              {s.label}
              {i === worst && <span className="ml-1.5 rounded bg-[rgba(248,113,113,.13)] px-1.5 py-0.5 text-[10px] font-bold uppercase">{t('dash.capacitarAca')}</span>}
            </span>
            <span className="mono font-semibold">
              {s.value.toLocaleString('en-US')}
              {i > 0 && <span className="ml-1.5 text-fg2">{Math.round(conv[i] * 100)}%</span>}
            </span>
          </div>
          <div className={compact ? 'h-2 rounded-full bg-surface2' : 'h-3 rounded-full bg-surface2'}>
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${Math.max(2, (s.value / max) * 100)}%`, background: i === worst ? '#f87171' : colors[i] }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
