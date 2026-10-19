/**
 * Plantillas de etiqueta editables.
 *
 * Una plantilla guarda TODO lo que va impreso en el rótulo (marca,
 * producto, fabricante, registro, lote, sellos) y cómo se imprime (tamaño
 * de etiqueta, hoja, márgenes, escala del texto). La usan la web, para
 * editar e imprimir, y la API, para validar lo que se guarda.
 *
 * Nada aquí depende del navegador ni de la base de datos.
 */

import { marca as marcaBase, producto as productoBase } from './tokens.js';
import { generarLote, calcularVencimiento, fechaCompacta, aIso, VIDA_UTIL_MESES } from './lote.js';
import { generarEan13, esEanValido } from './barcode.js';
import { perfilNutricional, evaluarSellos } from './nutricional.js';

export const VERSION_PLANTILLA = 1;

/** Sellos frontales octagonales (Resolución 810 de 2021 y 2492 de 2022). */
export const SELLOS = {
  azucares: 'EXCESO EN AZÚCARES',
  sodio: 'EXCESO EN SODIO',
  grasasSaturadas: 'EXCESO EN GRASAS SATURADAS',
  grasasTrans: 'EXCESO EN GRASAS TRANS',
};

/** Tamaños de etiqueta frecuentes en papel adhesivo. */
export const TAMANOS_ETIQUETA = {
  '70x50': { ancho: 70, alto: 50, nombre: '70 × 50 mm — frasco de 100 g' },
  '90x60': { ancho: 90, alto: 60, nombre: '90 × 60 mm — frasco de 250 g' },
  '100x70': { ancho: 100, alto: 70, nombre: '100 × 70 mm — frasco grande' },
  '60x40': { ancho: 60, alto: 40, nombre: '60 × 40 mm — formato mínimo' },
  '50x30': { ancho: 50, alto: 30, nombre: '50 × 30 mm — tapa o sello' },
};

/** Hojas de papel (vertical). */
export const HOJAS = {
  a4: { ancho: 210, alto: 297, nombre: 'A4 (210 × 297 mm)' },
  carta: { ancho: 216, alto: 279, nombre: 'Carta (216 × 279 mm)' },
  oficio: { ancho: 216, alto: 330, nombre: 'Oficio (216 × 330 mm)' },
};

export const LIMITES = {
  etiqueta: { min: 20, max: 300 },
  hoja: { min: 50, max: 600 },
  margen: { min: 0, max: 40 },
  separacion: { min: 0, max: 30 },
  escala: { min: 50, max: 200 },
  cantidad: { min: 1, max: 500 },
  texto: 600,
  nombre: 120,
};

