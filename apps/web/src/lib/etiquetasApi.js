/**
 * Cliente de /api/etiquetas. Todas las llamadas llevan la clave en el
 * encabezado X-Clave; la API responde 401 si no coincide.
 */

export const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

async function pedir(ruta, { clave, metodo = 'GET', cuerpo } = {}) {
  if (!API) throw new ErrorApi('El servicio de etiquetas no está conectado (falta NEXT_PUBLIC_API_URL).', 0);
  let res;
  try {
    res = await fetch(`${API}/api/etiquetas${ruta}`, {
      method: metodo,
      headers: {
        'X-Clave': clave || '',
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', 0);
  }
  if (res.status === 204) return null;
  let json = null;
  try {
    json = await res.json();
  } catch {}
  if (!res.ok) throw new ErrorApi(json?.error || `Error ${res.status}`, res.status);
  return json;
}

export const listarEtiquetas = (clave) => pedir('', { clave }).then((j) => j.etiquetas);
export const leerEtiqueta = (clave, id) => pedir(`/${id}`, { clave }).then((j) => j.etiqueta);
export const crearEtiqueta = (clave, cuerpo) => pedir('', { clave, metodo: 'POST', cuerpo }).then((j) => j.etiqueta);
export const actualizarEtiqueta = (clave, id, cuerpo) =>
  pedir(`/${id}`, { clave, metodo: 'PUT', cuerpo }).then((j) => j.etiqueta);
export const borrarEtiqueta = (clave, id) => pedir(`/${id}`, { clave, metodo: 'DELETE' });
