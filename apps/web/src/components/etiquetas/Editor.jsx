'use client';

import { useId } from 'react';
import { SELLOS, TAMANOS_ETIQUETA, HOJAS, LIMITES } from '@chela/brand/plantilla';

/** Lee un valor anidado: leer(doc, 'producto.denominacion'). */
export function leer(obj, ruta) {
  return ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/** Devuelve una copia con el valor cambiado en la ruta. */
export function escribir(obj, ruta, valor) {
  const [k, ...resto] = ruta.split('.');
  const base = obj && typeof obj === 'object' ? obj : {};
  return { ...base, [k]: resto.length ? escribir(base[k], resto.join('.'), valor) : valor };
}

/* -------------------------------------------------------------- controles */

function Campo({ etiqueta, ayuda, children, ancho = 1 }) {
  const id = useId();
  return (
    <div className="campo" style={ancho === 2 ? { gridColumn: '1 / -1' } : undefined}>
      <label htmlFor={id}>{etiqueta}</label>
      {children(id)}
      {ayuda && <small className="campo__ayuda">{ayuda}</small>}
    </div>
  );
}

function Texto({ doc, cambiar, ruta, etiqueta, ayuda, ancho, max = 200, placeholder, lista }) {
  const listaId = useId();
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} ancho={ancho}>
      {(id) => (
        <>
          <input
            id={id}
            value={leer(doc, ruta) ?? ''}
            maxLength={max}
            placeholder={placeholder}
            list={lista ? listaId : undefined}
            onChange={(e) => cambiar(ruta, e.target.value)}
          />
          {lista && (
            <datalist id={listaId}>
              {lista.map((o) => <option key={o} value={o} />)}
            </datalist>
          )}
        </>
      )}
    </Campo>
  );
}

function Area({ doc, cambiar, ruta, etiqueta, ayuda, filas = 3 }) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} ancho={2}>
      {(id) => (
        <textarea
          id={id}
          rows={filas}
          maxLength={LIMITES.texto}
          value={leer(doc, ruta) ?? ''}
          onChange={(e) => cambiar(ruta, e.target.value)}
        />
      )}
    </Campo>
  );
}

function Numero({ doc, cambiar, ruta, etiqueta, ayuda, min, max, paso = 1, unidad, deshabilitado }) {
  return (
    <Campo etiqueta={unidad ? `${etiqueta} (${unidad})` : etiqueta} ayuda={ayuda}>
      {(id) => (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={paso}
          disabled={deshabilitado}
          value={leer(doc, ruta) ?? ''}
          onChange={(e) => cambiar(ruta, e.target.value)}
        />
      )}
    </Campo>
  );
}