/** Plantilla de partida: los datos actuales de la marca. */
export function plantillaPorDefecto() {
  return {
    version: VERSION_PLANTILLA,
    marca: {
      parte1: 'Sabor',
      parte2: 'Puro',
      mostrarCanasta: true,
    },
    producto: {
      denominacion: productoBase.denominacion,
      calificativo: productoBase.calificativo,
      mostrarCalificativo: true,
      prefijoContenido: 'Peso neto',
      contenido: productoBase.contenidoNetoGramos,
      unidad: 'g',
      ingredientes: productoBase.ingredientes
        .map((i) => (i.funcion ? `${i.nombre} (${i.funcion})` : i.nombre))
        .join(', '),
      conservacion: productoBase.conservacion,
      modoUso: productoBase.modoDeUso,
      mostrarModoUso: true,
      leyenda: '',
    },
    fabricante: {
      razonSocial: marcaBase.razonSocial,
      nit: '',
      direccion: marcaBase.direccion,
      ciudad: `${marcaBase.localidad}, ${marcaBase.ciudad}`,
      telefono: marcaBase.contacto.telefono,
      sitio: marcaBase.sitio.replace(/^https?:\/\//, ''),
      origen: 'Producto colombiano',
    },
    registro: {
      sanitario: marcaBase.registroSanitario,
      eanModo: 'interno', // interno | propio
      eanPrefijo: productoBase.prefijoEan,
      eanReferencia: productoBase.referenciaEan,
      ean: '',
      mostrarCodigoBarras: true,
    },
    lote: {
      fechaHoy: true,
      fechaProduccion: '',
      tanda: 1,
      loteModo: 'auto', // auto | manual
      loteManual: '',
      vidaUtilMeses: VIDA_UTIL_MESES,
      vencimientoModo: 'auto', // auto | manual
      vencimientoManual: '',
    },
    sellos: {
      modo: 'receta', // receta | manual
      receta: { mora: 1000, azucar: 700, limon: 30, rendimiento: 1200 },
      manual: ['azucares'],
    },
    impresion: {
      tamano: '70x50', // clave de TAMANOS_ETIQUETA o 'personalizado'
      ancho: 70,
      alto: 50,
      hoja: 'a4', // clave de HOJAS o 'personalizada'
      hojaAncho: 210,
      hojaAlto: 297,
      orientacion: 'vertical', // vertical | horizontal
      margen: 8,
      separacion: 4,
      escalaTexto: 100,
      cantidad: 10,
      bordeCorte: true,
      centrar: false,
    },
  };
}

/* ------------------------------------------------------------ normalizar */

const texto = (v, max = LIMITES.texto) => String(v ?? '').slice(0, max);
const bool = (v, defecto) => (typeof v === 'boolean' ? v : defecto);
const elegir = (v, opciones, defecto) => (opciones.includes(v) ? v : defecto);

function numero(v, { min, max }, defecto) {
  const n = Number(v);
  if (!Number.isFinite(n)) return defecto;
  return Math.min(max, Math.max(min, Math.round(n * 10) / 10));
}

function fechaIso(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? '')) ? String(v) : '';
}

/**
 * Devuelve una plantilla completa y saneada a partir de cualquier objeto:
 * completa lo que falte con los valores por defecto, recorta textos y
 * limita los números. Es idempotente.
 */
