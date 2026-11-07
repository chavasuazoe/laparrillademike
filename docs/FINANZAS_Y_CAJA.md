# Finanzas y caja · V10.1

## Qué preguntas responde

| Pregunta del dueño | Pantalla | Cálculo / criterio |
|---|---|---|
| ¿Cuánto vendimos hoy? | Inicio | Suma de recibos cobrados del turno operativo, sin propinas |
| ¿Cuánto efectivo debo tener? | Caja | Fondo inicial + ventas netas en efectivo + aportes de caja − gastos pagados de caja − retiros de caja |
| ¿Cuánto entró por transferencia? | Inicio / Análisis | Suma de la porción de transferencia de los recibos |
| ¿En qué gastamos? | Gastos | Categorías registradas manualmente, con pago desde caja o por fuera |
| ¿Cuánto se deja de propinas? | Inicio / Caja | Total registrado; mesero 70%, ayudante 30% |
| ¿Qué productos y horarios venden más? | Análisis | Unidades y pesos por producto; cuentas por hora de pedido cuando la hora está disponible |
| ¿El dinero cuadra? | Caja | Efectivo contado − efectivo esperado, registrado en corte inmutable |
| ¿Qué pasó otros días? | Datos / Análisis | Historial de recibos, cortes e informes por fecha y periodo |

## Diferencias entre movimientos

- **Venta en efectivo:** dinero cobrado por productos, descontando cambio entregado. No incluye propinas.
- **Venta por transferencia:** pago electrónico; no aparece en el cajón de efectivo.
- **Gasto pagado de caja (`cash_out`):** reduce efectivo y aumenta gastos registrados. Ejemplo: tortillas pagadas en efectivo.
- **Gasto externo (`expense`):** aumenta gastos, pero no reduce el cajón. Ejemplo: compra de carne por transferencia bancaria.
- **Aporte a caja (`cash_in`):** entra dinero para cambio. **No es venta** ni utilidad.
- **Retiro de caja (`cash_drop`):** sale dinero del cajón para resguardo/entrega; **no es gasto operativo**.
- **Propinas:** monto separado de ventas, con desglose 70%/30%. Se asumen fuera del cajón; si en la operación real se dejan dentro, hay que registrarlo en un movimiento de caja para cuadrar.
- **Corte:** fotografía inmutable del fondo, movimientos, efectivo esperado y contado al momento de confirmarlo.

## Jornada y cierre

Se trabaja jueves a martes, de 18:30 a 00:00. Miércoles descanso habitual. Para un pago tardío hasta las 05:59 de la madrugada, el reporte lo asigna al turno de la noche anterior. A partir de las 06:00 corresponde al nuevo día operativo. El horario no bloquea registros fuera de turno.

Para evitar diferencias, registra primero los movimientos de efectivo, después cuenta el dinero y guarda el corte. Si hay movimientos posteriores al cierre, el sistema no reescribe el corte antiguo y muestra una advertencia.

## Qué todavía NO representa utilidad neta

No hay inventario, coste por receta, facturación SAT, impuestos automáticos, cuentas por pagar, depreciación ni nómina automática. **Saldo parcial = ventas cobradas − gastos registrados.** No llames "ganancia neta" a ese importe. Si falta una compra o un sueldo, el cálculo estará incompleto.

El dato "horas con más pedidos" representa órdenes registradas, no el número exacto de personas presentes. Comensales solo se cuentan si Mesero los registra.

## Seguridad y respaldos

Solo un dispositivo vinculado como Administración tiene acceso a datos financieros, apertura de caja, gastos y cierres. Las credenciales de los dispositivos no se incorporan al repositorio. Los cortes se guardan en Cloudflare, no en los archivos de GitHub.

Exporta CSV regularmente. El borrado por fecha se deja **exclusivamente para datos de prueba**; exige escribir la fecha y no borra las órdenes pagadas ni comandas, para evitar duplicados. Una exportación CSV no es una copia completa de la base de datos. No elimines el Worker sin un respaldo y plan de recuperación.

## Requisitos técnicos de publicación

Los cambios en `cloudflare/src/worker.mjs` incluyen paginación del historial, aperturas de caja, categorías de gastos, retiros de caja y el cálculo del corte en el servidor. Publica primero Cloudflare con el nombre y origen especificados en `cloudflare/wrangler.toml`; configura `SETUP_CODE` como secreto allí, no en GitHub. Después copia la URL HTTPS del Worker en `assets/js/config.js` y sube el repositorio a GitHub Pages.

## Fundamentos de diseño financiero

Este panel se inspiró en el formato de reporte de día, pagos, propinas, horas y productos de la documentación pública de Lightspeed Restaurant:

- https://resto-support.lightspeedhq.com/hc/en-us/articles/226404868-Day-Report
- https://o-series-support.lightspeedhq.com/hc/en-us/articles/31329355994523-Accessing-Back-Office-Reports
- https://resto-support.lightspeedhq.com/hc/en-us/articles/226305787-About-reports-and-data

No afirma ser producto de Lightspeed ni utiliza datos de ventas de negocios ajenos.
