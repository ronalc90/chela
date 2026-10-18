/**
 * Modelo de datos de la etiqueta.
 *
 * Reune marca + receta + lote + codigo de barras en la estructura exacta
 * que exige el rotulado de alimentos envasados en Colombia, siguiendo la
 * etiqueta de referencia hecha a mano y el tablero de la Resolucion 5109.
 *
 * Base normativa: Resolucion 5109 de 2005 (rotulado general, art. 4
 * modificado por la Resolucion 557 de 2022) y Resolucion 810 de 2021
 * modificada por la 2492 de 2022 y corregida por la 254 de 2023
 * (tabla nutricional y sellos frontales).
 */

import { marca as marcaPorDefecto, producto as productoPorDefecto, listaIngredientes } from './tokens.js';
import { datosDeLote, VIDA_UTIL_MESES } from './lote.js';
import { generarEan13, esEanValido } from './barcode.js';
import { perfilNutricional, evaluarSellos } from './nutricional.js';

/**
 * Construye la etiqueta completa de una tanda concreta.
 *
 * @param {object} opciones
 * @param {string} opciones.fechaProduccion - YYYY-MM-DD
 * @param {number} [opciones.tanda=1]
 * @param {number} opciones.gramosMora
 * @param {number} opciones.gramosAzucar
 * @param {number} [opciones.gramosLimon=0]
 * @param {number} opciones.gramosRendimiento
 */
export function construirEtiqueta({
  fechaProduccion,
  tanda = 1,
  gramosMora,
  gramosAzucar,
  gramosLimon = 0,
  gramosRendimiento,
  vidaUtilMeses = VIDA_UTIL_MESES,
  marca = marcaPorDefecto,
  producto = productoPorDefecto,
  ean,
}) {
  const lote = datosDeLote({ fechaProduccion, tanda, vidaUtilMeses });
  const perfil = perfilNutricional({ gramosMora, gramosAzucar, gramosLimon, gramosRendimiento });
  const { sellos, permiteDeclaracionesNutricionales } = evaluarSellos(perfil);

  const codigoEan = ean && esEanValido(ean)
    ? ean
    : generarEan13(producto.prefijoEan, producto.referenciaEan);

  // Porcion de referencia: una cucharada rasa.
  const porcion = 20;
  const factorPorcion = porcion / 100;

  const porPorcion = {};
  for (const [k, v] of Object.entries(perfil.por100g)) {
    porPorcion[k] = Math.round(v * factorPorcion * 10) / 10;
  }
  porPorcion.energiaKcal = Math.round(perfil.por100g.energiaKcal * factorPorcion);
  porPorcion.energiaKj = Math.round(perfil.por100g.energiaKj * factorPorcion);

  return {
    frente: {
      marca: marca.nombre,
      descriptor: marca.descriptor,
      denominacion: producto.denominacion,
      calificativo: producto.calificativo,
      contenidoNeto: `${producto.contenidoNetoGramos} g`,
      pesoNetoGramos: producto.contenidoNetoGramos,
      sellos,
    },
    reverso: {
      ingredientes: producto.ingredientes,
      listaIngredientes: listaIngredientes(producto),
      conservacion: producto.conservacion,
      modoDeUso: producto.modoDeUso,
      lote: lote.lote,
      fechaProduccion: lote.fechaProduccionCompacta,
      fechaVencimiento: lote.fechaVencimientoCompacta,
      fabricante: marca.razonSocial,
      nit: marca.nit,
      direccion: [marca.direccion, marca.localidad, marca.ciudad, marca.pais].filter(Boolean).join(', '),
      telefono: marca.contacto?.telefono,
      origen: `Producto colombiano. Hecho en ${marca.pais}.`,
      registroSanitario: marca.registroSanitario,
      ean: codigoEan,
    },
    tablaNutricional: {
      porcionGramos: porcion,
      porcionDescripcion: `1 cucharada (${porcion} g)`,
      porcionesPorEnvase: Math.round(producto.contenidoNetoGramos / porcion),
      por100g: perfil.por100g,
      porPorcion,
    },
    analisis: {
      porcentajeFruta: perfil.porcentajeFruta,
      brixAproximado: perfil.brixAproximado,
      porcentajeEnergiaAzucares: perfil.porcentajeEnergiaAzucares,
      permiteDeclaracionesNutricionales,
      evaporado: perfil.receta.evaporado,
    },
    lote,
    receta: perfil.receta,
    advertencia:
      'Valores nutricionales estimados a partir de la receta. La tabla que se imprime y se radica ante el INVIMA debe provenir de un análisis bromatológico de laboratorio.',
  };
}

/** Campos obligatorios del rotulo, para verificar que ninguno quedo vacio. */
export const CAMPOS_OBLIGATORIOS = [
  { campo: 'denominacion', etiqueta: 'Nombre del alimento', donde: 'frente' },
  { campo: 'contenidoNeto', etiqueta: 'Contenido neto', donde: 'frente' },
  { campo: 'listaIngredientes', etiqueta: 'Lista de ingredientes', donde: 'reverso' },
  { campo: 'fabricante', etiqueta: 'Nombre y razón social del fabricante', donde: 'reverso' },
  { campo: 'direccion', etiqueta: 'Dirección del fabricante', donde: 'reverso' },
  { campo: 'nit', etiqueta: 'NIT', donde: 'reverso' },
  { campo: 'origen', etiqueta: 'País de origen', donde: 'reverso' },
  { campo: 'lote', etiqueta: 'Identificación del lote', donde: 'reverso' },
  { campo: 'fechaVencimiento', etiqueta: 'Fecha de vencimiento', donde: 'reverso' },
  { campo: 'conservacion', etiqueta: 'Instrucciones de conservación', donde: 'reverso' },
  { campo: 'registroSanitario', etiqueta: 'Registro / notificación sanitaria', donde: 'reverso' },
];

/**
 * Revisa que la etiqueta no lleve campos pendientes a imprenta.
 * Devuelve la lista de problemas encontrados; vacia significa lista.
 */
export function validarEtiqueta(etiqueta) {
  const problemas = [];
  for (const { campo, etiqueta: nombre, donde } of CAMPOS_OBLIGATORIOS) {
    const valor = etiqueta[donde]?.[campo];
    if (valor === undefined || valor === null || valor === '') {
      problemas.push({ campo, nombre, nivel: 'error', mensaje: `Falta ${nombre}.` });
    } else if (String(valor).includes('PENDIENTE')) {
      problemas.push({ campo, nombre, nivel: 'error', mensaje: `${nombre} sigue en marcador de posición.` });
    }
  }
  if (!esEanValido(etiqueta.reverso?.ean)) {
    problemas.push({ campo: 'ean', nombre: 'Código de barras', nivel: 'error', mensaje: 'El EAN-13 no es válido.' });
  } else if (String(etiqueta.reverso.ean).startsWith('2')) {
    problemas.push({
      campo: 'ean',
      nombre: 'Código de barras',
      nivel: 'aviso',
      mensaje: 'El EAN usa prefijo interno (2xx): sirve para control propio, no para retail. Se requiere prefijo GS1 de LOGYCA.',
    });
  }
  if (etiqueta.frente?.sellos?.length && etiqueta.analisis?.permiteDeclaracionesNutricionales === false) {
    problemas.push({
      campo: 'declaraciones',
      nombre: 'Declaraciones',
      nivel: 'aviso',
      mensaje: 'Con sello de advertencia no se permiten declaraciones de propiedad nutricional ni de salud.',
    });
  }
  return problemas;
}
