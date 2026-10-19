'use client';

import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { svgEan13 } from '@chela/brand/barcode';
import { svgSello } from '@chela/brand/nutricional';
import { Emblema } from '@/components/Logo';

const MM_A_PX = 96 / 25.4;

/** Una etiqueta física, armada con los datos ya resueltos de la plantilla. */
export const EtiquetaImpresa = forwardRef(function EtiquetaImpresa({ r, barras, sellos }, ref) {
  const imp = r.plantilla.impresion;
  const f = r.fabricante;
  const conNombre2 = r.marca.parte2.trim().length > 0;
  const fabricante = [
    f.razonSocial,
    f.nit ? `NIT ${f.nit}` : '',
  ].filter(Boolean).join(' · ');
  const direccion = [f.direccion, f.ciudad].filter(Boolean).join(', ');

  return (
    <div
      ref={ref}
      className={`etq ${imp.bordeCorte ? '' : 'etq--sin-borde'} ${sellos.length > 1 ? 'etq--varios-sellos' : ''}`}
      style={{ '--escala': imp.escalaTexto / 100 }}
    >
      <div className="etq__cabecera">
        {/* La canasta va ARRIBA del nombre, también en el rótulo impreso. */}
        <p className={`etq__marca ${r.marca.mostrarCanasta ? '' : 'etq__marca--solo-nombre'}`}>
          {r.marca.mostrarCanasta && (
            <Emblema tamano={40} detalle="simple" className="etq__emblema" decorativo />
          )}
          <span className="etq__nombre marca-wm">
            <span className="marca-wm__sabor">{r.marca.parte1}</span>
            {conNombre2 && <span className="marca-wm__puro">{r.marca.parte2}</span>}
          </span>
        </p>
        <div className="etq__textos">
          <p className="etq__denominacion">{r.denominacion}</p>
          {r.calificativo && <p className="etq__calificativo">{r.calificativo}</p>}
          <p className="etq__peso">{r.lineaContenido}</p>
        </div>
        {sellos.length > 0 && (
          <div className="etq__sellos">
            {sellos.map((s) => (
              <div key={s.clave} className="etq__sello" dangerouslySetInnerHTML={{ __html: s.svg }} />
            ))}
          </div>
        )}
      </div>

      <div className="etq__cuerpo">
        {r.ingredientes && <p><strong>Ingredientes:</strong> {r.ingredientes}</p>}
        {r.conservacion && <p>{r.conservacion}</p>}
        {r.modoUso && <p><strong>Modo de uso:</strong> {r.modoUso}</p>}
        {(fabricante || direccion) && (
          <p>
            <strong>Fabricado por:</strong> {fabricante}
            {direccion ? `. ${direccion}` : ''}
            {f.telefono ? `. Tel. ${f.telefono}` : ''}
          </p>
        )}
        {(f.origen || f.sitio) && <p>{[f.origen, f.sitio].filter(Boolean).join(' · ')}</p>}
        {r.leyenda && <p className="etq__leyenda">{r.leyenda}</p>}
      </div>

      <div className="etq__pie">
        <div className="etq__codigos">
          <div>Lote: {r.lote}</div>
          <div>Vence: {r.fechaVencimientoCompacta}</div>
          {r.registroSanitario && <div>Reg.: {r.registroSanitario}</div>}
        </div>
        {r.mostrarCodigoBarras && barras && (
          <div className="etq__barras" dangerouslySetInnerHTML={{ __html: barras }} />
        )}
      </div>
    </div>
  );
});

