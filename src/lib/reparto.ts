import { perfiles, vendedores } from '@/mock/base'
import { uid } from '@/mock/leads'
import type { Credito, Lead, Origen, ReglasCalificacion, ReglasReparto, Segmento } from '@/mock/types'

/** Aplica las reglas de calificación editables desde el admin */
export function califica(l: Pick<Lead, 'score' | 'presupuesto' | 'credito' | 'enZona'>, r: ReglasCalificacion) {
  if (l.score < r.scoreMin) return false
  if (l.presupuesto < r.presupuestoMin) return false
  if (r.excluirCreditoMalo && l.credito === 'malo') return false
  if (r.soloEnZona && !l.enZona) return false
  return true
}

/** Elige closer según el modo de reparto, cupos y especialidad */
export function elegirCloser(seg: Segmento, reglas: ReglasReparto, carga: Record<string, number>, turno: number): string | null {
  const activos = reglas.closers.filter((c) => c.activo && (carga[c.vendedorId] ?? 0) < c.cupoDiario)
  if (!activos.length) return null
  if (reglas.modo === 'round_robin') return activos[turno % activos.length].vendedorId
  if (reglas.modo === 'especialidad') {
    const esp = activos.filter((c) => c.segmentos.includes(seg))
    const pool = esp.length ? esp : activos
    return pool.sort((a, b) => (carga[a.vendedorId] ?? 0) - (carga[b.vendedorId] ?? 0))[0].vendedorId
  }
  // desempeño: ponderado por peso, menos carga relativa primero
  return activos.sort((a, b) => (carga[a.vendedorId] ?? 0) / a.peso - (carga[b.vendedorId] ?? 0) / b.peso)[0].vendedorId
}

const ej: [string, string, string, Origen, string | null, Credito, number, number, boolean][] = [
  ['Yesenia Cruz', '+1 (786) 555-0193', 'Honda CR-V 2024', 'facebook', 'c1', 'bueno', 4500, 84, true],
  ['Tyler Harris', '+1 (954) 555-2210', 'Ford F-150 2023', 'google', 'c4', 'regular', 6000, 77, true],
  ['Marisol Peña', '+1 (305) 555-8841', 'Toyota Camry 2024', 'google', 'c3', 'bueno', 3500, 88, true],
  ['Brittany Moore', '+1 (786) 555-4402', 'Kia Sportage 2024', 'facebook', 'c2', 'malo', 0, 31, true],
  ['Óscar Díaz', '+1 (305) 555-7719', 'Toyota Tacoma 2024', 'facebook', 'c1', 'sin_historial', 2500, 68, true],
  ['Lauren Clark', '+1 (954) 555-3307', 'Nissan Rogue 2024', 'web', 'c6', 'bueno', 5000, 91, true],
  ['Héctor Romero', '+1 (305) 555-6620', 'Chevrolet Silverado 2022', 'marketplace', 'c5', 'regular', 1800, 63, true],
  ['Samantha Lewis', '+1 (786) 555-1185', 'Hyundai Tucson 2024', 'facebook', 'c2', 'regular', 500, 42, true],
  ['Diego Aguilar', '+1 (954) 555-9074', 'Jeep Grand Cherokee 2022', 'marketplace', 'c5', 'bueno', 7000, 86, true],
  ['Nicole White', '+1 (305) 555-2246', 'Toyota RAV4 2023', 'facebook', 'c1', 'bueno', 4000, 81, false],
  ['Rafael Ortiz', '+1 (786) 555-5503', 'Chevrolet Equinox 2024', 'google', 'c3', 'sin_historial', 2000, 66, true],
  ['Megan Taylor', '+1 (954) 555-6618', 'Honda Civic 2022', 'web', 'c6', 'regular', 3000, 74, true],
  ['Jorge Medina', '+1 (305) 555-8090', 'Nissan Altima 2023', 'facebook', 'c2', 'malo', 300, 28, true],
  ['Amanda Jackson', '+1 (786) 555-3391', 'Toyota Camry 2021', 'marketplace', 'c5', 'bueno', 3500, 79, true],
  ['Luis Gutiérrez', '+1 (954) 555-4472', 'Ford F-150 2023', 'google', 'c4', 'bueno', 8000, 93, true],
]

export const CSV_EJEMPLO_HEAD = ['nombre', 'telefono', 'vehiculo', 'origen', 'campana', 'credito', 'down_payment', 'score']
export const csvEjemplo = ej

const segDe = (veh: string): Segmento =>
  /F-150|Silverado|Tacoma/.test(veh) ? 'pickup' : /2021|2022|RAV4 2023/.test(veh) ? 'usado' : /Camry 2024|Altima/.test(veh) ? 'sedan' : 'suv'

/** Crea un lead nuevo y lo reparte según reglas */
export function nuevoLead(
  d: { nombre: string; telefono: string; vehiculo: string; origen: Origen; campanaId: string | null; credito: Credito; presupuesto: number; score: number; enZona: boolean },
  calif: ReglasCalificacion,
  reparto: ReglasReparto,
  carga: Record<string, number>,
  turno: number,
  forzarVendedor?: string | null,
): Lead {
  const now = Date.now()
  const calificado = califica(d, calif)
  const seg = segDe(d.vehiculo)
  const vid = forzarVendedor ?? (calificado ? elegirCloser(seg, reparto, carga, turno) : null)
  if (vid) carga[vid] = (carga[vid] ?? 0) + 1
  const v = vendedores.find((x) => x.id === vid)
  return {
    id: uid('N'),
    nombre: d.nombre,
    telefono: d.telefono,
    vehiculoInteres: d.vehiculo,
    segmento: seg,
    origen: d.origen,
    campanaId: d.campanaId,
    anuncio: null,
    idioma: /[áéíóúñ]|José|María|Luis|Jorge|Diego|Rafael|Héctor|Óscar|Marisol|Yesenia/.test(d.nombre) ? 'es' : 'en',
    financiacion: 'financiado',
    tradeIn: false,
    score: d.score,
    credito: d.credito,
    presupuesto: d.presupuesto,
    enZona: d.enZona,
    calificado,
    estado: vid ? 'asignado' : 'nuevo',
    vendedorId: vid,
    bdc: v?.bdc ?? 'BDC Norte',
    creadoAt: now,
    asignadoAt: vid ? now : null,
    msgsIn: 0,
    msgsSinResponder: 0,
    historial: [
      { id: uid('e'), tipo: 'creado', at: now },
      { id: uid('e'), tipo: calificado ? 'calificado' : 'no_calificado', at: now, detalle: { es: `Score ${d.score}/100`, en: `Score ${d.score}/100` } },
      ...(vid ? [{ id: uid('e'), tipo: 'asignado' as const, at: now, vendedorId: vid }] : []),
    ],
    notas: [],
    seguimientos: [],
  }
}

/** carga de hoy por closer (para cupos) */
export function cargaHoy(leads: Lead[]) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const c: Record<string, number> = {}
  for (const l of leads) if (l.vendedorId && l.asignadoAt && l.asignadoAt >= d.getTime()) c[l.vendedorId] = (c[l.vendedorId] ?? 0) + 1
  return c
}

export const pesoDefault = (id: string) => perfiles[id]?.peso ?? 1
