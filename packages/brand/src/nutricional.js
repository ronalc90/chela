/**
 * Calculo nutricional teorico y evaluacion de sellos frontales.
 *
 * ADVERTENCIA
 * -----------
 * Estos numeros son una ESTIMACION a partir de la receta, utiles para
 * disenar la etiqueta y anticipar que sellos van a aplicar. La tabla
 * nutricional que se imprime y se radica ante el INVIMA debe salir de un
 * analisis bromatologico de laboratorio sobre el producto terminado.
 *
 * Marco: Resolucion 810 de 2021, modificada por la Resolucion 2492 de 2022
 * y corregida por la Resolucion 254 de 2023.
 */

/** Composicion por 100 g de ingrediente crudo. */
export const INGREDIENTES = {
  mora: {
    nombre: 'Mora de Castilla',
    energiaKcal: 43,
    carbohidratos: 9.6,
    azucares: 4.9,
    fibra: 5.3,
    proteina: 1.4,
    grasaTotal: 0.5,
    grasaSaturada: 0.0,
    sodioMg: 1,
    agua: 88.2,
  },
  azucar: {
    nombre: 'Azucar (sacarosa)',
    energiaKcal: 387,
    carbohidratos: 100,
    azucares: 100,
    fibra: 0,
    proteina: 0,
    grasaTotal: 0,
    grasaSaturada: 0,
    sodioMg: 0,
    agua: 0,
  },
  limon: {
    nombre: 'Jugo de limon',
    energiaKcal: 22,
    carbohidratos: 6.9,
    azucares: 2.5,
    fibra: 0.3,
    proteina: 0.35,
    grasaTotal: 0.24,
    grasaSaturada: 0.04,
    sodioMg: 1,
    agua: 92.3,
  },
};

/**
 * Umbral de azucares del sello frontal: 10 % o mas de la energia total
 * proveniente de azucares libres (Resolucion 2492 de 2022).
 */
export const UMBRAL_AZUCARES_PORCENTAJE_ENERGIA = 10;

/** Energia por gramo, factores de Atwater. */
const KCAL_POR_G = { carbohidrato: 4, proteina: 4, grasa: 9 };

/**
 * Calcula el perfil nutricional por 100 g de mermelada terminada.
 *
 * Durante la coccion solo se evapora agua: los solidos se conservan.
 * Por eso el rendimiento final es el dato que concentra todo.
 *
 * @param {number} gramosMora
 * @param {number} gramosAzucar
 * @param {number} gramosRendimiento - peso del producto terminado
 */
export function perfilNutricional({ gramosMora, gramosAzucar, gramosLimon = 0, gramosRendimiento }) {
  if (!(gramosMora > 0)) throw new Error('gramosMora debe ser mayor que cero');
  if (!(gramosAzucar >= 0)) throw new Error('gramosAzucar no puede ser negativo');
  if (!(gramosLimon >= 0)) throw new Error('gramosLimon no puede ser negativo');
  if (!(gramosRendimiento > 0)) throw new Error('gramosRendimiento debe ser mayor que cero');

  const entrada = gramosMora + gramosAzucar + gramosLimon;
  if (gramosRendimiento > entrada) {
    throw new Error(
      `El rendimiento (${gramosRendimiento} g) no puede superar la suma de ingredientes (${entrada} g): en la coccion solo se pierde agua.`
    );
  }

  const aporte = (ing, gramos) => {
    const f = gramos / 100;
    return {
      carbohidratos: ing.carbohidratos * f,
      azucares: ing.azucares * f,
      fibra: ing.fibra * f,
      proteina: ing.proteina * f,
      grasaTotal: ing.grasaTotal * f,
      grasaSaturada: ing.grasaSaturada * f,
      sodioMg: ing.sodioMg * f,
    };
  };

  const a = aporte(INGREDIENTES.mora, gramosMora);
  const b = aporte(INGREDIENTES.azucar, gramosAzucar);
  const c = aporte(INGREDIENTES.limon, gramosLimon);

  const totales = {
    carbohidratos: a.carbohidratos + b.carbohidratos + c.carbohidratos,
    azucares: a.azucares + b.azucares + c.azucares,
    azucaresAnadidos: b.azucares,
    fibra: a.fibra + b.fibra + c.fibra,
    proteina: a.proteina + b.proteina + c.proteina,
    grasaTotal: a.grasaTotal + b.grasaTotal + c.grasaTotal,
    grasaSaturada: a.grasaSaturada + b.grasaSaturada + c.grasaSaturada,
    sodioMg: a.sodioMg + b.sodioMg + c.sodioMg,
  };

  // Escalamos al producto terminado: todo lo solido queda en menos gramos.
  const factor = 100 / gramosRendimiento;
  const por100 = {};
  for (const [k, v] of Object.entries(totales)) {
    por100[k] = v * factor;
  }

  // Los carbohidratos disponibles excluyen la fibra para el calculo de energia.
  const carbsDisponibles = Math.max(0, por100.carbohidratos - por100.fibra);
  const energiaKcal =
    carbsDisponibles * KCAL_POR_G.carbohidrato +
    por100.proteina * KCAL_POR_G.proteina +
    por100.grasaTotal * KCAL_POR_G.grasa;

  // Azucares libres: en una mermelada la fruta se rompe por completo, asi que
  // tanto el azucar anadido como el de la fruta cuentan como azucar libre.
  const azucaresLibres = por100.azucares;
  const porcentajeEnergiaAzucares = energiaKcal > 0 ? (azucaresLibres * KCAL_POR_G.carbohidrato / energiaKcal) * 100 : 0;

  const brixAproximado = ((gramosAzucar + gramosMora * (INGREDIENTES.mora.carbohidratos / 100)) / gramosRendimiento) * 100;

  return {
    receta: { gramosMora, gramosAzucar, gramosLimon, gramosRendimiento, evaporado: entrada - gramosRendimiento },
    por100g: {
      energiaKcal: redondear(energiaKcal, 0),
      energiaKj: redondear(energiaKcal * 4.184, 0),
      carbohidratos: redondear(por100.carbohidratos, 1),
      azucares: redondear(por100.azucares, 1),
      azucaresAnadidos: redondear(por100.azucaresAnadidos, 1),
      fibra: redondear(por100.fibra, 1),
      proteina: redondear(por100.proteina, 1),
      grasaTotal: redondear(por100.grasaTotal, 1),
      grasaSaturada: redondear(por100.grasaSaturada, 1),
      sodioMg: redondear(por100.sodioMg, 0),
    },
    porcentajeFruta: redondear((gramosMora / entrada) * 100, 1),
    brixAproximado: redondear(brixAproximado, 1),
    porcentajeEnergiaAzucares: redondear(porcentajeEnergiaAzucares, 1),
  };
}

