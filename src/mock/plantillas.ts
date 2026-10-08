import type { AutoMensaje, Ejecucion, Lead, Plantilla, ReglasCalificacion, ReglasReparto } from './types'
import { DAY, HOUR, NOW, vendedores } from './base'

export const plantillasIniciales: Plantilla[] = [
  {
    id: 'p1', categoria: 'utility', estadoMeta: 'aprobada', variables: ['nombre', 'vendedor', 'vehiculo'],
    nombre: { es: 'Bienvenida lead nuevo', en: 'New lead welcome' },
    cuerpo: {
      es: 'Hola {{nombre}} 👋 Soy {{vendedor}} de Campos Auto. Vi que te interesa el {{vehiculo}}. ¿Te paso fotos, precio y opciones de financiación?',
      en: 'Hi {{nombre}} 👋 This is {{vendedor}} from Campos Auto. I saw you are interested in the {{vehiculo}}. Can I send you photos, price and financing options?',
    },
  },
  {
    id: 'p2', categoria: 'utility', estadoMeta: 'aprobada', variables: ['nombre', 'vehiculo', 'fecha', 'hora'],
    nombre: { es: 'Confirmación de cita', en: 'Appointment confirmation' },
    cuerpo: {
      es: '¡Listo {{nombre}}! Tu cita para ver el {{vehiculo}} quedó confirmada para el {{fecha}} a las {{hora}}. Te esperamos en 7950 NW 36th St, Doral. 🚗',
      en: 'All set {{nombre}}! Your appointment to see the {{vehiculo}} is confirmed for {{fecha}} at {{hora}}. See you at 7950 NW 36th St, Doral. 🚗',
    },
  },
  {
    id: 'p3', categoria: 'utility', estadoMeta: 'aprobada', variables: ['nombre', 'vehiculo', 'hora'],
    nombre: { es: 'Recordatorio de cita (24 h)', en: 'Appointment reminder (24 h)' },
    cuerpo: {
      es: 'Hola {{nombre}}, te recordamos que mañana a las {{hora}} te esperamos para ver el {{vehiculo}}. Respondé 1 para confirmar o 2 para reprogramar.',
      en: 'Hi {{nombre}}, a reminder that tomorrow at {{hora}} we expect you to see the {{vehiculo}}. Reply 1 to confirm or 2 to reschedule.',
    },
  },
  {
    id: 'p4', categoria: 'utility', estadoMeta: 'aprobada', variables: ['nombre', 'fecha'],
    nombre: { es: 'Cita cancelada', en: 'Appointment canceled' },
    cuerpo: {
      es: 'Hola {{nombre}}, cancelamos tu cita del {{fecha}} como pediste. Cuando quieras la reprogramamos por acá mismo. 🙌',
      en: 'Hi {{nombre}}, we canceled your appointment on {{fecha}} as requested. Whenever you want, we can reschedule right here. 🙌',
    },
  },
  {
    id: 'p5', categoria: 'utility', estadoMeta: 'aprobada', variables: ['nombre', 'vehiculo'],
    nombre: { es: 'Post-compra día 0 · placas', en: 'Post-purchase day 0 · plates' },
    cuerpo: {
      es: '¡Felicitaciones {{nombre}} por tu {{vehiculo}}! 🎉 Próximos pasos: tus placas temporales vencen en 30 días; te avisamos apenas lleguen las definitivas.',
      en: 'Congratulations {{nombre}} on your {{vehiculo}}! 🎉 Next steps: your temporary plates expire in 30 days; we will let you know as soon as the permanent ones arrive.',
    },
  },
  {
    id: 'p6', categoria: 'utility', estadoMeta: 'aprobada', variables: ['nombre'],
    nombre: { es: 'Post-compra día 7 · papeles', en: 'Post-purchase day 7 · paperwork' },
    cuerpo: {
      es: 'Hola {{nombre}}, actualización de tus papeles: el título ya está en trámite con el DMV. Si necesitás algo, respondé este mensaje.',
      en: 'Hi {{nombre}}, paperwork update: your title is being processed with the DMV. If you need anything, just reply to this message.',
    },
  },
  {
    id: 'p7', categoria: 'marketing', estadoMeta: 'aprobada', variables: ['nombre', 'vendedor'],
    nombre: { es: 'Post-compra día 14 · referidos', en: 'Post-purchase day 14 · referrals' },
    cuerpo: {
      es: '{{nombre}}, ¿cómo va el auto? 😊 Si conocés a alguien buscando vehículo, pasale mi contacto ({{vendedor}}): por cada referido que compre te regalamos $200.',
      en: '{{nombre}}, how is the car going? 😊 If you know someone looking for a vehicle, share my contact ({{vendedor}}): for every referral who buys, you get $200.',
    },
  },
  {
    id: 'p8', categoria: 'utility', estadoMeta: 'revision', variables: ['nombre', 'hora'],
    nombre: { es: 'Recordatorio de cita (2 h)', en: 'Appointment reminder (2 h)' },
    cuerpo: {
      es: '{{nombre}}, en 2 horas ({{hora}}) te esperamos. ¿Seguimos en pie?',
      en: '{{nombre}}, we will see you in 2 hours ({{hora}}). Are we still on?',
    },
  },
  {
    id: 'p9', categoria: 'marketing', estadoMeta: 'revision', variables: ['nombre', 'vehiculo'],
    nombre: { es: 'Oferta fin de mes', en: 'End-of-month offer' },
    cuerpo: {
      es: '{{nombre}}, este fin de mes tenemos bono de $1,000 en el {{vehiculo}}. ¿Querés que te reserve un turno?',
      en: '{{nombre}}, this month-end we have a $1,000 bonus on the {{vehiculo}}. Want me to book you a slot?',
    },
  },
  {
    id: 'p10', categoria: 'marketing', estadoMeta: 'rechazada', variables: ['nombre'],
    nombre: { es: 'Promo 0% financiación', en: '0% financing promo' },
    cuerpo: {
      es: '🔥 {{nombre}} 0% de interés GARANTIZADO para todos, sin importar tu crédito!!!',
      en: '🔥 {{nombre}} 0% interest GUARANTEED for everyone, no matter your credit!!!',
    },
  },
]