export function normalizarPlantilla(entrada = {}) {
  const d = plantillaPorDefecto();
  const e = entrada && typeof entrada === 'object' ? entrada : {};
  const m = e.marca || {};
  const p = e.producto || {};
  const f = e.fabricante || {};
  const r = e.registro || {};
  const l = e.lote || {};
  const s = e.sellos || {};
  const i = e.impresion || {};
  const receta = s.receta || {};

  const tamano = elegir(i.tamano, [...Object.keys(TAMANOS_ETIQUETA), 'personalizado'], d.impresion.tamano);
  const preset = TAMANOS_ETIQUETA[tamano];
  const hoja = elegir(i.hoja, [...Object.keys(HOJAS), 'personalizada'], d.impresion.hoja);
  const presetHoja = HOJAS[hoja];

  return {
    version: VERSION_PLANTILLA,
    marca: {
      parte1: texto(m.parte1 ?? d.marca.parte1, 60),
      parte2: texto(m.parte2 ?? d.marca.parte2, 60),
      mostrarCanasta: bool(m.mostrarCanasta, d.marca.mostrarCanasta),
    },
    producto: {
      denominacion: texto(p.denominacion ?? d.producto.denominacion, 120),
      calificativo: texto(p.calificativo ?? d.producto.calificativo, 60),
      mostrarCalificativo: bool(p.mostrarCalificativo, d.producto.mostrarCalificativo),
      prefijoContenido: texto(p.prefijoContenido ?? d.producto.prefijoContenido, 40),
      contenido: numero(p.contenido, { min: 0, max: 100000 }, d.producto.contenido),
      unidad: elegir(p.unidad, ['g', 'kg', 'ml', 'L', 'cm³', 'unidades'], d.producto.unidad),
      ingredientes: texto(p.ingredientes ?? d.producto.ingredientes),
      conservacion: texto(p.conservacion ?? d.producto.conservacion),
      modoUso: texto(p.modoUso ?? d.producto.modoUso),
      mostrarModoUso: bool(p.mostrarModoUso, d.producto.mostrarModoUso),
      leyenda: texto(p.leyenda ?? d.producto.leyenda),
    },
    fabricante: {
      razonSocial: texto(f.razonSocial ?? d.fabricante.razonSocial, 160),
      nit: texto(f.nit ?? d.fabricante.nit, 40),
      direccion: texto(f.direccion ?? d.fabricante.direccion, 200),
      ciudad: texto(f.ciudad ?? d.fabricante.ciudad, 120),
      telefono: texto(f.telefono ?? d.fabricante.telefono, 60),
      sitio: texto(f.sitio ?? d.fabricante.sitio, 120),
      origen: texto(f.origen ?? d.fabricante.origen, 120),
    },
    registro: {
      sanitario: texto(r.sanitario ?? d.registro.sanitario, 60),
      eanModo: elegir(r.eanModo, ['interno', 'propio'], d.registro.eanModo),
      eanPrefijo: texto(r.eanPrefijo ?? d.registro.eanPrefijo, 11).replace(/\D/g, ''),
      eanReferencia: texto(r.eanReferencia ?? d.registro.eanReferencia, 12).replace(/\D/g, ''),
      ean: texto(r.ean ?? d.registro.ean, 13).replace(/\D/g, ''),
      mostrarCodigoBarras: bool(r.mostrarCodigoBarras, d.registro.mostrarCodigoBarras),
    },
    lote: {
      fechaHoy: bool(l.fechaHoy, d.lote.fechaHoy),
      fechaProduccion: fechaIso(l.fechaProduccion),
      tanda: numero(l.tanda, { min: 1, max: 99 }, d.lote.tanda),
      loteModo: elegir(l.loteModo, ['auto', 'manual'], d.lote.loteModo),
      loteManual: texto(l.loteManual ?? '', 40),
      vidaUtilMeses: numero(l.vidaUtilMeses, { min: 1, max: 120 }, d.lote.vidaUtilMeses),
      vencimientoModo: elegir(l.vencimientoModo, ['auto', 'manual'], d.lote.vencimientoModo),
      vencimientoManual: fechaIso(l.vencimientoManual),
    },
    sellos: {
      modo: elegir(s.modo, ['receta', 'manual'], d.sellos.modo),
      receta: {
        mora: numero(receta.mora, { min: 0, max: 1e6 }, d.sellos.receta.mora),
        azucar: numero(receta.azucar, { min: 0, max: 1e6 }, d.sellos.receta.azucar),
        limon: numero(receta.limon, { min: 0, max: 1e6 }, d.sellos.receta.limon),
        rendimiento: numero(receta.rendimiento, { min: 0, max: 1e6 }, d.sellos.receta.rendimiento),
      },
      manual: Array.isArray(s.manual)
        ? [...new Set(s.manual.filter((k) => k in SELLOS))]
        : d.sellos.manual,
    },
    impresion: {
      tamano,
      ancho: preset ? preset.ancho : numero(i.ancho, LIMITES.etiqueta, d.impresion.ancho),
      alto: preset ? preset.alto : numero(i.alto, LIMITES.etiqueta, d.impresion.alto),
      hoja,
      hojaAncho: presetHoja ? presetHoja.ancho : numero(i.hojaAncho, LIMITES.hoja, d.impresion.hojaAncho),
      hojaAlto: presetHoja ? presetHoja.alto : numero(i.hojaAlto, LIMITES.hoja, d.impresion.hojaAlto),
      orientacion: elegir(i.orientacion, ['vertical', 'horizontal'], d.impresion.orientacion),
      margen: numero(i.margen, LIMITES.margen, d.impresion.margen),
      separacion: numero(i.separacion, LIMITES.separacion, d.impresion.separacion),
      escalaTexto: numero(i.escalaTexto, LIMITES.escala, d.impresion.escalaTexto),
      cantidad: Math.round(numero(i.cantidad, LIMITES.cantidad, d.impresion.cantidad)),
      bordeCorte: bool(i.bordeCorte, d.impresion.bordeCorte),
      centrar: bool(i.centrar, d.impresion.centrar),
    },
  };
}

