import { test } from 'node:test';
import assert from 'node:assert/strict';

import { digitoVerificador, esEanValido, generarEan13, modulosEan13, svgEan13 } from '../src/barcode.js';
import { generarLote, parsearLote, calcularVencimiento, sumarMeses, aIso, fechaCompacta } from '../src/lote.js';
import { perfilNutricional, evaluarSellos } from '../src/nutricional.js';
import { construirEtiqueta, validarEtiqueta } from '../src/etiqueta.js';

test('digito verificador contra codigos EAN-13 reales conocidos', () => {
  // Codigos publicados por GS1 y fabricantes; el ultimo digito es el verificador.
  assert.equal(digitoVerificador('770100100000'), 8); // 7701001000008
  assert.equal(digitoVerificador('400638133393'), 1); // 4006381333931
  assert.equal(digitoVerificador('978020137962'), 4); // 9780201379624
  assert.equal(digitoVerificador('500015945005'), 8); // 5000159450058
});

test('esEanValido acepta validos y rechaza alterados', () => {
  assert.equal(esEanValido('7701001000008'), true);
  assert.equal(esEanValido('4006381333931'), true);
  assert.equal(esEanValido('7701001000009'), false, 'digito verificador equivocado');
  assert.equal(esEanValido('770100100000'), false, 'longitud equivocada');
  assert.equal(esEanValido('abcdefghijklm'), false);
});

test('generarEan13 produce codigos auto-consistentes', () => {
  const codigo = generarEan13('200', '10250');
  assert.equal(codigo.length, 13);
  assert.equal(esEanValido(codigo), true);
  assert.ok(codigo.startsWith('200'));

  const conPrefijoColombia = generarEan13('7701234', '567');
  assert.equal(esEanValido(conPrefijoColombia), true);
  assert.ok(conPrefijoColombia.startsWith('7701234'));
});

test('generarEan13 rechaza entradas imposibles', () => {
  assert.throws(() => generarEan13('20', '1'), /entre 3 y 11/);
  assert.throws(() => generarEan13('7701234567', '12345'), /no cabe/);
});

test('modulos EAN-13 respetan la estructura del estandar', () => {
  const mods = modulosEan13('7701001000008');
  assert.equal(mods.length, 95, '95 modulos exactos');
  assert.equal(mods.slice(0, 3), '101', 'guarda inicial');
  assert.equal(mods.slice(45, 50), '01010', 'guarda central');
  assert.equal(mods.slice(92), '101', 'guarda final');
});

test('svgEan13 genera SVG con el codigo legible', () => {
  const svg = svgEan13('7701001000008');
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('</svg>'));
  assert.ok(svg.includes('<rect'));
  assert.throws(() => svgEan13('1234567890123'), /invalido/);
});

test('lote se genera y se vuelve a leer sin perder informacion', () => {
  const lote = generarLote('2026-10-18', 1);
  assert.equal(lote, 'L261018-01');

  const leido = parsearLote(lote);
  assert.deepEqual(leido, { codigo: 'L261018-01', fechaProduccion: '2026-10-18', tanda: 1 });

  assert.equal(parsearLote('L260230-01'), null, '30 de febrero no existe');
  assert.equal(parsearLote('no-es-un-lote'), null);
});

test('vencimiento respeta fin de mes', () => {
  assert.equal(calcularVencimiento('2026-10-18', 18), '2028-04-18');
  // 31 de agosto + 6 meses cae en febrero, que no tiene 31.
  assert.equal(aIso(sumarMeses('2026-08-31', 6)), '2027-02-28');
  assert.equal(fechaCompacta('2026-10-18'), '18/10/2026');
});

test('perfil nutricional concentra los solidos al evaporar agua', () => {
  // 1000 g de mora + 700 g de azucar reducidos a 1200 g de mermelada.
  const p = perfilNutricional({ gramosMora: 1000, gramosAzucar: 700, gramosRendimiento: 1200 });

  assert.equal(p.receta.evaporado, 500, 'se evaporaron 500 g de agua');
  assert.ok(p.por100g.azucares > 50, 'mermelada concentrada supera 50 g de azucar por 100 g');
  assert.ok(p.por100g.energiaKcal > 200, 'energia propia de una conserva azucarada');
  assert.ok(p.brixAproximado > 55, 'los grados Brix de una mermelada tradicional');
  assert.ok(p.porcentajeFruta > 55 && p.porcentajeFruta < 65);
});

test('perfil nutricional rechaza un rendimiento imposible', () => {
  assert.throws(
    () => perfilNutricional({ gramosMora: 1000, gramosAzucar: 700, gramosRendimiento: 1800 }),
    /no puede superar/,
  );
  assert.throws(() => perfilNutricional({ gramosMora: 0, gramosAzucar: 700, gramosRendimiento: 500 }), /gramosMora/);
});

test('una mermelada tradicional dispara el sello de azucares', () => {
  const p = perfilNutricional({ gramosMora: 1000, gramosAzucar: 700, gramosRendimiento: 1200 });
  const { sellos, permiteDeclaracionesNutricionales } = evaluarSellos(p);

  assert.equal(sellos.length, 1);
  assert.equal(sellos[0].clave, 'azucares');
  assert.equal(sellos[0].texto, 'EXCESO EN AZÚCARES');
  assert.equal(permiteDeclaracionesNutricionales, false, 'con sello no se permiten declaraciones');
});

test('la etiqueta completa arma frente, reverso y tabla', () => {
  const e = construirEtiqueta({
    fechaProduccion: '2026-10-18',
    tanda: 1,
    gramosMora: 1000,
    gramosAzucar: 700,
    gramosRendimiento: 1200,
  });

  assert.equal(e.frente.denominacion, 'Mermelada de mora');
  assert.equal(e.frente.contenidoNeto, '100 g');
  assert.equal(e.frente.sellos.length, 1);
  assert.equal(e.reverso.lote, 'L261018-01');
  assert.equal(e.reverso.fechaVencimiento, '18/04/2028');
  assert.equal(esEanValido(e.reverso.ean), true);
  assert.ok(e.tablaNutricional.porcionesPorEnvase > 0);
  assert.ok(e.reverso.listaIngredientes.includes('Limón (regulador de acidez)'));
});

test('validarEtiqueta detecta los campos que siguen pendientes', () => {
  const e = construirEtiqueta({
    fechaProduccion: '2026-10-18',
    gramosMora: 1000,
    gramosAzucar: 700,
    gramosRendimiento: 1200,
  });
  const problemas = validarEtiqueta(e);

  const errores = problemas.filter((p) => p.nivel === 'error');
  assert.equal(errores.length, 1, 'con los datos reales solo el NIT sigue pendiente');
  assert.equal(errores[0].campo, 'nit');
  assert.ok(problemas.some((p) => p.campo === 'ean' && p.nivel === 'aviso'), 'avisa que el EAN es prefijo interno');
  assert.ok(problemas.some((p) => p.campo === 'declaraciones'), 'avisa que el sello bloquea declaraciones');
});
