/**
 * Etiquetas guardadas con nombre.
 *
 * Cada fila es una plantilla completa del rótulo (ver
 * @chela/brand/plantilla). Todas las rutas exigen la clave de
 * ETIQUETAS_CLAVE en el encabezado X-Clave: sin ella nadie puede leer,
 * crear, cambiar ni borrar etiquetas. Si la variable no está configurada,
 * las rutas responden 503 en vez de quedar abiertas.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { normalizarPlantilla, resumenPlantilla, LIMITES } from '@chela/brand/plantilla';
import { consultar } from './db.js';

const MAX_CUERPO = 64 * 1024;
const VENTANA_MS = 10 * 60 * 1000;
const MAX_FALLOS = 12;

/** Intentos fallidos por IP, para frenar a quien pruebe claves al azar. */
const fallos = new Map();

function huella(texto) {
  return createHash('sha256').update(String(texto)).digest();
}

function claveCorrecta(recibida) {
  const esperada = process.env.ETIQUETAS_CLAVE;
  if (!esperada || !recibida) return false;
  return timingSafeEqual(huella(recibida), huella(esperada));
}

function bloqueada(ip) {
  const r = fallos.get(ip);
  if (!r) return false;
  if (Date.now() - r.desde > VENTANA_MS) {
    fallos.delete(ip);
    return false;
  }
  return r.n >= MAX_FALLOS;
}

function anotarFallo(ip) {
  const r = fallos.get(ip);
  if (!r || Date.now() - r.desde > VENTANA_MS) fallos.set(ip, { n: 1, desde: Date.now() });
  else r.n += 1;
}

function filaAEtiqueta(fila, { conDatos = true } = {}) {
  const base = {
    id: Number(fila.id),
    nombre: fila.nombre,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
    resumen: resumenPlantilla(fila.datos),
  };
  return conDatos ? { ...base, datos: normalizarPlantilla(fila.datos) } : base;
}

function leerCuerpo(req, reply) {
  const b = req.body;
  if (!b || typeof b !== 'object') {
    reply.code(400).send({ error: 'Falta el cuerpo de la petición.' });
    return null;
  }
  const nombre = String(b.nombre ?? '').trim().slice(0, LIMITES.nombre);
  if (nombre.length < 1) {
    reply.code(400).send({ error: 'Ponle un nombre a la etiqueta.' });
    return null;
  }
  if (!b.datos || typeof b.datos !== 'object') {
    reply.code(400).send({ error: 'Faltan los datos de la etiqueta.' });
    return null;
  }
  // Se guarda siempre normalizada: lo que entra ya cumple los límites.
  return { nombre, datos: normalizarPlantilla(b.datos) };
}

function idValido(req, reply) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    reply.code(400).send({ error: 'Identificador inválido.' });
    return null;
  }
  return id;
}

function conflictoNombre(e, reply, nombre) {
  if (e.code === '23505') {
    reply.code(409).send({ error: `Ya existe una etiqueta llamada «${nombre}». Usa otro nombre.` });
    return true;
  }
  return false;
}

export default async function rutasEtiquetas(app) {
  // Guardia de acceso para todo el prefijo.
  app.addHook('onRequest', async (req, reply) => {
    if (req.method === 'OPTIONS') return;
    if (!process.env.ETIQUETAS_CLAVE) {
      return reply.code(503).send({ error: 'El guardado de etiquetas no está configurado en el servidor (falta ETIQUETAS_CLAVE).' });
    }
    if (bloqueada(req.ip)) {
      return reply.code(429).send({ error: 'Demasiados intentos con clave incorrecta. Espera unos minutos.' });
    }
    if (!claveCorrecta(req.headers['x-clave'])) {
      anotarFallo(req.ip);
      return reply.code(401).send({ error: 'Clave incorrecta.' });
    }
  });

  app.get('/', async () => {
    const filas = await consultar(
      `SELECT id, nombre, datos, creado_en, actualizado_en
         FROM etiquetas ORDER BY actualizado_en DESC LIMIT 500`,
    );
    return { etiquetas: filas.map((f) => filaAEtiqueta(f, { conDatos: false })) };
  });

  app.get('/:id', async (req, reply) => {
    const id = idValido(req, reply);
    if (id === null) return reply;
    const filas = await consultar(`SELECT * FROM etiquetas WHERE id = $1`, [id]);
    if (!filas.length) return reply.code(404).send({ error: 'Esa etiqueta no existe.' });
    return { etiqueta: filaAEtiqueta(filas[0]) };
  });

  app.post('/', { bodyLimit: MAX_CUERPO }, async (req, reply) => {
    const cuerpo = leerCuerpo(req, reply);
    if (!cuerpo) return reply;
    try {
      const filas = await consultar(
        `INSERT INTO etiquetas (nombre, datos) VALUES ($1, $2) RETURNING *`,
        [cuerpo.nombre, cuerpo.datos],
      );
      return reply.code(201).send({ etiqueta: filaAEtiqueta(filas[0]) });
    } catch (e) {
      if (conflictoNombre(e, reply, cuerpo.nombre)) return reply;
      throw e;
    }
  });

  app.put('/:id', { bodyLimit: MAX_CUERPO }, async (req, reply) => {
    const id = idValido(req, reply);
    if (id === null) return reply;
    const cuerpo = leerCuerpo(req, reply);
    if (!cuerpo) return reply;
    try {
      const filas = await consultar(
        `UPDATE etiquetas SET nombre = $2, datos = $3, actualizado_en = now()
          WHERE id = $1 RETURNING *`,
        [id, cuerpo.nombre, cuerpo.datos],
      );
      if (!filas.length) return reply.code(404).send({ error: 'Esa etiqueta no existe.' });
      return { etiqueta: filaAEtiqueta(filas[0]) };
    } catch (e) {
      if (conflictoNombre(e, reply, cuerpo.nombre)) return reply;
      throw e;
    }
  });

  app.delete('/:id', async (req, reply) => {
    const id = idValido(req, reply);
    if (id === null) return reply;
    const filas = await consultar(`DELETE FROM etiquetas WHERE id = $1 RETURNING id`, [id]);
    if (!filas.length) return reply.code(404).send({ error: 'Esa etiqueta no existe.' });
    return reply.code(204).send();
  });
}