/* ------------------------------------------------------------- impresión */

/** Medidas finales de la hoja según la orientación. */
export function medidasHoja(impresion) {
  const { hojaAncho, hojaAlto, orientacion } = impresion;
  const corto = Math.min(hojaAncho, hojaAlto);
  const largo = Math.max(hojaAncho, hojaAlto);
  return orientacion === 'horizontal' ? { ancho: largo, alto: corto } : { ancho: corto, alto: largo };
}

/** Cuántas etiquetas caben por hoja y cuántas hojas hacen falta. */
export function capacidadHoja(impresion) {
  const { ancho, alto } = medidasHoja(impresion);
  const utilAncho = ancho - 2 * impresion.margen;
  const utilAlto = alto - 2 * impresion.margen;
  const g = impresion.separacion;
  const columnas = Math.max(0, Math.floor((utilAncho + g) / (impresion.ancho + g)));
  const filas = Math.max(0, Math.floor((utilAlto + g) / (impresion.alto + g)));
  const porHoja = columnas * filas;
  const hojas = porHoja > 0 ? Math.ceil(impresion.cantidad / porHoja) : 0;
  return { columnas, filas, porHoja, hojas, hojaAncho: ancho, hojaAlto: alto };
}

/* ------------------------------------------------------------- resolver */

function hoyIso() {
  return aIso(new Date());
}

/**
 * Calcula todo lo que se imprime a partir de la plantilla: lote, fechas,
 * EAN, sellos y textos listos. `hoy` permite fijar la fecha en pruebas.
 */
export function resolverPlantilla(entrada, { hoy = hoyIso() } = {}) {
  const t = normalizarPlantilla(entrada);
  const fechaProduccion = t.lote.fechaHoy || !t.lote.fechaProduccion ? hoy : t.lote.fechaProduccion;

  const lote = t.lote.loteModo === 'manual' && t.lote.loteManual.trim()
    ? t.lote.loteManual.trim().toUpperCase()
    : generarLote(fechaProduccion, t.lote.tanda);

  const vencimientoIso = t.lote.vencimientoModo === 'manual' && t.lote.vencimientoManual
    ? t.lote.vencimientoManual
    : calcularVencimiento(fechaProduccion, t.lote.vidaUtilMeses);

  let ean = '';
  let errorEan = null;
  if (t.registro.eanModo === 'propio') {
    ean = t.registro.ean;
    if (!esEanValido(ean)) errorEan = 'El EAN-13 propio no es válido: revisa los 13 dígitos.';
  } else {
    try {
      ean = generarEan13(t.registro.eanPrefijo || '200', t.registro.eanReferencia || '0');
    } catch (e) {
      errorEan = e.message;
    }
  }

  let sellos = [];
  let motivoSellos = '';
  let errorReceta = null;
  if (t.sellos.modo === 'receta') {
    try {
      const { mora, azucar, limon, rendimiento } = t.sellos.receta;
      const perfil = perfilNutricional({
        gramosMora: mora,
        gramosAzucar: azucar,
        gramosLimon: limon,
        gramosRendimiento: rendimiento,
      });
      const ev = evaluarSellos(perfil);
      sellos = ev.sellos.map((x) => ({ clave: x.clave, texto: x.texto }));
      motivoSellos = ev.sellos[0]?.motivo || 'Con esta receta no aplica ningún sello.';
    } catch (e) {
      errorReceta = e.message;
    }
  } else {
    sellos = t.sellos.manual.map((k) => ({ clave: k, texto: SELLOS[k] }));
  }

  const p = t.producto;
  const contenido = `${String(p.contenido).replace('.', ',')} ${p.unidad}`;

  return {
    plantilla: t,
    marca: { parte1: t.marca.parte1, parte2: t.marca.parte2, mostrarCanasta: t.marca.mostrarCanasta },
    denominacion: p.denominacion,
    calificativo: p.mostrarCalificativo ? p.calificativo : '',
    contenido,
    lineaContenido: [p.prefijoContenido, contenido].filter(Boolean).join(': '),
    ingredientes: p.ingredientes,
    conservacion: p.conservacion,
    modoUso: p.mostrarModoUso ? p.modoUso : '',
    leyenda: p.leyenda,
    fabricante: t.fabricante,
    registroSanitario: t.registro.sanitario,
    ean,
    mostrarCodigoBarras: t.registro.mostrarCodigoBarras && !errorEan,
    lote,
    fechaProduccion,
    fechaProduccionCompacta: fechaCompacta(fechaProduccion),
    fechaVencimiento: vencimientoIso,
    fechaVencimientoCompacta: fechaCompacta(vencimientoIso),
    sellos,
    motivoSellos,
    errores: { ean: errorEan, receta: errorReceta },
    capacidad: capacidadHoja(t.impresion),
  };
}

