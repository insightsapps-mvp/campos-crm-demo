import { Check, ChevronDown, Eye, Wrench } from 'lucide-react'
import { useState } from 'react'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'

const key = (id: string) => `ccrm_banner_${id}`
const readCollapsed = (id: string) => {
  try {
    return sessionStorage.getItem(key(id)) === '1'
  } catch {
    return false
  }
}

/** Banner "Qué hace este módulo cuando esté funcional" (colapsable por sesión) */
export function PreviewBanner({ id }: { id: string }) {
  const { t } = useT()
  const [collapsed, setCollapsed] = useState(() => readCollapsed(id))
  const toggle = () => {
    const v = !collapsed
    setCollapsed(v)
    try {
      sessionStorage.setItem(key(id), v ? '1' : '0')
    } catch {
      /* noop */
    }
  }
  return (
    <div className="no-print mb-5 overflow-hidden rounded-[12px] border border-accent/20 bg-gradient-to-br from-[rgba(59,130,246,.08)] to-transparent">
      <button onClick={toggle} className="flex min-h-[48px] w-full flex-wrap items-center gap-2 px-4 py-2.5 text-left">
        <span className="pill bg-[rgba(59,130,246,.15)] text-accent">
          <Eye size={12} /> {t('banner.previewNavegable')}
        </span>
        <span className="pill bg-surface2 text-fg2">{t('banner.datosMock')}</span>
        <span className="min-w-0 flex-1 text-[13px] font-semibold">{t('banner.titulo')}</span>
        <ChevronDown size={16} className={cn('text-fg2 transition', !collapsed && 'rotate-180')} />
      </button>
      {!collapsed && (
        <ul className="grid gap-2 px-4 pb-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex gap-2 text-[12.5px] leading-snug text-fg2">
              <Check size={14} className="mt-0.5 shrink-0 text-accent" />
              {t(`banner.${id}.${n}`)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Aviso ámbar sobre una función simulada */
export function DevNotice({ k, className }: { k: string; className?: string }) {
  const { t } = useT()
  return (
    <div className={cn('flex gap-2.5 rounded-[10px] border border-warn/30 bg-[rgba(245,158,11,.08)] px-3.5 py-2.5 text-[12.5px] leading-snug', className)}>
      <Wrench size={15} className="mt-0.5 shrink-0 text-warn" />
      <div>
        <b className="font-semibold text-warn">{t(`dev.${k}.titulo`)}</b>
        <span className="text-fg2"> · {t('dev.enDesarrollo')} — {t(`dev.${k}.texto`)}</span>
      </div>
    </div>
  )
}
