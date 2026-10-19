/**
 * Cliente de /api/etiquetas.
 *
 * Primero intenta el puente del propio sitio (/api/etiquetas), que añade la
 * clave en el servidor: así no hay que teclear nada. Si ese puente avisa de
 * que el servidor no tiene la clave, se pasa a hablar directo con la API y
 * entonces sí hace falta escribirla; queda guardada en el navegador.
 */

export const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const PUENTE = '/api/etiquetas';

let modo = 'puente'; // puente | directo

/** ¿Hay que pedirle la clave a la persona? Solo en modo directo. */
export const necesitaClave = () => modo === 'directo';

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

async function llamar(url, { metodo, cuerpo, clave }) {
  let res;
  try {
    res = await fetch(url, {
      method: metodo,
      headers: {
        ...(clave !== undefined ? { 'X-Clave': clave || '' } : {}),
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', 0);
  }
  if (res.status === 204) return { estado: 204, json: null };
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { estado: res.status, json };
}

function resultado({ estado, json }) {
  if (estado >= 400) throw new ErrorApi(json?.error || `Error ${estado}`, estado);
  return json;
}

async function pedir(ruta, { clave, metodo = 'GET', cuerpo } = {}) {
  if (modo === 'puente') {
    const r = await llamar(`${PUENTE}${ruta}`, { metodo, cuerpo });
    // 503 + necesitaClave es la única respuesta que nos hace cambiar de modo.
    if (!(r.estado === 503 && r.json?.necesitaClave)) return resultado(r);
    modo = 'directo';
  }

  if (!API) {
    throw new ErrorApi('El servicio de etiquetas no está conectado (falta NEXT_PUBLIC_API_URL).', 0);
  }
  if (!clave) {
    throw new ErrorApi('Escribe la clave para ver las etiquetas guardadas.', 401);
  }
  return resultado(await llamar(`${API}/api/etiquetas${ruta}`, { metodo, cuerpo, clave }));
}

export const listarEtiquetas = (clave) => pedir('', { clave }).then((j) => j.etiquetas);
export const leerEtiqueta = (clave, id) => pedir(`/${id}`, { clave }).then((j) => j.etiqueta);
export const crearEtiqueta = (clave, cuerpo) => pedir('', { clave, metodo: 'POST', cuerpo }).then((j) => j.etiqueta);
export const actualizarEtiqueta = (clave, id, cuerpo) =>
  pedir(`/${id}`, { clave, metodo: 'PUT', cuerpo }).then((j) => j.etiqueta);
export const borrarEtiqueta = (clave, id) => pedir(`/${id}`, { clave, metodo: 'DELETE' });
