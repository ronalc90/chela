/**
 * Puente hacia /api/etiquetas de la API.
 *
 * Existe para que la clave no tenga que teclearse en cada navegador: si el
 * servidor tiene ETIQUETAS_CLAVE, este puente la añade al reenviar y el
 * navegador nunca la ve. La clave se queda en el servidor; lo que viaja al
 * cliente es solo el resultado.
 *
 * Sin ETIQUETAS_CLAVE en el servidor, responde 503 con `necesitaClave` y el
 * cliente vuelve a hablar directo con la API pidiendo la clave, como antes.
 * Así el puente es algo que se enciende a propósito, no por descuido.
 *
 * Ojo: con el puente encendido, cualquiera que abra esta web puede ver,
 * cambiar y borrar las etiquetas guardadas, porque la autorización la pone
 * el servidor. Es una decisión deliberada para un sitio de uso personal.
 */

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const CLAVE = process.env.ETIQUETAS_CLAVE || '';
const MAX_CUERPO = 64 * 1024;

export const dynamic = 'force-dynamic';

function problema(mensaje, estado, extra) {
  return Response.json({ error: mensaje, ...extra }, { status: estado });
}

async function reenviar(peticion, contexto) {
  if (!CLAVE) {
    return problema(
      'Este servidor no guarda la clave de etiquetas; hay que escribirla aquí.',
      503,
      { necesitaClave: true },
    );
  }
  if (!API) {
    return problema('Falta NEXT_PUBLIC_API_URL: no sé a qué API hablarle.', 503);
  }

  const { ruta } = await contexto.params;
  const cola = Array.isArray(ruta) && ruta.length ? `/${ruta.map(encodeURIComponent).join('/')}` : '';

  let cuerpo;
  if (peticion.method === 'POST' || peticion.method === 'PUT') {
    cuerpo = await peticion.text();
    if (cuerpo.length > MAX_CUERPO) return problema('La etiqueta es demasiado grande.', 413);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API}/api/etiquetas${cola}`, {
      method: peticion.method,
      headers: {
        'X-Clave': CLAVE,
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: cuerpo,
      cache: 'no-store',
    });
  } catch {
    return problema('No se pudo hablar con el servidor de etiquetas.', 502);
  }

  if (respuesta.status === 204) return new Response(null, { status: 204 });

  const texto = await respuesta.text();
  return new Response(texto, {
    status: respuesta.status,
    headers: {
      'Content-Type': respuesta.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export const GET = reenviar;
export const POST = reenviar;
export const PUT = reenviar;
export const DELETE = reenviar;
