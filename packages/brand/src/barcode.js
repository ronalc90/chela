/**
 * EAN-13 — generacion, validacion y render SVG.
 *
 * IMPORTANTE SOBRE EL USO COMERCIAL
 * ---------------------------------
 * Un codigo EAN-13 valido *matematicamente* no es lo mismo que un codigo
 * *asignado*. Para vender en retail el prefijo de compania lo asigna GS1
 * (en Colombia, a traves de LOGYCA / GS1 Colombia). El prefijo de pais de
 * Colombia es 770.
 *
 * Mientras no tengas tu prefijo GS1, usa `PREFIJO_INTERNO` (200-299), que el
 * estandar reserva para circulacion interna y nunca colisiona con un producto
 * registrado de otra empresa. Sirve perfecto para control de inventario y
 * trazabilidad propia; NO sirve para supermercados.
 */

const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];

const PARIDAD = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

export const PREFIJO_PAIS_COLOMBIA = '770';
export const PREFIJO_INTERNO = '200';

/**
 * Calcula el digito verificador de un EAN-13 a partir de sus primeros 12 digitos.
 * Pesos alternados 1,3,1,3... desde la izquierda.
 */
export function digitoVerificador(doce) {
  const s = String(doce).replace(/\D/g, '');
  if (s.length !== 12) {
    throw new Error(`digitoVerificador espera 12 digitos, recibio ${s.length}`);
  }
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    suma += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (suma % 10)) % 10;
}

/** Devuelve true si la cadena es un EAN-13 completo y bien formado. */
export function esEanValido(codigo) {
  const s = String(codigo).replace(/\D/g, '');
  if (s.length !== 13) return false;
  return digitoVerificador(s.slice(0, 12)) === Number(s[12]);
}

/**
 * Construye un EAN-13 completo.
 * @param {string} prefijoEmpresa - prefijo GS1 asignado, o PREFIJO_INTERNO para uso propio.
 * @param {string|number} referencia - referencia de producto; se rellena con ceros.
 */
export function generarEan13(prefijoEmpresa, referencia) {
  const pref = String(prefijoEmpresa).replace(/\D/g, '');
  const ref = String(referencia).replace(/\D/g, '');
  if (pref.length < 3 || pref.length > 11) {
    throw new Error('El prefijo de empresa debe tener entre 3 y 11 digitos');
  }
  const libres = 12 - pref.length;
  if (ref.length > libres) {
    throw new Error(`La referencia no cabe: quedan ${libres} digitos con este prefijo`);
  }
  const base = pref + ref.padStart(libres, '0');
  return base + digitoVerificador(base);
}

/** Convierte un EAN-13 a su cadena de 95 modulos (1 = barra, 0 = espacio). */
export function modulosEan13(codigo) {
  const s = String(codigo).replace(/\D/g, '');
  if (!esEanValido(s)) throw new Error(`EAN-13 invalido: ${codigo}`);

  const primero = Number(s[0]);
  const patron = PARIDAD[primero];

  let mods = '101';
  for (let i = 0; i < 6; i++) {
    const d = Number(s[1 + i]);
    mods += patron[i] === 'L' ? L[d] : G[d];
  }
  mods += '01010';
  for (let i = 0; i < 6; i++) {
    mods += R[Number(s[7 + i])];
  }
  mods += '101';
  return mods;
}

/**
 * Renderiza el EAN-13 como SVG listo para imprimir.
 * Respeta las proporciones del estandar: barras de guarda mas largas y
 * zona muda (quiet zone) a ambos lados, sin la cual el lector falla.
 */
export function svgEan13(codigo, opciones = {}) {
  const {
    anchoModulo = 2,
    alto = 140,
    margen = 12,
    colorBarra = '#111111',
    colorFondo = '#ffffff',
    mostrarTexto = true,
    fuente = 'monospace',
  } = opciones;

  const s = String(codigo).replace(/\D/g, '');
  const mods = modulosEan13(s);

  const quietZone = 11 * anchoModulo;
  const altoTexto = mostrarTexto ? 22 : 0;
  const anchoTotal = quietZone * 2 + mods.length * anchoModulo;
  const altoTotal = alto + margen * 2 + altoTexto;

  const esGuarda = (i) =>
    (i >= 0 && i < 3) ||
    (i >= 45 && i < 50) ||
    (i >= 92 && i < 95);

  const altoNormal = alto;
  const altoGuarda = alto + (mostrarTexto ? 10 : 0);

  let barras = '';
  let i = 0;
  while (i < mods.length) {
    if (mods[i] === '1') {
      let ancho = 1;
      while (i + ancho < mods.length && mods[i + ancho] === '1' && esGuarda(i) === esGuarda(i + ancho)) {
        ancho++;
      }
      const h = esGuarda(i) ? altoGuarda : altoNormal;
      const x = quietZone + i * anchoModulo;
      barras += `<rect x="${x}" y="${margen}" width="${ancho * anchoModulo}" height="${h}" fill="${colorBarra}"/>`;
      i += ancho;
    } else {
      i++;
    }
  }

  let texto = '';
  if (mostrarTexto) {
    const yTexto = margen + altoGuarda + 16;
    const tam = Math.max(11, anchoModulo * 6);
    // Digito 1 fuera del simbolo, grupo izquierdo y grupo derecho centrados.
    texto += `<text x="${quietZone - 4}" y="${yTexto}" font-family="${fuente}" font-size="${tam}" text-anchor="end" fill="${colorBarra}">${s[0]}</text>`;
    texto += `<text x="${quietZone + 25.5 * anchoModulo}" y="${yTexto}" font-family="${fuente}" font-size="${tam}" text-anchor="middle" letter-spacing="${anchoModulo * 0.9}" fill="${colorBarra}">${s.slice(1, 7)}</text>`;
    texto += `<text x="${quietZone + 72.5 * anchoModulo}" y="${yTexto}" font-family="${fuente}" font-size="${tam}" text-anchor="middle" letter-spacing="${anchoModulo * 0.9}" fill="${colorBarra}">${s.slice(7)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${anchoTotal} ${altoTotal}" width="${anchoTotal}" height="${altoTotal}" role="img" aria-label="Codigo de barras EAN 13 ${s}">` +
    `<rect width="${anchoTotal}" height="${altoTotal}" fill="${colorFondo}"/>` +
    barras + texto +
    `</svg>`;
}
