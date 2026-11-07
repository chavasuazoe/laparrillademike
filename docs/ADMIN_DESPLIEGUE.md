# Instalar Administración financiera V10.1

**Si aún no has publicado la V10**, usa el ZIP **REPOSITORIO COMPLETO V10.1** como punto de partida; sustituye el ZIP anterior, no hagas dos instalaciones.

## Paso 1. Worker de Cloudflare

Desde una computadora con Node.js 22+, entra en `cloudflare/` y ejecuta:

```bash
npm install
npx wrangler login
npx wrangler deploy
npx wrangler secret put SETUP_CODE
```

`SETUP_CODE` es una contraseña privada de al menos 12 caracteres. **Nunca la subas a GitHub.** El nombre de servicio en `wrangler.toml` es `parrilla-mike-v10`; el origen permitido por defecto es `https://chavasuazoe.github.io`. Si tu dominio cambió, corrígelo antes de desplegar.

Copia la URL HTTPS resultante y verifica `https://TU-WORKER.workers.dev/api/health`.

## Paso 2. GitHub Pages

Configura **solo la URL pública** del Worker en `assets/js/config.js` y sube el repositorio completo conservando carpetas. `index.html`, `cocina.html`, `admin.html` y `sw.js` van en la raíz. No subas `node_modules`, `.wrangler`, secretos ni respaldos privados.

Activa **Settings → Pages → Deploy from a branch → main → /(root)**.

## Paso 3. Vinculación

- En Mesero autoriza el teléfono con `SETUP_CODE` una sola vez.
- Desde Mesero genera el código de 6 dígitos para Cocina.
- Genera otro código para Administración y vincula `admin.html` en el dispositivo del dueño.

No compartas el código privado con personal que solo necesita Cocina.

## Paso 4. Prueba de caja (sin clientes)

1. Abre CAJA; registra fondo inicial de $300.
2. Desde Mesero cobra $120 en efectivo; verifica que aparezca en INICIO.
3. Registra una compra de tortillas por $20 desde caja. Efectivo esperado: **$400**.
4. Registra un retiro de $50. Efectivo esperado: **$350** (no aumenta los gastos).
5. Cuenta $350 y guarda el corte. Debe mostrar diferencia $0.
6. Abre ANÁLISIS, revisa la venta del producto; exporta CSV desde DATOS.
7. Borra el día de prueba **solo si no hubo operaciones reales** en esa fecha. La acción no borra comandas ni rehabilita pedidos cobrados.

## Si ya publicaste una V10 anterior

Haz respaldo antes de actualizar. El Worker debe desplegarse **antes** de GitHub Pages, porque `admin.html` utiliza las rutas nuevas `/api/admin/openings` y el reporte paginado `/api/admin/data?offset=...`. No cambies el nombre del Worker, no borres su almacenamiento y no vuelvas a ejecutar el comando secreto si ya existe `SETUP_CODE`.

Las autorizaciones existentes en los dispositivos no se borran por actualizar el frontend o el Worker del mismo nombre.

**Pendiente:** validar visualmente en Safari del dispositivo real y confirmar un cobro sincronizado entre Mesero y Administración con el Worker publicado. Las pruebas automatizadas no equivalen a una auditoría contable ni a un despliegue productivo.
