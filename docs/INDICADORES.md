# Por qué estos indicadores

Para un restaurante pequeño priorizamos:

1. Ventas realizadas por turno, semana, mes y año; cantidad de cuentas y ticket promedio.
2. Efectivo neto y transferencias separados, propinas aparte.
3. Productos con más unidades vendidas; ayuda a prever insumos y ajustar el menú.
4. Horas de mayor número de cuentas; **no equivale** a contar personas.
5. Comensales registrados manualmente, cuando el mesero aporta el número.
6. Gastos y movimientos de caja para conocer entradas, salidas y aproximación a resultados operativos.
7. Corte con fondo inicial, efectivo contado, efectivo esperado y diferencia.

No mostramos inventario, food cost, márgenes por receta, utilidad neta ni rotación real de mesas porque esos datos no se capturan todavía. No inventamos esa información. Tampoco calculamos visitantes a partir de las ventas.

Referencias metodológicas consultadas:
- Square: [Daily sales reporting](https://squareup.com/help/us/en/article/8579-review-daily-sales-for-your-restaurant) y [cash drawer sessions](https://squareup.com/help/us/en/article/8344-start-and-end-a-cash-drawer-session).
- Toast: [Sales summary / first-day reporting](https://support.toasttab.com/en/article/Reporting-Best-Practices-Reports-to-Use-After-Your-First-Day-on-Toast), [menu product mix](https://support.toasttab.com/en/article/Menu-Report-Overview-1492794696577) y [guest count / top sellers](https://support.toasttab.com/en/article/How-to-Use-the-Toast-Reporting-Dashboard).


## Administración financiera V10.1

Los cuadros del dueño distinguen:

- **Ventas cobradas:** suma de recibos, sin propinas ni entradas manuales de caja.
- **Efectivo de venta:** efectivo recibido menos cambio entregado.
- **Transferencias:** importes pagados por transferencia en recibos.
- **Gastos registrados:** pagos de caja más pagos externos, agrupados por categoría.
- **Caja esperada:** fondo inicial más efectivo de ventas y aportaciones menos pagos en efectivo y retiros.
- **Diferencia:** efectivo contado menos efectivo esperado.
- **Propinas:** reparto 70/30, fuera de ventas.
- **Saldo parcial:** ventas menos gastos registrados; no utilidad neta.

Se muestran vistas hoy, 7 días, 30 días y últimos 12 meses. Los cobros se recuperan por páginas, en lugar de truncar silenciosamente el historial. Esto no sustituye la contabilidad fiscal ni captura todos los costos automáticamente.
