import { useCallback } from 'react'
import { useApp } from '@/store/app'
import type { Bi, Lang } from '@/mock/types'
import { dict } from './dict'

export type Vars = Record<string, string | number>

function interp(s: string, vars?: Vars) {
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`))
}

/** Función pura para usar en efectos, timers y lógica fuera de render. */
export function tr(key: string, lang: Lang, vars?: Vars): string {
  const e = dict[key]
  if (!e) {
    if (import.meta.env.DEV) console.warn('[i18n] falta clave', key)
    return key
  }
  return interp(e[lang === 'es' ? 0 : 1], vars)
}

export const bi = (b: Bi | undefined, lang: Lang) => (b ? b[lang] : '')

/** Hook de render. NUNCA poner `t` en dependencias de un useEffect: usar tr(clave, lang). */
export function useT() {
  const lang = useApp((s) => s.lang)
  const t = useCallback((key: string, vars?: Vars) => tr(key, lang, vars), [lang])
  const b = useCallback((x: Bi | undefined) => bi(x, lang), [lang])
  return { t, b, lang }
}
