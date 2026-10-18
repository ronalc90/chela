/**
 * Lotes, fechas y trazabilidad.
 *
 * La Resolucion 5109 de 2005 exige que el rotulo identifique el lote y
 * declare la fecha de vencimiento o de duracion minima. Este modulo produce
 * ambos de forma determinista para que el codigo impreso en el frasco
 * siempre pueda devolverse a un registro de produccion.
 */

/** Vida util por defecto de una mermelada de alto contenido de azucar, sin abrir. */
export const VIDA_UTIL_MESES = 18;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function dosDigitos(n) {
  return String(n).padStart(2, '0');
}

/** Normaliza cualquier entrada a un Date en UTC a medianoche. */
function aFecha(valor) {
  if (valor instanceof Date) {
    return new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate()));
  }
  const s = String(valor);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) throw new Error(`Fecha no reconocida: ${valor}. Usa formato YYYY-MM-DD.`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Formato ISO corto YYYY-MM-DD, estable en cualquier zona horaria. */
export function aIso(valor) {
  const d = aFecha(valor);
  return `${d.getUTCFullYear()}-${dosDigitos(d.getUTCMonth() + 1)}-${dosDigitos(d.getUTCDate())}`;
}

/** Formato legible para imprimir en la etiqueta: "18 de octubre de 2026". */
export function fechaLegible(valor) {
  const d = aFecha(valor);
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** Formato compacto DD/MM/AAAA, el que mas se usa en rotulado en Colombia. */
export function fechaCompacta(valor) {
  const d = aFecha(valor);
  return `${dosDigitos(d.getUTCDate())}/${dosDigitos(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/**
 * Codigo de lote: L + AAMMDD de produccion + secuencial de tanda del dia.
 * Ejemplo: L261018-01
 * Es corto, se puede escribir a mano en el sticker y es ordenable.
 */
export function generarLote(fechaProduccion, tandaDelDia = 1) {
  const d = aFecha(fechaProduccion);
  const aa = String(d.getUTCFullYear()).slice(-2);
  const mm = dosDigitos(d.getUTCMonth() + 1);
  const dd = dosDigitos(d.getUTCDate());
  return `L${aa}${mm}${dd}-${dosDigitos(tandaDelDia)}`;
}

/** Lee un codigo de lote y devuelve la fecha de produccion y el numero de tanda. */
export function parsearLote(codigo) {
  const m = String(codigo).trim().toUpperCase().match(/^L(\d{2})(\d{2})(\d{2})-(\d{2})$/);
  if (!m) return null;
  const anio = 2000 + Number(m[1]);
  const fechaProduccion = `${anio}-${m[2]}-${m[3]}`;
  // Validamos que la fecha exista de verdad (rechaza L260230-01).
  const d = aFecha(fechaProduccion);
  if (d.getUTCMonth() + 1 !== Number(m[2]) || d.getUTCDate() !== Number(m[3])) return null;
  return { codigo: String(codigo).trim().toUpperCase(), fechaProduccion, tanda: Number(m[4]) };
}

/** Suma meses respetando fin de mes (31 de enero + 1 mes = 28/29 de febrero). */
export function sumarMeses(valor, meses) {
  const d = aFecha(valor);
  const dia = d.getUTCDate();
  const destino = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + meses, 1));
  const ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(dia, ultimoDia));
  return destino;
}

/** Fecha de vencimiento a partir de la produccion. */
export function calcularVencimiento(fechaProduccion, meses = VIDA_UTIL_MESES) {
  return aIso(sumarMeses(fechaProduccion, meses));
}

/** Dias que faltan para el vencimiento respecto de una fecha de referencia. */
export function diasParaVencer(fechaVencimiento, hoy = new Date()) {
  const v = aFecha(fechaVencimiento).getTime();
  const h = aFecha(hoy).getTime();
  return Math.round((v - h) / 86400000);
}

/**
 * Arma el bloque completo de identificacion que va impreso en el frasco.
 */
export function datosDeLote({ fechaProduccion, tanda = 1, vidaUtilMeses = VIDA_UTIL_MESES }) {
  const produccion = aIso(fechaProduccion);
  const vencimiento = calcularVencimiento(produccion, vidaUtilMeses);
  return {
    lote: generarLote(produccion, tanda),
    tanda,
    fechaProduccion: produccion,
    fechaProduccionCompacta: fechaCompacta(produccion),
    fechaVencimiento: vencimiento,
    fechaVencimientoCompacta: fechaCompacta(vencimiento),
    fechaVencimientoLegible: fechaLegible(vencimiento),
    vidaUtilMeses,
  };
}
