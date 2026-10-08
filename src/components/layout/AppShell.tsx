import * as DM from '@radix-ui/react-dropdown-menu'
import { ArrowLeft, ChevronDown, LogOut, Menu, MoreHorizontal, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LeadDrawer } from '@/components/lead/LeadDrawer'
import { Avatar, Sheet } from '@/components/ui'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { DANIELA_ID, vendedorById } from '@/mock/base'
import { useApp } from '@/store/app'
import { CtaBlock, LangToggle, Logo, RoleSwitch, ThemeToggle, WhatsAppCta, useSwitchRole } from './bits'
import { bottomTabs, navFor, sheetItems, type NavItem } from './nav'

/** Navegar desde el menú cancela la previsualización y la vista "como closer" */
export function useMenuNav() {
  const navigate = useNavigate()
  return useCallback(
    (path: string) => {
      const st = useApp.getState()
      if (st.preview) st.cancelarPreview()
      if (st.viewAs) st.setViewAs(null)
      navigate(path)
    },
    [navigate],
  )
}

const isActive = (item: NavItem, pathname: string) => {
  if (item.children) return item.children.some((c) => pathname.startsWith(c.path))
  if (item.id === 'dashboard') return pathname.startsWith('/dashboard') || pathname.startsWith('/vendedores')
  return pathname.startsWith(item.path)
}

function TopNavItem({ item, active, onGo }: { item: NavItem; active: boolean; onGo: (p: string) => void }) {
  const { t } = useT()
  const base = cn(
    'relative flex h-10 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-2.5 text-[13px] font-semibold transition xl:px-3 xl:text-[13.5px]',
    active ? 'bg-[rgba(59,130,246,.12)] text-accent shadow-[0_0_24px_rgba(59,130,246,.18)]' : 'text-fg2 hover:bg-surface2 hover:text-fg',
  )
  const underline = active && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />
  if (item.children) {
    return (
      <DM.Root modal={false}>
        <DM.Trigger asChild>
          <button data-tour={`nav-${item.id}`} className={base}>
            {t(item.label)} <ChevronDown size={14} />
            {underline}
          </button>
        </DM.Trigger>
        <DM.Portal>
          <DM.Content sideOffset={10} align="start" className="z-[60] min-w-[230px] rounded-xl border border-line bg-surface p-1.5 shadow-2xl">
            {item.children.map((c) => (
              <DM.Item
                key={c.id}
                onSelect={() => onGo(c.path)}
                className="flex h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-[13.5px] font-medium text-fg outline-none data-[highlighted]:bg-surface2"
              >
                <c.icon size={16} className="text-accent" /> {t(c.label)}
              </DM.Item>
            ))}
          </DM.Content>
        </DM.Portal>
      </DM.Root>
    )
  }
  return (
    <button data-tour={`nav-${item.id}`} className={base} onClick={() => onGo(item.path)}>
      {item.comercial && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      {t(item.label)}
      {underline}
    </button>
  )
}

function AvatarMenu() {
  const { t } = useT()
  const role = useApp((s) => s.role)
  const logout = useApp((s) => s.logout)
  const navigate = useNavigate()
  const go = useMenuNav()
  const sw = useSwitchRole()
  const me = role === 'admin' ? { initials: 'MC', color: '#3b82f6', name: 'Miguel Campos', mail: 'miguel@camposcrm.demo' } : { initials: 'DR', color: '#22d3ee', name: 'Daniela Rojas', mail: 'daniela@camposcrm.demo' }
  return (
    <DM.Root modal={false}>
      <DM.Trigger asChild>
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full" aria-label={t('topbar.cuenta')}>
          <Avatar initials={me.initials} color={me.color} size={34} />
        </button>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content sideOffset={8} align="end" className="z-[60] w-[260px] rounded-xl border border-line bg-surface p-1.5 shadow-2xl">
          <div className="px-3 py-2.5">
            <div className="text-[13.5px] font-semibold">{me.name}</div>
            <div className="text-[12px] text-fg2">{me.mail}</div>
            <div className={cn('mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider', role === 'admin' ? 'bg-[rgba(59,130,246,.12)] text-accent' : 'bg-[rgba(34,211,238,.13)] text-cyan')}>
              {t(role === 'admin' ? 'rol.admin' : 'rol.vendedor')}
            </div>
          </div>
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.Label className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{t('nav.catComercial')}</DM.Label>
          <DM.Item onSelect={() => go('/propuesta')} className="flex h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13.5px] outline-none data-[highlighted]:bg-surface2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t('nav.propuesta')}
          </DM.Item>
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.Label className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{t('topbar.cambiarRol')}</DM.Label>
          {(['admin', 'vendedor'] as const).map((r) => (
            <DM.Item key={r} onSelect={() => r !== role && sw(r)} className="flex h-11 cursor-pointer items-center justify-between rounded-lg px-3 text-[13.5px] outline-none data-[highlighted]:bg-surface2">
              {t(r === 'admin' ? 'login.pillAdmin' : 'login.pillVendedor')}
              {r === role && <span className="h-2 w-2 rounded-full bg-accent" />}
            </DM.Item>
          ))}
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.Item
            onSelect={() => {
              logout()
              navigate('/login')
            }}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13.5px] text-bad outline-none data-[highlighted]:bg-surface2"
          >
            <LogOut size={15} /> {t('topbar.salir')}
          </DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  )
}

