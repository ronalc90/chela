import test from 'node:test';
import assert from 'node:assert/strict';

import {
  plantillaPorDefecto,
  normalizarPlantilla,
  resolverPlantilla,
  validarPlantilla,
  capacidadHoja,
  medidasHoja,
  SELLOS,
} from '../src/plantilla.js';

const HOY = '2026-10-18';

test('la plantilla por defecto reproduce la etiqueta actual', () => {
  const r = resolverPlantilla(plantillaPorDefecto(), { hoy: HOY });
  assert.equal(r.denominacion, 'Mermelada de mora');
  assert.equal(r.lineaContenido, 'Peso neto: 100 g');
  assert.equal(r.lote, 'L261018-01');
  assert.equal(r.fechaVencimientoCompacta, '18/04/2028');
  assert.deepEqual(r.sellos.map((s) => s.clave), ['azucares']);
  assert.equal(r.ean.length, 13);
});

test('normalizar completa, recorta y limita sin romper', () => {
  const t = normalizarPlantilla({
    marca: { parte1: 'Doña Chela', parte2: '' },
    producto: { contenido: '250', unidad: 'ml', denominacion: 'x'.repeat(500) },
    impresion: { tamano: 'personalizado', ancho: 5, alto: 9999, margen: -3, cantidad: 0 },
    basura: { a: 1 },
  });
  assert.equal(t.marca.parte1, 'Doña Chela');
  assert.equal(t.marca.parte2, '');
  assert.equal(t.producto.contenido, 250);
  assert.equal(t.producto.unidad, 'ml');
  assert.equal(t.producto.denominacion.length, 120);
  assert.equal(t.impresion.ancho, 20);
  assert.equal(t.impresion.alto, 300);
  assert.equal(t.impresion.margen, 0);
  assert.equal(t.impresion.cantidad, 1);
  assert.equal('basura' in t, false);
  // Idempotente
  assert.deepEqual(normalizarPlantilla(t), t);
});

test('los tamaños predefinidos mandan sobre las medidas sueltas', () => {
  const t = normalizarPlantilla({ impresion: { tamano: '90x60', ancho: 33, alto: 33 } });
  assert.equal(t.impresion.ancho, 90);
  assert.equal(t.impresion.alto, 60);
});

test('lote y vencimiento manuales', () => {
  const r = resolverPlantilla(
    {
      lote: {
        fechaHoy: false,
        fechaProduccion: '2026-01-31',
        loteModo: 'manual',
        loteManual: 'mx-77',
        vencimientoModo: 'manual',
        vencimientoManual: '2026-12-01',
      },
    },
    { hoy: HOY },
  );
  assert.equal(r.lote, 'MX-77');
  assert.equal(r.fechaProduccionCompacta, '31/01/2026');
  assert.equal(r.fechaVencimientoCompacta, '01/12/2026');
});

test('sellos manuales y EAN propio inválido', () => {
  const r = resolverPlantilla(
    { sellos: { modo: 'manual', manual: ['sodio', 'inventado', 'sodio'] }, registro: { eanModo: 'propio', ean: '123' } },
    { hoy: HOY },
  );
  assert.deepEqual(r.sellos, [{ clave: 'sodio', texto: SELLOS.sodio }]);
  assert.ok(r.errores.ean);
  assert.equal(r.mostrarCodigoBarras, false);
  assert.ok(validarPlantilla(r).some((p) => p.campo === 'ean' && p.nivel === 'error'));
});

test('validar avisa campos obligatorios vacíos', () => {
  const r = resolverPlantilla({ producto: { ingredientes: '', denominacion: '  ' } }, { hoy: HOY });
  const campos = validarPlantilla(r).filter((p) => p.nivel === 'error').map((p) => p.campo);
  assert.ok(campos.includes('ingredientes'));
  assert.ok(campos.includes('denominacion'));
});

test('capacidad por hoja: A4, Carta y horizontal', () => {
  const base = normalizarPlantilla({}).impresion;
  assert.equal(capacidadHoja(base).porHoja, 10);
  // Carta con 8 mm de margen: caben 4 filas de 50 mm; con 5 mm, 5 filas.
  assert.equal(capacidadHoja({ ...base, hoja: 'carta', hojaAncho: 216, hojaAlto: 279 }).porHoja, 8);
  assert.equal(capacidadHoja({ ...base, hoja: 'carta', hojaAncho: 216, hojaAlto: 279, margen: 5 }).porHoja, 10);
  const horiz = { ...base, orientacion: 'horizontal' };
  assert.deepEqual(medidasHoja(horiz), { ancho: 297, alto: 210 });
  assert.equal(capacidadHoja(horiz).columnas, 3);
  assert.equal(capacidadHoja({ ...base, cantidad: 25 }).hojas, 3);
  assert.equal(capacidadHoja({ ...base, ancho: 250 }).porHoja, 0);
});
