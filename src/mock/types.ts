export type Role = 'admin' | 'vendedor'
export type Lang = 'es' | 'en'
export type Bi = { es: string; en: string }

export type LeadEstado =
  | 'nuevo'
  | 'asignado'
  | 'contactado'
  | 'agendado'
  | 'cita_realizada'
  | 'negociacion'
  | 'comprador'
  | 'perdido'

export type Origen = 'facebook' | 'google' | 'walkin' | 'referido' | 'web' | 'marketplace'
export type Bdc = 'BDC Norte' | 'BDC Sur'
export type Credito = 'bueno' | 'regular' | 'sin_historial' | 'malo'
export type Segmento = 'suv' | 'sedan' | 'pickup' | 'usado'

export interface Vendedor {
  id: string
  nombre: string
  avatar: string // initials
  color: string
  bdc: Bdc
  activo: boolean
  email: string
  ultimoAcceso: number
}

export interface Campana {
  id: string
  nombre: string
  origen: Origen
  gasto: number // USD últimos 30 días
  activa: boolean
  anuncios: string[]
}

export type EventoTipo =
  | 'creado'
  | 'calificado'
  | 'no_calificado'
  | 'asignado'
  | 'reasignado'
  | 'contacto'
  | 'llamada'
  | 'cita'
  | 'cita_cancelada'
  | 'cita_realizada'
  | 'no_show'
  | 'negociacion'
  | 'comprador'
  | 'perdido'
  | 'nota'
  | 'seguimiento'

export interface Evento {
  id: string
  tipo: EventoTipo
  at: number
  detalle?: Bi
  minutos?: number
  vendedorId?: string
}

export interface Nota {
  id: string
  at: number
  autorId: string // vendedor id or 'admin'
  texto: Bi
}

export interface Seguimiento {
  id: string
  at: number
  titulo: Bi
  canal: 'whatsapp' | 'llamada' | 'visita'
  recordatorio: boolean
  hecho: boolean
}

export interface Venta {
  precio: number
  ganancia: number
  cash: number
}

export interface Lead {
  id: string
  nombre: string
  telefono: string
  vehiculoInteres: string
  segmento: Segmento
  origen: Origen
  campanaId: string | null
  anuncio: string | null
  idioma: 'es' | 'en'
  financiacion: 'financiado' | 'contado' | 'leasing'
  tradeIn: boolean
  score: number
  credito: Credito
  presupuesto: number
  enZona: boolean
  calificado: boolean
  estado: LeadEstado
  vendedorId: string | null
  bdc: Bdc
  creadoAt: number
  asignadoAt: number | null
  primerContactoAt?: number
  citaAt?: number
  citaRealizada?: boolean
  cerradoAt?: number
  venta?: Venta
  msgsIn: number
  msgsSinResponder: number
  historial: Evento[]
  notas: Nota[]
  seguimientos: Seguimiento[]
}

export type MsgEstado = 'enviado' | 'entregado' | 'leido'

export interface Adjunto {
  tipo: 'audio' | 'imagen' | 'archivo'
  nombre: string
  size?: number // bytes
  url?: string // object URL (archivos reales elegidos en la demo)
  duracion?: number // segundos (audio)
}

export interface Mensaje {
  id: string
  leadId: string
  direccion: 'in' | 'out'
  texto: Bi
  at: number
  estado: MsgEstado
  plantillaId?: string
  auto?: boolean
  adjunto?: Adjunto
  /** 'admin' cuando lo envió un administrador desde el chat del closer */
  enviadoPor?: 'admin'
  /** el admin respondió "como" el closer */
  comoCloser?: boolean
}

export type EstadoMeta = 'aprobada' | 'revision' | 'rechazada'

export interface Plantilla {
  id: string
  nombre: Bi
  categoria: 'utility' | 'marketing'
  cuerpo: Bi
  variables: string[]
  estadoMeta: EstadoMeta
}

export type EjecucionEstado = 'enviado' | 'programado' | 'cancelado' | 'completado'

export interface Ejecucion {
  id: string
  leadId: string
  compradoAt: number
  paso: 1 | 2 | 3
  proximoEnvio: number | null
  estado: EjecucionEstado
}

export interface AutoMensaje {
  id: string
  flujo: 'postcompra' | 'recordatorio'
  offset: Bi // "Día 0", "24 h antes"
  plantillaId: string
  texto: Bi
  activo: boolean
}

export interface ReglasCalificacion {
  scoreMin: number
  presupuestoMin: number
  excluirCreditoMalo: boolean
  soloEnZona: boolean
  nurturingNoCalificados: boolean
}

export type ModoReparto = 'round_robin' | 'desempeno' | 'especialidad'

export interface ReglaCloser {
  vendedorId: string
  activo: boolean
  cupoDiario: number
  peso: number
  segmentos: Segmento[]
}

export interface ReglasReparto {
  modo: ModoReparto
  closers: ReglaCloser[]
  pausarSiSinContacto: number // leads sin contactar que pausan el reparto
}
