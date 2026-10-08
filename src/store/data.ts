import { create } from 'zustand'
import { DAY, vehiculos, vendedorById } from '@/mock/base'
import { leadsIniciales, uid } from '@/mock/leads'
import { generarMensajes, rellenar } from '@/mock/mensajes'
import {
  autoMensajesIniciales, ejecucionesDesde, plantillasIniciales, reglasCalifIniciales, reglasRepartoIniciales,
} from '@/mock/plantillas'
import type {
  AutoMensaje, Bi, Ejecucion, Evento, Lead, LeadEstado, Mensaje, Plantilla, ReglasCalificacion, ReglasReparto,
  Seguimiento,
} from '@/mock/types'

const mensajesIniciales = generarMensajes(leadsIniciales)

interface DataState {
  leads: Lead[]
  mensajes: Mensaje[]
  plantillas: Plantilla[]
  ejecuciones: Ejecucion[]
  autoMensajes: AutoMensaje[]
  reglasCalif: ReglasCalificacion
  reglasReparto: ReglasReparto
  updateLead: (id: string, fn: (l: Lead) => Lead) => void
  setEstado: (id: string, estado: LeadEstado, actorId?: string) => void
  addNota: (id: string, texto: string, autorId: string) => void
  addSeguimiento: (id: string, s: Omit<Seguimiento, 'id' | 'hecho'>) => void
  toggleSeguimiento: (leadId: string, segId: string) => void
  agendarCita: (id: string, at: number) => void
  cancelarCita: (id: string) => void
  registrarLlamada: (id: string) => void
  sendMessage: (leadId: string, texto: Bi, plantillaId?: string, auto?: boolean) => void
  asignar: (ids: string[], vendedorId: string) => void
  addLeads: (ls: Lead[]) => void
  updateAutoMensaje: (id: string, patch: Partial<AutoMensaje>) => void
  setReglasCalif: (r: ReglasCalificacion) => void
  setReglasReparto: (r: ReglasReparto) => void
  addEjecucion: (leadId: string) => void
}

const ev = (tipo: Evento['tipo'], extra: Partial<Evento> = {}): Evento => ({ id: uid('e'), tipo, at: Date.now(), ...extra })

