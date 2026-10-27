# SaborPuro — Mermelada artesanal de mora

Sitio web, trazabilidad de lotes y generador de etiquetas para imprimir de
**SaborPuro**, la mermelada de mora elaborada por **Mujeres Usmeñas** en Usme,
Bogotá D.C.

Sirve a dos públicos: a quien compra el frasco, que puede ver cómo se hizo,
entender qué dice cada campo de la etiqueta y verificar su lote; y a quien
produce, que planea cada tanda e imprime etiquetas que cumplen el rotulado
colombiano sin hacer cuentas a mano.

**Demo en vivo:** <https://saborpuro.lat> (también en <https://saborpuro.vercel.app>)

![Portada de SaborPuro: nombre de la marca, canasta de frutas y frasco de mermelada con su etiqueta](docs/capturas/portada.webp)

## Funcionalidades

**Sitio público (`/`)**

- **El proceso** en doce pasos, del canasto al frasco, con la razón técnica de cada uno.
- **La etiqueta, campo por campo**: al pasar el cursor (o tocar en el celular)
  por cualquier campo, explica qué exige la norma y cita la resolución. Incluye
  la tabla nutricional por 100 g y por cucharada.
- **Planeador de tandas**: cambias mora, azúcar, limón y rendimiento, y se
  recalculan los frascos, el porcentaje de fruta, los grados Brix, las
  calorías, el agua evaporada, el lote que se asignaría y los sellos de
  advertencia que tocaría poner.
- **Verifica tu lote**: con el código impreso (`L261018-01`) consulta en la API
  qué día se produjo la tanda, con qué proporciones y hasta cuándo rinde.
- Tema claro y oscuro, diseño adaptable a celular y respeto por
  `prefers-reduced-motion`.

**Generador de etiquetas (`/etiquetas`)**

- Todo el rótulo es editable: marca, producto, ingredientes, fabricante,
  registro sanitario, código de barras, lote, fechas y sellos.
- El lote, el vencimiento, la tabla nutricional y el EAN-13 se calculan solos
  desde la receta; también se pueden fijar a mano.
- Cinco tamaños de etiqueta predefinidos (de 50 × 30 a 100 × 70 mm) o medidas
  propias; hoja A4, Carta, Oficio o personalizada, en vertical u horizontal.
  Calcula cuántas caben por hoja y cuántas hojas hacen falta.
- Avisa de campos obligatorios vacíos, del prefijo EAN interno y del texto que
  no cabe en la etiqueta.
- El borrador se guarda en el navegador; las etiquetas con nombre, con su foto,
  se guardan en el servidor y forman el catálogo de productos.

**API de trazabilidad (`apps/api`)**

- Registra cada tanda (`POST /api/lotes`) y devuelve el lote, su etiqueta y su
  código de barras en SVG.
- Calculadora sin persistencia, sello frontal en SVG y registro de pedidos.
- CRUD de etiquetas guardadas, protegido con la clave `X-Clave`.

## Capturas

| La etiqueta, campo por campo | Planeador de tandas |
|---|---|
| ![Etiqueta interactiva con la explicación del sello «Exceso en azúcares» y la tabla nutricional](docs/capturas/etiqueta-campo-por-campo.webp) | ![Planeador de tandas con frascos, porcentaje de fruta, grados Brix, calorías, lote asignado y sello frontal](docs/capturas/planeador-de-tandas.webp) |

| Generador de etiquetas | En el celular |
|---|---|
| ![Generador de etiquetas: catálogo de productos, editor del rótulo y hoja A4 con diez etiquetas listas para imprimir](docs/capturas/generador-de-etiquetas.webp) | <img src="docs/capturas/portada-movil.webp" alt="Portada de SaborPuro en un celular de 390 px de ancho" width="240"> |

Capturas tomadas del sitio en vivo con Playwright (1280 × 800 y 390 × 844).

## Stack

| Parte | Tecnología |
|---|---|
| Web (`apps/web`) | Next.js 15 (App Router), React 19, JavaScript y CSS propio, sin framework de estilos. Fuentes Fraunces, Karla y JetBrains Mono. |
| API (`apps/api`) | Fastify 5, `@fastify/cors` y PostgreSQL con `pg`. Las tablas (`lotes`, `pedidos`, `etiquetas`) se crean solas al arrancar. |
| Lógica compartida (`packages/brand`) | JavaScript ESM sin dependencias. Next lo transpila con `transpilePackages`. |
| Pruebas | `node:test`, el corredor nativo de Node. |
| Infraestructura | Vercel (web) y Railway con Nixpacks (API y Postgres). Monorepo con npm workspaces, Node 22. |

