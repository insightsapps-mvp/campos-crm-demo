import * as Popover from '@radix-ui/react-popover'
import { Info, X } from 'lucide-react'
import { forwardRef, useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { fmtElapsed } from '@/lib/format'
import { useT } from '@/i18n'

/* ───────── Button ───────── */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success'
type BtnSize = 'sm' | 'md' | 'lg' | 'icon'
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...p },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[8px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' && 'h-11 px-3 text-[13px] sm:h-9',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-[15px]',
        size === 'icon' && 'h-11 w-11',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-strong hover:shadow-glow',
        variant === 'secondary' && 'border border-line bg-surface2 text-fg hover:border-accent/40',
        variant === 'outline' && 'border border-line bg-transparent text-fg hover:bg-surface2',
        variant === 'ghost' && 'text-fg2 hover:bg-surface2 hover:text-fg',
        variant === 'danger' && 'border border-bad/30 bg-bad/10 text-bad hover:bg-bad/20',
        variant === 'success' && 'border border-ok/30 bg-ok/10 text-ok hover:bg-ok/20',
        className,
      )}
      {...p}
    />
  )
})

/* ───────── Badge ───────── */
export type Tone = 'accent' | 'ok' | 'warn' | 'bad' | 'muted' | 'violet' | 'cyan'
const toneCls: Record<Tone, string> = {
  accent: 'bg-accent/12 text-accent bg-[rgba(59,130,246,.12)]',
  ok: 'bg-[rgba(52,211,153,.12)] text-ok',
  warn: 'bg-[rgba(245,158,11,.14)] text-warn',
  bad: 'bg-[rgba(248,113,113,.13)] text-bad',
  muted: 'bg-surface2 text-fg2',
  violet: 'bg-[rgba(167,139,250,.14)] text-violet',
  cyan: 'bg-[rgba(34,211,238,.13)] text-cyan',
}
export function Badge({ tone = 'muted', className, children, dot }: { tone?: Tone; className?: string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn('pill whitespace-nowrap', toneCls[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/* ───────── Card ───────── */
export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...p}>
      {children}
    </div>
  )
}
export function CardHead({ title, sub, right, icon }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <div className="mt-0.5 text-accent">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
          {sub && <p className="mt-0.5 text-[12.5px] text-fg2">{sub}</p>}
        </div>
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  )
}

/* ───────── Page header ───────── */
export function PageHeader({ kicker, title, sub, right, kickerTone }: { kicker: string; title: string; sub?: string; right?: ReactNode; kickerTone?: 'cyan' | 'accent' }) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className={cn('kicker mb-1.5', kickerTone === 'cyan' ? 'text-cyan' : 'text-accent')}>{kicker}</div>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-fg2">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  )
}

