import { create } from 'zustand'

interface UIState {
  leadId: string | null
  openLead: (id: string | null) => void
  /** lead preseleccionado al abrir /whatsapp */
  chatLeadId: string | null
  openChat: (id: string | null) => void
}

export const useUI = create<UIState>((set) => ({
  leadId: null,
  openLead: (leadId) => set({ leadId }),
  chatLeadId: null,
  openChat: (chatLeadId) => set({ chatLeadId }),
}))
