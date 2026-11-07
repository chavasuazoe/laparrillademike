# Datos, permisos y seguridad

## Separación de roles

- **Mesero**: crea y modifica pedidos, cobra y emite vinculaciones temporales.
- **Cocina**: consulta comandas y marca/termina alimentos.
- **Administración**: consulta recibos, registra movimientos y cierra turnos.

El servidor valida cada permiso por endpoint. Las páginas son públicas, pero los datos operativos requieren tokens autorizados.

## Contraseñas y secretos

- `SETUP_CODE` solo se introduce como secreto con `npx wrangler secret put SETUP_CODE`.
- La URL en `assets/js/config.js` es pública y no es una contraseña.
- No pegues tokens o archivos `.dev.vars` en GitHub.
- Los tokens de sesión están en almacenamiento local del navegador. Protege los dispositivos con bloqueo de pantalla y no los compartas.
- El código de vinculación de Cocina/Admin es temporal. No permite administrar el servidor.

## Instalación V10 desde cero

La V10 utiliza un Worker nuevo `parrilla-mike-v10` y claves locales nuevas. Los datos almacenados en el Worker y en Safari de las versiones anteriores **no se importan automáticamente**. Conserva los respaldos y no borres el servicio antiguo hasta comprobar que ya no lo necesitas.

## Falla de internet

Mesero guarda cambios localmente y reintenta cuando regresa la red. Cocina mantiene la cola y los checks pendientes. Un check pendiente **no equivale a una confirmación de Cloudflare**. Los tres equipos no pueden compartir información cuando todos están desconectados: la sincronización requiere internet.

## Respaldos

- Descarga JSON local desde Mesero periódicamente, especialmente antes de actualizar.
- Descarga CSV de ventas desde Administración y conserva los cortes.
- Cloudflare almacena datos del Worker; GitHub no es una copia de seguridad de ventas.
- Para recuperar la base de datos en otro Worker hace falta una migración/exportación adicional; este proyecto no realiza copias centrales automáticas.

## Eliminación de datos de prueba

La eliminación por fecha es irreversible a través de la interfaz. Exporta primero el CSV y comprueba la fecha. La eliminación es solo de los registros financieros cubiertos por esa función; no garantiza borrar cada dato que alguna vez existió en la base o los backups del proveedor.
