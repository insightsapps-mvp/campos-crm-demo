import { create } from 'zustand'
import type { Lang, Role } from '@/mock/types'

type Theme = 'dark' | 'light'

const ls = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* noop */
    }
  },
}
const ss = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      sessionStorage.setItem(k, v)
    } catch {
      /* noop */
    }
  },
}

export interface PreviewCtx {
  modulo: number
  view: string
  rolePrevio: Role
  titulo: string
}

interface AppState {
  authed: boolean
  role: Role
  theme: Theme
  lang: Lang
  welcomeSeen: boolean
  tourOpen: boolean
  trailer: boolean
  preview: PreviewCtx | null
  moduloDestacado: number | null
  /** admin mirando el panel de un closer */
  viewAs: string | null
  /** navegación diferida (el store no conoce el router) */
  pendingNav: string | null
  login: (role: Role) => void
  logout: () => void
  setRole: (role: Role, opts?: { keepPreview?: boolean }) => void
  setTheme: (t: Theme) => void
  setLang: (l: Lang) => void
  markWelcome: () => void
  setTourOpen: (v: boolean) => void
  setTrailer: (v: boolean) => void
  abrirPreview: (modulo: number, view: string, titulo: string, rolDestino: Role) => void
  cerrarPreview: () => void
  cancelarPreview: () => void
  limpiarDestacado: () => void
  setViewAs: (id: string | null) => void
  navTo: (path: string | null) => void
}

export const defaultView = (r: Role) => (r === 'admin' ? '/dashboard' : '/mi-panel')

const initialTheme = (ls.get('ccrm_theme') as Theme) || 'dark'
const initialLang = (ls.get('ccrm_lang') as Lang) || 'es'
const savedAuth = ss.get('ccrm_auth')

export const useApp = create<AppState>((set, get) => ({
  authed: !!savedAuth,
  role: (savedAuth as Role) || 'admin',
  theme: initialTheme,
  lang: initialLang,
  welcomeSeen: ss.get('ccrm_welcome_seen') === '1',
  tourOpen: false,
  trailer: false,
  preview: null,
  moduloDestacado: null,
  viewAs: null,
  pendingNav: null,
  login: (role) => {
    ss.set('ccrm_auth', role)
    set({ authed: true, role, preview: null, viewAs: null })
  },
  logout: () => {
    try {
      sessionStorage.removeItem('ccrm_auth')
    } catch {
      /* noop */
    }
    set({ authed: false, preview: null, viewAs: null, tourOpen: false })
  },
  setRole: (role, opts) => {
    if (get().authed) ss.set('ccrm_auth', role)
    set({ role, viewAs: null, ...(opts?.keepPreview ? {} : { preview: null }) })
  },
  setTheme: (theme) => {
    ls.set('ccrm_theme', theme)
    const r = document.documentElement
    r.classList.toggle('dark', theme === 'dark')
    r.style.background = theme === 'dark' ? '#09090b' : '#ffffff'
    set({ theme })
  },
  setLang: (lang) => {
    ls.set('ccrm_lang', lang)
    document.documentElement.lang = lang
    set({ lang })
  },
  markWelcome: () => {
    ss.set('ccrm_welcome_seen', '1')
    set({ welcomeSeen: true })
  },
  setTourOpen: (tourOpen) => set({ tourOpen }),
  setTrailer: (trailer) => set({ trailer }),
  abrirPreview: (modulo, view, titulo, rolDestino) => {
    const rolePrevio = get().role
    if (get().authed) ss.set('ccrm_auth', rolDestino)
    set({ preview: { modulo, view, rolePrevio, titulo }, role: rolDestino, viewAs: null, pendingNav: view })
  },
  cerrarPreview: () => {
    const p = get().preview
    if (!p) return
    if (get().authed) ss.set('ccrm_auth', p.rolePrevio)
    set({ role: p.rolePrevio, preview: null, moduloDestacado: p.modulo, pendingNav: '/propuesta' })
  },
  cancelarPreview: () => set({ preview: null }),
  limpiarDestacado: () => set({ moduloDestacado: null }),
  setViewAs: (viewAs) => set({ viewAs }),
  navTo: (pendingNav) => set({ pendingNav }),
}))
