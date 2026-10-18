'use client';

import { useState } from 'react';
import { parsearLote } from '@chela/brand/lote';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function Trazabilidad() {
  const [codigo, setCodigo] = useState('');
  const [estado, setEstado] = useState('inicial'); // inicial | cargando | ok | vacio | error
  const [datos, setDatos] = useState(null);
  const [mensaje, setMensaje] = useState('');

  async function consultar(e) {
    e.preventDefault();
    const limpio = codigo.trim().toUpperCase();

    if (!parsearLote(limpio)) {
      setEstado('error');
      setMensaje('El código no tiene el formato esperado. Debe verse así: L261018-01');
      return;
    }

    if (!API) {
      setEstado('error');
      setMensaje('El servicio de trazabilidad aún no está conectado. Vuelve a intentarlo en un momento.');
      return;
    }

    setEstado('cargando');
    try {
      const res = await fetch(`${API}/api/lotes/${encodeURIComponent(limpio)}`);
      if (res.status === 404) {
        setEstado('vacio');
        setMensaje(`No encontramos el lote ${limpio} en nuestros registros.`);
        return;
      }
      if (!res.ok) throw new Error(`Respuesta ${res.status}`);
      const json = await res.json();
      setDatos(json);
      setEstado('ok');
    } catch {
      setEstado('error');
      setMensaje('No pudimos consultar el lote en este momento. Inténtalo de nuevo.');
    }
  }

  return (
    <div className="tarjeta">
      <form onSubmit={consultar} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="campo" style={{ flex: '1 1 220px' }}>
          <label htmlFor="t-lote">Código de lote del frasco</label>
          <input
            id="t-lote"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="L261018-01"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button className="boton" type="submit" disabled={estado === 'cargando'}>
          {estado === 'cargando' ? 'Consultando…' : 'Verificar'}
        </button>
      </form>

      <div aria-live="polite">
        {(estado === 'error' || estado === 'vacio') && (
          <div className={estado === 'error' ? 'aviso aviso--error' : 'aviso'}>{mensaje}</div>
        )}

        {estado === 'ok' && datos && (
          <div style={{ marginTop: 24 }}>
            <p className="explica__titulo">Lote {datos.lote.codigo}</p>
            <div className="metricas">
              <div className="metrica">
                <span className="metrica__valor" style={{ fontSize: '1.1rem' }}>
                  {datos.etiqueta.lote.fechaProduccionCompacta}
                </span>
                <span className="metrica__nombre">Producido</span>
              </div>
              <div className="metrica">
                <span className="metrica__valor" style={{ fontSize: '1.1rem' }}>
                  {datos.etiqueta.lote.fechaVencimientoCompacta}
                </span>
                <span className="metrica__nombre">Vence</span>
              </div>
              <div className="metrica">
                <span className="metrica__valor">{datos.etiqueta.analisis.porcentajeFruta}%</span>
                <span className="metrica__nombre">Fruta</span>
              </div>
              <div className="metrica">
                <span className="metrica__valor">{datos.etiqueta.analisis.brixAproximado}</span>
                <span className="metrica__nombre">°Brix aprox.</span>
              </div>
            </div>
            <p style={{ marginTop: 18, color: 'var(--texto-suave)' }}>
              Elaborado por {datos.etiqueta.reverso.fabricante} en {datos.etiqueta.reverso.direccion}.
              Ingredientes de esta tanda: {datos.etiqueta.reverso.listaIngredientes.replace(/^Ingredientes:\s*/, '')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
