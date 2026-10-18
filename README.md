# GaRo — Mermelada de mora casera

Sitio web, trazabilidad de lotes y generación de etiquetas para la mermelada
de mora elaborada por **Mujeres Usmeñas** en Usme, Bogotá D.C.

El proyecto digitaliza una etiqueta que originalmente se dibujó a mano sobre
papel cuadriculado: conserva los mismos datos, pero ahora el código de barras
es un EAN-13 con dígito verificador real, el lote se genera solo y la fecha de
vencimiento se calcula desde la fecha de producción.

**Dominio:** saborpuro.lat

## Estructura

```
apps/web        Next.js 15 — sitio público          → Vercel
apps/api        Fastify + PostgreSQL — trazabilidad → Railway
packages/brand  Lógica compartida y tokens de marca
```

`packages/brand` es el corazón del proyecto. Contiene:

| Módulo | Qué hace |
|---|---|
| `tokens.js` | Identidad de marca y datos legales. **Archivo único de configuración.** |
| `barcode.js` | EAN-13: generación, validación, dígito verificador y render SVG. |
| `lote.js` | Códigos de lote, fechas de producción y vencimiento. |
| `nutricional.js` | Perfil nutricional desde la receta y evaluación de sellos frontales. |
| `etiqueta.js` | Arma la etiqueta completa y valida campos obligatorios. |

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

**apps/api**

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Postgres. Railway la inyecta al enlazar el servicio. |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma. Los `*.vercel.app` se permiten siempre. |
| `PORT` | Lo asigna Railway. |

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
   `200`, válido para control propio. Un GTIN comercial lo asigna GS1 Colombia
   (LOGYCA); el prefijo de país es `770`.

## Pendientes antes de imprimir

- [ ] **NIT** de la organización.
- [ ] **Teléfono:** el tablero dice `311 583 9051`; la etiqueta a mano,
      `321 383 8226`. Definir cuál va.
- [ ] **Registro sanitario:** el tablero dice `NSA-8520-951`; la etiqueta a
      mano, `RSA 11783305`. Definir cuál es el vigente.
- [ ] **Análisis bromatológico** de laboratorio para la tabla nutricional real.
- [ ] **Prefijo GS1** si el producto va a supermercados.
- [ ] **Verificación del nombre** en la base de signos distintivos de la SIC.

Los valores nutricionales del sitio son estimaciones calculadas desde la
receta. No sustituyen un análisis de laboratorio.