/* ───────── Modal (centrado con m-auto, animación por propiedades individuales) ───────── */
export function Modal({
  open, onClose, children, width = 520, closeOnBackdrop = true, title, z = 80, hideClose, dataAttr,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: number
  closeOnBackdrop?: boolean
  title?: ReactNode
  z?: number
  hideClose?: boolean
  dataAttr?: string
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && closeOnBackdrop && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose, closeOnBackdrop])
  if (!open) return null
  return createPortal(
    <div style={{ zIndex: z }} className="fixed inset-0">
      <div className="anim-fade absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => closeOnBackdrop && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        data-modal={dataAttr}
        style={{ width: `min(${width}px, calc(100vw - 32px))` }}
        className="anim-modal fixed inset-0 m-auto h-fit max-h-[88vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl"
      >
        {(title || !hideClose) && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-5 py-3.5 backdrop-blur">
            <div className="min-w-0 text-[15px] font-semibold">{title}</div>
            {!hideClose && (
              <button onClick={onClose} className="tap -mr-2 grid place-items-center rounded-lg text-fg2 hover:bg-surface2" aria-label="Cerrar">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

/* ───────── Drawer: panel lateral (≥640) / sheet casi completo (<640) ───────── */
export function Drawer({ open, onClose, children, title, width = 460 }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="anim-fade absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        style={{ ['--w' as string]: `min(92vw, ${width}px)` }}
        className="anim-sheet sm:anim-drawer absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col rounded-t-2xl border border-line bg-surface sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[var(--w)] sm:rounded-none sm:rounded-l-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="min-w-0 flex-1">{title}</div>
          <button onClick={onClose} className="tap -mr-2 grid place-items-center rounded-lg text-fg2 hover:bg-surface2" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-safe">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}

/* ───────── Bottom Sheet ───────── */
export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[75]">
      <div className="anim-fade absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="anim-sheet absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl border border-line bg-surface">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line" />
        {title && (
          <div className="flex items-center justify-between px-5 pb-1 pt-2">
            <div className="text-[15px] font-semibold">{title}</div>
            <button onClick={onClose} className="tap -mr-2 grid place-items-center rounded-lg text-fg2" aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/* ───────── Segmented ───────── */
export function Segmented<T extends string>({
  value, onChange, options, size = 'md', className, dataTour,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  size?: 'sm' | 'md'
  className?: string
  dataTour?: string
}) {
  return (
    <div data-tour={dataTour} className={cn('inline-flex rounded-[9px] border border-line bg-surface2 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-[7px] px-2.5 font-semibold transition',
            size === 'sm' ? 'h-9 min-w-[40px] text-[12px]' : 'h-10 min-w-[44px] text-[13px]',
            value === o.value ? 'bg-surface text-fg shadow-sm ring-1 ring-line dark:bg-[#27272a]' : 'text-fg2 hover:text-fg',
          )}
          aria-pressed={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ───────── Tabs (subrayado) ───────── */
export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'relative flex h-11 shrink-0 items-center gap-2 px-3 text-[13.5px] font-semibold transition',
            value === o.value ? 'text-accent' : 'text-fg2 hover:text-fg',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="mono rounded-full bg-surface2 px-1.5 text-[11px] text-fg2">{o.count}</span>}
          {value === o.value && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  )
}

/* ───────── Avatar ───────── */
export function Avatar({ initials, color, size = 32, ring }: { initials: string; color: string; size?: number; ring?: boolean }) {
  return (
    <span
      style={{ width: size, height: size, background: `${color}22`, color, fontSize: size * 0.36 }}
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-bold', ring && 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--surface)]')}
    >
      {initials}
    </span>
  )
}

/* ───────── KPI ───────── */
export function Kpi({
  label, value, delta, deltaGood, sub, icon, accent, spark, dataTrailer,
}: {
  label: string
  value: ReactNode
  delta?: string
  deltaGood?: boolean
  sub?: ReactNode
  icon?: ReactNode
  accent?: string
  spark?: number[]
  dataTrailer?: string
}) {
  return (
    <div className="card relative overflow-hidden p-4 sm:p-5" data-trailer={dataTrailer}>
      <div className="flex items-start justify-between gap-2">
        <div className="label-up">{label}</div>
        {icon && <div style={{ color: accent ?? '#3b82f6' }}>{icon}</div>}
      </div>
      <div className="mono mt-2 font-bold leading-none tracking-tight" style={{ fontSize: 'clamp(26px, 6vw, 34px)' }}>
        {value}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-fg2">
        {delta && <Badge tone={deltaGood ? 'ok' : 'bad'}>{delta}</Badge>}
        {sub}
      </div>
      {spark && spark.length > 1 && <Spark data={spark} color={accent ?? '#3b82f6'} />}
    </div>
  )
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`).join(' ')
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 right-0 h-10 w-28 opacity-50">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/* ───────── ⓘ En desarrollo (popover por tap) ───────── */
export function InfoPop({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { t } = useT()
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className={cn('inline-flex h-11 min-w-[44px] items-center justify-center gap-1 rounded-lg px-2 text-[12px] font-medium text-fg2 hover:bg-surface2 sm:h-8', className)}>
          <Info size={14} />
          {label ?? t('common.enDesarrollo')}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6} collisionPadding={12} className="z-[95] max-w-[min(280px,calc(100vw-24px))] rounded-lg border border-line bg-surface p-3 text-[12.5px] leading-snug text-fg shadow-xl">
          {text}
          <Popover.Arrow className="fill-[var(--surface)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/* ───────── Popover genérico por tap ───────── */
export function TapPop({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6} collisionPadding={12} className="z-[95] max-w-[min(300px,calc(100vw-24px))] rounded-lg border border-line bg-surface p-3 text-[12.5px] leading-snug text-fg shadow-xl">
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/* ───────── Cronómetro en vivo ───────── */
export function LiveTimer({ since, warnAfterMin = 30, className }: { since: number; warnAfterMin?: number; className?: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const ms = now - since
  const late = ms > warnAfterMin * 60_000
  return (
    <span className={cn('mono inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12.5px] font-semibold', late ? 'bg-[rgba(248,113,113,.13)] text-bad' : 'bg-[rgba(245,158,11,.13)] text-warn', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', late ? 'bg-bad' : 'bg-warn', 'animate-pulse')} />
      {fmtElapsed(ms)}
    </span>
  )
}

/* ───────── Empty state ───────── */
export function Empty({ icon, title, sub }: { icon?: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <div className="text-sm font-semibold">{title}</div>
      {sub && <div className="max-w-xs text-[12.5px] text-fg2">{sub}</div>}
    </div>
  )
}

/* ───────── Select nativo estilizado ───────── */
export function Select({ value, onChange, children, className, ariaLabel }: { value: string; onChange: (v: string) => void; children: ReactNode; className?: string; ariaLabel?: string }) {
  return (
    <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} className={cn('input h-11 cursor-pointer pr-8 sm:h-10', className)}>
      {children}
    </select>
  )
}

/* ───────── Barra horizontal simple ───────── */
export function HBar({ value, max, color = '#3b82f6', marker, height = 8 }: { value: number; max: number; color?: string; marker?: number; height?: number }) {
  const w = Math.max(2, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div className="relative w-full rounded-full bg-surface2" style={{ height }}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${w}%`, background: color }} />
      {marker !== undefined && (
        <div className="absolute -top-1 w-0.5 rounded bg-fg/60" style={{ left: `${Math.min(100, (marker / (max || 1)) * 100)}%`, height: height + 8 }} />
      )}
    </div>
  )
}
