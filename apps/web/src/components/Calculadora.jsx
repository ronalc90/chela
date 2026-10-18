'use client';

import { useMemo, useState } from 'react';
import { perfilNutricional, evaluarSellos, svgSello } from '@chela/brand/nutricional';
import { datosDeLote } from '@chela/brand/lote';

const HOY = new Date().toISOString().slice(0, 10);

export default function Calculadora() {
  const [mora, setMora] = useState(1000);
  const [azucar, setAzucar] = useState(700);
  const [limon, setLimon] = useState(30);
  const [rendimiento, setRendimiento] = useState(1200);
  const [fecha, setFecha] = useState(HOY);
  const [frascoGramos, setFrascoGramos] = useState(100);

  const resultado = useMemo(() => {
    try {
      const perfil = perfilNutricional({
        gramosMora: Number(mora),
        gramosAzucar: Number(azucar),
        gramosLimon: Number(limon),
        gramosRendimiento: Number(rendimiento),
      });
      const sellos = evaluarSellos(perfil);
      const lote = datosDeLote({ fechaProduccion: fecha, tanda: 1 });
      const frascos = Math.floor(Number(rendimiento) / Math.max(1, Number(frascoGramos)));
      return { perfil, sellos, lote, frascos, error: null };
    } catch (e) {
      return { error: e.message };
    }
  }, [mora, azucar, limon, rendimiento, fecha, frascoGramos]);

  if (resultado.error) {
    return (
      <div className="tarjeta">
        <Campos
          {...{ mora, setMora, azucar, setAzucar, limon, setLimon, rendimiento, setRendimiento, fecha, setFecha, frascoGramos, setFrascoGramos }}
        />
        <div className="aviso aviso--error">{resultado.error}</div>
      </div>
    );
  }

  const { perfil, sellos, lote, frascos } = resultado;

  return (
    <div className="tarjeta">
      <Campos
        {...{ mora, setMora, azucar, setAzucar, limon, setLimon, rendimiento, setRendimiento, fecha, setFecha, frascoGramos, setFrascoGramos }}
      />

      <div className="metricas">
        <div className="metrica">
          <span className="metrica__valor">{frascos}</span>
          <span className="metrica__nombre">Frascos de {frascoGramos} g</span>
        </div>
        <div className="metrica">
          <span className="metrica__valor">{perfil.porcentajeFruta}%</span>
          <span className="metrica__nombre">Fruta</span>
        </div>
        <div className="metrica">
          <span className="metrica__valor">{perfil.brixAproximado}</span>
          <span className="metrica__nombre">°Brix aprox.</span>
        </div>
        <div className="metrica">
          <span className="metrica__valor">{perfil.por100g.energiaKcal}</span>
          <span className="metrica__nombre">kcal / 100 g</span>
        </div>
        <div className="metrica">
          <span className="metrica__valor">{perfil.por100g.azucares}</span>
          <span className="metrica__nombre">g azúcar / 100 g</span>
        </div>
        <div className="metrica">
          <span className="metrica__valor">{perfil.receta.evaporado}</span>
          <span className="metrica__nombre">g de agua evaporada</span>
        </div>
      </div>

      <div className="rejilla rejilla--2" style={{ marginTop: 26, alignItems: 'center' }}>
        <div>
          <p className="explica__titulo">Lote que se asignaría</p>
          <p className="mono" style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 6px' }}>
            {lote.lote}
          </p>
          <p style={{ margin: 0, color: 'var(--texto-suave)', fontSize: '0.92rem' }}>
            Producido el {lote.fechaProduccionCompacta} · Vence el {lote.fechaVencimientoCompacta}
            {' '}({lote.vidaUtilMeses} meses)
          </p>
        </div>

        <div>
          <p className="explica__titulo">Sellos frontales</p>
          {sellos.sellos.length === 0 ? (
            <p style={{ margin: 0 }}>Con esta formulación no aplicaría ningún sello de advertencia.</p>
          ) : (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              {sellos.sellos.map((s) => (
                <span
                  key={s.clave}
                  style={{ width: 92, flexShrink: 0 }}
                  dangerouslySetInnerHTML={{ __html: svgSello(s.texto, { tamano: 92 }) }}
                />
              ))}
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--texto-suave)', flex: '1 1 180px' }}>
                {sellos.sellos[0].motivo}
              </p>
            </div>
          )}
        </div>
      </div>

      {!sellos.permiteDeclaracionesNutricionales && (
        <div className="aviso">
          Con al menos un sello de advertencia no se permite ninguna declaración de propiedad
          nutricional ni de salud en la etiqueta: nada de «bajo en azúcar», «natural» o similares.
        </div>
      )}
    </div>
  );
}

function Campos({
  mora, setMora, azucar, setAzucar, limon, setLimon,
  rendimiento, setRendimiento, fecha, setFecha, frascoGramos, setFrascoGramos,
}) {
  return (
    <div className="calc__campos">
      <div className="campo">
        <label htmlFor="c-mora">Mora (g)</label>
        <input id="c-mora" type="number" min="1" step="10" value={mora}
          onChange={(e) => setMora(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="c-azucar">Azúcar (g)</label>
        <input id="c-azucar" type="number" min="0" step="10" value={azucar}
          onChange={(e) => setAzucar(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="c-limon">Limón (g)</label>
        <input id="c-limon" type="number" min="0" step="5" value={limon}
          onChange={(e) => setLimon(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="c-rend">Rendimiento (g)</label>
        <input id="c-rend" type="number" min="1" step="10" value={rendimiento}
          onChange={(e) => setRendimiento(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="c-frasco">Frasco (g)</label>
        <input id="c-frasco" type="number" min="1" step="10" value={frascoGramos}
          onChange={(e) => setFrascoGramos(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="c-fecha">Fecha de producción</label>
        <input id="c-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
    </div>
  );
}
