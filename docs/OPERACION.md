# Operación diaria

## Mesero

1. Abre M1–M8. Verde indica mesa disponible; rojo indica consumo abierto; amarillo indica cuenta solicitada.
2. Toca `+` o `−` por producto. Para tacos, selecciona Maíz/Harina y Con queso antes de agregar.
3. Usa el botón `+` del encabezado para separar **PLATO 1, PLATO 2...**. El siguiente producto pertenecerá al nuevo grupo. El botón no registra clientes ni divide cobros.
4. Envía la comida a Cocina. Las bebidas no se envían al parrillero.
5. Si alguien agrega comida, envíala como nueva comanda; puede aparecer como agregado prioritario en Cocina.
6. Al solicitar la cuenta, la mesa pasa a amarillo y se registra el tiempo de espera.
7. Cobra en efectivo, transferencia o mixto; registra propina si la recibes y libera la mesa al terminar.

## Cocina

- Ve una comanda a la vez, con los contadores de Maíz con queso, Harina con queso, Maíz, Harina, Gringas y Volcanes.
- **La comanda completa está visible**, agrupada por plato y manteniendo el orden original.
- Al marcar un producto queda en verde, sin moverse ni desaparecer. Si te equivocas, desmárcalo.
- El check se refleja de inmediato y queda pendiente de confirmación si falla internet.
- Cuando todos los checks se confirman en Cloudflare, se habilita TERMINAR COMANDA.
- Una comanda larga puede necesitar desplazamiento vertical en su área central. En un teléfono muy pequeño no caben infinitos productos a la vez sin reducir la legibilidad.

## Administración

- Consulta ventas por periodo, productos vendidos, horas de actividad y métodos de pago.
- Registra gastos y movimientos de caja; realiza cortes con fondo inicial y efectivo contado.
- Las cifras de comensales se basan en personas registradas, no en estimaciones de Wi-Fi o cámaras.
- Una venta no equivale a utilidad neta: sin todos los costos, el resultado es parcial.
- **Datos → Eliminar fecha** solo para pruebas; elimina registros financieros de un día, no borra la cola de Cocina.

## Rutina de cierre

1. Comprueba mesas abiertas y cuentas pendientes.
2. Verifica los métodos de pago y propinas registradas.
3. Cuenta efectivo y guarda el corte desde Administración.
4. Exporta CSV si necesitas un respaldo operativo adicional.
