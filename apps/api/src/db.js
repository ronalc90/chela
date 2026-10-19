import pg from 'pg';

const { Pool } = pg;

let pool = null;

/** Railway inyecta DATABASE_URL al enlazar el servicio de Postgres. */
export function obtenerPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Falta DATABASE_URL. Enlaza el servicio de Postgres en Railway.');
  }

  pool = new Pool({
    connectionString,
    // Railway usa certificados gestionados; en red interna no hace falta TLS.
    // sslmode=disable en la URL lo apaga también (bases locales de prueba).
    ssl:
      connectionString.includes('railway.internal') || /sslmode=disable/.test(connectionString)
        ? false
        : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  pool.on('error', (err) => {
    console.error('[db] error inesperado en cliente inactivo', err);
  });

  return pool;
}

export async function consultar(sql, params = []) {
  const res = await obtenerPool().query(sql, params);
  return res.rows;
}

/**
 * Migracion idempotente: se ejecuta en cada arranque.
 * Para un proyecto de este tamano es mas confiable que un runner aparte.
 */
export async function migrar() {
  await consultar(`
    CREATE TABLE IF NOT EXISTS lotes (
      id               SERIAL PRIMARY KEY,
      codigo           TEXT NOT NULL UNIQUE,
      fecha_produccion DATE NOT NULL,
      tanda            INTEGER NOT NULL DEFAULT 1,
      gramos_mora      NUMERIC(10,2) NOT NULL,
      gramos_azucar    NUMERIC(10,2) NOT NULL,
      gramos_rendimiento NUMERIC(10,2) NOT NULL,
      vida_util_meses  INTEGER NOT NULL DEFAULT 18,
      frascos          INTEGER NOT NULL DEFAULT 0,
      ean              TEXT,
      notas            TEXT,
      creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await consultar(`CREATE INDEX IF NOT EXISTS idx_lotes_codigo ON lotes (codigo);`);
  await consultar(`CREATE INDEX IF NOT EXISTS idx_lotes_fecha ON lotes (fecha_produccion DESC);`);

  await consultar(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id          SERIAL PRIMARY KEY,
      nombre      TEXT NOT NULL,
      contacto    TEXT NOT NULL,
      cantidad    INTEGER NOT NULL DEFAULT 1,
      mensaje     TEXT,
      estado      TEXT NOT NULL DEFAULT 'nuevo',
      creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Etiquetas editables guardadas con nombre (plantilla completa en JSONB).
  await consultar(`
    CREATE TABLE IF NOT EXISTS etiquetas (
      id              SERIAL PRIMARY KEY,
      nombre          TEXT NOT NULL,
      datos           JSONB NOT NULL,
      creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
      actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await consultar(`CREATE UNIQUE INDEX IF NOT EXISTS idx_etiquetas_nombre ON etiquetas (lower(nombre));`);

  // Foto del producto. No se imprime en el rotulo: identifica el producto en
  // el catalogo. Va en la fila como data URL de JPEG porque son pocas y
  // pequenas, y asi no hace falta almacenamiento aparte. `miniatura` es la
  // version chica, la unica que viaja en los listados.
  await consultar(`ALTER TABLE etiquetas ADD COLUMN IF NOT EXISTS foto TEXT;`);
  await consultar(`ALTER TABLE etiquetas ADD COLUMN IF NOT EXISTS miniatura TEXT;`);

  console.log('[db] migraciones aplicadas');
}
