import { useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { canAccess } from '@/components/layout/nav'
import { WelcomeModal } from '@/components/WelcomeModal'
import { Tour } from '@/components/tour/Tour'
import { Trailer } from '@/components/trailer/Trailer'
import { defaultView, useApp } from '@/store/app'
import Login from '@/pages/Login'
import Propuesta from '@/pages/Propuesta'
import Dashboard from '@/pages/Dashboard'
import VendedorDetalle from '@/pages/VendedorDetalle'
import MiPanel from '@/pages/MiPanel'
import MisMetricas from '@/pages/MisMetricas'
import { MetricaAgendamiento, MetricaCierre, MetricaVelocidad } from '@/pages/Metricas'
import Campanas from '@/pages/Campanas'
import Leads from '@/pages/Leads'
import WhatsApp from '@/pages/WhatsApp'
import Agenda from '@/pages/Agenda'
import Automatizaciones from '@/pages/Automatizaciones'
import Usuarios from '@/pages/Usuarios'

/** El store pide navegaciones (preview, trailer); este puente las ejecuta dentro del router */
function NavBridge() {
  const pendingNav = useApp((s) => s.pendingNav)
  const navTo = useApp((s) => s.navTo)
  const navigate = useNavigate()
  useEffect(() => {
    if (pendingNav) {
      navigate(pendingNav)
      navTo(null)
    }
  }, [pendingNav, navigate, navTo])
  return null
}

function Protected() {
  const authed = useApp((s) => s.authed)
  const role = useApp((s) => s.role)
  const viewAs = useApp((s) => s.viewAs)
  const { pathname } = useLocation()
  if (!authed) return <Navigate to="/login" replace />
  if (!canAccess(pathname, role, viewAs)) return <Navigate to={defaultView(role)} replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function LoginRoute() {
  const authed = useApp((s) => s.authed)
  const trailer = useApp((s) => s.trailer)
  if (authed && !trailer) return <Navigate to="/propuesta" replace />
  return <Login />
}

export default function App() {
  const theme = useApp((s) => s.theme)
  return (
    <BrowserRouter>
      <NavBridge />
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<Protected />}>
          <Route path="/propuesta" element={<Propuesta />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vendedores/:id" element={<VendedorDetalle />} />
          <Route path="/mi-panel" element={<MiPanel />} />
          <Route path="/mis-metricas" element={<MisMetricas />} />
          <Route path="/metricas/velocidad" element={<MetricaVelocidad />} />
          <Route path="/metricas/agendamiento" element={<MetricaAgendamiento />} />
          <Route path="/metricas/cierre" element={<MetricaCierre />} />
          <Route path="/metricas/campanas" element={<Campanas />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<Leads />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/automatizaciones" element={<Automatizaciones />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
        <Route path="*" element={<Navigate to="/propuesta" replace />} />
      </Routes>
      <WelcomeModal />
      <Tour />
      <Trailer />
      <Toaster
        theme={theme}
        position="top-center"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }}
        offset={72}
      />
    </BrowserRouter>
  )
}
