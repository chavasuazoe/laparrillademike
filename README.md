# Sistema de pedidos V10.1 — Administración financiera

Aplicación web ligera para **Mesero, Cocina y Administración**. Las tres pantallas se abren desde GitHub Pages y sincronizan las comandas, pagos y reportes a través de un Worker de Cloudflare. Sin Firebase y sin servidor propio encendido.

> **Antes de empezar:** esta es una instalación **nueva**. V10 usa otro Worker, otra base de datos y otras claves de almacenamiento del navegador. **No importa automáticamente pedidos, ventas, cortes ni autorizaciones de V9.5.** Los datos antiguos no se borran por instalar V10. **No elimines el Worker ni el repositorio anteriores hasta respaldarlos y comprobar V10.**


## Qué incluye Administración en esta versión

Además de Mesero y Cocina, **Administración (admin.html)** dispone de cinco secciones táctiles:

- **Inicio:** ventas cobradas del turno, cuentas, mesas abiertas, efectivo, transferencias, propinas y acceso directo al corte.
- **Caja:** abre el turno con un fondo inicial, calcula el efectivo esperado y guarda un corte inmutable con el dinero contado y su diferencia.
- **Gastos:** registra compras y nómina por categoría. Distingue gastos pagados desde la caja, gastos externos, aportaciones de efectivo y retiros que **no son gastos**.
- **Análisis:** ventas de hoy, 7 y 30 días, y últimos 12 meses; productos más vendidos, horas de actividad y pagos.
- **Datos:** cortes anteriores, detalle de ventas, exportación CSV y eliminación controlada de datos de prueba por fecha.

**Ejemplo de cuadre:** fondo $300 + ventas en efectivo $600 + entrada de cambio $100 − compra pagada desde caja $80 − retiro de caja $120 = **$800 esperados**. La propina se contabiliza aparte y se reparte 70%/30%; no se añade a la venta ni se supone que permanece dentro de la caja.

**Importante:** registrar el sueldo de $250 del mesero es una acción manual, no un descuento automático. El saldo `ventas − gastos registrados` **no es utilidad neta** si aún faltan materias primas, nómina, renta, impuestos o inventario. El panel no emite facturas fiscales.

### Uso cotidiano del dueño

1. Abre **CAJA** y registra el fondo inicial al iniciar el turno (18:30 normalmente).
2. En **GASTOS** captura tortillas, carne, sueldos, gas, insumos o cualquier salida; indica si salió del cajón de efectivo o se pagó por fuera.
3. Revisa **INICIO** para saber qué se cobró en efectivo, transferencia y propinas; no confundas las ventas con el efectivo disponible.
4. Al finalizar el turno, cuenta el efectivo físico y entra en **CAJA**. Compara el efectivo esperado y confirma el corte.
5. Consulta **ANÁLISIS** por periodo y exporta el turno en **DATOS**. Conserva respaldos periódicos.

Los pagos hechos después de guardar un corte no modifican su importe original: el panel avisa cuando detecta diferencias entre los registros actuales y el corte guardado. No utilices "Eliminar datos" con ventas reales.

Más información: [Guía de finanzas](docs/FINANZAS_Y_CAJA.md).

## 1. Estructura del repositorio

```text
laparrillademike/
├── index.html                 # Mesero
├── cocina.html                # Cocina
├── admin.html                 # Administración
├── sw.js                      # Caché para uso sin conexión
├── assets/
│   ├── css/                   # Estilos globales y por pantalla
│   ├── js/                    # Catálogo, vistas, sincronización, iconos, configuración
│   ├── icons/                 # Iconos de acceso directo
│   └── manifests/             # PWA de cada puesto
├── cloudflare/
│   ├── src/                   # Servidor y validaciones
│   ├── wrangler.toml          # Nombre, permiso de origen y Durable Object
│   └── package.json
├── tests/                     # Pruebas Node sin servicios externos
├── tools/                     # Comprobación de estructura
├── docs/                      # Operación, datos y arquitectura
├── package.json
├── .gitignore
└── README.md
```

`index.html`, `cocina.html` y `admin.html` **deben quedar en la raíz**. No subas el ZIP sin descomprimir, ni carpetas `node_modules`, `.wrangler`, `.dev.vars` o archivos con contraseñas.

## 2. Requisitos

