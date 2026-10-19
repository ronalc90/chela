import Fastify from 'fastify';
import cors from '@fastify/cors';

import { construirEtiqueta, validarEtiqueta } from '@chela/brand/etiqueta';
import { svgEan13, esEanValido } from '@chela/brand/barcode';
import { generarLote, parsearLote, aIso } from '@chela/brand/lote';
import { perfilNutricional, evaluarSellos, svgSello } from '@chela/brand/nutricional';

import { consultar, migrar } from './db.js';
import rutasEtiquetas from './etiquetas.js';

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL || 'info' },
  trustProxy: true,
});

await app.register(cors, {
  origin: (origin, cb) => {
    // Sin Origin (curl, health checks de Railway) se permite.
    if (!origin) return cb(null, true);
    const permitidos = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (permitidos.length === 0) return cb(null, true);
    if (permitidos.includes(origin) || permitidos.some((p) => p.startsWith('*.') && origin.endsWith(p.slice(1)))) {
      return cb(null, true);
    }
    // Previews de Vercel del proyecto.
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error('Origen no permitido'), false);
  },
});

/** Convierte una fila de Postgres en el objeto de dominio. */
function filaALote(fila) {
  return {
    codigo: fila.codigo,
    fechaProduccion: aIso(fila.fecha_produccion),
    tanda: Number(fila.tanda),
    gramosMora: Number(fila.gramos_mora),
    gramosAzucar: Number(fila.gramos_azucar),
    gramosRendimiento: Number(fila.gramos_rendimiento),
    vidaUtilMeses: Number(fila.vida_util_meses),
    frascos: Number(fila.frascos),
    ean: fila.ean || undefined,
    notas: fila.notas || undefined,
    creadoEn: fila.creado_en,
  };
}

function etiquetaDeLote(lote) {
  return construirEtiqueta({
    fechaProduccion: lote.fechaProduccion,
    tanda: lote.tanda,
    gramosMora: lote.gramosMora,
    gramosAzucar: lote.gramosAzucar,
    gramosRendimiento: lote.gramosRendimiento,
    vidaUtilMeses: lote.vidaUtilMeses,
    ean: lote.ean,
  });
}

// ---------------------------------------------------------------- salud

app.get('/health', async () => ({ ok: true, servicio: 'chela-api', hora: new Date().toISOString() }));

app.get('/', async () => ({
  servicio: 'chela-api',
  descripcion: 'Trazabilidad de lotes y generación de etiquetas — Doña Chela',
  endpoints: [
    'GET  /health',
    'GET  /api/lotes',
    'POST /api/lotes',
    'GET  /api/lotes/:codigo',
    'GET  /api/lotes/:codigo/etiqueta',
    'GET  /api/lotes/:codigo/barcode.svg',
    'GET  /api/sello.svg',
    'POST /api/calcular',
    'POST /api/pedidos',
    'GET  /api/etiquetas            (X-Clave)',
    'POST /api/etiquetas            (X-Clave)',
    'GET  /api/etiquetas/:id        (X-Clave)',
    'PUT  /api/etiquetas/:id        (X-Clave)',
    'DELETE /api/etiquetas/:id      (X-Clave)',
  ],
}));

// ---------------------------------------------------------------- lotes

app.get('/api/lotes', async (req) => {
  const limite = Math.min(Number(req.query?.limite) || 50, 200);
  const filas = await consultar(
    `SELECT * FROM lotes ORDER BY fecha_produccion DESC, tanda DESC LIMIT $1`,
    [limite],
  );
  return { lotes: filas.map(filaALote) };
});

