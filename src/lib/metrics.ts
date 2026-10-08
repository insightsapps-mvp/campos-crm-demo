import { DAY, NOW, campanas, vendedores } from '@/mock/base'
import type { Bdc, Lead, Origen } from '@/mock/types'

export type RangoId = 'hoy' | '7d' | '30d' | 'mes' | 'custom'

export interface Filtros {
  rango: RangoId
  desde?: number
  hasta?: number
  vendedorId?: string | null
  bdc?: Bdc | null
  origen?: Origen | null
}

export function rangoFechas(f: Pick<Filtros, 'rango' | 'desde' | 'hasta'>): [number, number] {
  const fin = Date.now()
  switch (f.rango) {
    case 'hoy': {
      const d = new Date(fin)
      d.setHours(0, 0, 0, 0)
      return [d.getTime(), fin]
    }
    case '7d':
      return [fin - 7 * DAY, fin]
    case 'mes': {
      const d = new Date(fin)
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
      return [d.getTime(), fin]
    }
    case 'custom':
      return [f.desde ?? fin - 30 * DAY, f.hasta ?? fin]
    default:
      return [fin - 30 * DAY, fin]
  }
}

export const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0)

export interface Stats {
  asignados: number
  contactados: number
  sinContactar: number
  velMediana: number // minutos
  velPromedio: number
  agendados: number
  citasRealizadas: number
  noShows: number
  negociacion: number
  ventas: number
  tasaAgenda: number
  tasaCierreCitas: number
  tasaCierreAsignados: number
  msgsIn: number
  msgsRespondidos: number
  msgsSinResponder: number
  tasaRespuesta: number
  ingresos: number
  ganancia: number
  margen: number
  cash: number
  cashSemana: number
  cashMes: number
  ventasMes: number
}

export function filtrarAsignados(leads: Lead[], f: Filtros) {
  const [d, h] = rangoFechas(f)
  return leads.filter(
    (l) =>
      l.vendedorId &&
      l.asignadoAt !== null &&
      l.asignadoAt >= d &&
      l.asignadoAt <= h &&
      (!f.vendedorId || l.vendedorId === f.vendedorId) &&
      (!f.bdc || l.bdc === f.bdc) &&
      (!f.origen || l.origen === f.origen),
  )
}

/** Stats de una cohorte de leads asignados + cash por ventana calendario (semana / mes). */
export function calcStats(cohorte: Lead[], universo?: Lead[]): Stats {
  const contactados = cohorte.filter((l) => l.primerContactoAt)
  const tiempos = contactados.map((l) => (l.primerContactoAt! - l.asignadoAt!) / 60000)
  const agendados = contactados.filter((l) => l.citaAt)
  const realizadas = agendados.filter((l) => l.citaRealizada)
  const ventasL = cohorte.filter((l) => l.estado === 'comprador' && l.venta)
  const msgsIn = cohorte.reduce((s, l) => s + l.msgsIn, 0)
  const sinResp = cohorte.reduce((s, l) => s + l.msgsSinResponder, 0)
  const ingresos = ventasL.reduce((s, l) => s + l.venta!.precio, 0)
  const ganancia = ventasL.reduce((s, l) => s + l.venta!.ganancia, 0)
  const base = universo ?? cohorte
  const ahora = Date.now()
  const inicioMes = new Date(ahora)
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const vendidosBase = base.filter((l) => l.estado === 'comprador' && l.venta && l.cerradoAt)
  const semana = vendidosBase.filter((l) => l.cerradoAt! >= ahora - 7 * DAY)
  const mes = vendidosBase.filter((l) => l.cerradoAt! >= inicioMes.getTime())
  return {
    asignados: cohorte.length,
    contactados: contactados.length,
    sinContactar: cohorte.filter((l) => !l.primerContactoAt && l.estado === 'asignado').length,
    velMediana: median(tiempos),
    velPromedio: mean(tiempos),
    agendados: agendados.length,
    citasRealizadas: realizadas.length,
    noShows: agendados.filter((l) => l.citaRealizada === false).length,
    negociacion: cohorte.filter((l) => l.estado === 'negociacion').length,
    ventas: ventasL.length,
    tasaAgenda: pct(agendados.length, contactados.length),
    tasaCierreCitas: pct(ventasL.length, realizadas.length),
    tasaCierreAsignados: pct(ventasL.length, cohorte.length),
    msgsIn,
    msgsRespondidos: msgsIn - sinResp,
    msgsSinResponder: sinResp,
    tasaRespuesta: pct(msgsIn - sinResp, msgsIn),
    ingresos,
    ganancia,
    margen: pct(ganancia, ingresos),
    cash: ventasL.reduce((s, l) => s + l.venta!.cash, 0),
    cashSemana: semana.reduce((s, l) => s + l.venta!.cash, 0),
    cashMes: mes.reduce((s, l) => s + l.venta!.cash, 0),
    ventasMes: mes.length,
  }
}