- Una cuenta en [GitHub](https://github.com/) y otra en [Cloudflare](https://dash.cloudflare.com/).
- Una computadora con **Node.js 22 LTS o posterior** para la instalación inicial y las pruebas.
- Navegadores actuales en los dispositivos: Safari de iPhone, Chrome o Edge.
- Internet móvil en cada puesto mientras se sincronizan pedidos. Los pedidos del Mesero pueden guardarse localmente si pierde señal, pero **no llegan a Cocina hasta recuperar la conexión**.

## 3. Respaldo antes de borrar V9.x

1. En la aplicación anterior, abre los ajustes de Mesero y descarga su **respaldo JSON**.
2. Desde el antiguo panel de Administración exporta los CSV de ventas y cortes que necesites.
3. Guarda una copia ZIP de tu repositorio antiguo y conserva la URL de tu Worker anterior.
4. No borres el Worker antiguo por ahora: su base de datos **no vive en GitHub**.

Si vuelves a crear el mismo repositorio de GitHub Pages, quizá quede el caché del navegador anterior. La V10.1 tiene un caché distinto; **no borres los datos de Safari ni desinstales la app instalada** hasta guardar tus respaldos.

## 4. Publicar el servidor nuevo en Cloudflare

En una computadora, descomprime V10. Abre una terminal en **la carpeta `cloudflare`** (no en `assets`). Ejecuta:

```bash
npm install
npx wrangler login
npx wrangler deploy
```

El proyecto incluye `cloudflare/wrangler.toml`:

```toml
name = "parrilla-mike-v10"

[vars]
FRONTEND_ORIGIN = "https://chavasuazoe.github.io"
```

- `name`: nombre del **nuevo** Worker; no uses el nombre anterior si deseas mantener los datos separados.
- `FRONTEND_ORIGIN`: el dominio donde abres GitHub Pages, **sin** `/laparrillademike/` y **sin** la diagonal final. Si cambias de usuario o usas un dominio propio, modifica ese valor **antes** de desplegar.
- No cambies los nombres `KITCHEN_ROOM` y `KitchenRoom` sin adaptar el código.

Ahora configura tu código privado **solamente en Cloudflare**:

```bash
npx wrangler secret put SETUP_CODE
```

Cuando Wrangler te lo pida, introduce una contraseña **de al menos 12 caracteres**, diferente de la que compartes con los empleados. No aparecerá en ningún archivo del proyecto y **no debes pegarla en GitHub, ni en capturas ni en este chat**.

Wrangler mostrará una URL parecida a:

`https://parrilla-mike-v10.laparrillademike.workers.dev`

Copia la URL **exacta** que aparezca en tu cuenta. Compruébala abriendo:

`https://TU-WORKER.workers.dev/api/health`

Debe responder un JSON con `"ok":true` y `"service":"parrilla-v10"`. Si no responde, no continúes con el resto de la instalación.

> **Nota:** `wrangler.toml` utiliza el sistema de exportaciones de Durable Objects respaldado por SQLite. El nuevo Worker comienza con las tablas vacías. Si eliminas el Worker antiguo, V10 no recuperará por sí sola esos datos.

## 5. Configurar la dirección pública del servidor

Abre el archivo **`assets/js/config.js`** y coloca la URL exacta impresa por Wrangler:

```js
window.PEDIDOS_CLOUDFLARE = Object.freeze({
  url: 'https://TU-WORKER.workers.dev'
});
```

Esta **URL sí es pública**. No es una contraseña. El Worker exige autorizaciones individuales para leer pedidos y datos de ventas.

## 6. Crear y subir el repositorio de GitHub limpio

Si vas a eliminar el repositorio anterior, asegúrate de que ya descargaste sus respaldos. Después:

1. En GitHub crea un repositorio público llamado **`laparrillademike`**, con tu usuario `chavasuazoe`. No necesitas generar un README nuevo porque el proyecto ya lo contiene.
2. Abre el repositorio → **Add file → Upload files**.
3. Arrastra **el contenido** de la carpeta descomprimida V10: los tres HTML, `assets`, `cloudflare`, `tests`, `tools`, `docs`, `README.md`, `sw.js`, `package.json` y demás archivos del proyecto. **No arrastres la carpeta contenedora V10**, para que `index.html` no quede dentro de otra carpeta.
4. Comprueba que las carpetas conservan sus rutas y pulsa **Commit changes**.
5. Abre **Settings → Pages → Build and deployment → Deploy from a branch**. Selecciona **`main`** y **`/(root)`**, y guarda.

Si el navegador no permite arrastrar bien las carpetas o los archivos ocultos, usa **GitHub Desktop** o la terminal. Los archivos ocultos `.gitignore` y `.editorconfig` ayudan al desarrollo, pero no son necesarios para que la página funcione.

### Alternativa para subir el proyecto con Git

Desde la carpeta raíz de V10 (donde está `index.html`):

```bash
git init
git add .
git commit -m "Release V10.1: finance and cash control"
git branch -M main
git remote add origin https://github.com/chavasuazoe/laparrillademike.git
git push -u origin main
```

Estos comandos suponen un repositorio remoto **nuevo y vacío**. Si ya tiene commits, clónalo primero o utiliza GitHub Desktop; no hagas `push --force` sobre datos que quieres conservar.

## 7. Abrir las tres pantallas

| Dispositivo | Página |
|---|---|
| Mesero | https://chavasuazoe.github.io/laparrillademike/ |
| Cocina | https://chavasuazoe.github.io/laparrillademike/cocina.html |
| Administración | https://chavasuazoe.github.io/laparrillademike/admin.html |

**Vincula en este orden:**

1. En tu teléfono abre **Mesero → engranaje → autorizar**. Introduce `SETUP_CODE` **una vez**. Si la clave ya se usó en otra sesión V10, utiliza **Recuperar acceso del mesero**; no crees otra cuenta.
2. En Mesero genera el **código temporal para Cocina**; introdúcelo en `cocina.html` desde el dispositivo del parrillero.
3. En Mesero genera el **código temporal para Administración**; introdúcelo en `admin.html` desde el dispositivo del dueño.
4. Instala cada página en la pantalla de inicio si te conviene, después de comprobar que funciona desde el navegador.

## 8. Prueba obligatoria antes del primer turno

Realiza esta prueba **sin clientes**:

1. En Mesero abre **M1**, agrega dos tacos de maíz y uno de harina con queso, crea PLATO 2 y agrega una hamburguesa para llevar.
2. Pulsa **COCINA**. En el dispositivo de Cocina deben verse **todos** los alimentos, agrupados por platos y en el mismo orden.
3. Marca cada producto; comprueba que **no desaparece ni cambia de posición**. Termina la comanda.
4. Agrega un taco extra a M1 y envía una **nueva comanda**, sin repetir los productos anteriores.
5. En Mesero solicita la cuenta, realiza un **cobro de prueba**, registra una propina y libera la mesa.
6. En Administración comprueba esa venta y los importes del turno. Si no quieres conservar la prueba en los reportes, utiliza la eliminación por fecha solo cuando ya no haya ventas reales de ese mismo día.
7. Desconecta momentáneamente los datos móviles del Mesero: registra un pedido, reconecta y confirma que la comanda sale **una sola vez**.

No empieces con pedidos reales si alguna de estas pruebas falla.

## 9. Pruebas de código (opcionales)

Desde la raíz de V10:

```bash
npm run check
```

Comprobará los archivos enlazados, el caché y las pruebas de negocio sin pedir contraseñas. Para abrir la interfaz en una computadora con un servidor local:

```bash
npm run serve
```

Entra en `http://localhost:8080`. **El doble clic en `index.html` sirve para revisar el diseño**, pero HTTPS es necesario para el uso PWA y algunas funciones de navegador.

## 10. Qué guarda cada lugar

- **GitHub:** los archivos publicados del sistema; **no** guarda los cobros de los clientes.
- **Cloudflare:** comandas, controles de Cocina, datos sincronizados de mesas, recibos, propinas, cortes y movimientos del administrador.
- **Navegador del Mesero:** pedidos y cambios pendientes de enviar, además de su sesión autorizada.
- **Navegador de Cocina:** comandas vistas y checks aún sin sincronizar.

**Advertencia:** borrar y recrear el repositorio de GitHub **no borra Cloudflare**. Crear el Worker **V10** sí inicia una base de datos independiente: tus reportes V9.5 no aparecen allí. Para recuperarlos necesitarías una migración de datos específica que esta versión no incluye.

## 11. Solución rápida de problemas

| Problema | Qué revisar |
|---|---|
| Mesero muestra error de conexión | Que `/api/health` abra y `assets/js/config.js` tenga la URL correcta |
| Mensaje `Load failed` en Safari | `FRONTEND_ORIGIN` debe ser exactamente `https://chavasuazoe.github.io`; vuelve a ejecutar `npx wrangler deploy` tras corregirlo |
| «Mesero ya autorizado» | El Worker tiene una autorización anterior; utiliza **Recuperar acceso del mesero** con el código privado de este Worker |
| Cocina no recibe pedidos | Vinculación de Cocina, conexión móvil, y comandas realmente enviadas (no solo guardadas) |
| La página vieja sigue apareciendo | Verifica en GitHub los archivos publicados, reabre la URL en una pestaña nueva y comprueba el caché sin borrar almacenamiento |
| No se ven los iconos | Los SVG se incluyen localmente en `assets/js/icons.js`, así que verifica que subiste esa carpeta |
| Administración parece vacía | En un Worker nuevo es normal: no existen ventas hasta completar la prueba o atender clientes |
| `npm install` genera cientos de archivos | No subas `node_modules`; `.gitignore` excluye esa carpeta |

## 12. Límites y costos

GitHub Pages y Cloudflare Workers/Durable Objects ofrecen modalidades gratuitas sujetas a condiciones, cuotas y límites que podrían cambiar. Esta versión **no calcula impuestos, facturación SAT, inventario, devoluciones ni utilidad neta** sin registrar todos los costos del negocio. Administración reporta ventas y gastos registrados, no beneficios garantizados.

Horario configurado para reportes: **jueves a martes, 18:30–00:00; descanso los miércoles**. El día operativo agrupa movimientos de madrugada hasta las 05:59 con el turno anterior. Esto organiza reportes; no bloquea la aplicación fuera de horario.

Información adicional: [Operación](docs/OPERACION.md), [Datos y seguridad](docs/DATOS_Y_SEGURIDAD.md), [Arquitectura](docs/ARQUITECTURA.md), [Métricas](docs/INDICADORES.md).

## Documentación oficial de referencia

- [GitHub Pages: crear el sitio](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [GitHub Pages: publicar desde `main` / raíz](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Cloudflare: configuración de Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare: Durable Objects y almacenamiento SQLite](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)
