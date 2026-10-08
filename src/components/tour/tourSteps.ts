import { tr, type Vars } from '@/i18n'
import { fmtMin, fmtPct } from '@/lib/format'
import { ranking } from '@/lib/metrics'
import { DANIELA_ID, KEVIN_ID, VALERIA_ID } from '@/mock/base'
import type { Lang, Role } from '@/mock/types'
import { useData } from '@/store/data'
import { bottomTabs, navAdmin, navVendedor } from '@/components/layout/nav'

export interface TourStep {
  id: string
  /** selectores candidatos; se usa el primero visible */
  selectors: string[]
  route?: string
  title: string
  body: string
  roles: Role[]
}

function datosMock() {
  const leads = useData.getState().leads
  const { filas, equipo } = ranking(leads, { rango: '30d' })
  const by = (id: string) => filas.find((f) => f.vendedorId === id)!
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return {
    kevin: fmtMin(by(KEVIN_ID).velMediana),
    equipoVel: fmtMin(equipo.velMediana),
    valeria: fmtPct(by(VALERIA_ID).tasaCierreCitas),
    danielaPos: by(DANIELA_ID).posicion,
    danielaVel: fmtMin(by(DANIELA_ID).velMediana),
    hoy: leads.filter((l) => l.creadoAt >= hoy.getTime()).length,
    sinContacto: leads.filter((l) => l.estado === 'asignado').length,
    n: filas.length,
  }
}

/** Pasos en el ORDEN VISUAL EXACTO del menú. Se filtran por rol sin reordenar. */
export function getTourSteps(role: Role, lang: Lang, isMobile: boolean): TourStep[] {
  const d = datosMock() as unknown as Vars
  const T = (k: string) => tr(k, lang, d)
  const steps: TourStep[] = []

  steps.push({ id: 'welcome-admin', selectors: [], title: T('tour.welcomeAdmin.t'), body: T('tour.welcomeAdmin.b'), roles: ['admin'] })
  steps.push({ id: 'welcome-vend', selectors: [], title: T('tour.welcomeVend.t'), body: T('tour.welcomeVend.b'), roles: ['vendedor'] })

  steps.push({
    id: 'nav',
    selectors: [isMobile ? '[data-tour="bottom-nav"]' : '[data-tour="top-nav"]'],
    title: T('tour.nav.t'),
    body: T(isMobile ? 'tour.nav.bMobile' : 'tour.nav.b'),
    roles: ['admin', 'vendedor'],
  })

  const items = (r: Role) => (r === 'admin' ? navAdmin : navVendedor)
  for (const r of ['admin', 'vendedor'] as Role[]) {
    const tabs = bottomTabs(r).map((x) => x.id)
    items(r).forEach((it, i) => {
      const sel = isMobile
        ? tabs.includes(it.id)
          ? [`[data-tour="tab-${it.id}"]`]
          : ['[data-tour="mobile-menu"]']
        : [`[data-tour="nav-${it.id}"]`, '[data-tour="nav-more"]']
      steps.push({
        id: `${r}-${it.id}`,
        selectors: sel,
        route: it.path,
        title: `${i + 1}. ${tr(it.label, lang)}`,
        body: T(`tour.item.${r}.${it.id}`) + (isMobile && !tabs.includes(it.id) ? ' ' + T('tour.enMas') : ''),
        roles: [r],
      })
    })
  }

  steps.push({
    id: 'switch',
    selectors: isMobile ? ['[data-tour="mobile-menu"]'] : ['[data-tour="switch-user"]'],
    title: T('tour.switch.t'),
    body: T(isMobile ? 'tour.switch.bMobile' : 'tour.switch.b'),
    roles: ['admin', 'vendedor'],
  })
  steps.push({
    id: 'cta',
    selectors: isMobile ? ['[data-tour="mobile-menu"]'] : ['header [data-tour="whatsapp-cta"]'],
    title: T('tour.cta.t'),
    body: T(isMobile ? 'tour.cta.bMobile' : 'tour.cta.b'),
    roles: ['admin', 'vendedor'],
  })

  return steps.filter((s) => s.roles.includes(role))
}
