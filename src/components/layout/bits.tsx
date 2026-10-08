import { Gauge, MessageCircle, Moon, Sun } from 'lucide-react'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Segmented } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { cn, WA_URL } from '@/lib/utils'
import { defaultView, useApp } from '@/store/app'
import type { Role } from '@/mock/types'

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-accent text-white shadow-[0_6px_18px_-6px_rgba(59,130,246,.7)]">
        <Gauge size={19} strokeWidth={2.3} />
      </span>
      {!compact && (
        <span className="whitespace-nowrap text-[16px] font-bold tracking-tight">
          Campos <span className="text-accent">CRM</span>
        </span>
      )}
    </div>
  )
}

export function ThemeToggle() {
  const theme = useApp((s) => s.theme)
  const setTheme = useApp((s) => s.setTheme)
  const { t } = useT()
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px] border border-line bg-surface2 text-fg2 transition hover:text-fg"
      aria-label={t('topbar.tema')}
      title={t('topbar.tema')}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

export function LangToggle({ compactOnMobile, compactBelowXl }: { compactOnMobile?: boolean; compactBelowXl?: boolean }) {
  const lang = useApp((s) => s.lang)
  const setLang = useApp((s) => s.setLang)
  return (
    <>
      {(compactOnMobile || compactBelowXl) && (
        <button
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          className={cn('mono grid h-10 w-10 shrink-0 place-items-center rounded-[9px] border border-line bg-surface2 text-[12px] font-bold text-fg', compactBelowXl ? 'xl:hidden' : 'sm:hidden')}
          aria-label="ES/EN"
        >
          {lang.toUpperCase()}
        </button>
      )}
      <Segmented
        size="sm"
        className={cn(compactOnMobile && 'hidden sm:inline-flex', compactBelowXl && 'hidden xl:inline-flex')}
        value={lang}
        onChange={setLang}
        options={[
          { value: 'es', label: 'ES' },
          { value: 'en', label: 'EN' },
        ]}
      />
    </>
  )
}

/** Cambia el rol en vivo y resetea a la vista default del rol */
export function useSwitchRole() {
  const navigate = useNavigate()
  return useCallback(
    (r: Role) => {
      const st = useApp.getState()
      st.setRole(r)
      navigate(defaultView(r))
      toast.success(tr(r === 'admin' ? 'toast.rolAdmin' : 'toast.rolVendedor', st.lang))
    },
    [navigate],
  )
}

export function RoleSwitch({ className, full }: { className?: string; full?: boolean }) {
  const role = useApp((s) => s.role)
  const sw = useSwitchRole()
  const { t } = useT()
  return (
    <Segmented
      dataTour="switch-user"
      size="sm"
      className={cn(full && 'flex w-full [&>button]:flex-1', className)}
      value={role}
      onChange={(r) => r !== role && sw(r)}
      options={[
        { value: 'admin', label: t('rol.adminCorto') },
        { value: 'vendedor', label: t('rol.vendedorCorto') },
      ]}
    />
  )
}

export function WhatsAppCta({ iconOnlyBelowXl, className, label }: { iconOnlyBelowXl?: boolean; className?: string; label?: string }) {
  const { t } = useT()
  return (
    <a
      data-tour="whatsapp-cta"
      href={WA_URL}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[9px] bg-accent px-3.5 text-[13px] font-semibold text-white transition hover:bg-accent-strong hover:shadow-glow',
        iconOnlyBelowXl && 'w-10 px-0 2xl:w-auto 2xl:px-3.5',
        className,
      )}
      title={t('cta.quieroArrancar')}
    >
      <MessageCircle size={16} />
      <span className={cn(iconOnlyBelowXl && 'hidden 2xl:inline')}>{label ?? t('cta.quieroArrancar')}</span>
    </a>
  )
}

export function CtaBlock({ className }: { className?: string }) {
  const { t } = useT()
  return (
    <div className={cn('rounded-[12px] border border-accent/25 bg-[rgba(59,130,246,.06)] p-4', className)}>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="ping-dot absolute inline-flex h-full w-full rounded-full bg-accent" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-accent">Demo preview</span>
      </div>
      <p className="mt-2 text-[13.5px] font-medium">{t('cta.teGusto')}</p>
      <WhatsAppCta className="mt-3 h-11 w-full" />
      <p className="mt-3 text-center text-[10px] text-muted">Powered by Insights</p>
    </div>
  )
}
