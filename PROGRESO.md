# PROGRESO — Campos CRM (MVP demo)

## Completado
- **1 · Scaffold**: Vite 5 + React 18 + TS 5, Tailwind 3, tokens dark/light, anti-flash en `index.html`, `render.yaml` static con rewrite SPA, `manifest.webmanifest` + íconos 192/512. Todas las deps de build en `dependencies`.
- **2 · Base**: i18n (`useT` + `tr`, diccionario `{clave:[es,en]}`), stores zustand (`app`, `data`, `ui`), router con guardas por rol.
- **3 · Mock**: generador determinístico (seed fija): ~100 consultas/día × 12 semanas (~8.000 leads), 4 closers, 6 campañas con anuncios, calificación, ventas con precio/ganancia/cash. Todas las métricas se calculan desde los leads.
- **4 · Shell**: top-nav ≥1024 (dropdown Métricas, "Más ▾" debajo de 1536 px), topbar compacto + bottom-nav + sheet "Más" <1024, role switcher, preview banner, DevNotice, footer CTA.
- **5 · Login + Welcome** (centrado, una vez por sesión).
- **6 · Dashboard admin ★**: alertas "que no se escape nada", 8 KPIs con deltas, ranking ordenable con 10 métricas por closer (velocidad, respondidos, agenda, citas, cierre, ventas, cash semana/mes, margen) y brechas, agenda de todos los closers (timeline por carriles / semana), leads entrantes (volumen diario, campañas, características → conversión), embudos de capacitación, evolución 12 semanas, export CSV real.
- **7 · Closer**: `/vendedores/:id` (ficha + "Entrar a su panel" + reasignar) y `/mi-panel` (cronómetros en vivo, próximas citas, negociaciones, evolución).
- **8 · Métricas**: velocidad, agendamiento, cierre y **Anuncios y calidad** (`/metricas/campanas`): CPL, costo por calificado, costo por venta, ROI, anuncios por campaña, insights automáticos.
- **9 · Leads**: tabs calificados/no calificados/sin contactar, filtros, tabla/tablero/tarjetas, alta, importación CSV con reparto automático, asignación masiva, drawer con etapa, notas, seguimientos, historial.
- **10 · WhatsApp**: bandeja por closer, botones **Agendar cita / Cancelar cita** en el chat, nota, seguimiento, ventana 24 h, plantillas con estado Meta, ticks.
- **11 · Automatizaciones ★ + Usuarios**: post-compra 0/7/14 con "Simular compra", recordatorios de cita editables, calificación y reparto con simulador; usuarios, permisos y "Ver su panel".
- **12 · Propuesta**: circuito, 9 módulos con "Ver en el demo" (con retorno y resaltado), inversión oculta por defecto, imprimir.
- **13 · Tour** manual (desktop y mobile). **14 · Trailer** de 11 escenas (≥1024).
- **15 · QA i18n**: `npm run i18n:check` → 0 faltantes.
- **16 · QA responsive**: sin scroll horizontal a 390 px en todas las vistas; modales centrados (desvío 0 px).
- **17 · Build final** limpio; deep links (`/propuesta`, `/dashboard`, `/metricas/velocidad`, `/whatsapp`) responden con la SPA; capturas en `/screenshots` (1440 y 390).

## Decisiones
- Pedidos del cliente durante el desarrollo (integrados sin cambiar el monto ni la cantidad de módulos):
  - ~100 consultas diarias desde anuncios → calificadas/no calificadas automáticamente y repartidas a closers con reglas editables (Automatizaciones → Calificación y reparto).
  - WhatsApp del closer con botones de agendar y cancelar cita, notas, etapas (negociación/cierre) y seguimientos con recordatorio.
  - Mensajes automáticos (recordatorios de cita) editables desde el admin.
  - El admin entra al panel de cada closer ("Vista de closer"): agenda, chats, seguimientos, negociaciones, notas.
  - Métricas de desempeño por closer: mensajes respondidos/sin responder, citas, ventas, cash collected semanal y mensual, margen %.
  - Equipo de **4 closers** (Daniela, Carlos, Valeria, Kevin; 2 BDC).
- El rol "vendedor" se muestra como **Closer**.
- Con 100 consultas/día los KPIs reales del mock son ~1.500 leads asignados/30 días (en lugar de 312 del brief original).
- Se agregó la sección **Agenda** al menú de ambos roles.
- `vite.config.js` usa `preserveSymlinks: true` para que el dev server funcione dentro de la carpeta virtualizada de Windows.

## Cómo correrlo
```bash
npm install
npm run dev          # desarrollo
npm run build        # producción → dist/
npm run i18n:check   # claves de traducción
```
Accesos: `miguel@camposcrm.demo` / `daniela@camposcrm.demo`, contraseña `demo1234`.

## Bloqueos
- Ninguno técnico.
