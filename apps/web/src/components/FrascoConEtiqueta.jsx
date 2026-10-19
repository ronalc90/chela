'use client';

import { useMemo, useState } from 'react';
import { construirEtiqueta } from '@chela/brand/etiqueta';
import { svgSello } from '@chela/brand/nutricional';
import { Emblema } from './Logo';

/**
 * Foto del frasco con la etiqueta de 100 g puesta encima.
 *
 * No es un montaje hecho con un generador de imágenes: la etiqueta se
 * compone en vivo sobre la foto con CSS. Eso tiene dos ventajas sobre un
 * render: el texto queda nítido a cualquier tamaño y, cuando cambian los
 * datos del lote, la etiqueta del frasco cambia con ellos.
 *
 * Cada foto trae su propia geometría: dónde queda el cuerpo del frasco
 * (en % de la foto) y si la cámara lo ve desde arriba, en cuyo caso los
 * bordes de la etiqueta se curvan hacia abajo en el centro, igual que el
 * borde de la tapa.
 */

export const FOTOS_FRASCO = {
  estudio: {
    src: '/fotos/frasco-estudio.jpg',
    alt: 'Frasco de mermelada de mora con tapa dorada sobre fondo de miel',
    ancho: 1136,
    alto: 1408,
    // Cuerpo de vidrio entre el aro de la tapa y la base.
    etiqueta: { x: 26, y: 54.5, w: 49, h: 20.5 },
    curva: true,
  },
};

export default function FrascoConEtiqueta({
  foto = 'estudio',
  conEtiqueta = true,
  control = true,
  pie = null,
  className = '',
}) {
  const datos = FOTOS_FRASCO[foto] ?? FOTOS_FRASCO.estudio;
  const [mostrar, setMostrar] = useState(conEtiqueta);

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

  const { x, y, w, h } = datos.etiqueta;
  const estilo = {
    '--foto-ratio': `${datos.ancho} / ${datos.alto}`,
    '--etq-x': `${x}%`,
    '--etq-y': `${y}%`,
    '--etq-w': `${w}%`,
    '--etq-h': `${h}%`,
  };

  return (
    <div className={`montaje ${className}`}>
      <figure className="montaje__figura" style={estilo}>
        <img
          src={datos.src}
          alt={`${datos.alt}${mostrar ? ', con la etiqueta de 100 g' : ', sin etiqueta'}`}
          width={datos.ancho}
          height={datos.alto}
          className="montaje__foto"
        />

        <div
          className={[
            'envoltura-etq',
            mostrar ? 'envoltura-etq--puesta' : '',
            datos.curva ? 'envoltura-etq--curva' : '',
          ].join(' ')}
          aria-hidden={!mostrar}
        >
          <div className="envoltura-etq__papel">
            <div className="envoltura-etq__fila">
              {/* Nombre arriba de la canasta, como en toda la marca. */}
              <p className="envoltura-etq__marca">
                <span className="envoltura-etq__nombre">
                  <span className="marca-wm__sabor">Sabor</span><span className="marca-wm__puro">Puro</span>
                </span>
                <Emblema detalle="simple" tamano={48} className="envoltura-etq__emblema" decorativo />
              </p>
              <div className="envoltura-etq__texto">
                <p className="envoltura-etq__denom">{etiqueta.frente.denominacion}</p>
                <p className="envoltura-etq__peso">{etiqueta.frente.contenidoNeto}</p>
              </div>
              {sello ? (
                <div
                  className="envoltura-etq__sello"
                  dangerouslySetInnerHTML={{ __html: sello }}
                />
              ) : null}
            </div>
            {/* A lo ancho: si compite con el sello, se corta. */}
            <p className="envoltura-etq__lote">
              Lote {etiqueta.reverso.lote} · Vence {etiqueta.reverso.fechaVencimiento}
            </p>
          </div>
          {/* Sombras laterales y brillo central: el frasco es un cilindro. */}
          <div className="envoltura-etq__curva" aria-hidden="true" />
        </div>

        {pie ? <figcaption className="montaje__pie">{pie}</figcaption> : null}
      </figure>

      {control ? (
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
      ) : null}
    </div>
  );
}