export interface FilaRanking extends Stats {
  vendedorId: string
  posicion: number
  brecha: 'contacto' | 'agenda' | 'cierre' | null
}

/** Ranking del equipo (score compuesto por las 3 métricas) */
export function ranking(leads: Lead[], f: Filtros): { filas: FilaRanking[]; equipo: Stats } {
  const cohorte = filtrarAsignados(leads, { ...f, vendedorId: null })
  const equipo = calcStats(cohorte, leads.filter((l) => l.vendedorId))
  const vs = vendedores.filter((v) => !f.vendedorId || v.id === f.vendedorId).filter((v) => !f.bdc || v.bdc === f.bdc)
  const filas = vs.map((v) => {
    const st = calcStats(
      cohorte.filter((l) => l.vendedorId === v.id),
      leads.filter((l) => l.vendedorId === v.id),
    )
    let brecha: FilaRanking['brecha'] = null
    if (st.velMediana > equipo.velMediana * 3) brecha = 'contacto'
    else if (st.tasaCierreCitas < equipo.tasaCierreCitas * 0.6) brecha = 'cierre'
    else if (st.tasaAgenda < equipo.tasaAgenda * 0.75) brecha = 'agenda'
    return { ...st, vendedorId: v.id, posicion: 0, brecha }
  })
  const score = (s: Stats) =>
    (s.tasaCierreAsignados / Math.max(1, equipo.tasaCierreAsignados)) * 0.5 +
    (s.tasaAgenda / Math.max(1, equipo.tasaAgenda)) * 0.25 +
    (Math.max(1, equipo.velMediana) / Math.max(1, s.velMediana)) * 0.25 * 0.6
  ;[...filas].sort((a, b) => score(b) - score(a)).forEach((fl, i) => (fl.posicion = i + 1))
  return { filas: filas.sort((a, b) => a.posicion - b.posicion), equipo }
}

export interface Semana {
  label: string
  inicio: number
  velocidad: number
  agendamiento: number
  cierre: number
  ventas: number
  cash: number
}

export function evolucionSemanal(leads: Lead[], vendedorId?: string | null, semanas = 12): Semana[] {
  const out: Semana[] = []
  const fin = NOW
  for (let i = semanas - 1; i >= 0; i--) {
    const h = fin - i * 7 * DAY
    const d = h - 7 * DAY
    const c = leads.filter((l) => l.vendedorId && (!vendedorId || l.vendedorId === vendedorId) && l.asignadoAt! >= d && l.asignadoAt! < h)
    const st = calcStats(c)
    const dt = new Date(d)
    out.push({
      label: `${dt.getDate()}/${dt.getMonth() + 1}`,
      inicio: d,
      velocidad: Math.round(st.velMediana * 10) / 10,
      agendamiento: Math.round(st.tasaAgenda * 10) / 10,
      cierre: Math.round(st.tasaCierreCitas * 10) / 10,
      ventas: st.ventas,
      cash: st.cash,
    })
  }
  return out
}

