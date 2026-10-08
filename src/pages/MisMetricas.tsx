import { useState } from 'react'
import { useCloserId } from '@/components/layout/AppShell'
import { PreviewBanner } from '@/components/layout/Notices'
import { PageHeader, Tabs } from '@/components/ui'
import { useT } from '@/i18n'
import { DANIELA_ID, vendedorById } from '@/mock/base'
import { MetricaAgendamiento, MetricaCierre, MetricaVelocidad } from './Metricas'

type Tab = 'velocidad' | 'agendamiento' | 'cierre'

export default function MisMetricas() {
  const { t } = useT()
  const id = useCloserId() ?? DANIELA_ID
  const [tab, setTab] = useState<Tab>('velocidad')
  return (
    <div>
      <PreviewBanner id="misMetricas" />
      <PageHeader kicker={t('kicker.cartera')} kickerTone="cyan" title={t('nav.misMetricas')} sub={t('misMetricas.sub', { n: vendedorById(id)!.nombre })} />
      <div className="mb-5">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'velocidad', label: t('nav.velocidad') },
            { value: 'agendamiento', label: t('nav.agendamiento') },
            { value: 'cierre', label: t('nav.cierre') },
          ]}
        />
      </div>
      {tab === 'velocidad' && <MetricaVelocidad fixed={id} />}
      {tab === 'agendamiento' && <MetricaAgendamiento fixed={id} />}
      {tab === 'cierre' && <MetricaCierre fixed={id} />}
    </div>
  )
}
