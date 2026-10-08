# PROGRESO — Campos CRM (MVP demo)

## Completado
- Bloque 1: scaffold Vite + React + TS, Tailwind, tokens dark/light, anti-flash, render.yaml (rewrite SPA), manifest.
- Bloque 2: i18n (useT + tr), stores (app, data, ui), router con guardas por rol.
- Bloque 3: mock determinístico (~100 consultas/día × 12 semanas, 8 closers, 6 campañas), métricas calculadas.
- Bloque 4: shell top-nav / bottom-nav / sheet "Más", role switcher, preview banner, DevNotice.
- Bloque 5: login + welcome modal.
- Bloque 6: dashboard admin (alertas, KPIs, ranking 10 métricas, agenda del equipo, leads entrantes, capacitación, evolución, CSV).

## En curso
- Propuesta y resto de vistas.

## Pendiente
- Ver lista de bloques 7–17 del brief.

## Decisiones
- El cliente pidió (mid-build) ~100 consultas/día, calificación + reparto automático, WhatsApp del closer con agendar/cancelar cita, notas, etapas, seguimientos con recordatorio, mensajes automáticos editables, admin entrando al panel de cada closer y métricas de desempeño (mensajes respondidos, citas, ventas, cash semanal/mensual, margen). Se integraron dentro de los 9 módulos de la propuesta sin cambiar el monto.
- Rol "vendedor" se muestra como "Closer" en la UI.
- Volumen: los KPIs se calculan sobre ~1.500 leads asignados/30 días (en lugar de 312) por el pedido de 100 consultas diarias.

## Bloqueos
- Ninguno.