const fechaBi = (t: number): { es: string; en: string; hora: string } => {
  const d = new Date(t)
  return {
    es: d.toLocaleDateString('es-US', { weekday: 'long', day: 'numeric', month: 'short' }),
    en: d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' }),
    hora: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

export const useData = create<DataState>((set, get) => {
  const patchLead = (id: string, fn: (l: Lead) => Lead) =>
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? fn(l) : l)) }))

  const progresarTicks = (msgId: string) => {
    setTimeout(() => set((s) => ({ mensajes: s.mensajes.map((m) => (m.id === msgId ? { ...m, estado: 'entregado' } : m)) })), 900)
    setTimeout(() => set((s) => ({ mensajes: s.mensajes.map((m) => (m.id === msgId ? { ...m, estado: 'leido' } : m)) })), 2400)
  }

  const autoTexto = (amId: string, lead: Lead, extra: Record<string, string> = {}, extraEn: Record<string, string> = {}): Bi | null => {
    const am = get().autoMensajes.find((a) => a.id === amId)
    if (!am || !am.activo) return null
    return { es: rellenar(am.texto.es, lead, extra), en: rellenar(am.texto.en, lead, { ...extra, ...extraEn }) }
  }

  return {
    leads: leadsIniciales,
    mensajes: mensajesIniciales,
    plantillas: plantillasIniciales,
    ejecuciones: ejecucionesDesde(leadsIniciales),
    autoMensajes: autoMensajesIniciales,
    reglasCalif: reglasCalifIniciales,
    reglasReparto: reglasRepartoIniciales,

    updateLead: patchLead,

    setEstado: (id, estado, actorId) => {
      const now = Date.now()
      patchLead(id, (l) => {
        const tipo: Evento['tipo'] =
          estado === 'comprador' ? 'comprador' : estado === 'perdido' ? 'perdido' : estado === 'negociacion' ? 'negociacion' : estado === 'cita_realizada' ? 'cita_realizada' : 'nota'
        const n: Lead = { ...l, estado, historial: [...l.historial, ev(tipo, { vendedorId: actorId ?? l.vendedorId ?? undefined, detalle: tipo === 'nota' ? { es: `Estado → ${estado}`, en: `Status → ${estado}` } : undefined })] }
        if (estado === 'cita_realizada') n.citaRealizada = true
        if (estado === 'comprador' && !l.venta) {
          const base = vehiculos.find((v) => v.nombre === l.vehiculoInteres)?.precio ?? 30000
          n.cerradoAt = now
          n.citaRealizada = l.citaAt ? true : l.citaRealizada
          n.venta = { precio: base, ganancia: Math.round(base * 0.1), cash: Math.round(base * 0.2) }
        }
        return n
      })
      if (estado === 'comprador') {
        get().addEjecucion(id)
        const lead = get().leads.find((l) => l.id === id)!
        const txt = autoTexto('am1', lead)
        if (txt) get().sendMessage(id, txt, 'p5', true)
      }
      if (estado !== 'comprador') {
        // si cambia la etiqueta, se cancelan los mensajes pendientes
        set((s) => ({
          ejecuciones: s.ejecuciones.map((e) => (e.leadId === id && e.estado === 'programado' ? { ...e, estado: 'cancelado', proximoEnvio: null } : e)),
        }))
      }
    },

    addNota: (id, texto, autorId) =>
      patchLead(id, (l) => ({
        ...l,
        notas: [{ id: uid('n'), at: Date.now(), autorId, texto: { es: texto, en: texto } }, ...l.notas],
        historial: [...l.historial, ev('nota', { vendedorId: autorId, detalle: { es: texto, en: texto } })],
      })),

    addSeguimiento: (id, s) =>
      patchLead(id, (l) => ({
        ...l,
        seguimientos: [...l.seguimientos, { ...s, id: uid('s'), hecho: false }].sort((a, b) => a.at - b.at),
        historial: [...l.historial, ev('seguimiento', { detalle: s.titulo })],
      })),

    toggleSeguimiento: (leadId, segId) =>
      patchLead(leadId, (l) => ({ ...l, seguimientos: l.seguimientos.map((s) => (s.id === segId ? { ...s, hecho: !s.hecho } : s)) })),

    agendarCita: (id, at) => {
      patchLead(id, (l) => ({
        ...l,
        citaAt: at,
        citaRealizada: undefined,
        estado: 'agendado',
        primerContactoAt: l.primerContactoAt ?? Date.now(),
        historial: [...l.historial, ev('cita', { detalle: { es: l.vehiculoInteres, en: l.vehiculoInteres } })],
      }))
      const lead = get().leads.find((l) => l.id === id)!
      const f = fechaBi(at)
      const txt = autoTexto('am4', lead, { fecha: f.es, hora: f.hora }, { fecha: f.en })
      if (txt) get().sendMessage(id, txt, 'p2', true)
    },

    cancelarCita: (id) => {
      const lead = get().leads.find((l) => l.id === id)
      if (!lead || !lead.citaAt) return
      const f = fechaBi(lead.citaAt)
      patchLead(id, (l) => ({
        ...l,
        citaAt: undefined,
        citaRealizada: undefined,
        estado: 'contactado',
        historial: [...l.historial, ev('cita_cancelada')],
      }))
      const txt = autoTexto('am7', lead, { fecha: f.es }, { fecha: f.en })
      if (txt) get().sendMessage(id, txt, 'p4', true)
    },

    registrarLlamada: (id) =>
      patchLead(id, (l) => {
        if (l.primerContactoAt) return { ...l, historial: [...l.historial, ev('llamada', { vendedorId: l.vendedorId ?? undefined })] }
        const min = l.asignadoAt ? Math.round((Date.now() - l.asignadoAt) / 60000) : 0
        return {
          ...l,
          primerContactoAt: Date.now(),
          estado: 'contactado',
          historial: [...l.historial, ev('llamada', { minutos: min, vendedorId: l.vendedorId ?? undefined })],
        }
      }),

    sendMessage: (leadId, texto, plantillaId, auto) => {
      const m: Mensaje = { id: uid('m'), leadId, direccion: 'out', texto, at: Date.now(), estado: 'enviado', plantillaId, auto }
      set((s) => ({ mensajes: [...s.mensajes, m] }))
      patchLead(leadId, (l) => {
        if (l.primerContactoAt) return { ...l, msgsSinResponder: 0 }
        const min = l.asignadoAt ? Math.round((Date.now() - l.asignadoAt) / 60000) : 0
        return {
          ...l,
          msgsSinResponder: 0,
          primerContactoAt: Date.now(),
          estado: l.estado === 'asignado' || l.estado === 'nuevo' ? 'contactado' : l.estado,
          historial: [...l.historial, ev('contacto', { minutos: min, vendedorId: l.vendedorId ?? undefined })],
        }
      })
      progresarTicks(m.id)
    },

    asignar: (ids, vendedorId) => {
      const set_ = new Set(ids)
      const v = vendedorById(vendedorId)
      set((s) => ({
        leads: s.leads.map((l) => {
          if (!set_.has(l.id)) return l
          const re = !!l.vendedorId && l.vendedorId !== vendedorId
          return {
            ...l,
            vendedorId,
            bdc: v?.bdc ?? l.bdc,
            calificado: true,
            asignadoAt: re ? l.asignadoAt : Date.now(),
            estado: l.estado === 'nuevo' ? 'asignado' : l.estado,
            historial: [...l.historial, ev(re ? 'reasignado' : 'asignado', { vendedorId })],
          }
        }),
      }))
    },

    addLeads: (ls) => set((s) => ({ leads: [...ls, ...s.leads] })),

    updateAutoMensaje: (id, patch) => set((s) => ({ autoMensajes: s.autoMensajes.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
    setReglasCalif: (reglasCalif) => set({ reglasCalif }),
    setReglasReparto: (reglasReparto) => set({ reglasReparto }),

    addEjecucion: (leadId) =>
      set((s) => ({
        ejecuciones: [
          { id: uid('x'), leadId, compradoAt: Date.now(), paso: 1, proximoEnvio: Date.now() + 7 * DAY, estado: 'programado' },
          ...s.ejecuciones.filter((e) => e.leadId !== leadId),
        ],
      })),
  }
})

export const leadById = (id: string | undefined | null) => useData.getState().leads.find((l) => l.id === id)
