import { Eye, EyeOff, LogIn, MessageCircle, PlayCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LangToggle, Logo, ThemeToggle } from '@/components/layout/bits'
import { Button } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { WA_URL, cn } from '@/lib/utils'
import { useApp } from '@/store/app'
import type { Role } from '@/mock/types'

const CREDS: Record<string, Role> = {
  'miguel@camposcrm.demo': 'admin',
  'daniela@camposcrm.demo': 'vendedor',
}

export default function Login() {
  const { t } = useT()
  const login = useApp((s) => s.login)
  const setTrailer = useApp((s) => s.setTrailer)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(false)

  const fill = (r: Role) => {
    setEmail(r === 'admin' ? 'miguel@camposcrm.demo' : 'daniela@camposcrm.demo')
    setPass('demo1234')
    setError(false)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const role = CREDS[email.trim().toLowerCase()]
    if (!role || pass !== 'demo1234') {
      setError(true)
      toast.error(tr('login.error', useApp.getState().lang))
      return
    }
    login(role)
    navigate('/propuesta')
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-20">
      {/* fondo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,.14),transparent_60%)]" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-blob rounded-full bg-accent/25 blur-[90px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 animate-blob rounded-full bg-blue-700/20 blur-[100px] [animation-delay:-9s]" />

      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <LangToggle />
        <ThemeToggle />
      </div>

      <div className="relative w-[min(420px,calc(100vw-32px))]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-[rgba(59,130,246,.08)] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-accent">
            <span className="relative flex h-2 w-2">
              <span className="ping-dot absolute inline-flex h-full w-full rounded-full bg-accent" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Demo preview
          </span>
        </div>

        <form onSubmit={submit} className="card p-5 shadow-2xl sm:p-7">
          <h1 className="text-[20px] font-bold tracking-tight">{t('login.titulo')}</h1>
          <p className="mt-1 text-[13px] text-fg2">{t('login.sub')}</p>

          <div className="mt-5 flex flex-col gap-2">
            <span className="label-up">{t('login.accesoRapido')}</span>
            <div className="flex flex-wrap gap-2">
              {(['admin', 'vendedor'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => fill(r)}
                  className={cn(
                    'min-h-[40px] rounded-full border px-3 py-1.5 text-left text-[12px] font-semibold transition',
                    email === (r === 'admin' ? 'miguel@camposcrm.demo' : 'daniela@camposcrm.demo')
                      ? 'border-accent bg-[rgba(59,130,246,.12)] text-accent'
                      : 'border-line bg-surface2 text-fg2 hover:text-fg',
                  )}
                >
                  {t(r === 'admin' ? 'login.pillAdmin' : 'login.pillVendedor')}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-5 block">
            <span className="label-up">{t('login.usuario')}</span>
            <input
              className={cn('input mt-1.5', error && 'border-bad')}
              type="email"
              autoComplete="username"
              placeholder="nombre@camposcrm.demo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="mt-3.5 block">
            <span className="label-up">{t('login.contrasena')}</span>
            <div className="relative mt-1.5">
              <input
                className={cn('input pr-12', error && 'border-bad')}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-0 top-0 grid h-11 w-11 place-items-center text-fg2" aria-label="ver">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
            <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-fg2">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#3b82f6]" />
              {t('login.recordarme')}
            </label>
            <button
              type="button"
              className="min-h-[40px] font-medium text-accent"
              onClick={() =>
                toast.warning(tr('dev.password.titulo', useApp.getState().lang), {
                  description: tr('dev.password.texto', useApp.getState().lang),
                })
              }
            >
              {t('login.olvide')}
            </button>
          </div>

          <Button variant="primary" size="lg" type="submit" className="mt-4 w-full">
            <LogIn size={17} /> {t('login.entrar')}
          </Button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2 text-[13px]">
          <button
            onClick={() => setTrailer(true)}
            className="hidden min-h-[40px] items-center gap-2 font-semibold text-accent hover:underline lg:inline-flex"
          >
            <PlayCircle size={16} /> {t('login.trailer')}
          </button>
          <a href={WA_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-[40px] items-center gap-2 text-fg2 hover:text-fg">
            <MessageCircle size={15} /> {t('login.noAcceso')}
          </a>
        </div>
      </div>
    </div>
  )
}
