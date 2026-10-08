import {
  DANIELA_ID, DAY, HOUR, KEVIN_ID, MIN, NOW, apellidos, calidadCampana, campanas, nombres, perfiles, rng,
  vehiculos, vendedores,
} from './base'
import type { Bi, Credito, Evento, Lead, LeadEstado, Nota, Origen, Seguimiento } from './types'

const r = rng(20261008)
const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)]
const between = (a: number, b: number) => a + r() * (b - a)
/** normal estándar (Box-Muller) */
const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r())

let seq = 0
const uid = (p: string) => `${p}${(++seq).toString(36)}`

/** Lleva un timestamp a horario comercial (9-20 h) */
function horaComercial(t: number) {
  const d = new Date(t)
  const h = d.getHours()
  if (h < 9) d.setHours(9 + Math.floor(r() * 3), Math.floor(r() * 60))
  if (h >= 20) d.setHours(10 + Math.floor(r() * 8), Math.floor(r() * 60))
  return d.getTime()
}

function telefono() {
  const area = pick(['305', '786', '954'])
  const n = Math.floor(1000 + r() * 8999)
  return `+1 (${area}) 555-${n}`
}

const notasPool: Bi[] = [
  { es: 'Busca cuota mensual por debajo de $450. Tiene trade-in (Corolla 2016).', en: 'Wants monthly payment under $450. Has a trade-in (2016 Corolla).' },
  { es: 'Prefiere que lo contacten después de las 6 pm por WhatsApp.', en: 'Prefers to be contacted after 6 pm on WhatsApp.' },
  { es: 'Viene con su esposa a ver el vehículo. Quiere color blanco.', en: 'Coming with his wife to see the vehicle. Wants it in white.' },
  { es: 'Crédito en reconstrucción: ofrecer plan con down payment más alto.', en: 'Rebuilding credit: offer a plan with a higher down payment.' },
  { es: 'Comparando con otro dealer en Hialeah. Mejorar oferta de trade-in.', en: 'Comparing with another dealer in Hialeah. Improve the trade-in offer.' },
  { es: 'Pidió cotización con y sin garantía extendida.', en: 'Asked for a quote with and without extended warranty.' },
  { es: 'Necesita el auto antes del 15 para empezar trabajo nuevo.', en: 'Needs the car before the 15th to start a new job.' },
]

const seguimientoPool: Bi[] = [
  { es: 'Enviar cotización final con trade-in', en: 'Send final quote with trade-in' },
  { es: 'Llamar para confirmar aprobación del banco', en: 'Call to confirm bank approval' },
  { es: 'Recordar documentos: licencia y comprobante de ingresos', en: 'Remind documents: license and proof of income' },
  { es: 'Seguimiento post test-drive', en: 'Post test-drive follow-up' },
  { es: 'Confirmar visita del sábado', en: 'Confirm Saturday visit' },
]

const motivosNoCalif: Bi[] = [
  { es: 'Score bajo: sin presupuesto definido', en: 'Low score: no defined budget' },
  { es: 'Fuera de la zona de cobertura', en: 'Outside the coverage area' },
  { es: 'Crédito malo sin down payment', en: 'Bad credit with no down payment' },
  { es: 'Solo consultando precios', en: 'Just checking prices' },
]

function weightedCloser() {
  const total = vendedores.reduce((s, v) => s + perfiles[v.id].peso, 0)
  let x = r() * total
  for (const v of vendedores) {
    x -= perfiles[v.id].peso
    if (x <= 0) return v
  }
  return vendedores[0]
}

function origenYCampana(): { origen: Origen; campanaId: string | null } {
  const x = r()
  if (x < 0.27) return { origen: 'facebook', campanaId: 'c1' }
  if (x < 0.46) return { origen: 'facebook', campanaId: 'c2' }
  if (x < 0.6) return { origen: 'google', campanaId: 'c3' }
  if (x < 0.71) return { origen: 'google', campanaId: 'c4' }
  if (x < 0.8) return { origen: 'marketplace', campanaId: 'c5' }
  if (x < 0.88) return { origen: 'web', campanaId: 'c6' }
  if (x < 0.95) return { origen: 'walkin', campanaId: null }
  return { origen: 'referido', campanaId: null }
}