app.post('/api/lotes', async (req, reply) => {
  const b = req.body || {};
  const fechaProduccion = b.fechaProduccion || aIso(new Date());
  const tanda = Number(b.tanda) || 1;

  const gramosMora = Number(b.gramosMora);
  const gramosAzucar = Number(b.gramosAzucar);
  const gramosRendimiento = Number(b.gramosRendimiento);

  // Validamos con la misma logica que usa la web, antes de tocar la base.
  try {
    perfilNutricional({ gramosMora, gramosAzucar, gramosRendimiento });
  } catch (e) {
    return reply.code(400).send({ error: e.message });
  }

  if (b.ean && !esEanValido(b.ean)) {
    return reply.code(400).send({ error: `EAN-13 inválido: ${b.ean}` });
  }

  const codigo = generarLote(fechaProduccion, tanda);

  try {
    const filas = await consultar(
      `INSERT INTO lotes (codigo, fecha_produccion, tanda, gramos_mora, gramos_azucar,
                          gramos_rendimiento, vida_util_meses, frascos, ean, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        codigo,
        fechaProduccion,
        tanda,
        gramosMora,
        gramosAzucar,
        gramosRendimiento,
        Number(b.vidaUtilMeses) || 18,
        Number(b.frascos) || 0,
        b.ean || null,
        b.notas || null,
      ],
    );
    const lote = filaALote(filas[0]);
    return reply.code(201).send({ lote, etiqueta: etiquetaDeLote(lote) });
  } catch (e) {
    if (e.code === '23505') {
      return reply.code(409).send({ error: `El lote ${codigo} ya existe. Usa otro número de tanda.` });
    }
    throw e;
  }
});

app.get('/api/lotes/:codigo', async (req, reply) => {
  const codigo = String(req.params.codigo).toUpperCase();
  if (!parsearLote(codigo)) {
    return reply.code(400).send({ error: 'Formato de lote inválido. Se espera LAAMMDD-NN.' });
  }
  const filas = await consultar(`SELECT * FROM lotes WHERE codigo = $1`, [codigo]);
  if (filas.length === 0) {
    return reply.code(404).send({ error: `No existe el lote ${codigo}.` });
  }
  const lote = filaALote(filas[0]);
  return { lote, etiqueta: etiquetaDeLote(lote) };
});

app.get('/api/lotes/:codigo/etiqueta', async (req, reply) => {
  const codigo = String(req.params.codigo).toUpperCase();
  const filas = await consultar(`SELECT * FROM lotes WHERE codigo = $1`, [codigo]);
  if (filas.length === 0) return reply.code(404).send({ error: `No existe el lote ${codigo}.` });
  const etiqueta = etiquetaDeLote(filaALote(filas[0]));
  return { etiqueta, problemas: validarEtiqueta(etiqueta) };
});

app.get('/api/lotes/:codigo/barcode.svg', async (req, reply) => {
  const codigo = String(req.params.codigo).toUpperCase();
  const filas = await consultar(`SELECT * FROM lotes WHERE codigo = $1`, [codigo]);
  if (filas.length === 0) return reply.code(404).send({ error: `No existe el lote ${codigo}.` });
  const etiqueta = etiquetaDeLote(filaALote(filas[0]));
  reply.header('Content-Type', 'image/svg+xml; charset=utf-8');
  reply.header('Cache-Control', 'public, max-age=86400');
  return svgEan13(etiqueta.reverso.ean);
});

// ------------------------------------------------------------- utilidades

app.get('/api/sello.svg', async (req, reply) => {
  const texto = req.query?.texto || 'EXCESO EN AZÚCARES';
  reply.header('Content-Type', 'image/svg+xml; charset=utf-8');
  reply.header('Cache-Control', 'public, max-age=86400');
  return svgSello(String(texto));
});

/** Calculadora sin persistencia: la usa la web en vivo. */
app.post('/api/calcular', async (req, reply) => {
  try {
    const { gramosMora, gramosAzucar, gramosRendimiento } = req.body || {};
    const perfil = perfilNutricional({
      gramosMora: Number(gramosMora),
      gramosAzucar: Number(gramosAzucar),
      gramosRendimiento: Number(gramosRendimiento),
    });
    return { perfil, ...evaluarSellos(perfil) };
  } catch (e) {
    return reply.code(400).send({ error: e.message });
  }
});

// ------------------------------------------------------------- etiquetas

await app.register(rutasEtiquetas, { prefix: '/api/etiquetas' });

// -------------------------------------------------------------- pedidos

app.post('/api/pedidos', async (req, reply) => {
  const b = req.body || {};
  const nombre = String(b.nombre || '').trim();
  const contacto = String(b.contacto || '').trim();
  if (nombre.length < 2) return reply.code(400).send({ error: 'Falta el nombre.' });
  if (contacto.length < 5) return reply.code(400).send({ error: 'Falta un contacto válido.' });

  const filas = await consultar(
    `INSERT INTO pedidos (nombre, contacto, cantidad, mensaje)
     VALUES ($1,$2,$3,$4) RETURNING id, creado_en`,
    [nombre.slice(0, 120), contacto.slice(0, 160), Math.max(1, Number(b.cantidad) || 1), String(b.mensaje || '').slice(0, 800)],
  );
  return reply.code(201).send({ ok: true, id: filas[0].id });
});

// --------------------------------------------------------------- arranque

const puerto = Number(process.env.PORT) || 8080;

try {
  if (process.env.DATABASE_URL) {
    await migrar();
  } else {
    app.log.warn('Sin DATABASE_URL: el servicio arranca pero los endpoints de datos fallarán.');
  }
  await app.listen({ port: puerto, host: '0.0.0.0' });
  app.log.info(`chela-api escuchando en :${puerto}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
