import { core } from './core'
import { pages } from './pages'
import { propuesta } from './propuesta'
import { tour } from './tour'

export const dict: Record<string, [string, string]> = { ...core, ...propuesta, ...pages, ...tour }