export function evolucionMensual(leads: Lead[], vendedorId?: string | null): Semana[] {
  const out: Semana[] = []
  for (let i = 2; i >= 0; i--) {
    const h = NOW - i * 28 * DAY
    const d = h - 28 * DAY
    const c = leads.filter((l) => l.vendedorId && (!vendedorId || l.vendedorId === vendedorId) && l.asignadoAt! >= d && l.asignadoAt! < h)
    const st = calcStats(c)
    const dt = new Date(h - DAY)
    out.push({
      label: `${dt.getDate()}/${dt.getMonth() + 1}`,
      inicio: d,
      velocidad: Math.round(st.velMediana * 10) / 10,
      agendamiento: Math.round(st.tasaAgenda * 10) / 10,
      cierre: Math.round(st.tasaCierreCitas * 10) / 10,
      ventas: st.ventas,
      cash: st.cash,
    })
  }
  return out
}

export function distribucionVelocidad(cohorte: Lead[]) {
  const t = cohorte.filter((l) => l.primerContactoAt).map((l) => (l.primerContactoAt! - l.asignadoAt!) / 60000)
  const n = t.length || 1
  return [
    { id: 'lt5', value: pct(t.filter((x) => x < 5).length, n) },
    { id: '5_15', value: pct(t.filter((x) => x >= 5 && x < 15).length, n) },
    { id: '15_60', value: pct(t.filter((x) => x >= 15 && x < 60).length, n) },
    { id: 'gt60', value: pct(t.filter((x) => x >= 60).length, n) },
  ]
}

export interface StatsCampana {
  id: string
  nombre: string
  origen: Origen
  gasto: number
  leads: number
  calificados: number
  noCalificados: number
  tasaCalif: number
  cpl: number
  costoCalificado: number
  citas: number
  ventas: number
  costoVenta: number
  ingresos: number
  ganancia: number
  roi: number
  scoreMedio: number
}

/** Calidad de leads por anuncio (últimos 30 días por creación) */
export function statsCampanas(leads: Lead[], dias = 30): StatsCampana[] {
  const desde = Date.now() - dias * DAY
  const rows = leads.filter((l) => l.creadoAt >= desde)
  const ids: { id: string; nombre: string; origen: Origen; gasto: number }[] = [
    ...campanas.map((c) => ({ id: c.id, nombre: c.nombre, origen: c.origen, gasto: c.gasto })),
    { id: 'walkin', nombre: 'Walk-in', origen: 'walkin', gasto: 0 },
    { id: 'referido', nombre: 'Referidos', origen: 'referido', gasto: 0 },
  ]
  return ids.map((c) => {
    const ls = rows.filter((l) => (l.campanaId ?? l.origen) === c.id)
    const cal = ls.filter((l) => l.calificado)
    const ventasL = ls.filter((l) => l.estado === 'comprador' && l.venta)
    const ingresos = ventasL.reduce((s, l) => s + l.venta!.precio, 0)
    const ganancia = ventasL.reduce((s, l) => s + l.venta!.ganancia, 0)
    return {
      ...c,
      leads: ls.length,
      calificados: cal.length,
      noCalificados: ls.length - cal.length,
      tasaCalif: pct(cal.length, ls.length),
      cpl: ls.length ? c.gasto / ls.length : 0,
      costoCalificado: cal.length ? c.gasto / cal.length : 0,
      citas: ls.filter((l) => l.citaAt).length,
      ventas: ventasL.length,
      costoVenta: ventasL.length ? c.gasto / ventasL.length : 0,
      ingresos,
      ganancia,
      roi: c.gasto ? ganancia / c.gasto : 0,
      scoreMedio: mean(ls.map((l) => l.score)),
    }
  })
}