## Estructura

```
apps/web        Next.js 15 — sitio público y generador   → Vercel
apps/api        Fastify + PostgreSQL — trazabilidad       → Railway
packages/brand  Lógica compartida y tokens de marca
```

`packages/brand` es el corazón del proyecto:

| Módulo | Qué hace |
|---|---|
| `tokens.js` | Identidad de marca y datos legales. **Archivo único de configuración.** |
| `barcode.js` | EAN-13: generación, validación, dígito verificador y render SVG. |
| `lote.js` | Códigos de lote, fechas de producción y vencimiento. |
| `nutricional.js` | Perfil nutricional desde la receta y evaluación de sellos frontales. |
| `etiqueta.js` | Arma la etiqueta completa y valida campos obligatorios. |
| `plantilla.js` | Plantilla editable del generador: tamaños, hojas, capacidad por hoja y validación. |

Para cambiar el nombre, los colores, el NIT o el registro sanitario, se
toca **solo `packages/brand/src/tokens.js`**: todo lo demás se actualiza
con él.

> **Datos de ejemplo.** `tokens.js` trae a propósito datos de relleno
> («Fabricante de ejemplo», «Calle Falsa 123», teléfono `300 000 0000`, NIT y
> registro con ceros): ningún dato personal real vive en el repositorio. Los
> de verdad se escriben en el generador y se guardan con cada etiqueta en el
> servidor.

## Cómo correrlo en local

Requisitos: Node 22 (está en `.nvmrc`; el mínimo es 20) y npm. PostgreSQL solo
hace falta para la verificación de lotes y el catálogo de productos.

```bash
git clone https://github.com/ronalc90/chela
cd chela
npm ci
npm run dev:web      # http://localhost:3000
```

Con eso funcionan el sitio público, el planeador y el generador (el borrador
queda en el navegador). Sin API, la verificación de lotes avisa que el
servicio no está conectado.

Para tener también la API:

```bash
# Postgres local (por ejemplo, con Docker)
docker run -d --name chela-pg -e POSTGRES_PASSWORD=chela -p 5432:5432 postgres:16

# API en http://localhost:8080; crea las tablas al arrancar
DATABASE_URL="postgres://postgres:chela@localhost:5432/postgres?sslmode=disable" \
ETIQUETAS_CLAVE="clave-local" \
npm run dev:api

# Web apuntando a esa API
printf 'NEXT_PUBLIC_API_URL=http://localhost:8080\nETIQUETAS_CLAVE=clave-local\n' > apps/web/.env.local
npm run dev:web
```

`sslmode=disable` apaga TLS para la base local. Sin `CORS_ORIGINS`, la API
acepta cualquier origen.

## Scripts

Desde la raíz del repositorio:

| Script | Qué hace |
|---|---|
| `npm run dev:web` | Servidor de desarrollo de Next.js en el puerto 3000. |
| `npm run dev:api` | API con `node --watch` en el puerto 8080 (o `PORT`). |
| `npm run build:web` | Compilación de producción de la web (`next build`). |
| `npm run build:api` | La API no tiene paso de compilación (Node ejecuta `src/` directo) y no define `build`, así que este script falla. |
| `npm test` | Las 20 pruebas de `packages/brand`. |
| `npm run start --workspace=@chela/api` | Arranca la API en modo producción; es lo que ejecuta Railway. |
| `npm run start --workspace=@chela/web` | Sirve la web ya compilada (`next start`). |

## Pruebas

```bash
npm test
```

Son **20 pruebas** con `node:test` sobre la lógica compartida; no necesitan
instalar dependencias ni base de datos.

- `packages/brand/test/core.test.mjs` (13): dígito verificador y estructura del
  EAN-13, render SVG, lote de ida y vuelta, vencimiento a fin de mes, perfil
  nutricional, sello de azúcares y armado y validación de la etiqueta.
- `packages/brand/test/plantilla.test.mjs` (7): plantilla por defecto,
  normalización y límites, tamaños predefinidos, lote y vencimiento manuales,
  sellos y EAN propio, campos obligatorios y capacidad por hoja (A4, Carta y
  horizontal).

La web y la API no tienen pruebas automáticas.

## Despliegue

