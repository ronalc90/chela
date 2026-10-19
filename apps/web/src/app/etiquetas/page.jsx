'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { construirEtiqueta, validarEtiqueta } from '@chela/brand/etiqueta';
import { svgEan13, esEanValido } from '@chela/brand/barcode';
import { svgSello } from '@chela/brand/nutricional';
import { marca, producto } from '@chela/brand/tokens';
import { Emblema, Logotipo } from '@/components/Logo';

const HOY = new Date().toISOString().slice(0, 10);

/** Tamaños de etiqueta usuales en papel adhesivo A4. */
const FORMATOS = {
  '70x50': { ancho: 70, alto: 50, nombre: '70 × 50 mm — frasco de 100 g' },
  '90x60': { ancho: 90, alto: 60, nombre: '90 × 60 mm — frasco de 250 g' },
  '60x40': { ancho: 60, alto: 40, nombre: '60 × 40 mm — formato mínimo, letra pequeña' },
};

/**
 * Cuántas etiquetas caben en una hoja A4 (210 × 297 mm) con el margen de
 * @page (8 mm por lado) y la separación de la rejilla (4 mm). Debe coincidir
 * con impresion.css; si allá cambian, cambia aquí.
 */
const A4_UTIL = { ancho: 210 - 16, alto: 297 - 16 };
const SEPARACION = 4;

function capacidadA4({ ancho, alto }) {
  const columnas = Math.floor((A4_UTIL.ancho + SEPARACION) / (ancho + SEPARACION));
  const filas = Math.floor((A4_UTIL.alto + SEPARACION) / (alto + SEPARACION));
  return { columnas, filas, porHoja: columnas * filas };
}