function redondear(n, decimales) {
  const f = Math.pow(10, decimales);
  return Math.round(n * f) / f;
}

/**
 * Evalua que sellos frontales octagonales aplican.
 * Hoy solo evaluamos azucares, que es el unico umbral relevante para una
 * mermelada; grasas saturadas y sodio quedan documentados pero deben
 * contrastarse contra la tabla vigente antes de imprimir.
 */
export function evaluarSellos(perfil) {
  const sellos = [];
  if (perfil.porcentajeEnergiaAzucares >= UMBRAL_AZUCARES_PORCENTAJE_ENERGIA) {
    sellos.push({
      clave: 'azucares',
      texto: 'EXCESO EN AZÚCARES',
      motivo: `${perfil.porcentajeEnergiaAzucares} % de la energía proviene de azúcares libres (umbral: ${UMBRAL_AZUCARES_PORCENTAJE_ENERGIA} %).`,
    });
  }
  return {
    sellos,
    // Con al menos un sello quedan prohibidas las declaraciones de propiedad
    // nutricional y de salud, sin excepcion.
    permiteDeclaracionesNutricionales: sellos.length === 0,
  };
}

/**
 * Sello frontal octagonal en SVG.
 * Octagono de fondo negro, borde y letras blancas en mayuscula, con la
 * palabra MINSALUD en la parte baja de la figura.
 */
export function svgSello(texto = 'EXCESO EN AZÚCARES', { tamano = 220 } = {}) {
  const r = 50;
  const puntos = Array.from({ length: 8 }, (_, i) => {
    const ang = (Math.PI / 4) * i + Math.PI / 8;
    return `${(50 + r * Math.cos(ang)).toFixed(2)},${(50 + r * Math.sin(ang)).toFixed(2)}`;
  }).join(' ');

  const palabras = texto.split(' ');
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    if ((actual + ' ' + p).trim().length > 10 && actual) {
      lineas.push(actual.trim());
      actual = p;
    } else {
      actual = (actual + ' ' + p).trim();
    }
  }
  if (actual) lineas.push(actual);

  const inicioY = 46 - (lineas.length - 1) * 6;
  const texto_ = lineas
    .map((l, i) => {
      const tam = l.length > 8 ? 9.5 : 11.5;
      return `<text x="50" y="${inicioY + i * 12}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${tam}" fill="#ffffff">${escapar(l)}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${tamano}" height="${tamano}" role="img" aria-label="Sello frontal de advertencia: ${escapar(texto)}">` +
    `<polygon points="${puntos}" fill="#000000" stroke="#ffffff" stroke-width="3"/>` +
    `<polygon points="${puntos}" fill="none" stroke="#000000" stroke-width="1"/>` +
    texto_ +
    `<text x="50" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="7.5" letter-spacing="0.4" fill="#ffffff">MINSALUD</text>` +
    `</svg>`;
}

function escapar(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