export const autoMensajesIniciales: AutoMensaje[] = [
  { id: 'am1', flujo: 'postcompra', offset: { es: 'Día 0', en: 'Day 0' }, plantillaId: 'p5', texto: plantillasIniciales[4].cuerpo, activo: true },
  { id: 'am2', flujo: 'postcompra', offset: { es: 'Día 7', en: 'Day 7' }, plantillaId: 'p6', texto: plantillasIniciales[5].cuerpo, activo: true },
  { id: 'am3', flujo: 'postcompra', offset: { es: 'Día 14', en: 'Day 14' }, plantillaId: 'p7', texto: plantillasIniciales[6].cuerpo, activo: true },
  { id: 'am4', flujo: 'recordatorio', offset: { es: 'Al agendar', en: 'When booked' }, plantillaId: 'p2', texto: plantillasIniciales[1].cuerpo, activo: true },
  { id: 'am5', flujo: 'recordatorio', offset: { es: '24 h antes', en: '24 h before' }, plantillaId: 'p3', texto: plantillasIniciales[2].cuerpo, activo: true },
  { id: 'am6', flujo: 'recordatorio', offset: { es: '2 h antes', en: '2 h before' }, plantillaId: 'p8', texto: plantillasIniciales[7].cuerpo, activo: false },
  { id: 'am7', flujo: 'recordatorio', offset: { es: 'Al cancelar', en: 'When canceled' }, plantillaId: 'p4', texto: plantillasIniciales[3].cuerpo, activo: true },
]

export const reglasCalifIniciales: ReglasCalificacion = {
  scoreMin: 60,
  presupuestoMin: 1500,
  excluirCreditoMalo: true,
  soloEnZona: true,
  nurturingNoCalificados: true,
}

export const reglasRepartoIniciales: ReglasReparto = {
  modo: 'desempeno',
  pausarSiSinContacto: 5,
  closers: vendedores.map((v) => ({
    vendedorId: v.id,
    activo: true,
    cupoDiario: v.id === 'v4' ? 10 : v.id === 'v1' ? 18 : v.id === 'v2' ? 16 : 14,
    peso: v.id === 'v1' ? 18 : v.id === 'v2' ? 16 : v.id === 'v4' ? 8 : 12,
    segmentos: v.id === 'v2' ? ['pickup', 'suv'] : v.id === 'v3' ? ['usado', 'sedan', 'suv'] : ['suv', 'sedan', 'pickup', 'usado'],
  })),
}

/** Ejecuciones de post-compra a partir de los compradores de las últimas 3 semanas */
export function ejecucionesDesde(leads: Lead[]): Ejecucion[] {
  const compradores = leads
    .filter((l) => l.estado === 'comprador' && l.cerradoAt && NOW - l.cerradoAt < 20 * DAY)
    .sort((a, b) => b.cerradoAt! - a.cerradoAt!)
    .slice(0, 12)
  return compradores.map((l, i) => {
    const dias = (NOW - l.cerradoAt!) / DAY
    const paso = (dias >= 14 ? 3 : dias >= 7 ? 2 : 1) as 1 | 2 | 3
    const proximo = paso === 3 ? null : l.cerradoAt! + (paso === 1 ? 7 : 14) * DAY
    const cancelada = i === 4
    return {
      id: `x${i + 1}`,
      leadId: l.id,
      compradoAt: l.cerradoAt!,
      paso,
      proximoEnvio: cancelada ? null : proximo,
      estado: cancelada ? 'cancelado' : paso === 3 ? 'completado' : proximo && proximo - NOW < 2 * HOUR ? 'enviado' : 'programado',
    }
  })
}
