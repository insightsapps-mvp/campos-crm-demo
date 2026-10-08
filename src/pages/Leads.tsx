import * as DM from '@radix-ui/react-dropdown-menu'
import { ChevronLeft, ChevronRight, FileUp, LayoutGrid, MoreVertical, Plus, Search, StickyNote, Table2, UploadCloud, UserPlus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useCloserId } from '@/components/layout/AppShell'
import { PreviewBanner } from '@/components/layout/Notices'
import { EstadoBadge, NotasBlock, RegistrarLlamadaBtn } from '@/components/lead/LeadActions'
import { Avatar, Badge, Button, Card, Empty, LiveTimer, Modal, PageHeader, Segmented, Select, Tabs } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtRel } from '@/lib/format'
import { CSV_EJEMPLO_HEAD, cargaHoy, csvEjemplo, nuevoLead } from '@/lib/reparto'
import { cn } from '@/lib/utils'
import { DAY, campanas, vehiculos, vendedorById, vendedores } from '@/mock/base'
import type { Credito, Lead, LeadEstado, Origen } from '@/mock/types'
import { useApp } from '@/store/app'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'

const ESTADOS: LeadEstado[] = ['nuevo', 'asignado', 'contactado', 'agendado', 'cita_realizada', 'negociacion', 'comprador', 'perdido']
const ORIGENES: Origen[] = ['facebook', 'google', 'walkin', 'referido', 'web', 'marketplace']
const PAGE = 25
const L = () => useApp.getState().lang

