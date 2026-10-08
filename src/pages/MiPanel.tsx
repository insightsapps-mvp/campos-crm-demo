import { Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { useCloserId } from '@/components/layout/AppShell'
import { PreviewBanner } from '@/components/layout/Notices'
import { Avatar, Badge, PageHeader } from '@/components/ui'
import { useT } from '@/i18n'
import { ranking } from '@/lib/metrics'
import { DANIELA_ID, vendedorById } from '@/mock/base'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'
import { EsperandoContacto, EvolucionCloser, KpisCloser, Negociaciones, ProximasCitas } from './closer/parts'

export default function MiPanel() {
  const { t } = useT()
  const role = useApp((s) => s.role)
  const id = useCloserId() ?? DANIELA_ID
  const v = vendedorById(id)!
  const leads = useData((s) => s.leads)
  const { filas, equipo } = useMemo(() => ranking(leads, { rango: '30d' }), [leads])
  const me = filas.find((f) => f.vendedorId === id)!
  const mine = useMemo(() => leads.filter((l) => l.vendedorId === id), [leads, id])
  const admin = role === 'admin'

  return (
    <div>
      <PreviewBanner id="miPanel" />
      <PageHeader
        kicker={t('kicker.cartera')}
        kickerTone="cyan"
        title={admin ? t('panel.tituloAdmin', { n: v.nombre }) : t('panel.titulo', { n: v.nombre.split(' ')[0] })}
        sub={t('panel.sub')}
        right={
          <div className="flex items-center gap-3 rounded-[12px] border border-cyan/30 bg-[rgba(34,211,238,.07)] px-3 py-2" data-tour="posicion">
            <Avatar initials={v.avatar} color={v.color} size={34} />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan">{t('panel.posicion')}</div>
              <div className="mono flex items-center gap-1.5 text-[18px] font-bold">
                <Trophy size={16} className="text-warn" /> #{me.posicion}{' '}
                <span className="text-[13px] font-medium text-fg2">{t('panel.deN', { n: filas.length })}</span>
              </div>
            </div>
            {me.posicion <= 2 && <Badge tone="ok">{t('panel.top')}</Badge>}
          </div>
        }
      />
      <KpisCloser me={me} team={equipo} />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <EsperandoContacto leads={mine} />
          <EvolucionCloser vendedorId={id} />
        </div>
        <div className="space-y-5">
          <ProximasCitas leads={mine} />
          <Negociaciones leads={mine} />
        </div>
      </div>
    </div>
  )
}
