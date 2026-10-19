/**
 * Preparación de la foto del producto, en el navegador.
 *
 * La foto se guarda en la fila del producto, así que tiene que llegar
 * liviana: lo que salga de una cámara de teléfono pesa varios megas y no
 * tiene sentido guardar eso para enseñarlo a 300 px. Aquí se reduce y se
 * recomprime a JPEG antes de enviarla, y se saca además una miniatura, que
 * es la única que viaja en el listado.
 *
 * Todo ocurre en el equipo de la persona: la foto original nunca se sube.
 */

export const MAX_FOTO = 900 * 1024;
export const MAX_MINIATURA = 80 * 1024;

const LADO_FOTO = 1100;
const LADO_MINIATURA = 260;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

export class ErrorImagen extends Error {}

function medidas(ancho, alto, lado) {
  const factor = Math.min(1, lado / Math.max(ancho, alto));
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}

/** Dibuja el mapa de bits en un lienzo del tamaño pedido y lo saca en JPEG. */
function aJpeg(bitmap, lado, calidad) {
  const { ancho, alto } = medidas(bitmap.width, bitmap.height, lado);
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  // Fondo blanco: un PNG con transparencia se vería negro en JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  return lienzo.toDataURL('image/jpeg', calidad);
}

async function leerBitmap(archivo) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(archivo);
    } catch {}
  }
  // Safari viejo: se pasa por <img> y una URL temporal.
  const url = URL.createObjectURL(archivo);
  try {
    return await new Promise((listo, falla) => {
      const img = new Image();
      img.onload = () => listo(img);
      img.onerror = () => falla(new ErrorImagen('No se pudo abrir la imagen.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Devuelve { foto, miniatura } como data URLs de JPEG, ya dentro de los
 * límites que acepta el servidor. Si con la primera calidad no cabe, baja
 * la calidad antes que rendirse: vale más una foto algo más blanda que un
 * error en la cara.
 */
export async function prepararFoto(archivo) {
  if (!archivo) throw new ErrorImagen('No llegó ninguna imagen.');
  if (!TIPOS.includes(archivo.type)) {
    throw new ErrorImagen('Formato no admitido. Usa JPG, PNG o WebP.');
  }
  if (archivo.size > 25 * 1024 * 1024) {
    throw new ErrorImagen('Esa imagen pesa demasiado (más de 25 MB).');
  }

  const bitmap = await leerBitmap(archivo);

  let foto = '';
  for (const calidad of [0.82, 0.72, 0.62, 0.5]) {
    foto = aJpeg(bitmap, LADO_FOTO, calidad);
    if (foto.length <= MAX_FOTO) break;
  }
  if (foto.length > MAX_FOTO) {
    foto = aJpeg(bitmap, 800, 0.5);
  }
  if (foto.length > MAX_FOTO) {
    throw new ErrorImagen('No se pudo reducir lo suficiente esa imagen. Prueba con otra.');
  }

  let miniatura = aJpeg(bitmap, LADO_MINIATURA, 0.7);
  if (miniatura.length > MAX_MINIATURA) miniatura = aJpeg(bitmap, 200, 0.6);

  if (typeof bitmap.close === 'function') bitmap.close();
  return { foto, miniatura };
}
