import * as DM from '@radix-ui/react-dropdown-menu'
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Crown, Eye, LayoutDashboard, MessageCircle, MoreVertical } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Badge } from '@/components/ui'
import { useT } from '@/i18n'
import { fmtMin, fmtPct, fmtUSD } from '@/lib/format'
import type { FilaRanking, Stats } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { vendedorById } from '@/mock/base'
import { useApp } from '@/store/app'

type ColKey = 'posicion' | 'asignados' | 'velMediana' | 'tasaAgenda' | 'tasaCierreCitas' | 'tasaRespuesta' | 'agendados' | 'ventas' | 'cashSemana' | 'cashMes' | 'margen'

interface Col {
  key: ColKey
  label: string
  better?: 'high' | 'low'
  perCapita?: boolean
  fmt: (r: FilaRanking) => string
  sub?: (r: FilaRanking) => string | null
  color?: string
}

/** compara contra el promedio del equipo con una banda neutra de ±5% */
function verdict(v: number, avg: number, better?: 'high' | 'low') {
  if (!better || !avg) return 0
  const ratio = v / avg
  if (ratio > 0.95 && ratio < 1.05) return 0
  const up = ratio >= 1.05
  return (better === 'high' ? up : !up) ? 1 : -1
}

export function useEntrarPanel() {
  const navigate = useNavigate()
  return (id: string) => {
    useApp.getState().setViewAs(id)
    navigate('/mi-panel')
  }
}

export function RowMenu({ id }: { id: string }) {
  const { t } = useT()
  const navigate = useNavigate()
  const entrar = useEntrarPanel()
  const go = (p: string) => {
    useApp.getState().setViewAs(id)
    navigate(p)
  }
  return (
    <DM.Root modal={false}>
      <DM.Trigger asChild>
        <button onClick={(e) => e.stopPropagation()} className="grid h-10 w-10 place-items-center rounded-lg text-fg2 hover:bg-surface2" aria-label={t('common.acciones')}>
          <MoreVertical size={17} />
        </button>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content onClick={(e) => e.stopPropagation()} align="end" sideOffset={4} className="z-[60] min-w-[220px] rounded-xl border border-line bg-surface p-1.5 shadow-2xl">
          {[
            { i: Eye, l: 'rank.verFicha', f: () => navigate(`/vendedores/${id}`) },
            { i: LayoutDashboard, l: 'rank.entrarPanel', f: () => entrar(id) },
            { i: MessageCircle, l: 'rank.verChats', f: () => go('/whatsapp') },
            { i: CalendarDays, l: 'rank.verAgenda', f: () => go('/agenda') },
          ].map((x) => (
            <DM.Item key={x.l} onSelect={x.f} className="flex h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-[13px] outline-none data-[highlighted]:bg-surface2">
              <x.i size={15} className="text-accent" /> {t(x.l)}
            </DM.Item>
          ))}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  )
}

export function BrechaChip({ b }: { b: FilaRanking['brecha'] }) {
  const { t } = useT()
  if (!b) return null
  return (
    <Badge tone="bad" className="gap-1">
      <AlertTriangle size={11} /> {t(`brecha.${b}`)}
    </Badge>
  )
}