function Opciones({ doc, cambiar, ruta, etiqueta, opciones, ancho, alCambiar }) {
  return (
    <Campo etiqueta={etiqueta} ancho={ancho}>
      {(id) => (
        <select
          id={id}
          value={leer(doc, ruta) ?? ''}
          onChange={(e) => (alCambiar ? alCambiar(e.target.value) : cambiar(ruta, e.target.value))}
        >
          {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      )}
    </Campo>
  );
}

function Interruptor({ doc, cambiar, ruta, children }) {
  const activo = Boolean(leer(doc, ruta));
  return (
    <label className="interruptor">
      <input type="checkbox" checked={activo} onChange={(e) => cambiar(ruta, e.target.checked)} />
      <span className="interruptor__pista" aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}

function Segmentado({ doc, cambiar, ruta, opciones, etiqueta }) {
  const actual = leer(doc, ruta);
  return (
    <div className="segmentado" role="radiogroup" aria-label={etiqueta}>
      {opciones.map(([v, t]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={actual === v}
          className={actual === v ? 'activo' : ''}
          onClick={() => cambiar(ruta, v)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Seccion({ titulo, numero, abierta = false, resumen, children }) {
  return (
    <details className="seccion-editor" open={abierta}>
      <summary>
        <span className="seccion-editor__num">{numero}</span>
        <span className="seccion-editor__titulo">{titulo}</span>
        {resumen && <span className="seccion-editor__resumen">{resumen}</span>}
      </summary>
      <div className="seccion-editor__cuerpo">{children}</div>
    </details>
  );
}

/* ---------------------------------------------------------------- editor */

export default function Editor({ doc, r, cambiar, cambiarVarios }) {
  const p = { doc, cambiar };
  const imp = r.plantilla.impresion;

  const elegirTamano = (clave) => {
    const t = TAMANOS_ETIQUETA[clave];
    cambiarVarios(t
      ? { 'impresion.tamano': clave, 'impresion.ancho': t.ancho, 'impresion.alto': t.alto }
      : { 'impresion.tamano': clave });
  };

  const elegirHoja = (clave) => {
    const h = HOJAS[clave];
    cambiarVarios(h
      ? { 'impresion.hoja': clave, 'impresion.hojaAncho': h.ancho, 'impresion.hojaAlto': h.alto }
      : { 'impresion.hoja': clave });
  };

  const sellosManual = leer(doc, 'sellos.manual') || [];
  const alternarSello = (k) =>
    cambiar('sellos.manual', sellosManual.includes(k) ? sellosManual.filter((x) => x !== k) : [...sellosManual, k]);

  return (
    <div className="editor">
      <Seccion numero="1" titulo="Marca" abierta resumen={`${r.marca.parte1}${r.marca.parte2}`}>
        <div className="rejilla-campos">
          <Texto {...p} ruta="marca.parte1" etiqueta="Nombre — parte en negrita" max={60} />
          <Texto {...p} ruta="marca.parte2" etiqueta="Nombre — parte en cursiva" max={60} ayuda="Déjala vacía si la marca es una sola palabra." />
        </div>
        <Interruptor {...p} ruta="marca.mostrarCanasta">Mostrar la canasta debajo del nombre</Interruptor>
      </Seccion>

      <Seccion numero="2" titulo="Producto" resumen={r.denominacion}>
        <div className="rejilla-campos">
          <Texto {...p} ruta="producto.denominacion" etiqueta="Nombre del alimento" ancho={2} max={120} />
          <Texto {...p} ruta="producto.calificativo" etiqueta="Calificativo" max={60} placeholder="Artesanal" />
          <div className="campo campo--alineado">
            <Interruptor {...p} ruta="producto.mostrarCalificativo">Mostrar calificativo</Interruptor>
          </div>
          <Texto {...p} ruta="producto.prefijoContenido" etiqueta="Texto antes de la cantidad" max={40}
            lista={['Peso neto', 'Contenido neto', 'Peso escurrido', 'Contenido']} />
          <div className="rejilla-campos rejilla-campos--2">
            <Numero {...p} ruta="producto.contenido" etiqueta="Cantidad" min={0} paso={1} />
            <Opciones {...p} ruta="producto.unidad" etiqueta="Unidad"
              opciones={['g', 'kg', 'ml', 'L', 'cm³', 'unidades'].map((u) => [u, u])} />
          </div>
        </div>
        <Area {...p} ruta="producto.ingredientes" etiqueta="Ingredientes"
          ayuda="En orden de mayor a menor cantidad. Los aditivos llevan su función entre paréntesis." />
        <Area {...p} ruta="producto.conservacion" etiqueta="Conservación" />
        <Area {...p} ruta="producto.modoUso" etiqueta="Modo de uso" filas={2} />
        <Interruptor {...p} ruta="producto.mostrarModoUso">Mostrar modo de uso</Interruptor>
        <Area {...p} ruta="producto.leyenda" etiqueta="Leyenda adicional (opcional)" filas={2}
          ayuda="Se imprime en negrita. Ejemplo: «Contiene edulcorante, no recomendable en niños»." />
      </Seccion>

      <Seccion numero="3" titulo="Fabricante" resumen={r.fabricante.razonSocial}>
        <div className="rejilla-campos">
          <Texto {...p} ruta="fabricante.razonSocial" etiqueta="Nombre o razón social" ancho={2} max={160} />
          <Texto {...p} ruta="fabricante.nit" etiqueta="NIT" max={40} />
          <Texto {...p} ruta="fabricante.telefono" etiqueta="Teléfono" max={60} />
          <Texto {...p} ruta="fabricante.direccion" etiqueta="Dirección" ancho={2} max={200} />
          <Texto {...p} ruta="fabricante.ciudad" etiqueta="Barrio / ciudad" max={120} />
          <Texto {...p} ruta="fabricante.sitio" etiqueta="Sitio web" max={120} />
          <Texto {...p} ruta="fabricante.origen" etiqueta="País de origen" ancho={2} max={120} placeholder="Producto colombiano" />
        </div>
      </Seccion>

      <Seccion numero="4" titulo="Registro y código de barras" resumen={r.registroSanitario}>
        <div className="rejilla-campos">
          <Texto {...p} ruta="registro.sanitario" etiqueta="Registro / notificación sanitaria" ancho={2} max={60} />
        </div>
        <Segmentado {...p} ruta="registro.eanModo" etiqueta="Código de barras"
          opciones={[['interno', 'EAN interno'], ['propio', 'EAN propio (GS1)']]} />
        {leer(doc, 'registro.eanModo') === 'propio' ? (
          <div className="rejilla-campos">
            <Texto {...p} ruta="registro.ean" etiqueta="EAN-13 (13 dígitos)" max={13} ancho={2} />
          </div>
        ) : (
          <div className="rejilla-campos">
            <Texto {...p} ruta="registro.eanPrefijo" etiqueta="Prefijo" max={11} />
            <Texto {...p} ruta="registro.eanReferencia" etiqueta="Referencia del producto" max={12} />
          </div>
        )}
        <p className="nota-campo">Código resultante: <code>{r.ean || '—'}</code></p>
        <Interruptor {...p} ruta="registro.mostrarCodigoBarras">Imprimir el código de barras</Interruptor>
      </Seccion>

      <Seccion numero="5" titulo="Lote y fechas" resumen={`${r.lote} · vence ${r.fechaVencimientoCompacta}`}>
        <Interruptor {...p} ruta="lote.fechaHoy">Usar la fecha de hoy como producción</Interruptor>
        <div className="rejilla-campos">
          <Campo etiqueta="Fecha de producción">
            {(id) => (
              <input id={id} type="date" disabled={leer(doc, 'lote.fechaHoy')}
                value={leer(doc, 'lote.fechaHoy') ? r.fechaProduccion : leer(doc, 'lote.fechaProduccion') || ''}
                onChange={(e) => cambiar('lote.fechaProduccion', e.target.value)} />
            )}
          </Campo>
          <Numero {...p} ruta="lote.tanda" etiqueta="Tanda del día" min={1} max={99} />
        </div>
        <Segmentado {...p} ruta="lote.loteModo" etiqueta="Lote"
          opciones={[['auto', 'Lote automático'], ['manual', 'Escribir el lote']]} />
        {leer(doc, 'lote.loteModo') === 'manual' ? (
          <div className="rejilla-campos">
            <Texto {...p} ruta="lote.loteManual" etiqueta="Lote" max={40} ancho={2} />
          </div>
        ) : (
          <p className="nota-campo">Lote: <code>{r.lote}</code> (L + fecha AAMMDD + tanda)</p>
        )}
        <Segmentado {...p} ruta="lote.vencimientoModo" etiqueta="Vencimiento"
          opciones={[['auto', 'Por vida útil'], ['manual', 'Fecha exacta']]} />
        <div className="rejilla-campos">
          {leer(doc, 'lote.vencimientoModo') === 'manual' ? (
            <Campo etiqueta="Vence el">
              {(id) => (
                <input id={id} type="date" value={leer(doc, 'lote.vencimientoManual') || ''}
                  onChange={(e) => cambiar('lote.vencimientoManual', e.target.value)} />
              )}
            </Campo>
          ) : (
            <Numero {...p} ruta="lote.vidaUtilMeses" etiqueta="Vida útil" unidad="meses" min={1} max={120} />
          )}
          <div className="campo campo--alineado">
            <p className="nota-campo">Vence: <strong>{r.fechaVencimientoCompacta}</strong></p>
          </div>
        </div>
      </Seccion>

      <Seccion numero="6" titulo="Sellos de advertencia" resumen={r.sellos.length ? r.sellos.map((s) => s.texto.replace('EXCESO EN ', '')).join(', ').toLowerCase() : 'ninguno'}>
        <Segmentado {...p} ruta="sellos.modo" etiqueta="Sellos"
          opciones={[['receta', 'Calcular con la receta'], ['manual', 'Elegir a mano']]} />
        {leer(doc, 'sellos.modo') === 'manual' ? (
          <div className="casillas">
            {Object.entries(SELLOS).map(([k, t]) => (
              <label key={k} className="casilla">
                <input type="checkbox" checked={sellosManual.includes(k)} onChange={() => alternarSello(k)} />
                <span>{t.charAt(0) + t.slice(1).toLowerCase()}</span>
              </label>
            ))}
          </div>
        ) : (
          <>
            <div className="rejilla-campos rejilla-campos--4">
              <Numero {...p} ruta="sellos.receta.mora" etiqueta="Mora" unidad="g" min={0} paso={10} />
              <Numero {...p} ruta="sellos.receta.azucar" etiqueta="Azúcar" unidad="g" min={0} paso={10} />
              <Numero {...p} ruta="sellos.receta.limon" etiqueta="Limón" unidad="g" min={0} paso={5} />
              <Numero {...p} ruta="sellos.receta.rendimiento" etiqueta="Rendimiento" unidad="g" min={1} paso={10} />
            </div>
            <p className="nota-campo">{r.errores.receta || r.motivoSellos}</p>
            <p className="nota-campo">El cálculo automático está hecho para mermelada de mora. Para otros productos usa «Elegir a mano».</p>
          </>
        )}
      </Seccion>

      <Seccion numero="7" titulo="Tamaño e impresión" abierta
        resumen={`${imp.ancho} × ${imp.alto} mm · ${r.capacidad.porHoja} por hoja`}>
        <div className="rejilla-campos">
          <Opciones {...p} ruta="impresion.tamano" etiqueta="Tamaño de la etiqueta" ancho={2}
            alCambiar={elegirTamano}
            opciones={[...Object.entries(TAMANOS_ETIQUETA).map(([k, v]) => [k, v.nombre]), ['personalizado', 'Personalizado…']]} />
          <Numero {...p} ruta="impresion.ancho" etiqueta="Ancho" unidad="mm" min={LIMITES.etiqueta.min} max={LIMITES.etiqueta.max}
            deshabilitado={leer(doc, 'impresion.tamano') !== 'personalizado'} />
          <Numero {...p} ruta="impresion.alto" etiqueta="Alto" unidad="mm" min={LIMITES.etiqueta.min} max={LIMITES.etiqueta.max}
            deshabilitado={leer(doc, 'impresion.tamano') !== 'personalizado'} />

          <Opciones {...p} ruta="impresion.hoja" etiqueta="Hoja de papel" alCambiar={elegirHoja}
            opciones={[...Object.entries(HOJAS).map(([k, v]) => [k, v.nombre]), ['personalizada', 'Personalizada…']]} />
          <Opciones {...p} ruta="impresion.orientacion" etiqueta="Orientación"
            opciones={[['vertical', 'Vertical'], ['horizontal', 'Horizontal']]} />
          {leer(doc, 'impresion.hoja') === 'personalizada' && (
            <>
              <Numero {...p} ruta="impresion.hojaAncho" etiqueta="Ancho de hoja" unidad="mm" min={LIMITES.hoja.min} max={LIMITES.hoja.max} />
              <Numero {...p} ruta="impresion.hojaAlto" etiqueta="Alto de hoja" unidad="mm" min={LIMITES.hoja.min} max={LIMITES.hoja.max} />
            </>
          )}
          <Numero {...p} ruta="impresion.margen" etiqueta="Margen de la hoja" unidad="mm" min={0} max={LIMITES.margen.max} paso={0.5} />
          <Numero {...p} ruta="impresion.separacion" etiqueta="Separación entre etiquetas" unidad="mm" min={0} max={LIMITES.separacion.max} paso={0.5} />
        </div>

        <Campo etiqueta={`Tamaño del texto: ${imp.escalaTexto} %`} ancho={2}>
          {(id) => (
            <input id={id} type="range" min={LIMITES.escala.min} max={LIMITES.escala.max} step={5}
              value={leer(doc, 'impresion.escalaTexto') ?? 100}
              onChange={(e) => cambiar('impresion.escalaTexto', Number(e.target.value))} />
          )}
        </Campo>

        <div className="rejilla-campos">
          <Numero {...p} ruta="impresion.cantidad" etiqueta="Cuántas etiquetas" min={1} max={LIMITES.cantidad.max} />
          <div className="campo campo--alineado">
            <button type="button" className="boton boton--fantasma boton--chico"
              disabled={!r.capacidad.porHoja}
              onClick={() => cambiar('impresion.cantidad', Math.max(1, r.capacidad.hojas) * r.capacidad.porHoja)}>
              Llenar {r.capacidad.hojas > 1 ? `${r.capacidad.hojas} hojas` : 'la hoja'} ({Math.max(1, r.capacidad.hojas) * r.capacidad.porHoja})
            </button>
          </div>
        </div>
        <Interruptor {...p} ruta="impresion.bordeCorte">Imprimir el borde de corte de cada etiqueta</Interruptor>
        <Interruptor {...p} ruta="impresion.centrar">Centrar las etiquetas en la hoja</Interruptor>
      </Seccion>
    </div>
  );
}
