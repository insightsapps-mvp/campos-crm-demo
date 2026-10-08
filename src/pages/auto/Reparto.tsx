import { Filter, Minus, Play, Plus, Save, Shuffle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, Badge, Button, Card, CardHead, HBar, Segmented } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtPct } from '@/lib/format'
import { califica, elegirCloser } from '@/lib/reparto'
import { cn } from '@/lib/utils'
import { DAY, vehiculos, vendedorById } from '@/mock/base'
import type { ModoReparto, ReglasCalificacion, ReglasReparto, Segmento } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'

const SEGS: Segmento[] = ['suv', 'sedan', 'pickup', 'usado']

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="grid h-11 w-14 shrink-0 place-items-center">
      <span className={cn('relative h-6 w-11 rounded-full transition', on ? 'bg-accent' : 'bg-zinc-500/40')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </button>
  )
}
export { Toggle }

export function CalificacionYReparto() {
  const { t } = useT()
  const leads = useData((s) => s.leads)
  const reglasCalif = useData((s) => s.reglasCalif)
  const reglasReparto = useData((s) => s.reglasReparto)
  const setReglasCalif = useData((s) => s.setReglasCalif)
  const setReglasReparto = useData((s) => s.setReglasReparto)
  const [rc, setRc] = useState<ReglasCalificacion>(reglasCalif)
  const [rr, setRr] = useState<ReglasReparto>(reglasReparto)
  const [sim, setSim] = useState<{ nombre: string; veh: string; vid: string | null; cal: boolean }[]>([])
  const [running, setRunning] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const rows30 = useMemo(() => leads.filter((l) => l.creadoAt >= Date.now() - 30 * DAY), [leads])
  const actual = useMemo(() => rows30.filter((l) => l.calificado).length, [rows30])
  const conReglas = useMemo(() => rows30.filter((l) => califica(l, rc)).length, [rows30, rc])

  const updCloser = (id: string, patch: Partial<ReglasReparto['closers'][number]>) =>
    setRr((r) => ({ ...r, closers: r.closers.map((c) => (c.vendedorId === id ? { ...c, ...patch } : c)) }))

  const guardar = () => {
    setReglasCalif(rc)
    setReglasReparto(rr)
    toast.success(tr('toast.reglasOk', useApp.getState().lang), { description: tr('toast.reglasDesc', useApp.getState().lang) })
  }

  const simular = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setSim([])
    setRunning(true)
    const muestra = rows30.slice(0, 20)
    const carga: Record<string, number> = {}
    const res = muestra.map((l, i) => {
      const cal = califica(l, rc)
      const vid = cal ? elegirCloser(l.segmento, rr, carga, i) : null
      if (vid) carga[vid] = (carga[vid] ?? 0) + 1
      return { nombre: l.nombre, veh: l.vehiculoInteres, vid, cal }
    })
    res.forEach((r, i) => {
      timers.current.push(window.setTimeout(() => setSim((s) => [...s, r]), 160 * (i + 1)))
    })
    timers.current.push(window.setTimeout(() => setRunning(false), 160 * (res.length + 1)))
  }

  const porCloser = rr.closers.map((c) => ({ id: c.vendedorId, n: sim.filter((s) => s.vid === c.vendedorId).length }))
  const nurt = sim.filter((s) => !s.vid).length
  const vehSeg = (n: string) => vehiculos.find((v) => v.nombre === n)?.segmento

  return (
    <div className="space-y-5">
      <Card data-tour="reglas-calif">
        <CardHead icon={<Filter size={16} />} title={t('auto.calif.titulo')} sub={t('auto.calif.sub')} />
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-medium">{t('auto.calif.scoreMin')}</span>
                <span className="mono font-bold text-accent">{rc.scoreMin}</span>
              </div>
              <input type="range" min={30} max={90} step={5} value={rc.scoreMin} onChange={(e) => setRc({ ...rc, scoreMin: Number(e.target.value) })} className="h-11 w-full accent-[#3b82f6]" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-medium">{t('auto.calif.presupuestoMin')}</span>
                <span className="mono font-bold text-accent">${rc.presupuestoMin.toLocaleString('en-US')}</span>
              </div>
              <input type="range" min={0} max={5000} step={250} value={rc.presupuestoMin} onChange={(e) => setRc({ ...rc, presupuestoMin: Number(e.target.value) })} className="h-11 w-full accent-[#3b82f6]" />
            </div>
            {(
              [
                ['excluirCreditoMalo', 'auto.calif.creditoMalo'],
                ['soloEnZona', 'auto.calif.zona'],
                ['nurturingNoCalificados', 'auto.calif.nurturing'],
              ] as const
            ).map(([k, l]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-t border-line pt-2">
                <span className="text-[13px]">{t(l)}</span>
                <Toggle on={rc[k]} onChange={(v) => setRc({ ...rc, [k]: v })} label={t(l)} />
              </div>
            ))}
          </div>
          <div className="rounded-[12px] border border-accent/30 bg-[rgba(59,130,246,.06)] p-4">
            <div className="label-up">{t('auto.calif.impacto')}</div>
            <div className="mono mt-2 text-[34px] font-bold leading-none text-accent">{fmtPct((conReglas / (rows30.length || 1)) * 100)}</div>
            <div className="mt-1 text-[12.5px] text-fg2">{t('auto.calif.impactoSub', { n: conReglas, t: rows30.length })}</div>
            <div className="mt-3"><HBar value={conReglas} max={rows30.length} height={8} /></div>
            <div className="mt-3 text-[12px] text-fg2">
              {t('auto.calif.hoy', { p: fmtPct((actual / (rows30.length || 1)) * 100) })}{' '}
              <b className={conReglas >= actual ? 'text-ok' : 'text-warn'}>
                {conReglas >= actual ? '+' : ''}
                {conReglas - actual}
              </b>
            </div>
          </div>
        </div>
      </Card>

      <Card data-tour="reglas-reparto">
        <CardHead
          icon={<Shuffle size={16} />}
          title={t('auto.rep.titulo')}
          sub={t('auto.rep.sub')}
          right={
            <Segmented<ModoReparto>
              size="sm"
              value={rr.modo}
              onChange={(modo) => setRr({ ...rr, modo })}
              options={[
                { value: 'desempeno', label: t('auto.rep.desempeno') },
                { value: 'round_robin', label: t('auto.rep.roundRobin') },
                { value: 'especialidad', label: t('auto.rep.especialidad') },
              ]}
            />
          }
        />
        <p className="px-4 pt-3 text-[12.5px] text-fg2 sm:px-5">{t(`auto.rep.modo.${rr.modo}`)}</p>
        <div className="scroll-x">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="text-left">
                <th className="label-up px-4 py-2.5">{t('rank.closer')}</th>
                <th className="label-up px-2 py-2.5">{t('auto.rep.activo')}</th>
                <th className="label-up px-2 py-2.5">{t('auto.rep.cupo')}</th>
                <th className="label-up px-2 py-2.5">{t('auto.rep.peso')}</th>
                <th className="label-up px-4 py-2.5">{t('auto.rep.segmentos')}</th>
              </tr>
            </thead>
            <tbody>
              {rr.closers.map((c) => {
                const v = vendedorById(c.vendedorId)!
                return (
                  <tr key={c.vendedorId} className={cn('border-t border-line', !c.activo && 'opacity-50')}>
                    <td className="px-4 py-2"><span className="flex items-center gap-2 whitespace-nowrap font-medium"><Avatar initials={v.avatar} color={v.color} size={26} /> {v.nombre}</span></td>
                    <td className="px-2 py-1"><Toggle on={c.activo} onChange={(on) => updCloser(c.vendedorId, { activo: on })} label={v.nombre} /></td>
                    <td className="px-2 py-1">
                      <div className="inline-flex items-center rounded-[9px] border border-line">
                        <button className="grid h-10 w-10 place-items-center text-fg2" onClick={() => updCloser(c.vendedorId, { cupoDiario: Math.max(0, c.cupoDiario - 1) })} aria-label="-"><Minus size={14} /></button>
                        <span className="mono w-8 text-center font-semibold">{c.cupoDiario}</span>
                        <button className="grid h-10 w-10 place-items-center text-fg2" onClick={() => updCloser(c.vendedorId, { cupoDiario: c.cupoDiario + 1 })} aria-label="+"><Plus size={14} /></button>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={30} value={c.peso} disabled={rr.modo !== 'desempeno'} onChange={(e) => updCloser(c.vendedorId, { peso: Number(e.target.value) })} className="h-10 w-28 accent-[#3b82f6]" />
                        <span className="mono w-6 text-[12px]">{c.peso}</span>
                      </div>
                    </td>
                    <td className="px-4 py-1">
                      <div className="flex flex-wrap gap-1">
                        {SEGS.map((s) => {
                          const on = c.segmentos.includes(s)
                          return (
                            <button key={s} onClick={() => updCloser(c.vendedorId, { segmentos: on ? c.segmentos.filter((x) => x !== s) : [...c.segmentos, s] })} className={cn('h-9 rounded-full border px-2.5 text-[11.5px] font-semibold', on ? 'border-accent/50 bg-[rgba(59,130,246,.12)] text-accent' : 'border-line text-fg2')}>
                              {t(`segmento.${s}`)}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
          <label className="flex items-center gap-2 text-[13px]">
            {t('auto.rep.pausar')}
            <input type="number" min={1} max={20} value={rr.pausarSiSinContacto} onChange={(e) => setRr({ ...rr, pausarSiSinContacto: Number(e.target.value) })} className="input mono h-10 w-16 text-center" />
            {t('auto.rep.pausar2')}
          </label>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="secondary" onClick={simular} disabled={running} className="flex-1 sm:flex-none"><Play size={15} /> {t('auto.rep.simular')}</Button>
            <Button variant="primary" onClick={guardar} className="flex-1 sm:flex-none"><Save size={15} /> {t('auto.rep.guardar')}</Button>
          </div>
        </div>
      </Card>

      {sim.length > 0 && (
        <Card>
          <CardHead title={t('auto.rep.simTitulo')} sub={t('auto.rep.simSub', { n: sim.length })} />
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_300px]">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {sim.map((s, i) => {
                const v = vendedorById(s.vid)
                return (
                  <div key={i} className="anim-rise flex items-center gap-2 rounded-[10px] border border-line px-2.5 py-2 text-[12.5px]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.nombre}</span>
                      <span className="block truncate text-[11px] text-fg2">{s.veh} · {t(`segmento.${vehSeg(s.veh) ?? 'suv'}`)}</span>
                    </span>
                    {v ? (
                      <span className="flex shrink-0 items-center gap-1.5"><Avatar initials={v.avatar} color={v.color} size={22} /><span className="hidden text-[11.5px] sm:inline">{v.nombre.split(' ')[0]}</span></span>
                    ) : (
                      <Badge tone="muted">{t('leads.nurturing')}</Badge>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="space-y-2">
              {porCloser.filter((p) => p.n > 0).sort((a, b) => b.n - a.n).map((p) => {
                const v = vendedorById(p.id)!
                return (
                  <div key={p.id}>
                    <div className="mb-1 flex justify-between text-[12.5px]"><span>{v.nombre}</span><span className="mono font-semibold">{p.n}</span></div>
                    <HBar value={p.n} max={sim.length} color={v.color} />
                  </div>
                )
              })}
              <div className="pt-1 text-[12.5px] text-fg2">{t('auto.rep.aNurturing', { n: nurt })}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