/* ------------------------------------------------------------- validar */

/**
 * Revisa lo que debe ir en el rótulo antes de imprimir. Devuelve una
 * lista de { campo, nivel: 'error' | 'aviso', mensaje }.
 */
export function validarPlantilla(resuelta) {
  const r = resuelta.plantilla ? resuelta : resolverPlantilla(resuelta);
  const t = r.plantilla;
  const problemas = [];
  const falta = (campo, nombre) => problemas.push({ campo, nivel: 'error', mensaje: `Falta ${nombre}.` });

  if (!t.producto.denominacion.trim()) falta('denominacion', 'el nombre del alimento');
  if (!(t.producto.contenido > 0)) falta('contenido', 'el contenido neto');
  if (!t.producto.ingredientes.trim()) falta('ingredientes', 'la lista de ingredientes');
  if (!t.producto.conservacion.trim()) falta('conservacion', 'las instrucciones de conservación');
  if (!t.fabricante.razonSocial.trim()) falta('razonSocial', 'el nombre o razón social del fabricante');
  if (!t.fabricante.direccion.trim()) falta('direccion', 'la dirección del fabricante');
  if (!t.fabricante.origen.trim()) falta('origen', 'el país de origen');
  if (!t.registro.sanitario.trim()) falta('sanitario', 'el registro o notificación sanitaria');
  if (!r.lote) falta('lote', 'el lote');

  if (!t.fabricante.nit.trim()) {
    problemas.push({ campo: 'nit', nivel: 'aviso', mensaje: 'El NIT está vacío.' });
  }
  if (r.errores.ean) problemas.push({ campo: 'ean', nivel: 'error', mensaje: r.errores.ean });
  else if (r.ean.startsWith('2')) {
    problemas.push({
      campo: 'ean',
      nivel: 'aviso',
      mensaje: 'El EAN usa prefijo interno (2xx): sirve para control propio, no para supermercados. El prefijo lo asigna GS1 Colombia (LOGYCA).',
    });
  }
  if (r.errores.receta) problemas.push({ campo: 'receta', nivel: 'error', mensaje: `Receta: ${r.errores.receta}` });
  if (r.sellos.length) {
    problemas.push({
      campo: 'declaraciones',
      nivel: 'aviso',
      mensaje: 'Con sello de advertencia no se permiten declaraciones de propiedad nutricional ni de salud.',
    });
  }
  if (r.fechaVencimiento <= r.fechaProduccion) {
    problemas.push({ campo: 'vencimiento', nivel: 'error', mensaje: 'El vencimiento es anterior o igual a la producción.' });
  }
  if (r.capacidad.porHoja === 0) {
    problemas.push({ campo: 'tamano', nivel: 'error', mensaje: 'La etiqueta no cabe en la hoja con esos márgenes.' });
  }
  return problemas;
}

/** Resumen corto para listados. */
export function resumenPlantilla(entrada) {
  const t = normalizarPlantilla(entrada);
  return {
    marca: `${t.marca.parte1}${t.marca.parte2}`,
    denominacion: t.producto.denominacion,
    contenido: `${t.producto.contenido} ${t.producto.unidad}`,
    tamano: `${t.impresion.ancho} × ${t.impresion.alto} mm`,
  };
}
