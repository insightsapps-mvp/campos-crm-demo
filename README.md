# Campos CRM — MVP demo

CRM de ventas con métricas por closer, leads de anuncios calificados y repartidos automáticamente, WhatsApp API y automatizaciones post-compra. Demo navegable con datos mock (Insights).

## Correr local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de producción en dist/
npm run i18n:check # verifica que todas las claves de traducción existan
```

Accesos demo: `miguel@camposcrm.demo` (admin) y `daniela@camposcrm.demo` (closer), contraseña `demo1234`.

## Deploy en Render

Static Site. `render.yaml` ya incluye build (`npm install && npm run build`), `staticPublishPath: ./dist` y el rewrite SPA `/* → /index.html`.