function makeLead(creadoAt: number, forceQualified: boolean | null): Lead {
  const id = uid('L')
  const nombre = `${pick(nombres)} ${pick(apellidos)}`
  const veh = pick(vehiculos)
  const { origen, campanaId } = origenYCampana()
  const q = calidadCampana[campanaId ?? origen] ?? 0.7
  let calificado = forceQualified ?? r() < q
  // si forzamos calificado y la campaña es mala, igual respetamos el forzado
  const credito: Credito = calificado ? pick(['bueno', 'bueno', 'regular', 'sin_historial']) : pick(['malo', 'regular', 'sin_historial', 'malo'])
  const presupuesto = calificado ? Math.round(between(2000, 9000) / 100) * 100 : Math.round(between(0, 2500) / 100) * 100
  const enZona = calificado ? true : r() < 0.6
  const score = calificado ? Math.round(between(62, 98)) : Math.round(between(18, 58))
  const v = calificado ? weightedCloser() : null
  const camp = campanaId ? campanas.find((c) => c.id === campanaId)! : null
  const anuncio = camp ? pick(camp.anuncios) : null
  const idioma: 'es' | 'en' = r() < 0.72 ? 'es' : 'en'
  const financiacion = r() < 0.74 ? 'financiado' : r() < 0.6 ? 'contado' : 'leasing'
  const tradeIn = r() < (calificado ? 0.42 : 0.2)
  const bdc = v ? v.bdc : r() < 0.5 ? 'BDC Norte' : 'BDC Sur'

  const historial: Evento[] = [
    { id: uid('e'), tipo: 'creado', at: creadoAt, detalle: { es: campanaId ? campanas.find((c) => c.id === campanaId)!.nombre : origen === 'walkin' ? 'Walk-in en el dealer' : 'Referido por cliente', en: campanaId ? campanas.find((c) => c.id === campanaId)!.nombre : origen === 'walkin' ? 'Walk-in at the dealership' : 'Referred by a customer' } },
  ]
  const lead: Lead = {
    id, nombre, telefono: telefono(), vehiculoInteres: veh.nombre, segmento: veh.segmento, origen, campanaId, anuncio, idioma,
    financiacion: financiacion as Lead['financiacion'], tradeIn, score, credito,
    presupuesto, enZona, calificado, estado: 'nuevo', vendedorId: v ? v.id : null, bdc, creadoAt,
    asignadoAt: null, msgsIn: 0, msgsSinResponder: 0, historial, notas: [], seguimientos: [],
  }

  if (!calificado || !v) {
    historial.push({ id: uid('e'), tipo: 'no_calificado', at: creadoAt + 20_000, detalle: pick(motivosNoCalif) })
    lead.estado = NOW - creadoAt > 21 * DAY && r() < 0.6 ? 'perdido' : 'nuevo'
    return lead
  }

  const p = perfiles[v.id]
  const asignadoAt = creadoAt + Math.round(between(15, 90)) * 1000
  lead.asignadoAt = asignadoAt
  historial.push({ id: uid('e'), tipo: 'calificado', at: creadoAt + 10_000, detalle: { es: `Score ${score}/100`, en: `Score ${score}/100` } })
  historial.push({ id: uid('e'), tipo: 'asignado', at: asignadoAt, vendedorId: v.id })

  const delayMin = Math.max(1, p.medianaMin * Math.exp(p.sigma * gauss()))
  const contactoAt = asignadoAt + delayMin * MIN
  if (contactoAt > NOW) {
    lead.estado = 'asignado'
    return lead
  }
  lead.primerContactoAt = contactoAt
  historial.push({ id: uid('e'), tipo: r() < 0.82 ? 'contacto' : 'llamada', at: contactoAt, minutos: Math.round(delayMin), vendedorId: v.id })
  lead.estado = 'contactado'
  lead.msgsIn = 2 + Math.floor(r() * 7)
  lead.msgsSinResponder = Math.min(lead.msgsIn, Math.round(lead.msgsIn * p.pSinResp * between(0.4, 2.2)))

  const edad = NOW - contactoAt
  if (r() < p.pAgenda) {
    const citaAt = horaComercial(contactoAt + between(0.6, 5) * DAY)
    lead.citaAt = citaAt
    historial.push({ id: uid('e'), tipo: 'cita', at: contactoAt + between(2, 40) * MIN, detalle: { es: veh.nombre, en: veh.nombre } })
    if (citaAt > NOW) {
      lead.estado = 'agendado'
    } else if (r() < p.pShow) {
      lead.citaRealizada = true
      historial.push({ id: uid('e'), tipo: 'cita_realizada', at: citaAt + 50 * MIN })
      if (r() < p.pCierre) {
        const cerradoAt = horaComercial(citaAt + between(0, 2.5) * DAY)
        if (cerradoAt > NOW) {
          lead.estado = 'negociacion'
          historial.push({ id: uid('e'), tipo: 'negociacion', at: citaAt + 2 * HOUR })
        } else {
          lead.estado = 'comprador'
          lead.cerradoAt = cerradoAt
          const precio = Math.round((veh.precio * between(0.95, 1.05)) / 100) * 100
          const ganancia = Math.round(precio * p.margen * between(0.82, 1.18))
          const cash = r() < 0.17 ? precio : Math.round((precio * between(0.1, 0.3)) / 100) * 100
          lead.venta = { precio, ganancia, cash }
          historial.push({ id: uid('e'), tipo: 'comprador', at: cerradoAt, detalle: { es: `USD ${precio.toLocaleString('en-US')}`, en: `USD ${precio.toLocaleString('en-US')}` } })
        }
      } else if (NOW - citaAt < 8 * DAY && r() < 0.55) {
        lead.estado = 'negociacion'
        historial.push({ id: uid('e'), tipo: 'negociacion', at: citaAt + 3 * HOUR })
      } else {
        lead.estado = 'perdido'
        historial.push({ id: uid('e'), tipo: 'perdido', at: citaAt + between(1, 4) * DAY })
      }
    } else {
      lead.citaRealizada = false
      historial.push({ id: uid('e'), tipo: 'no_show', at: citaAt + HOUR })
      lead.estado = NOW - citaAt < 6 * DAY ? 'contactado' : 'perdido'
    }
  } else if (edad > 12 * DAY && r() < 0.65) {
    lead.estado = 'perdido'
    historial.push({ id: uid('e'), tipo: 'perdido', at: contactoAt + between(6, 11) * DAY })
  }

  if (['contactado', 'agendado', 'negociacion'].includes(lead.estado)) {
    const nNotas = Math.floor(r() * 3)
    for (let i = 0; i < nNotas; i++) {
      const at = contactoAt + between(0.1, 0.9) * Math.max(HOUR, NOW - contactoAt)
      const n: Nota = { id: uid('n'), at, autorId: v.id, texto: pick(notasPool) }
      lead.notas.push(n)
    }
    if (r() < 0.55) {
      const s: Seguimiento = {
        id: uid('s'), at: horaComercial(NOW + between(0.1, 4) * DAY), titulo: pick(seguimientoPool),
        canal: pick(['whatsapp', 'llamada', 'visita']), recordatorio: true, hecho: false,
      }
      lead.seguimientos.push(s)
    }
  }
  historial.sort((a, b) => a.at - b.at)
  return lead
}