/** SVG del código de barras y de los sellos, calculados una sola vez. */
export function usarGraficos(r) {
  const barras = useMemo(
    () => (r.mostrarCodigoBarras ? svgEan13(r.ean, { anchoModulo: 2, alto: 56, margen: 2, mostrarTexto: true }) : ''),
    [r.ean, r.mostrarCodigoBarras],
  );
  const claveSellos = r.sellos.map((s) => s.clave).join(',');
  const sellos = useMemo(
    () => r.sellos.map((s) => ({ clave: s.clave, svg: svgSello(s.texto, { tamano: 140 }) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [claveSellos],
  );
  return { barras, sellos };
}

/** Reparte las etiquetas en hojas según la capacidad calculada. */
function paginas(r) {
  const { porHoja } = r.capacidad;
  const total = r.plantilla.impresion.cantidad;
  if (!porHoja) return [];
  const out = [];
  for (let i = 0; i < total; i += porHoja) out.push(Math.min(porHoja, total - i));
  return out;
}

function estiloPagina(r) {
  const imp = r.plantilla.impresion;
  const c = r.capacidad;
  return {
    '--hoja-ancho': `${c.hojaAncho}mm`,
    '--hoja-alto': `${c.hojaAlto}mm`,
    '--hoja-margen': `${imp.margen}mm`,
    '--etq-ancho': `${imp.ancho}mm`,
    '--etq-alto': `${imp.alto}mm`,
    '--etq-gap': `${imp.separacion}mm`,
    '--columnas': c.columnas,
    justifyContent: imp.centrar ? 'center' : 'start',
    alignContent: imp.centrar ? 'center' : 'start',
  };
}

function Pagina({ r, n, graficos, refPrimera }) {
  return (
    <div className="pagina" style={estiloPagina(r)}>
      {Array.from({ length: n }, (_, i) => (
        <EtiquetaImpresa key={i} ref={i === 0 ? refPrimera : undefined} r={r} {...graficos} />
      ))}
    </div>
  );
}

/**
 * Vista previa en pantalla: hojas a tamaño real, reducidas para caber en
 * la columna. Además monta, fuera de la vista, la copia sin reducir que es
 * la que sale por la impresora.
 */
export default function Hojas({ r, onRecorte }) {
  const graficos = usarGraficos(r);
  const marco = useRef(null);
  const primera = useRef(null);
  const [escala, setEscala] = useState(0.5);
  const [montado, setMontado] = useState(false);
  const lista = paginas(r);
  const anchoPx = r.capacidad.hojaAncho * MM_A_PX;
  const altoPx = r.capacidad.hojaAlto * MM_A_PX;

  useEffect(() => setMontado(true), []);

  // Escala para que la hoja quepa en el ancho disponible.
  useLayoutEffect(() => {
    const el = marco.current;
    if (!el) return undefined;
    const medir = () => setEscala(Math.min(1, (el.clientWidth - 2) / anchoPx));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [anchoPx]);

  // ¿El texto obligatorio cabe en la etiqueta? Se mide la primera.
  useEffect(() => {
    const t = setTimeout(() => {
      const cuerpo = primera.current?.querySelector('.etq__cuerpo');
      onRecorte?.(cuerpo ? Math.max(0, cuerpo.scrollHeight - cuerpo.clientHeight) : 0);
    }, 80);
    return () => clearTimeout(t);
  });

  return (
    <>
      <div className="hojas" ref={marco}>
        {lista.length === 0 ? (
          <div className="aviso aviso--error">
            Con estas medidas no cabe ninguna etiqueta en la hoja. Reduce el tamaño de la etiqueta
            o los márgenes.
          </div>
        ) : (
          lista.map((n, i) => (
            <div key={i} className="hojas__item">
              <span className="hojas__numero">Hoja {i + 1} de {lista.length}</span>
              <div className="hojas__escala" style={{ width: anchoPx * escala, height: altoPx * escala }}>
                <div style={{ transform: `scale(${escala})`, transformOrigin: '0 0', width: anchoPx, height: altoPx }}>
                  <Pagina r={r} n={n} graficos={graficos} refPrimera={i === 0 ? primera : undefined} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Copia para la impresora: hija directa de <body>, a tamaño real. */}
      {montado &&
        createPortal(
          <div className="raiz-impresion" aria-hidden="true">
            <style>{`@page { size: ${r.capacidad.hojaAncho}mm ${r.capacidad.hojaAlto}mm; margin: 0; }`}</style>
            {lista.map((n, i) => (
              <Pagina key={i} r={r} n={n} graficos={graficos} />
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