function TourButton({ compact }: { compact?: boolean }) {
  const setTourOpen = useApp((s) => s.setTourOpen)
  const { t } = useT()
  return (
    <button
      data-tour="tour-btn"
      onClick={() => setTourOpen(true)}
      className={cn(
        'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[9px] border border-accent/30 bg-[rgba(59,130,246,.1)] text-[13px] font-semibold text-accent transition hover:bg-[rgba(59,130,246,.18)]',
        compact ? 'w-10' : 'w-10 2xl:w-auto 2xl:px-3',
      )}
      title={t('topbar.tour')}
    >
      <Sparkles size={16} />
      {!compact && <span className="hidden 2xl:inline">{t('topbar.tour')}</span>}
    </button>
  )
}

function TopBar() {
  const role = useApp((s) => s.role)
  const { pathname } = useLocation()
  const { t } = useT()
  const go = useMenuNav()
  const items = navFor(role)
  const overflow = items.filter((i) => i.overflow)
  return (
    <header className="sticky top-0 z-50 hidden h-16 border-b border-line bg-[var(--glass)] backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 xl:px-6">
        <button onClick={() => go(role === 'admin' ? '/dashboard' : '/mi-panel')} className="shrink-0" aria-label="Campos CRM">
          <Logo className="xl:hidden" compact />
          <Logo className="hidden xl:flex" />
        </button>
        <nav data-tour="top-nav" className="mx-auto flex min-w-0 items-center gap-0.5">
          {items.map((it) => (
            <div key={it.id} className={cn(it.overflow && 'hidden 2xl:block')}>
              <TopNavItem item={it} active={isActive(it, pathname)} onGo={go} />
            </div>
          ))}
          {overflow.length > 0 && (
            <div className="2xl:hidden">
              <DM.Root modal={false}>
                <DM.Trigger asChild>
                  <button
                    data-tour="nav-more"
                    className={cn(
                      'flex h-10 items-center gap-1 rounded-[9px] px-3 text-[13.5px] font-semibold',
                      overflow.some((o) => isActive(o, pathname)) ? 'bg-[rgba(59,130,246,.12)] text-accent' : 'text-fg2 hover:bg-surface2',
                    )}
                  >
                    {t('nav.mas')} <ChevronDown size={14} />
                  </button>
                </DM.Trigger>
                <DM.Portal>
                  <DM.Content sideOffset={10} align="end" className="z-[60] min-w-[220px] rounded-xl border border-line bg-surface p-1.5 shadow-2xl">
                    {overflow.map((c) => (
                      <DM.Item key={c.id} onSelect={() => go(c.path)} className="flex h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-[13.5px] font-medium outline-none data-[highlighted]:bg-surface2">
                        <c.icon size={16} className="text-accent" /> {t(c.label)}
                      </DM.Item>
                    ))}
                  </DM.Content>
                </DM.Portal>
              </DM.Root>
            </div>
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <TourButton />
          <LangToggle compactBelowXl />
          <ThemeToggle />
          <RoleSwitch />
          <WhatsAppCta iconOnlyBelowXl />
          <AvatarMenu />
        </div>
      </div>
    </header>
  )
}

function MobileTop({ onMenu }: { onMenu: () => void }) {
  const role = useApp((s) => s.role)
  const go = useMenuNav()
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[var(--glass)] backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <button data-tour="mobile-menu" onClick={onMenu} className="grid h-11 w-11 shrink-0 place-items-center rounded-[9px] text-fg2 hover:bg-surface2" aria-label="Menu">
          <Menu size={20} />
        </button>
        <button onClick={() => go(role === 'admin' ? '/dashboard' : '/mi-panel')} className="min-w-0">
          <Logo compact className="sm:hidden" />
          <Logo className="hidden sm:flex" />
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <TourButton compact />
          <LangToggle compactOnMobile />
          <ThemeToggle />
          <AvatarMenu />
        </div>
      </div>
    </header>
  )
}

function BottomNav({ onMore }: { onMore: () => void }) {
  const role = useApp((s) => s.role)
  const { pathname } = useLocation()
  const { t } = useT()
  const go = useMenuNav()
  const tabs = bottomTabs(role)
  const moreActive = sheetItems(role).some((i) => pathname.startsWith(i.path))
  return (
    <nav data-tour="bottom-nav" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[var(--glass)] pb-safe backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid h-[64px] max-w-xl grid-cols-5">
        {tabs.map((it) => {
          const active = isActive(it, pathname)
          return (
            <button key={it.id} data-tour={`tab-${it.id}`} onClick={() => go(it.path)} className={cn('relative flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold', active ? 'text-accent' : 'text-fg2')}>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
              <span className="relative">
                <it.icon size={20} strokeWidth={active ? 2.4 : 2} />
                {it.comercial && <span className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />}
              </span>
              <span className="max-w-full truncate px-1">{t(it.label)}</span>
            </button>
          )
        })}
        <button data-tour="tab-more" onClick={onMore} className={cn('flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold', moreActive ? 'text-accent' : 'text-fg2')}>
          <MoreHorizontal size={20} />
          {t('nav.mas')}
        </button>
      </div>
    </nav>
  )
}

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const role = useApp((s) => s.role)
  const { pathname } = useLocation()
  const { t } = useT()
  const go = useMenuNav()
  const all = navFor(role).flatMap((i) => (i.children ? i.children : [i]))
  return (
    <Sheet open={open} onClose={onClose} title={t('nav.menu')}>
      <div className="grid grid-cols-2 gap-2 pt-2">
        {all.map((it) => {
          const active = pathname.startsWith(it.path)
          return (
            <button
              key={it.id}
              onClick={() => {
                onClose()
                go(it.path)
              }}
              className={cn('flex min-h-[52px] items-center gap-2.5 rounded-[10px] border px-3 text-left text-[13px] font-semibold', active ? 'border-accent/40 bg-[rgba(59,130,246,.1)] text-accent' : 'border-line bg-surface2 text-fg')}
            >
              <it.icon size={17} className="shrink-0 text-accent" />
              <span className="leading-tight">{t(it.label)}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-5">
        <div className="label-up mb-2">{t('topbar.cambiarRol')}</div>
        <RoleSwitch full />
      </div>
      <CtaBlock className="mt-5" />
    </Sheet>
  )
}

function DesktopFooter() {
  const { t } = useT()
  return (
    <footer className="mt-10 hidden border-t border-line lg:block">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-6 px-8 py-5">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-[rgba(59,130,246,.08)] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-accent">
            <span className="relative flex h-2 w-2">
              <span className="ping-dot absolute inline-flex h-full w-full rounded-full bg-accent" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Demo preview
          </span>
          <span className="text-[14px] font-medium">{t('cta.teGusto')}</span>
        </div>
        <div className="flex items-center gap-5">
          <WhatsAppCta />
          <span className="text-[10px] text-muted">Powered by Insights</span>
        </div>
      </div>
    </footer>
  )
}

/** Botón flotante "Volver a la propuesta" + píldora "Estás viendo" */
function PreviewReturn() {
  const preview = useApp((s) => s.preview)
  const trailer = useApp((s) => s.trailer)
  const cerrar = useApp((s) => s.cerrarPreview)
  const { t } = useT()
  useEffect(() => {
    if (!preview) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [preview, cerrar])
  if (!preview || trailer) return null
  return (
    <div className="no-print sticky top-14 z-40 lg:top-16">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-2 px-3 pt-3 sm:px-6 xl:px-8">
        <button onClick={cerrar} className="relative inline-flex h-11 items-center gap-2 rounded-full bg-accent pl-3.5 pr-4 text-[13px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,.6)]">
          <span className="pointer-events-none absolute inset-0 animate-halo rounded-full border-2 border-accent" />
          <ArrowLeft size={16} /> {t('preview.volver')}
        </button>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-[var(--glass)] px-3.5 text-[12.5px] text-fg2 backdrop-blur-xl">
          {t('preview.estasViendo')} <b className="font-semibold text-fg">{t(preview.titulo)}</b>
        </span>
      </div>
    </div>
  )
}

/** Barra del admin mirando el panel de un closer */
function ViewAsBar() {
  const viewAs = useApp((s) => s.viewAs)
  const setViewAs = useApp((s) => s.setViewAs)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useT()
  if (!viewAs) return null
  const v = vendedorById(viewAs)
  if (!v) return null
  const tabs = [
    { p: '/mi-panel', l: 'nav.miPanel' },
    { p: '/leads', l: 'nav.leads' },
    { p: '/whatsapp', l: 'nav.whatsapp' },
    { p: '/agenda', l: 'nav.agenda' },
    { p: '/mis-metricas', l: 'nav.misMetricas' },
  ]
  return (
    <div className="sticky top-14 z-40 border-b border-cyan/25 bg-[rgba(34,211,238,.08)] backdrop-blur-xl lg:top-16">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-2 text-[12.5px]">
          <Avatar initials={v.avatar} color={v.color} size={26} />
          <span className="truncate">
            {t('viewAs.viendo')} <b>{v.nombre}</b>
          </span>
        </div>
        <div className="no-scrollbar -mx-1 flex flex-1 gap-1 overflow-x-auto">
          {tabs.map((x) => (
            <button key={x.p} onClick={() => navigate(x.p)} className={cn('h-9 shrink-0 rounded-lg px-3 text-[12.5px] font-semibold', pathname.startsWith(x.p) ? 'bg-cyan/15 text-cyan' : 'text-fg2 hover:text-fg')}>
              {t(x.l)}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setViewAs(null)
            navigate(`/vendedores/${v.id}`)
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[12.5px] font-semibold"
        >
          <X size={14} /> {t('viewAs.salir')}
        </button>
      </div>
    </div>
  )
}

/** id del closer cuyos datos se muestran en las vistas "de closer" */
export function useCloserId(): string | null {
  const role = useApp((s) => s.role)
  const viewAs = useApp((s) => s.viewAs)
  return role === 'vendedor' ? DANIELA_ID : viewAs
}

export function AppShell({ children }: { children: ReactNode }) {
  const [more, setMore] = useState(false)
  const close = useCallback(() => setMore(false), [])
  const open = useCallback(() => setMore(true), [])
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return (
    <div className="min-h-[100dvh]">
      <TopBar />
      <MobileTop onMenu={open} />
      <ViewAsBar />
      <PreviewReturn />
      <main className="mx-auto w-full max-w-[1480px] px-4 pb-[calc(84px+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:pb-6 lg:pt-7 xl:px-8">{children}</main>
      <DesktopFooter />
      <BottomNav onMore={open} />
      <MoreSheet open={more} onClose={close} />
      <LeadDrawer />
    </div>
  )
}
