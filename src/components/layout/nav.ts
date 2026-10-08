import {
  BarChart3, CalendarDays, FileText, Gauge, LayoutDashboard, MessageCircle, Settings2, Timer, Trophy, Users, UserRound,
  Megaphone, CalendarCheck, Inbox, type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/mock/types'

export interface NavItem {
  id: string
  path: string
  label: string // clave i18n
  icon: LucideIcon
  children?: NavItem[]
  /** en 1024-1279 pasa al dropdown "Más" */
  overflow?: boolean
  comercial?: boolean
}

export const metricasChildren: NavItem[] = [
  { id: 'velocidad', path: '/metricas/velocidad', label: 'nav.velocidad', icon: Timer },
  { id: 'agendamiento', path: '/metricas/agendamiento', label: 'nav.agendamiento', icon: CalendarCheck },
  { id: 'cierre', path: '/metricas/cierre', label: 'nav.cierre', icon: Trophy },
  { id: 'campanas', path: '/metricas/campanas', label: 'nav.campanas', icon: Megaphone },
]

export const navAdmin: NavItem[] = [
  { id: 'propuesta', path: '/propuesta', label: 'nav.propuesta', icon: FileText, comercial: true },
  { id: 'dashboard', path: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { id: 'leads', path: '/leads', label: 'nav.leads', icon: Inbox },
  { id: 'metricas', path: '/metricas/velocidad', label: 'nav.metricas', icon: BarChart3, children: metricasChildren },
  { id: 'whatsapp', path: '/whatsapp', label: 'nav.whatsapp', icon: MessageCircle },
  { id: 'agenda', path: '/agenda', label: 'nav.agenda', icon: CalendarDays, overflow: true },
  { id: 'automatizaciones', path: '/automatizaciones', label: 'nav.automatizaciones', icon: Settings2, overflow: true },
  { id: 'usuarios', path: '/usuarios', label: 'nav.usuarios', icon: Users, overflow: true },
]

export const navVendedor: NavItem[] = [
  { id: 'propuesta', path: '/propuesta', label: 'nav.propuesta', icon: FileText, comercial: true },
  { id: 'mi-panel', path: '/mi-panel', label: 'nav.miPanel', icon: Gauge },
  { id: 'leads', path: '/leads', label: 'nav.misLeads', icon: Inbox },
  { id: 'whatsapp', path: '/whatsapp', label: 'nav.whatsapp', icon: MessageCircle },
  { id: 'agenda', path: '/agenda', label: 'nav.agenda', icon: CalendarDays },
  { id: 'mis-metricas', path: '/mis-metricas', label: 'nav.misMetricas', icon: BarChart3 },
]

export const navFor = (r: Role) => (r === 'admin' ? navAdmin : navVendedor)

/** 4 tabs fijos + "Más" en la bottom-nav */
export const bottomTabs = (r: Role) => navFor(r).filter((i) => ['propuesta', 'dashboard', 'mi-panel', 'leads', 'whatsapp'].includes(i.id))
export const sheetItems = (r: Role): NavItem[] => {
  const rest = navFor(r).filter((i) => !bottomTabs(r).includes(i))
  return rest.flatMap((i) => (i.children ? i.children : [i]))
}

export const UserIcon = UserRound

/** Rutas permitidas por rol */
export const adminOnly = ['/dashboard', '/vendedores', '/metricas', '/automatizaciones', '/usuarios']
export const vendedorOnly = ['/mi-panel', '/mis-metricas']

export function canAccess(path: string, role: Role, viewAs: string | null) {
  if (role === 'admin') {
    if (vendedorOnly.some((p) => path.startsWith(p))) return !!viewAs
    return true
  }
  return !adminOnly.some((p) => path.startsWith(p))
}
