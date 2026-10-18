'use client';

import { useMemo, useState } from 'react';
import { construirEtiqueta } from '@chela/brand/etiqueta';
import { svgSello } from '@chela/brand/nutricional';
import { marca } from '@chela/brand/tokens';

/**
 * La etiqueta montada sobre la foto real del frasco.
 *
 * No es un montaje hecho con un generador de imágenes: la etiqueta se
 * compone en vivo sobre la foto con CSS. Eso tiene dos ventajas sobre un
 * render: el texto queda nítido a cualquier tamaño y, cuando cambian los
 * datos del lote, la etiqueta del frasco cambia con ellos.
 *
 * La curvatura se simula con un degradado de sombras a los costados y un
 * brillo al centro, que es como se comporta la luz sobre un cilindro.
 */
export default function FrascoConEtiqueta({ foto = '/fotos/frasco-01.jpg' }) {
  const [mostrar, setMostrar] = useState(true);

  const etiqueta = useMemo(
    () =>
      construirEtiqueta({
        fechaProduccion: new Date().toISOString().slice(0, 10),
        tanda: 1,
        gramosMora: 1000,
        gramosAzucar: 700,
        gramosLimon: 30,
        gramosRendimiento: 1200,
      }),
    [],
  );

  const sello = useMemo(
    () =>
      etiqueta.frente.sellos.length
        ? svgSello(etiqueta.frente.sellos[0].texto, { tamano: 90 })
        : '',
    [etiqueta],
  );

  return (
    <div className="montaje">
      <figure className="montaje__figura">
        <img
          src={foto}
          alt="Frasco de mermelada de mora con tapa dorada"
          width="900"
          height="1200"
          className="montaje__foto"
        />

        <div
          className={`envoltura-etq ${mostrar ? 'envoltura-etq--puesta' : ''}`}
          aria-hidden={!mostrar}
        >
          <div className="envoltura-etq__papel">
            <div className="envoltura-etq__texto">
              <p className="envoltura-etq__marca">
                <span className="envoltura-etq__hoja">&#10087;</span>
                {marca.nombre}
              </p>
              <p className="envoltura-etq__denom">{etiqueta.frente.denominacion}</p>
              <p className="envoltura-etq__peso">{etiqueta.frente.contenidoNeto}</p>
              <p className="envoltura-etq__lote">
                Lote {etiqueta.reverso.lote} · Vence {etiqueta.reverso.fechaVencimiento}
              </p>
            </div>
            {sello ? (
              <div
                className="envoltura-etq__sello"
                dangerouslySetInnerHTML={{ __html: sello }}
              />
            ) : null}
          </div>
          {/* Sombras laterales y brillo central: el frasco es un cilindro. */}
          <div className="envoltura-etq__curva" aria-hidden="true" />
        </div>
      </figure>

      <div className="montaje__control no-imprimir">
        <button
          type="button"
          className="boton boton--fantasma"
          onClick={() => setMostrar((v) => !v)}
        >
          {mostrar ? 'Ver el frasco sin etiqueta' : 'Poner la etiqueta'}
        </button>
        <p className="montaje__nota">
          La etiqueta se dibuja en vivo sobre la foto, así que el lote y la fecha que ves son los
          que se generarían hoy.
        </p>
      </div>
    </div>
  );
}