/** ~100 consultas por día durante 12 semanas (menos el domingo), horario 8-22 h */
function generar(): Lead[] {
  const out: Lead[] = []
  const hoy = new Date(NOW)
  hoy.setHours(0, 0, 0, 0)
  for (let d = 0; d < 84; d++) {
    const dia = hoy.getTime() - d * DAY
    const dow = new Date(dia).getDay()
    const base = dow === 0 ? 62 : dow === 6 ? 88 : 104
    const n = Math.round(base * between(0.88, 1.12))
    for (let i = 0; i < n; i++) {
      const hora = 8 + Math.min(13.99, Math.abs(gauss() * 3.4 + (r() < 0.5 ? 4 : 9)))
      const t = dia + hora * HOUR
      if (t > NOW - 2 * MIN) continue
      out.push(makeLead(t, null))
    }
  }
  return out.sort((a, b) => b.creadoAt - a.creadoAt)
}


/** Casos borde visibles y leads "en vivo" para los cronómetros */
function casosBorde(leads: Lead[]) {
  const recent = (vid: string, minutos: number, nombre: string, veh: string, campanaId: string) => {
    const l = makeLead(NOW - minutos * MIN - 40_000, true)
    const v = vendedores.find((x) => x.id === vid)!
    const vehObj = vehiculos.find((x) => x.nombre === veh)!
    const c = campanas.find((x) => x.id === campanaId)!
    Object.assign(l, {
      nombre, vehiculoInteres: veh, segmento: vehObj.segmento, origen: c.origen, campanaId, vendedorId: vid, bdc: v.bdc,
      estado: 'asignado' as LeadEstado, asignadoAt: NOW - minutos * MIN, primerContactoAt: undefined, citaAt: undefined,
      citaRealizada: undefined, cerradoAt: undefined, venta: undefined, msgsIn: 1, msgsSinResponder: 1, notas: [], seguimientos: [],
    })
    l.historial = [
      { id: uid('e'), tipo: 'creado', at: l.asignadoAt! - 40_000, detalle: { es: c.nombre, en: c.nombre } },
      { id: uid('e'), tipo: 'calificado', at: l.asignadoAt! - 20_000, detalle: { es: `Score ${l.score}/100`, en: `Score ${l.score}/100` } },
      { id: uid('e'), tipo: 'asignado', at: l.asignadoAt!, vendedorId: vid },
    ]
    leads.unshift(l)
    return l
  }
  // quitamos los "asignado" reales de Daniela para controlar su lista
  for (let i = leads.length - 1; i >= 0; i--) if (leads[i].vendedorId === DANIELA_ID && leads[i].estado === 'asignado') leads.splice(i, 1)
  recent(KEVIN_ID, 220, 'Jessica Morales', 'Toyota RAV4 2023', 'c1')
  recent(KEVIN_ID, 95, 'Brandon Lewis', 'Ford F-150 2023', 'c4')
  recent(KEVIN_ID, 48, 'Paola Castillo', 'Hyundai Tucson 2024', 'c2')
  recent(DANIELA_ID, 41, 'Ricardo Vargas', 'Honda CR-V 2024', 'c1')
  recent(DANIELA_ID, 14, 'Megan Clark', 'Toyota Camry 2024', 'c3')
  recent(DANIELA_ID, 3, 'Héctor Aguilar', 'Chevrolet Equinox 2024', 'c6')
  recent('v6', 22, 'Amanda White', 'Kia Sportage 2024', 'c2')
  recent('v8', 9, 'Óscar Medina', 'Nissan Rogue 2024', 'c5')
}

export const leadsIniciales: Lead[] = (() => {
  const l = generar()
  casosBorde(l)
  return l
})()

export { uid }
