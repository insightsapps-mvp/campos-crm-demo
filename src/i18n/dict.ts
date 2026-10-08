import { core } from './core'
import { pages } from './pages'

export const dict: Record<string, [string, string]> = { ...core, ...pages }