**Web → Vercel.** Proyecto `saborpuro` (framework Next.js, Node 22), con los
dominios `saborpuro.lat`, `www.saborpuro.lat` y `saborpuro.vercel.app`. Cada
cambio en `main` se publica en producción y cada PR tiene su vista previa.
Variables: `NEXT_PUBLIC_API_URL` y, opcional, `ETIQUETAS_CLAVE`.

**API → Railway.** `railway.json` y `nixpacks.toml` definen el despliegue: Node
22 con Nixpacks, instalación de los workspaces, arranque con
`npm run start --workspace=@chela/api`, chequeo de salud en `/health` y
reinicio automático si falla. Railway enlaza Postgres e inyecta
`DATABASE_URL`.

## Variables de entorno

**apps/web**

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública de la API en Railway. Sin ella, la verificación de lote avisa que el servicio no está conectado. |
| `ETIQUETAS_CLAVE` | Secreto de servidor, **sin** prefijo `NEXT_PUBLIC_`. Si está, el puente `/api/etiquetas` pone la clave por su cuenta y la biblioteca abre sin pedir nada; entonces cualquiera que abra el sitio puede ver, editar y borrar las etiquetas. Si no está, la biblioteca pide la clave y la guarda en ese navegador. |

**apps/api**

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Postgres. Railway la inyecta al enlazar el servicio. Sin ella la API arranca, pero los endpoints de datos fallan. |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma. Los `*.vercel.app` se permiten siempre. |
| `ETIQUETAS_CLAVE` | Clave de `/api/etiquetas`, comparada contra la cabecera `X-Clave`. Sin ella esas rutas responden 503 en vez de quedar abiertas. |
| `PORT` | Lo asigna Railway. En local, 8080 por defecto. |
| `LOG_LEVEL` | Nivel de los logs de Fastify (`info` por defecto). |

## Productos

Cada producto guardado es su rótulo completo (ver `@chela/brand/plantilla`) más
una foto opcional. La foto no se imprime: sirve para reconocerlo en el
catálogo de `/etiquetas`. Se redimensiona y se recomprime a JPEG en el
navegador antes de subirla (máximo 900 KB), y se guarda además una miniatura
(máximo 80 KB) que es la única que viaja en el listado.

## Imprimir etiquetas

En `/etiquetas`, tras configurar la tanda, usa el botón de imprimir y en
el diálogo del navegador **desactiva «ajustar a la página» y deja la
escala en 100 %**. Las etiquetas están medidas en milímetros, así que
cualquier reescalado las saca de tamaño.

La hoja imprime solo las etiquetas: el panel, el menú y los fondos se
ocultan automáticamente.

## Marco normativo

La etiqueta sigue:

- **Resolución 5109 de 2005** — rotulado general de alimentos envasados
  (art. 4 modificado por la Resolución 557 de 2022).
- **Resolución 810 de 2021**, modificada por la **2492 de 2022** y corregida
  por la **254 de 2023** — tabla nutricional y sellos frontales de advertencia.
- **Resolución 2674 de 2013** y **Resolución 719 de 2015** — clasificación por
  riesgo y registro sanitario ante el INVIMA.

### Dos hallazgos que afectan el producto

1. **La mermelada lleva sello «EXCESO EN AZÚCARES».** El umbral es 10 % o más
   de la energía total proveniente de azúcares libres, y una mermelada
   tradicional lo supera con holgura. Llevar un sello **prohíbe toda
   declaración de propiedad nutricional o de salud** en la etiqueta.

2. **El código de barras actual no sirve para retail.** Usa prefijo interno
   `200`, válido para control propio. Un GTIN comercial lo asigna GS1
   Colombia (LOGYCA); el prefijo de país es `770`.

## Pendientes antes de imprimir en serio

- [ ] **NIT** de la organización.
- [ ] **Teléfono:** las fuentes originales traen dos números distintos. Definir
      cuál va.
- [ ] **Registro sanitario:** hay dos versiones, en formatos distintos (NSA y
      RSA). Definir cuál es el vigente.
- [ ] **Análisis bromatológico** de laboratorio para la tabla nutricional real.
- [ ] **Prefijo GS1** si el producto va a supermercados.
- [ ] **Verificación del nombre** en la base de signos distintivos de la SIC.

Los valores reales de teléfono, NIT y registro no se escriben en el
repositorio: van en el generador. El generador marca en pantalla los campos
que siguen pendientes.

Los valores nutricionales del sitio son estimaciones calculadas desde la
receta. No sustituyen un análisis de laboratorio.
