# Pruebas y aceptación

## Automáticas

Desde la raíz del proyecto con Node.js 22 o posterior:

```bash
npm run check
```

Comprueba rutas públicas, caché, respuestas de autorización, separación de platos, reintentos de Cocina, importes y permisos de Administración. Estas pruebas se ejecutan sin Cloudflare real. No sustituyen la prueba en los tres dispositivos.

## Manuales antes de uso real

- Mesero: todas las ocho mesas, productos por categoría, tortillas, queso, cambios, PLATO 1/2, pedido adicional y cobro.
- Cocina: tickets completos sin reordenación, check/reversión, agregado prioritario y sincronización sin duplicados.
- Administración: una venta nueva, propina, corte, horarios, totales y exportación CSV.
- Red: activar/desactivar datos móviles, verificar reintentos y mantener sincronización sin doble recibo.
- Diseño: iPhone XR (aprox. 375 CSS px), teléfono angosto (320 px), tablet (768 px), monitor 16:9.

**Si una prueba falla, mantén la V10 como demostración y no la uses para cobrar clientes hasta corregirla.**
