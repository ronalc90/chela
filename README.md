# SaborPuro — Mermelada artesanal de mora

Sitio web, trazabilidad de lotes y generador de etiquetas para imprimir,
de la mermelada de mora elaborada por **Mujeres Usmeñas** en Usme,
Bogotá D.C.

**Dominio:** https://saborpuro.lat

## Qué hace

- **Sitio público** — el proceso de elaboración paso a paso, una etiqueta
  interactiva que explica qué norma exige cada campo, un planeador de
  tandas que recalcula en vivo, y consulta de trazabilidad por lote.
- **Generador de etiquetas** (`/etiquetas`) — llenas los datos de la tanda
  y sale una hoja A4 lista para papel adhesivo. Tres tamaños de etiqueta.
  El lote, el vencimiento, la tabla nutricional y el código de barras se
  calculan solos desde la receta.
- **API de trazabilidad** — registra cada tanda y permite devolver
  cualquier frasco a su día de producción.

## Estructura

```
apps/web        Next.js 15 — sitio público          → Vercel
apps/api        Fastify + PostgreSQL — trazabilidad → Railway
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

Para cambiar el nombre, los colores, el NIT o el registro sanitario, se
toca **solo `packages/brand/src/tokens.js`**: todo lo demás se actualiza
con él.

## Desarrollo

```bash
npm install --workspaces --include-workspace-root
npm run dev:web      # http://localhost:3000
npm run dev:api      # http://localhost:8080
npm test             # suite del paquete de marca
```

## Variables de entorno

**apps/web**

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública de la API en Railway. Sin ella, la verificación de lote avisa que el servicio no está conectado. |
| `ETIQUETAS_CLAVE` | Secreto de servidor, **sin** prefijo `NEXT_PUBLIC_`. Si está, el puente `/api/etiquetas` pone la clave por su cuenta y la biblioteca abre sin pedir nada; entonces cualquiera que abra el sitio puede ver, editar y borrar las etiquetas. Si no está, la biblioteca pide la clave y la guarda en ese navegador. |

**apps/api**

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Postgres. Railway la inyecta al enlazar el servicio. |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma. Los `*.vercel.app` se permiten siempre. |
| `ETIQUETAS_CLAVE` | Clave de `/api/etiquetas`, comparada contra la cabecera `X-Clave`. Sin ella esas rutas responden 503 en vez de quedar abiertas. |
| `PORT` | Lo asigna Railway. |

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
- [ ] **Teléfono:** hay dos versiones en las fuentes, `311 583 9051` y
      `321 383 8226`. Definir cuál va.
- [ ] **Registro sanitario:** hay dos versiones, `NSA-8520-951` y
      `RSA 11783305`. Definir cuál es el vigente.
- [ ] **Análisis bromatológico** de laboratorio para la tabla nutricional real.
- [ ] **Prefijo GS1** si el producto va a supermercados.
- [ ] **Verificación del nombre** en la base de signos distintivos de la SIC.

El generador marca estos pendientes en pantalla mientras sigan sin
resolverse.

Los valores nutricionales del sitio son estimaciones calculadas desde la
receta. No sustituyen un análisis de laboratorio.