export default function GeneradorEtiquetas() {
  const [fecha, setFecha] = useState(HOY);
  const [tanda, setTanda] = useState(1);
  const [mora, setMora] = useState(1000);
  const [azucar, setAzucar] = useState(700);
  const [limon, setLimon] = useState(30);
  const [rendimiento, setRendimiento] = useState(1200);
  const [vidaUtil, setVidaUtil] = useState(18);
  const [neto, setNeto] = useState(producto.contenidoNetoGramos);
  const [cantidad, setCantidad] = useState(capacidadA4(FORMATOS['70x50']).porHoja);
  const [formato, setFormato] = useState('70x50');
  const [ean, setEan] = useState('');
  const [recorte, setRecorte] = useState(0);
  const refEtiqueta = useRef(null);

  const resultado = useMemo(() => {
    try {
      const etiqueta = construirEtiqueta({
        fechaProduccion: fecha,
        tanda: Number(tanda) || 1,
        gramosMora: Number(mora),
        gramosAzucar: Number(azucar),
        gramosLimon: Number(limon),
        gramosRendimiento: Number(rendimiento),
        vidaUtilMeses: Number(vidaUtil) || 18,
        producto: { ...producto, contenidoNetoGramos: Number(neto) || 100 },
        ean: ean && esEanValido(ean) ? ean : undefined,
      });
      return { etiqueta, problemas: validarEtiqueta(etiqueta), error: null };
    } catch (e) {
      return { error: e.message };
    }
  }, [fecha, tanda, mora, azucar, limon, rendimiento, vidaUtil, neto, ean]);

  const dim = FORMATOS[formato];
  const capacidad = capacidadA4(dim);

  // Si la cantidad era "una hoja llena" del formato anterior, se ajusta a
  // una hoja llena del nuevo; si la persona puso otro número, se respeta.
  function cambiarFormato(nuevo) {
    if (Number(cantidad) === capacidadA4(FORMATOS[formato]).porHoja) {
      setCantidad(capacidadA4(FORMATOS[nuevo]).porHoja);
    }
    setFormato(nuevo);
  }

  // El rótulo lleva datos que la norma exige. Si no caben en el formato
  // elegido, hay que decirlo antes de imprimir, no recortarlos en silencio.
  const medir = useCallback(() => {
    const cuerpo = refEtiqueta.current?.querySelector('.etq__cuerpo');
    if (!cuerpo) return;
    setRecorte(Math.max(0, cuerpo.scrollHeight - cuerpo.clientHeight));
  }, []);

  useEffect(() => {
    const t = setTimeout(medir, 120);
    window.addEventListener('resize', medir);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', medir);
    };
  }, [medir, formato, fecha, tanda, mora, azucar, limon, rendimiento, vidaUtil, neto, ean]);
  const n = Math.min(Math.max(Number(cantidad) || 1, 1), 60);
  const hojas = Math.ceil(n / capacidad.porHoja);

  const barras = useMemo(() => {
    if (resultado.error) return '';
    return svgEan13(resultado.etiqueta.reverso.ean, {
      anchoModulo: 2,
      alto: 56,
      margen: 2,
      mostrarTexto: true,
    });
  }, [resultado]);

  const sello = useMemo(() => {
    if (resultado.error || !resultado.etiqueta.frente.sellos.length) return '';
    return svgSello(resultado.etiqueta.frente.sellos[0].texto, { tamano: 140 });
  }, [resultado]);

  const eanInvalido = ean.length > 0 && !esEanValido(ean);

  return (
    <main style={{ paddingBlock: '32px 80px' }}>
      <div className="envoltura no-imprimir">
        <div className="gen-cabeza">
          <Link href="/" className="gen-volver">
            <span aria-hidden="true">←</span> Volver al sitio
          </Link>
        </div>

        <div className="gen-intro">
          <Link href="/" aria-label="SaborPuro, inicio" style={{ textDecoration: 'none' }}>
            <Logotipo tamano={112} />
          </Link>
          <div>
            <span className="rotulo">Para imprimir y pegar</span>
            <h1>Generador de etiquetas</h1>
            <p className="plomo">
              Llena los datos de la tanda y se arma la hoja lista para imprimir en papel adhesivo
              A4. El lote, el vencimiento, la tabla y el código de barras se calculan solos a partir
              de la receta.
            </p>
          </div>
        </div>
      </div>

      <div className="envoltura">
        <div className="herramienta">
          <aside className="panel no-imprimir">
            <h3>Datos de la tanda</h3>

            <div className="panel__grupo">
              <div className="campo">
                <label htmlFor="g-fecha">Producción</label>
                <input id="g-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="g-tanda">Tanda del día</label>
                <input id="g-tanda" type="number" min="1" max="99" value={tanda}
                  onChange={(e) => setTanda(e.target.value)} />
              </div>
            </div>

            <hr />
            <h3>Receta</h3>
            <div className="panel__grupo">
              <div className="campo">
                <label htmlFor="g-mora">Mora (g)</label>
                <input id="g-mora" type="number" min="1" step="10" value={mora}
                  onChange={(e) => setMora(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="g-azucar">Azúcar (g)</label>
                <input id="g-azucar" type="number" min="0" step="10" value={azucar}
                  onChange={(e) => setAzucar(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="g-limon">Limón (g)</label>
                <input id="g-limon" type="number" min="0" step="5" value={limon}
                  onChange={(e) => setLimon(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="g-rend">Rendimiento (g)</label>
                <input id="g-rend" type="number" min="1" step="10" value={rendimiento}
                  onChange={(e) => setRendimiento(e.target.value)} />
              </div>
            </div>

            <hr />
            <h3>Envase</h3>
            <div className="panel__grupo">
              <div className="campo">
                <label htmlFor="g-neto">Contenido neto (g)</label>
                <input id="g-neto" type="number" min="1" step="10" value={neto}
                  onChange={(e) => setNeto(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="g-vida">Vida útil (meses)</label>
                <input id="g-vida" type="number" min="1" max="60" value={vidaUtil}
                  onChange={(e) => setVidaUtil(e.target.value)} />
              </div>
            </div>

            <hr />
            <h3>Impresión</h3>
            <div className="panel__grupo--uno panel__grupo">
              <div className="campo">
                <label htmlFor="g-formato">Tamaño de etiqueta</label>
                <select id="g-formato" value={formato} onChange={(e) => cambiarFormato(e.target.value)}>
                  {Object.entries(FORMATOS).map(([k, v]) => (
                    <option key={k} value={k}>{v.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="g-cant">Cuántas etiquetas</label>
                <input id="g-cant" type="number" min="1" max="60" value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="g-ean">EAN-13 propio (opcional)</label>
                <input id="g-ean" value={ean} onChange={(e) => setEan(e.target.value)}
                  placeholder="Déjalo vacío para el interno" inputMode="numeric" spellCheck={false} />
              </div>
            </div>

            {eanInvalido && (
              <div className="aviso aviso--error" style={{ marginTop: 14 }}>
                Ese EAN-13 no es válido: el dígito verificador no cuadra. Se usará el interno.
              </div>
            )}

            <button
              className="boton"
              type="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
              onClick={() => window.print()}
            >
              Imprimir {n} {n === 1 ? 'etiqueta' : 'etiquetas'}
              {hojas > 1 ? ` · ${hojas} hojas` : ''}
            </button>

            {recorte > 1 && (
              <div className="aviso aviso--error" style={{ marginTop: 14 }}>
                En este formato no cabe todo el texto obligatorio: se están recortando unos
                {' '}{Math.ceil(recorte / 4)} mm. Usa un tamaño de etiqueta más grande antes de
                imprimir, o el rótulo saldría sin datos que la norma exige.
              </div>
            )}

            <p style={{ fontSize: '0.78rem', color: 'var(--texto-suave)', marginTop: 12, marginBottom: 0 }}>
              En el diálogo de impresión desactiva «ajustar a la página» y deja la escala en 100 %,
              o las etiquetas saldrán más pequeñas de lo que miden.
            </p>

            {resultado.problemas?.length > 0 && (
              <div className="problemas">
                {resultado.problemas.map((p) => (
                  <div key={p.campo} className={`problema problema--${p.nivel}`}>
                    <span className="problema__icono">{p.nivel === 'error' ? '!' : '•'}</span>
                    <span>{p.mensaje}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <div>
            {resultado.error ? (
              <div className="aviso aviso--error">{resultado.error}</div>
            ) : (
              <>
                <div className="hoja-cabecera no-imprimir">
                  <div>
                    <strong className="hoja-cabecera__lote">
                      Lote {resultado.etiqueta.reverso.lote}
                    </strong>
                    <span className="hoja-cabecera__vence">
                      vence {resultado.etiqueta.reverso.fechaVencimiento}
                    </span>
                  </div>
                  <div className="hoja-cabecera__pastillas">
                    <span className="pastilla">{dim.ancho} × {dim.alto} mm</span>
                    <span className="pastilla">
                      {capacidad.porHoja} por hoja A4 ({capacidad.columnas} × {capacidad.filas})
                    </span>
                    <span className={`pastilla ${hojas > 1 ? 'pastilla--alerta' : ''}`}>
                      {n} {n === 1 ? 'etiqueta' : 'etiquetas'} · {hojas} {hojas === 1 ? 'hoja' : 'hojas'}
                    </span>
                  </div>
                </div>

                <div className="hoja-marco">
                  <div
                    className="hoja"
                    style={{ '--etq-ancho': `${dim.ancho}mm`, '--etq-alto': `${dim.alto}mm` }}
                  >
                    {Array.from({ length: n }, (_, i) => (
                      <Etiqueta
                        key={i}
                        ref={i === 0 ? refEtiqueta : undefined}
                        etiqueta={resultado.etiqueta}
                        barras={barras}
                        sello={sello}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const Etiqueta = forwardRef(function Etiqueta({ etiqueta, barras, sello }, ref) {
  return (
    <div className="etq" ref={ref}>
      <div className="etq__cabecera">
        {/* La canasta va ARRIBA del nombre, también en el rótulo impreso. */}
        <p className="etq__marca">
          <Emblema tamano={40} detalle="simple" className="etq__emblema" decorativo />
          <span className="etq__nombre marca-wm">
            <span className="marca-wm__sabor">Sabor</span><span className="marca-wm__puro">Puro</span>
          </span>
        </p>
        <div className="etq__textos">
          <p className="etq__denominacion">{etiqueta.frente.denominacion}</p>
          <p className="etq__calificativo">{etiqueta.frente.calificativo}</p>
          <p className="etq__peso" style={{ marginTop: '1mm' }}>
            Peso neto: {etiqueta.frente.contenidoNeto}
          </p>
        </div>
        {sello ? (
          <div className="etq__sello" dangerouslySetInnerHTML={{ __html: sello }} />
        ) : null}
      </div>

      <div className="etq__cuerpo">
        <p>{etiqueta.reverso.listaIngredientes}</p>
        <p>{etiqueta.reverso.conservacion}</p>
        <p><strong>Modo de uso:</strong> {etiqueta.reverso.modoDeUso}</p>
        <p>
          <strong>Fabricado por:</strong> {etiqueta.reverso.fabricante}. {marca.direccion},
          {' '}{marca.localidad}, {marca.ciudad}. Tel. {etiqueta.reverso.telefono}
        </p>
        <p>Producto colombiano · {marca.sitio.replace('https://', '')}</p>
      </div>

      <div className="etq__pie">
        <div className="etq__codigos">
          <div>Lote: {etiqueta.reverso.lote}</div>
          <div>Vence: {etiqueta.reverso.fechaVencimiento}</div>
          <div>Reg.: {etiqueta.reverso.registroSanitario}</div>
        </div>
        <div className="etq__barras" dangerouslySetInnerHTML={{ __html: barras }} />
      </div>
    </div>
  );
});
