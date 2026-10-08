import { ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Logo } from '@/components/layout/bits'
import { Button, Modal } from '@/components/ui'
import { useT } from '@/i18n'
import { useApp } from '@/store/app'

/** Aparece ~400ms después del login, una vez por sesión, encima de la Propuesta */
export function WelcomeModal() {
  const authed = useApp((s) => s.authed)
  const seen = useApp((s) => s.welcomeSeen)
  const trailer = useApp((s) => s.trailer)
  const markWelcome = useApp((s) => s.markWelcome)
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const { t } = useT()

  useEffect(() => {
    if (!authed || seen || trailer || pathname !== '/propuesta') return
    const id = setTimeout(() => setOpen(true), 400)
    return () => clearTimeout(id)
  }, [authed, seen, trailer, pathname])

  const close = useCallback(() => {
    setOpen(false)
    markWelcome()
  }, [markWelcome])

  return (
    <Modal open={open} onClose={close} closeOnBackdrop={false} hideClose width={520} z={90} dataAttr="welcome">
      <div className="p-6 sm:p-8">
        <Logo />
        <h2 className="mt-6 text-[26px] font-bold tracking-tight">{t('welcome.hola')}</h2>
        <p className="mt-3 text-[14.5px] font-medium leading-relaxed">{t('welcome.somos')}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-fg2">{t('welcome.parrafo')}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-fg2">{t('welcome.parrafo2')}</p>
        <p className="mt-4 text-[13.5px] italic text-fg2">{t('welcome.italica')}</p>
        <Button variant="primary" size="lg" className="mt-6 w-full" onClick={close}>
          {t('welcome.verPlataforma')} <ArrowRight size={17} />
        </Button>
      </div>
    </Modal>
  )
}