function AsignarModal({ ids, open, onClose, onDone }: { ids: string[]; open: boolean; onClose: () => void; onDone: () => void }) {
  const { t } = useT()
  const asignar = useData((s) => s.asignar)
  const [bdc, setBdc] = useState<'BDC Norte' | 'BDC Sur'>('BDC Norte')
  const [vid, setVid] = useState('')
  const lista = vendedores.filter((v) => v.bdc === bdc)
  return (
    <Modal open={open} onClose={onClose} title={t('leads.asignarN', { n: ids.length })} width={460}>
      <div className="space-y-4 p-5">
        <Segmented value={bdc} onChange={(b) => { setBdc(b); setVid('') }} options={[{ value: 'BDC Norte', label: 'BDC Norte' }, { value: 'BDC Sur', label: 'BDC Sur' }]} className="flex w-full [&>button]:flex-1" />
        <div className="grid gap-2">
          {lista.map((v) => (
            <button key={v.id} onClick={() => setVid(v.id)} className={cn('flex min-h-[52px] items-center gap-3 rounded-[10px] border px-3 text-left', vid === v.id ? 'border-accent bg-[rgba(59,130,246,.1)]' : 'border-line bg-surface2/50')}>
              <Avatar initials={v.avatar} color={v.color} size={30} />
              <span className="flex-1 text-[13.5px] font-semibold">{v.nombre}</span>
              {vid === v.id && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>{t('common.cancelar')}</Button>
          <Button
            variant="primary"
            disabled={!vid}
            onClick={() => {
              asignar(ids, vid)
              toast.success(tr('toast.asignado', L(), { n: ids.length, v: vendedorById(vid)!.nombre }))
              onDone()
              onClose()
            }}
          >
            <UserPlus size={16} /> {t('leads.asignar')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function NuevoLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT()
  const role = useApp((s) => s.role)
  const closerId = useCloserId()
  const { addLeads, reglasCalif, reglasReparto, leads } = useData()
  const [f, setF] = useState({ nombre: '', telefono: '', vehiculo: vehiculos[0].nombre, origen: 'walkin' as Origen, credito: 'bueno' as Credito, presupuesto: 3000, vid: '' })
  const ok = f.nombre.trim().length > 2 && f.telefono.trim().length > 6
  const guardar = () => {
    const camp = campanas.find((c) => c.origen === f.origen)
    const forzar = role === 'vendedor' ? closerId : f.vid || null
    const l = nuevoLead(
      { nombre: f.nombre.trim(), telefono: f.telefono.trim(), vehiculo: f.vehiculo, origen: f.origen, campanaId: camp && ['facebook', 'google', 'web', 'marketplace'].includes(f.origen) ? camp.id : null, credito: f.credito, presupuesto: f.presupuesto, score: f.credito === 'malo' ? 40 : 78, enZona: true },
      reglasCalif, reglasReparto, cargaHoy(leads), leads.length, forzar,
    )
    addLeads([l])
    toast.success(tr('toast.leadCreado', L(), { n: l.nombre }), {
      description: l.vendedorId ? tr('toast.leadAsignadoA', L(), { v: vendedorById(l.vendedorId)!.nombre }) : tr('toast.leadNurturing', L()),
    })
    setF({ ...f, nombre: '', telefono: '' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={t('leads.nuevo')} width={520}>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label-up">{t('leads.col.nombre')}</span>
          <input className="input mt-1.5" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej. Carla Gómez" />
        </label>
        <label>
          <span className="label-up">{t('leads.col.telefono')}</span>
          <input className="input mono mt-1.5" value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} placeholder="+1 (305) 555-0000" />
        </label>
        <label>
          <span className="label-up">{t('leads.col.vehiculo')}</span>
          <Select className="mt-1.5" value={f.vehiculo} onChange={(v) => setF({ ...f, vehiculo: v })}>
            {vehiculos.map((v) => <option key={v.nombre}>{v.nombre}</option>)}
          </Select>
        </label>
        <label>
          <span className="label-up">{t('leads.col.origen')}</span>
          <Select className="mt-1.5" value={f.origen} onChange={(v) => setF({ ...f, origen: v as Origen })}>
            {ORIGENES.map((o) => <option key={o} value={o}>{t(`origen.${o}`)}</option>)}
          </Select>
        </label>
        <label>
          <span className="label-up">{t('grupo.credito')}</span>
          <Select className="mt-1.5" value={f.credito} onChange={(v) => setF({ ...f, credito: v as Credito })}>
            {(['bueno', 'regular', 'sin_historial', 'malo'] as Credito[]).map((c) => <option key={c} value={c}>{t(`credito.${c}`)}</option>)}
          </Select>
        </label>
        {role === 'admin' && (
          <label className="sm:col-span-2">
            <span className="label-up">{t('lead.responsable')}</span>
            <Select className="mt-1.5" value={f.vid} onChange={(v) => setF({ ...f, vid: v })}>
              <option value="">{t('leads.repartoAuto')}</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </Select>
          </label>
        )}
        <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>{t('common.cancelar')}</Button>
          <Button variant="primary" disabled={!ok} onClick={guardar}><Plus size={16} /> {t('leads.crear')}</Button>
        </div>
      </div>
    </Modal>
  )
}

function ImportarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT()
  const { addLeads, reglasCalif, reglasReparto, leads } = useData()
  const [cargado, setCargado] = useState(false)
  const importar = () => {
    const carga = cargaHoy(leads)
    const nuevos = csvEjemplo.map((r, i) =>
      nuevoLead({ nombre: r[0], telefono: r[1], vehiculo: r[2], origen: r[3], campanaId: r[4], credito: r[5], presupuesto: r[6], score: r[7], enZona: r[8] }, reglasCalif, reglasReparto, carga, i),
    )
    addLeads(nuevos)
    const asig = nuevos.filter((l) => l.vendedorId)
    toast.success(tr('toast.importOk', L(), { n: nuevos.length }), {
      description: tr('toast.importDesc', L(), { a: asig.length, c: new Set(asig.map((l) => l.vendedorId)).size, n: nuevos.length - asig.length }),
    })
    setCargado(false)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={t('leads.importar')} width={760}>
      <div className="space-y-4 p-5">
        {!cargado ? (
          <>
            <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-line bg-surface2/40 p-6 text-center hover:border-accent/50">
              <UploadCloud size={28} className="text-accent" />
              <span className="text-[14px] font-semibold">{t('leads.dropzone')}</span>
              <span className="text-[12px] text-fg2">{t('leads.dropzoneSub')}</span>
              <input type="file" accept=".csv" className="hidden" onChange={() => setCargado(true)} />
            </label>
            <Button variant="primary" className="w-full" onClick={() => setCargado(true)}>
              <FileUp size={16} /> {t('leads.usarEjemplo')}
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {CSV_EJEMPLO_HEAD.map((h, i) => (
                <span key={h} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface2 px-2 py-1 text-[11.5px]">
                  <span className="mono text-fg2">{h}</span> → <b className="text-accent">{t(`leads.map.${i}`)}</b>
                </span>
              ))}
            </div>
            <div className="scroll-x max-h-[42vh] overflow-y-auto rounded-[10px] border border-line">
              <table className="w-full min-w-[640px] text-[12px]">
                <thead className="sticky top-0 bg-surface2">
                  <tr>{CSV_EJEMPLO_HEAD.map((h) => <th key={h} className="mono px-2.5 py-2 text-left font-semibold text-fg2">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {csvEjemplo.map((r) => (
                    <tr key={r[1]} className="border-t border-line">
                      <td className="px-2.5 py-1.5 font-medium">{r[0]}</td>
                      <td className="mono px-2.5 py-1.5">{r[1]}</td>
                      <td className="px-2.5 py-1.5">{r[2]}</td>
                      <td className="px-2.5 py-1.5">{r[3]}</td>
                      <td className="px-2.5 py-1.5">{r[4]}</td>
                      <td className="px-2.5 py-1.5">{r[5]}</td>
                      <td className="mono px-2.5 py-1.5">{r[6]}</td>
                      <td className="mono px-2.5 py-1.5">{r[7]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12.5px] text-fg2">{t('leads.importNota')}</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setCargado(false)}>{t('common.volver')}</Button>
              <Button variant="primary" onClick={importar}><FileUp size={16} /> {t('leads.importarN', { n: csvEjemplo.length })}</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

/** Última nota + acceso rápido para agregar otra */
function NotaCelda({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const { t, b, lang } = useT()
  const ultima = lead.notas[0]
  return (
    <button onClick={onOpen} className="group flex min-h-[44px] w-full max-w-[260px] items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-surface2">
      <StickyNote size={15} className={cn('shrink-0', ultima ? 'text-warn' : 'text-muted group-hover:text-accent')} />
      {ultima ? (
        <span className="min-w-0 flex-1">
          <span className="line-clamp-1 text-[12.5px]">{b(ultima.texto)}</span>
          <span className="text-[11px] text-muted">
            {fmtRel(ultima.at, lang)}
            {lead.notas.length > 1 && ` · ${t('leads.masNotas', { n: lead.notas.length - 1 })}`}
          </span>
        </span>
      ) : (
        <span className="text-[12.5px] font-medium text-fg2 group-hover:text-accent">+ {t('leads.agregarNota')}</span>
      )}
    </button>
  )
}

const SUGERENCIAS = ['leads.sug.1', 'leads.sug.2', 'leads.sug.3', 'leads.sug.4', 'leads.sug.5']

function NotasModal({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const { t } = useT()
  const lead = useData((s) => s.leads.find((l) => l.id === leadId))
  const role = useApp((s) => s.role)
  const openLead = useUI((s) => s.openLead)
  if (!lead) return null
  return (
    <Modal open={!!lead} onClose={onClose} width={520} title={t('leads.notasDe', { n: lead.nombre })}>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-fg2">
          <EstadoBadge e={lead.estado} /> {lead.vehiculoInteres} · <span className="mono">{lead.telefono}</span>
        </div>
        <NotasBlock lead={lead} autorId={role === 'admin' ? 'admin' : lead.vendedorId ?? 'admin'} sugerencias={SUGERENCIAS.map((k) => t(k))} />
        <button
          onClick={() => {
            onClose()
            openLead(lead.id)
          }}
          className="h-10 text-[12.5px] font-semibold text-accent hover:underline"
        >
          {t('leads.verFicha')}
        </button>
      </div>
    </Modal>
  )
}

type Tab = 'todos' | 'calificados' | 'no_calificados' | 'sin_contacto'

export default function Leads() {
  const { t, b, lang } = useT()
  const role = useApp((s) => s.role)
  const closerId = useCloserId()
  const leads = useData((s) => s.leads)
  const openLead = useUI((s) => s.openLead)
  const navigate = useNavigate()
  const { id } = useParams()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState<Tab>('todos')
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<string>(sp.get('estado') ?? '')
  const [vid, setVid] = useState('')
  const [origen, setOrigen] = useState('')
  const [dias, setDias] = useState('30')
  const [page, setPage] = useState(0)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [vista, setVista] = useState<'tabla' | 'tablero'>('tabla')
  const [mAsignar, setMAsignar] = useState(false)
  const [mNuevo, setMNuevo] = useState(false)
  const [mImport, setMImport] = useState(false)
  const [notaId, setNotaId] = useState<string | null>(null)
  const esCloser = !!closerId

  useEffect(() => {
    if (id) openLead(id)
  }, [id, openLead])

  const base = useMemo(() => (esCloser ? leads.filter((l) => l.vendedorId === closerId) : leads), [leads, esCloser, closerId])

  const filtrados = useMemo(() => {
    const desde = Date.now() - Number(dias) * DAY
    const qq = q.trim().toLowerCase()
    return base.filter(
      (l) =>
        l.creadoAt >= desde &&
        (tab === 'todos' || (tab === 'calificados' && l.calificado) || (tab === 'no_calificados' && !l.calificado) || (tab === 'sin_contacto' && l.estado === 'asignado')) &&
        (!estado || l.estado === estado) &&
        (!vid || l.vendedorId === vid) &&
        (!origen || l.origen === origen) &&
        (!qq || l.nombre.toLowerCase().includes(qq) || l.telefono.includes(qq) || l.vehiculoInteres.toLowerCase().includes(qq)),
    )
  }, [base, tab, estado, vid, origen, q, dias])

  useEffect(() => setPage(0), [tab, estado, vid, origen, q, dias])

  const pages = Math.max(1, Math.ceil(filtrados.length / PAGE))
  const rows = filtrados.slice(page * PAGE, page * PAGE + PAGE)
  const counts = useMemo(() => {
    const desde = Date.now() - Number(dias) * DAY
    const b = base.filter((l) => l.creadoAt >= desde)
    return { todos: b.length, cal: b.filter((l) => l.calificado).length, no: b.filter((l) => !l.calificado).length, sc: b.filter((l) => l.estado === 'asignado').length }
  }, [base, dias])

  const toggle = (lid: string) => setSel((s) => { const n = new Set(s); n.has(lid) ? n.delete(lid) : n.add(lid); return n })
  const allOnPage = rows.length > 0 && rows.every((r) => sel.has(r.id))
  const togglePage = () => setSel((s) => { const n = new Set(s); rows.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id))); return n })
  const abrir = (l: Lead) => { openLead(l.id); navigate(`/leads/${l.id}`, { replace: true }) }

  const resp = (l: Lead) => {
    const v = vendedorById(l.vendedorId)
    return v ? (
      <span className="flex items-center gap-2 whitespace-nowrap">
        <Avatar initials={v.avatar} color={v.color} size={24} />
        <span className="text-[12.5px]">{v.nombre.split(' ')[0]} <span className="text-muted">· {v.bdc.replace('BDC ', '')}</span></span>
      </span>
    ) : (
      <Badge tone="muted">{t('leads.nurturing')}</Badge>
    )
  }

  const kanban: LeadEstado[] = ['asignado', 'contactado', 'agendado', 'negociacion', 'comprador']

  return (
    <div>
      <PreviewBanner id="leads" />
      <PageHeader
        kicker={t(esCloser ? 'kicker.cartera' : 'kicker.equipo')}
        kickerTone={esCloser ? 'cyan' : 'accent'}
        title={t(esCloser ? 'nav.misLeads' : 'leads.titulo')}
        sub={t(esCloser ? 'leads.subCloser' : 'leads.sub')}
        right={
          <>
            <Button variant="secondary" onClick={() => setMImport(true)} className="flex-1 sm:flex-none"><FileUp size={16} /> {t('leads.importar')}</Button>
            <Button variant="primary" onClick={() => setMNuevo(true)} className="flex-1 sm:flex-none"><Plus size={16} /> {t('leads.nuevo')}</Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="px-3 pt-2 sm:px-4">
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'todos', label: t('leads.tab.todos'), count: counts.todos },
              { value: 'calificados', label: t('leads.tab.calificados'), count: counts.cal },
              { value: 'no_calificados', label: t('leads.tab.noCalificados'), count: counts.no },
              { value: 'sin_contacto', label: t('leads.tab.sinContacto'), count: counts.sc },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9 sm:h-10" placeholder={t('leads.buscar')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select ariaLabel={t('leads.col.estado')} value={estado} onChange={setEstado}>
            <option value="">{t('leads.todosEstados')}</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{t(`estado.${e}`)}</option>)}
          </Select>
          {!esCloser && (
            <Select ariaLabel={t('lead.responsable')} value={vid} onChange={setVid}>
              <option value="">{t('filtro.todosVendedores')}</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </Select>
          )}
          <Select ariaLabel={t('filtro.origen')} value={origen} onChange={setOrigen}>
            <option value="">{t('filtro.todosOrigenes')}</option>
            {ORIGENES.map((o) => <option key={o} value={o}>{t(`origen.${o}`)}</option>)}
          </Select>
          <Select ariaLabel={t('leads.fecha')} value={dias} onChange={setDias}>
            <option value="1">{t('leads.ult24')}</option>
            <option value="7">{t('rango.7d')}</option>
            <option value="30">{t('rango.30d')}</option>
            <option value="84">{t('leads.ult12sem')}</option>
          </Select>
          <Segmented
            size="sm"
            className="hidden sm:inline-flex"
            value={vista}
            onChange={setVista}
            options={[{ value: 'tabla', label: <Table2 size={15} /> }, { value: 'tablero', label: <LayoutGrid size={15} /> }]}
          />
        </div>

        {filtrados.length === 0 ? (
          <Empty icon={<Search size={28} />} title={t('common.sinResultados')} sub={t('common.sinResultadosSub')} />
        ) : vista === 'tablero' ? (
          <div className="scroll-x hidden border-t border-line p-3 sm:block">
            <div className="grid min-w-[1000px] grid-cols-5 gap-3">
              {kanban.map((k) => {
                const col = filtrados.filter((l) => l.estado === k)
                return (
                  <div key={k} className="rounded-[12px] bg-surface2/50 p-2">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <EstadoBadge e={k} />
                      <span className="mono text-[12px] text-fg2">{col.length}</span>
                    </div>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                      {col.slice(0, 30).map((l) => (
                        <button key={l.id} onClick={() => abrir(l)} className="w-full rounded-[10px] border border-line bg-surface p-2.5 text-left hover:border-accent/40">
                          <div className="truncate text-[13px] font-semibold">{l.nombre}</div>
                          <div className="truncate text-[11.5px] text-fg2">{l.vehiculoInteres}</div>
                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
                            {vendedorById(l.vendedorId)?.nombre.split(' ')[0] ?? '—'}
                            <span>{fmtRel(l.creadoAt, lang)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            {/* tabla ≥640 */}
            <div className="scroll-x hidden border-t border-line sm:block">
              <table className="w-full min-w-[860px] text-[13px]">
                <thead className="bg-surface2/50">
                  <tr className="text-left">
                    <th className="w-12 px-3 py-2"><input type="checkbox" checked={allOnPage} onChange={togglePage} className="h-4 w-4 accent-[#3b82f6]" aria-label="all" data-trailer="leads-check-all" /></th>
                    <th className="label-up px-2 py-2">{t('leads.col.nombre')}</th>
                    <th className="label-up hidden px-2 py-2 md:table-cell">{t('leads.col.vehiculo')}</th>
                    <th className="label-up px-2 py-2">{t('leads.col.origen')}</th>
                    <th className="label-up px-2 py-2">{t('leads.col.estado')}</th>
                    {!esCloser && <th className="label-up px-2 py-2">{t('lead.responsable')}</th>}
                    <th className="label-up hidden px-2 py-2 lg:table-cell">{t('leads.col.antiguedad')}</th>
                    <th className="label-up hidden px-2 py-2 md:table-cell">{t('leads.col.notas')}</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <tr key={l.id} onClick={() => abrir(l)} className={cn('cursor-pointer border-t border-line hover:bg-surface2/60', sel.has(l.id) && 'bg-[rgba(59,130,246,.06)]')}>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={sel.has(l.id)} onChange={() => toggle(l.id)} className="h-4 w-4 accent-[#3b82f6]" aria-label={l.nombre} />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {l.nombre}
                          {!l.calificado && <Badge tone="muted" className="px-1.5 py-0 text-[10px]">{t('lead.noCalificadoCorto')}</Badge>}
                        </div>
                        <div className="mono text-[11.5px] text-fg2">{l.telefono}</div>
                      </td>
                      <td className="hidden px-2 py-2 md:table-cell">{l.vehiculoInteres}</td>
                      <td className="px-2 py-2 text-[12.5px]">
                        {t(`origen.${l.origen}`)}
                        {l.campanaId && <div className="max-w-[160px] truncate text-[11px] text-muted">{campanas.find((c) => c.id === l.campanaId)?.nombre}</div>}
                      </td>
                      <td className="px-2 py-2"><EstadoBadge e={l.estado} /></td>
                      {!esCloser && <td className="px-2 py-2">{resp(l)}</td>}
                      <td className="hidden px-2 py-2 lg:table-cell">
                        {l.estado === 'asignado' && l.asignadoAt ? <LiveTimer since={l.asignadoAt} /> : <span className="text-[12.5px] text-fg2">{fmtRel(l.creadoAt, lang)}</span>}
                      </td>
                      <td className="hidden px-2 py-2 md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <NotaCelda lead={l} onOpen={() => setNotaId(l.id)} />
                      </td>
                      <td className="px-1 py-1" onClick={(e) => e.stopPropagation()}>
                        <DM.Root modal={false}>
                          <DM.Trigger asChild>
                            <button className="grid h-10 w-10 place-items-center rounded-lg text-fg2 hover:bg-surface2" aria-label={t('common.acciones')}><MoreVertical size={16} /></button>
                          </DM.Trigger>
                          <DM.Portal>
                            <DM.Content align="end" className="z-[60] min-w-[200px] rounded-xl border border-line bg-surface p-1.5 shadow-2xl">
                              <DM.Item onSelect={() => abrir(l)} className="flex h-11 cursor-pointer items-center rounded-lg px-3 text-[13px] outline-none data-[highlighted]:bg-surface2">{t('leads.abrirFicha')}</DM.Item>
                              <DM.Item onSelect={() => { useUI.getState().openChat(l.id); navigate('/whatsapp') }} className="flex h-11 cursor-pointer items-center rounded-lg px-3 text-[13px] outline-none data-[highlighted]:bg-surface2">{t('leads.abrirChat')}</DM.Item>
                              {role === 'admin' && <DM.Item onSelect={() => { setSel(new Set([l.id])); setMAsignar(true) }} className="flex h-11 cursor-pointer items-center rounded-lg px-3 text-[13px] outline-none data-[highlighted]:bg-surface2">{t('leads.asignarA')}</DM.Item>}
                            </DM.Content>
                          </DM.Portal>
                        </DM.Root>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* tarjetas <640 */}
            <div className="space-y-2 border-t border-line p-3 sm:hidden">
              {rows.map((l) => (
                <div key={l.id} onClick={() => abrir(l)} className={cn('flex gap-3 rounded-[12px] border border-line p-3', sel.has(l.id) && 'border-accent/50 bg-[rgba(59,130,246,.06)]')}>
                  <label className="-m-1 grid h-11 w-11 shrink-0 place-items-center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={sel.has(l.id)} onChange={() => toggle(l.id)} className="h-5 w-5 accent-[#3b82f6]" aria-label={l.nombre} />
                  </label>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{l.nombre}</div>
                        <div className="truncate text-[12px] text-fg2">{l.vehiculoInteres} · {t(`origen.${l.origen}`)}</div>
                      </div>
                      <EstadoBadge e={l.estado} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      {!esCloser ? resp(l) : <span />}
                      {l.estado === 'asignado' && l.asignadoAt ? <LiveTimer since={l.asignadoAt} /> : <span className="text-[11.5px] text-muted">{fmtRel(l.creadoAt, lang)}</span>}
                    </div>
                    {l.notas[0] && <p className="mt-2 line-clamp-2 rounded-lg bg-surface2/60 px-2.5 py-1.5 text-[12px] text-fg2">📝 {b(l.notas[0].texto)}</p>}
                    <div className="mt-2 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="secondary" onClick={() => setNotaId(l.id)}>
                        <StickyNote size={15} /> {l.notas.length ? t('leads.notaN', { n: l.notas.length }) : t('leads.agregarNota')}
                      </Button>
                      {l.estado === 'asignado' && <RegistrarLlamadaBtn lead={l} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2.5 text-[12.5px] text-fg2 sm:px-4">
              <span>{t('common.resultados', { n: filtrados.length.toLocaleString('en-US') })}</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label={t('common.anterior')}><ChevronLeft size={17} /></Button>
                <span className="mono px-1">{t('common.pagina', { a: page + 1, b: pages })}</span>
                <Button size="icon" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label={t('common.siguiente')}><ChevronRight size={17} /></Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* barra de acción masiva */}
      {sel.size > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center gap-2 rounded-[14px] border border-accent/40 bg-surface/95 p-2 pl-4 shadow-2xl backdrop-blur-xl lg:bottom-6">
          <span className="flex-1 text-[13px] font-semibold">{t('leads.seleccionados', { n: sel.size })}</span>
          {role === 'admin' && (
            <Button size="sm" variant="primary" onClick={() => setMAsignar(true)} data-trailer="asignar-masivo"><UserPlus size={15} /> {t('leads.asignarA')}</Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => setSel(new Set())} aria-label={t('common.cerrar')}><X size={17} /></Button>
        </div>
      )}

      <NotasModal leadId={notaId} onClose={() => setNotaId(null)} />
      <AsignarModal ids={[...sel]} open={mAsignar} onClose={() => setMAsignar(false)} onDone={() => setSel(new Set())} />
      <NuevoLeadModal open={mNuevo} onClose={() => setMNuevo(false)} />
      <ImportarModal open={mImport} onClose={() => setMImport(false)} />
    </div>
  )
}
