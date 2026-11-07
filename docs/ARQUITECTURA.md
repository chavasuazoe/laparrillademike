# Arquitectura técnica V10

```text
GitHub Pages (HTML/CSS/JS)
  ├── Mesero          -> localStorage de pedidos / cola de reintentos
  ├── Cocina          -> localStorage de checks pendientes
  └── Administración  -> reportes y cortes
          |
          +--- HTTPS y WSS ---> Cloudflare Worker
                                 |
                                 +--- Durable Object (SQLite)
                                        - roles / sesiones
                                        - comandas / checks
                                        - mesas / cobros
                                        - propinas / caja / cortes
```

- `assets/js/config.js`: URL pública del Worker.
- `assets/js/cloudflare.js`: cliente HTTP/WS y autorizaciones por rol.
- `assets/js/menu.js`: catálogo de precios compartido.
- `assets/js/icons.js`: SVG sin dependencias externas.
- `assets/js/waiter.js`, `kitchen.js`, `admin.js`: controladores independientes.
- `assets/css/base.css`: tokens compartidos y accesibilidad.
- `assets/css/{waiter,kitchen,admin}.css`: estilos exclusivos de cada vista.
- `cloudflare/src/worker.mjs`: endpoints y almacenamiento.
- `cloudflare/src/entry.mjs`: adaptador de Durable Objects.
- `cloudflare/src/validation.mjs`: validación de tickets y formatos.

El proyecto usa un solo Durable Object por restaurante. El identificador interno del objeto, `parrilla-unica`, se conserva dentro del Worker. Al desplegar un Worker **nuevo**, se crea un espacio de datos independiente.

Los valores monetarios persistidos por el backend están en centavos MXN para evitar errores de coma flotante. No se presupone que Ventas = Ganancia. Los turnos se agrupan por hora local de Ciudad de México con frontera operativa a las 06:00.

## Compatibilidad

La V10 mantiene el formato de las comandas y las APIs probadas en V9.5, pero **no reutiliza automáticamente** las claves locales ni la base de datos antigua. Para conservar historial V9.5 se requiere una migración explícita que no está incluida.