export function Ranking({ filas, equipo }: { filas: FilaRanking[]; equipo: Stats }) {
  const { t } = useT()
  const navigate = useNavigate()
  const [sort, setSort] = useState<{ key: ColKey; dir: 'asc' | 'desc' }>({ key: 'posicion', dir: 'asc' })
  const n = Math.max(1, filas.length)

  const cols: Col[] = [
    { key: 'asignados', label: 'rank.leads', fmt: (r) => String(r.asignados), sub: (r) => (r.sinContactar ? t('rank.sinContactar', { n: r.sinContactar }) : null) },
    { key: 'velMediana', label: 'rank.velocidad', better: 'low', fmt: (r) => fmtMin(r.velMediana), color: '#3b82f6' },
    { key: 'tasaRespuesta', label: 'rank.respuesta', better: 'high', fmt: (r) => fmtPct(r.tasaRespuesta), sub: (r) => t('rank.sinResp', { n: r.msgsSinResponder }) },
    { key: 'tasaAgenda', label: 'rank.agenda', better: 'high', fmt: (r) => fmtPct(r.tasaAgenda), color: '#a78bfa' },
    { key: 'agendados', label: 'rank.citas', fmt: (r) => String(r.agendados), sub: (r) => (r.noShows ? t('rank.noShows', { n: r.noShows }) : null) },
    { key: 'tasaCierreCitas', label: 'rank.cierre', better: 'high', fmt: (r) => fmtPct(r.tasaCierreCitas), sub: (r) => t('rank.sobreAsign', { p: fmtPct(r.tasaCierreAsignados, 1) }), color: '#34d399' },
    { key: 'ventas', label: 'rank.ventas', better: 'high', perCapita: true, fmt: (r) => String(r.ventas) },
    { key: 'cashSemana', label: 'rank.cashSemana', better: 'high', perCapita: true, fmt: (r) => fmtUSD(r.cashSemana, true) },
    { key: 'cashMes', label: 'rank.cashMes', better: 'high', perCapita: true, fmt: (r) => fmtUSD(r.cashMes, true) },
    { key: 'margen', label: 'rank.margen', better: 'high', fmt: (r) => fmtPct(r.margen, 1), sub: (r) => fmtUSD(r.ganancia, true) },
  ]
  const avg = (c: Col) => (c.perCapita ? (equipo[c.key as keyof Stats] as number) / n : (equipo[c.key as keyof Stats] as number))

  const sorted = useMemo(() => {
    const s = [...filas].sort((a, b) => {
      const d = (a[sort.key] as number) - (b[sort.key] as number)
      return sort.dir === 'asc' ? d : -d
    })
    return s
  }, [filas, sort])

  const clickSort = (key: ColKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'velMediana' || key === 'posicion' ? 'asc' : 'desc' }))

  const SortIcon = ({ k }: { k: ColKey }) =>
    sort.key !== k ? <ArrowUpDown size={12} className="opacity-40" /> : sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />

  return (
    <>
      {/* tabla ≥640 */}
      <div className="scroll-x hidden sm:block">
        <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr className="text-left">
              <th className="sticky left-0 z-10 bg-surface px-3 py-2.5">
                <button onClick={() => clickSort('posicion')} className="label-up inline-flex h-8 items-center gap-1">
                  # {t('rank.closer')} <SortIcon k="posicion" />
                </button>
              </th>
              {cols.map((c) => (
                <th key={c.key} className="px-2.5 py-2.5 text-right">
                  <button
                    data-trailer={c.key === 'velMediana' ? 'rank-velocidad' : undefined}
                    onClick={() => clickSort(c.key)}
                    className={cn('label-up ml-auto inline-flex h-8 items-center gap-1 whitespace-nowrap', sort.key === c.key && 'text-accent')}
                  >
                    {c.color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />}
                    {t(c.label)} <SortIcon k={c.key} />
                  </button>
                </th>
              ))}
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const v = vendedorById(r.vendedorId)!
              return (
                <tr
                  key={r.vendedorId}
                  data-trailer={r.vendedorId === 'v4' ? 'row-kevin' : undefined}
                  onClick={() => navigate(`/vendedores/${r.vendedorId}`)}
                  className={cn('group cursor-pointer transition hover:bg-surface2/70', r.brecha === 'contacto' && 'bg-[rgba(248,113,113,.05)]')}
                >
                  <td className="sticky left-0 z-10 border-t border-line bg-surface px-3 py-2.5 group-hover:bg-surface2">
                    <div className="flex items-center gap-2.5">
                      <span className={cn('mono w-6 text-center text-[13px] font-bold', r.posicion === 1 ? 'text-warn' : 'text-fg2')}>{r.posicion}</span>
                      <Avatar initials={v.avatar} color={v.color} size={32} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
                          {v.nombre}
                          {r.posicion === 1 && (
                            <Badge tone="warn" className="px-1.5 py-0 text-[10px]">
                              <Crown size={10} /> Top
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11.5px] text-fg2">
                          {v.bdc}
                          <BrechaChip b={r.brecha} />
                        </div>
                      </div>
                    </div>
                  </td>
                  {cols.map((c) => {
                    const vd = verdict(r[c.key] as number, avg(c), c.better)
                    const sub = c.sub?.(r)
                    return (
                      <td key={c.key} className="border-t border-line px-2.5 py-2.5 text-right align-middle">
                        <div
                          className={cn(
                            'mono inline-flex items-center justify-end gap-1 rounded-md px-1.5 py-0.5 font-semibold',
                            vd === -1 && 'bg-[rgba(248,113,113,.12)] text-bad',
                            vd === 1 && 'text-ok',
                          )}
                        >
                          {vd === -1 && <AlertTriangle size={12} />}
                          {c.fmt(r)}
                        </div>
                        {sub && <div className="mt-0.5 whitespace-nowrap text-[11px] text-muted">{sub}</div>}
                      </td>
                    )
                  })}
                  <td className="border-t border-line px-1 py-2 text-right">
                    <RowMenu id={r.vendedorId} />
                  </td>
                </tr>
              )
            })}
            <tr className="text-fg2">
              <td className="sticky left-0 z-10 border-t border-line bg-surface px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider">{t('rank.promedioEquipo')}</td>
              {cols.map((c) => (
                <td key={c.key} className="mono border-t border-line px-2.5 py-2.5 text-right text-[12.5px] font-semibold">
                  {c.key === 'velMediana'
                    ? fmtMin(equipo.velMediana)
                    : c.key.startsWith('tasa') || c.key === 'margen'
                      ? fmtPct(avg(c), c.key === 'margen' ? 1 : 0)
                      : c.key.startsWith('cash')
                        ? fmtUSD(avg(c), true)
                        : Math.round(avg(c) * 10) / 10}
                </td>
              ))}
              <td className="border-t border-line" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* tarjetas <640 */}
      <div className="space-y-2.5 p-3 sm:hidden">
        {sorted.map((r) => {
          const v = vendedorById(r.vendedorId)!
          const m = [
            { l: 'rank.velocidad', v: fmtMin(r.velMediana), vd: verdict(r.velMediana, equipo.velMediana, 'low') },
            { l: 'rank.agenda', v: fmtPct(r.tasaAgenda), vd: verdict(r.tasaAgenda, equipo.tasaAgenda, 'high') },
            { l: 'rank.cierre', v: fmtPct(r.tasaCierreCitas), vd: verdict(r.tasaCierreCitas, equipo.tasaCierreCitas, 'high') },
          ]
          return (
            <div
              key={r.vendedorId}
              data-trailer={r.vendedorId === 'v4' ? 'row-kevin-m' : undefined}
              onClick={() => navigate(`/vendedores/${r.vendedorId}`)}
              className={cn('rounded-[12px] border border-line bg-surface2/50 p-3', r.brecha && 'border-bad/30')}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn('mono w-6 text-center text-[15px] font-bold', r.posicion === 1 ? 'text-warn' : 'text-fg2')}>#{r.posicion}</span>
                <Avatar initials={v.avatar} color={v.color} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{v.nombre}</div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-fg2">
                    {v.bdc} <BrechaChip b={r.brecha} />
                  </div>
                </div>
                <RowMenu id={r.vendedorId} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {m.map((x) => (
                  <div key={x.l} className={cn('rounded-lg bg-surface px-2 py-1.5', x.vd === -1 && 'bg-[rgba(248,113,113,.1)]')}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t(x.l)}</div>
                    <div className={cn('mono text-[15px] font-bold', x.vd === -1 ? 'text-bad' : x.vd === 1 ? 'text-ok' : '')}>{x.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[12px] text-fg2">
                <span>
                  {t('rank.ventas')} <b className="mono text-fg">{r.ventas}</b>
                </span>
                <span>
                  {t('rank.cashMes')} <b className="mono text-fg">{fmtUSD(r.cashMes, true)}</b>
                </span>
                <span>
                  {t('rank.respuesta')} <b className="mono text-fg">{fmtPct(r.tasaRespuesta)}</b>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
