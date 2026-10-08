import { DANIELA_ID, HOUR, MIN, NOW, rng, vendedorById, vendedores } from './base'
import { plantillasIniciales } from './plantillas'
import type { Bi, Lead, Mensaje } from './types'

const r = rng(777)
let seq = 0
const mid = () => `m${(++seq).toString(36)}`

/** Completa {{variables}} de una plantilla con los datos del lead */
export function rellenar(texto: string, lead: Lead, extra: Record<string, string> = {}) {
  const v = vendedorById(lead.vendedorId)
  const vars: Record<string, string> = {
    nombre: lead.nombre.split(' ')[0],
    vehiculo: lead.vehiculoInteres,
    vendedor: v ? v.nombre.split(' ')[0] : 'Campos Auto',
    ...extra,
  }
  return texto.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}

const biRellenar = (b: Bi, lead: Lead, extra: Record<string, string> = {}): Bi => ({
  es: rellenar(b.es, lead, extra),
  en: rellenar(b.en, lead, extra),
})

const fechaCorta = (t: number) => {
  const d = new Date(t)
  return {
    es: d.toLocaleDateString('es-US', { weekday: 'long', day: 'numeric', month: 'short' }),
    en: d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' }),
    hora: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

const inPool: Bi[][] = [
  [
    { es: '¡Hola! Sí, me interesa. ¿Cuánto sería el down payment?', en: 'Hi! Yes, I am interested. How much would the down payment be?' },
    { es: 'Tengo un Corolla 2016 para dar en parte de pago', en: 'I have a 2016 Corolla to trade in' },
    { es: '¿Puedo pasar a verlo esta semana?', en: 'Can I come see it this week?' },
  ],
  [
    { es: 'Buenas, ¿todavía lo tienen disponible?', en: 'Hi, do you still have it available?' },
    { es: '¿Lo tienen en color gris?', en: 'Do you have it in gray?' },
    { es: 'Ok, me gustaría hacer un test drive', en: 'Ok, I would like to do a test drive' },
  ],
  [
    { es: 'Hola, ¿aceptan ITIN para financiar?', en: 'Hi, do you accept ITIN for financing?' },
    { es: 'Perfecto, ¿qué papeles tengo que llevar?', en: 'Great, what documents should I bring?' },
    { es: 'Dale, ¿el sábado a la mañana tienen lugar?', en: 'Sure, do you have a slot Saturday morning?' },
  ],
]
const outPool: Bi[] = [
  { es: 'Con tu perfil el down arranca en $2,500 y la cuota queda cerca de $430/mes. ¿Tenés trade-in?', en: 'With your profile the down payment starts at $2,500 and the payment is about $430/month. Do you have a trade-in?' },
  { es: 'Sí, lo tenemos en gris y en blanco. Te mando fotos 📸', en: 'Yes, we have it in gray and white. Sending you photos 📸' },
  { es: 'Sí, trabajamos con ITIN. Traé licencia, 2 recibos de sueldo y comprobante de domicilio.', en: 'Yes, we work with ITIN. Bring your license, 2 pay stubs and proof of address.' },
]
const negociacionIn: Bi = { es: 'En otro dealer me ofrecieron $1,500 menos 🤔', en: 'Another dealer offered me $1,500 less 🤔' }
const negociacionOut: Bi = { es: 'Dejame hablar con el gerente y te mejoro el trade-in. Te escribo en un rato.', en: 'Let me talk to my manager and I will improve your trade-in. I will text you shortly.' }
const confirmaIn: Bi = { es: 'Perfecto, ahí estaré 👍', en: 'Perfect, I will be there 👍' }
const seguimientoIn: Bi = { es: '¿Hola? ¿Me pudieron ver lo de la cuota?', en: 'Hello? Were you able to check the monthly payment?' }
const primerIn = (l: Lead): Bi => ({
  es: `Hola, vi el anuncio del ${l.vehiculoInteres}. ¿Sigue disponible?`,
  en: `Hi, I saw the ad for the ${l.vehiculoInteres}. Is it still available?`,
})
const graciasIn: Bi = { es: '¡Gracias! Feliz con el auto 🙌', en: 'Thanks! Happy with the car 🙌' }

function hilo(l: Lead): Mensaje[] {
  const ms: Mensaje[] = []
  const add = (direccion: 'in' | 'out', texto: Bi, at: number, extra: Partial<Mensaje> = {}) =>
    ms.push({ id: mid(), leadId: l.id, direccion, texto, at, estado: 'leido', ...extra })

  if (!l.primerContactoAt) {
    add('in', primerIn(l), (l.asignadoAt ?? l.creadoAt) - 30_000)
    return ms
  }
  const pool = inPool[Math.floor(r() * inPool.length)]
  const k = inPool.indexOf(pool)
  // si el contacto fue hace mucho, la conversación "reciente" arranca más tarde
  let t = l.primerContactoAt
  add('in', primerIn(l), (l.asignadoAt ?? t) - 40_000)
  add('out', biRellenar(plantillasIniciales[0].cuerpo, l), t, { plantillaId: 'p1' })
  t += (3 + r() * 20) * MIN
  add('in', pool[0], t)
  t += (2 + r() * 15) * MIN
  add('out', outPool[k], t)
  t += (10 + r() * 90) * MIN
  add('in', pool[1], t)
  if (l.tradeIn && k === 0) add('in', { es: '', en: '' }, t + 2 * MIN, { adjunto: { tipo: 'imagen', nombre: 'trade-in-corolla-2016.jpg', size: 1_840_000 } })
  if (k === 1) add('in', { es: '', en: '' }, t + 6 * MIN, { adjunto: { tipo: 'audio', nombre: 'audio.ogg', duracion: 18 + Math.floor(r() * 30) } })
  if (l.citaAt) {
    t += (4 + r() * 20) * MIN
    add('in', pool[2], t)
    const f = fechaCorta(l.citaAt)
    t += (2 + r() * 10) * MIN
    add('out', { es: rellenar(plantillasIniciales[1].cuerpo.es, l, { fecha: f.es, hora: f.hora }), en: rellenar(plantillasIniciales[1].cuerpo.en, l, { fecha: f.en, hora: f.hora }) }, t, { plantillaId: 'p2', auto: true })
    t += (5 + r() * 30) * MIN
    add('in', confirmaIn, t)
    t += (20 + r() * 60) * MIN
    add('out', { es: 'Te dejo la cotización para que la revises antes de venir 👇', en: 'Here is the quote so you can review it before coming 👇' }, t, { adjunto: { tipo: 'archivo', nombre: 'Cotizacion_' + l.vehiculoInteres.replace(/ /g, '_') + '.pdf', size: 248_000 } })
  }
  if (l.estado === 'negociacion') {
    t = Math.max(t, (l.citaAt ?? t) + 3 * HOUR)
    add('in', negociacionIn, t)
    add('in', { es: '', en: '' }, t + MIN, { adjunto: { tipo: 'audio', nombre: 'audio.ogg', duracion: 34 } })
    t += 12 * MIN
    add('out', negociacionOut, t)
  }
  if (l.estado === 'comprador' && l.cerradoAt) {
    add('out', biRellenar(plantillasIniciales[4].cuerpo, l), l.cerradoAt + 5 * MIN, { plantillaId: 'p5', auto: true })
    add('in', graciasIn, l.cerradoAt + 40 * MIN)
  }
  if (l.msgsSinResponder > 0 && l.estado !== 'comprador') {
    add('in', seguimientoIn, Math.min(NOW - (20 + r() * 300) * MIN, Math.max(t + 30 * MIN, NOW - 20 * HOUR)))
  }
  ms.sort((a, b) => a.at - b.at)
  // ticks: el último saliente puede quedar "entregado"
  const lastOut = [...ms].reverse().find((m) => m.direccion === 'out')
  if (lastOut && NOW - lastOut.at < 30 * MIN) lastOut.estado = 'entregado'
  return ms.filter((m) => m.at <= NOW)
}

/** ~30 conversaciones: 10 de Daniela, 3 de cada uno del resto + leads sin contactar */
export function generarMensajes(leads: Lead[]): Mensaje[] {
  const activos = (vid: string) =>
    leads
      .filter((l) => l.vendedorId === vid && ['asignado', 'contactado', 'agendado', 'negociacion', 'comprador'].includes(l.estado))
      .sort((a, b) => (b.asignadoAt ?? 0) - (a.asignadoAt ?? 0))
  const elegidos: Lead[] = []
  for (const v of vendedores) {
    const lista = activos(v.id)
    const sinC = lista.filter((l) => l.estado === 'asignado').slice(0, v.id === DANIELA_ID ? 3 : 2)
    const resto = lista.filter((l) => l.estado !== 'asignado')
    const conAgenda = resto.filter((l) => l.estado === 'agendado').slice(0, v.id === DANIELA_ID ? 3 : 2)
    const neg = resto.filter((l) => l.estado === 'negociacion').slice(0, 2)
    const comp = resto.filter((l) => l.estado === 'comprador').slice(0, 1)
    const cont = resto.filter((l) => l.estado === 'contactado').slice(0, 3)
    elegidos.push(...sinC, ...conAgenda, ...neg, ...comp, ...cont)
  }
  return elegidos.flatMap(hilo)
}
