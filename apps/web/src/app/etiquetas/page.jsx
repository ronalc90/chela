'use client';

/**
 * Generador de etiquetas.
 *
 * Todo el rótulo es editable: el estado es una sola plantilla (`doc`) que
 * en cada render se resuelve a lo que de verdad se imprime (lote, fechas,
 * EAN, sellos, capacidad de la hoja). El borrador queda en este navegador
 * para no perder nada al recargar; lo guardado con nombre vive en el
 * servidor junto con su foto, y lo maneja el catálogo de Productos.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { plantillaPorDefecto, resolverPlantilla, validarPlantilla } from '@chela/brand/plantilla';
import Editor, { escribir } from '@/components/etiquetas/Editor';
import Hojas from '@/components/etiquetas/Hojas';
import Productos from '@/components/etiquetas/Productos';
import Nav from '@/components/Nav';

const LLAVE_BORRADOR = 'puro-generador-borrador';
const PX_POR_MM = 96 / 25.4;

/** Punto de comparación para saber si una etiqueta nueva ya se tocó. */
const LIMPIO = JSON.stringify(plantillaPorDefecto());

export default function GeneradorEtiquetas() {
  const [doc, setDoc] = useState(plantillaPorDefecto);
  const [nombre, setNombre] = useState('');
  const [idActual, setIdActual] = useState(null);
  const [guardadoJson, setGuardadoJson] = useState(null);
  const [foto, setFoto] = useState(null);
  const [miniatura, setMiniatura] = useState(null);
  const [fotoGuardada, setFotoGuardada] = useState(null);
  const [recortePx, setRecortePx] = useState(0);
  const [listo, setListo] = useState(false);
  const imprimirPendiente = useRef(false);

  /* ------------------------------------------------------------ borrador */

  // Se lee una vez, ya en el navegador: así la fecha de hoy y el borrador
  // son los del equipo de la persona y no los del servidor.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(LLAVE_BORRADOR);
      if (guardado) {
        const b = JSON.parse(guardado);
        if (b && typeof b === 'object') {
          if (b.doc && typeof b.doc === 'object') setDoc(b.doc);
          if (typeof b.nombre === 'string') setNombre(b.nombre);
          if (Number.isInteger(b.id)) setIdActual(b.id);
          if (typeof b.guardadoJson === 'string') setGuardadoJson(b.guardadoJson);
          if (typeof b.foto === 'string') setFoto(b.foto);
          if (typeof b.miniatura === 'string') setMiniatura(b.miniatura);
          if (typeof b.fotoGuardada === 'string') setFotoGuardada(b.fotoGuardada);
        }
      }
    } catch {}
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    const base = { doc, nombre, id: idActual, guardadoJson };
    try {
      localStorage.setItem(
        LLAVE_BORRADOR,
        JSON.stringify({ ...base, foto, miniatura, fotoGuardada }),
      );
    } catch {
      // Una foto grande puede no caber en el almacenamiento del navegador.
      // Vale más conservar el rótulo sin la foto que perderlo todo.
      try {
        localStorage.setItem(LLAVE_BORRADOR, JSON.stringify({ ...base, miniatura }));
      } catch {}
    }
  }, [listo, doc, nombre, idActual, guardadoJson, foto, miniatura, fotoGuardada]);

  /* -------------------------------------------------------------- cambios */

  const cambiar = useCallback((ruta, valor) => {
    setDoc((d) => escribir(d, ruta, valor));
  }, []);

  const cambiarVarios = useCallback((cambios) => {
    setDoc((d) => Object.entries(cambios).reduce((acc, [ruta, v]) => escribir(acc, ruta, v), d));
  }, []);

  /* ----------------------------------------------------------- biblioteca */

  const cargarEtiqueta = useCallback((etq) => {
    setDoc(etq.datos);
    setNombre(etq.nombre);
    setIdActual(etq.id);
    setGuardadoJson(JSON.stringify(etq.datos));
    // El listado no trae la foto grande; al abrir o guardar sí llega.
    const grande = etq.foto ?? null;
    setFoto(grande);
    setMiniatura(etq.miniatura ?? null);
    setFotoGuardada(grande);
  }, []);

  const cambiarFoto = useCallback((grande, chica) => {
    setFoto(grande);
    setMiniatura(chica);
  }, []);

  const alImprimirGuardada = useCallback(
    (etq) => {
      cargarEtiqueta(etq);
      imprimirPendiente.current = true;
    },
    [cargarEtiqueta],
  );

  const alNueva = useCallback(() => {
    setDoc(plantillaPorDefecto());
    setNombre('');
    setIdActual(null);
    setGuardadoJson(null);
    setFoto(null);
    setMiniatura(null);
    setFotoGuardada(null);
  }, []);

  const alBorrado = useCallback((id) => {
    if (idActual !== id) return;
    setIdActual(null);
    setGuardadoJson(null);
    setFotoGuardada(null);
  }, [idActual]);

  // Imprimir desde la lista: primero se monta la etiqueta, después se
  // llama al diálogo; si no, saldría la anterior.
  useEffect(() => {
    if (!imprimirPendiente.current) return undefined;
    imprimirPendiente.current = false;
    const t = setTimeout(() => window.print(), 450);
    return () => clearTimeout(t);
  }, [doc]);

  /* -------------------------------------------------------------- resolver */

  const r = useMemo(() => resolverPlantilla(doc), [doc]);
  const problemas = useMemo(() => validarPlantilla(r), [r]);

  // La foto no va dentro del rótulo, así que se compara aparte.
  const sinGuardar =
    JSON.stringify(doc) !== (guardadoJson ?? LIMPIO) || (foto ?? null) !== (fotoGuardada ?? null);
  const recorteMm = Math.round((recortePx / PX_POR_MM) * 10) / 10;
  const imp = r.plantilla.impresion;
  const cap = r.capacidad;
  const hojas = Math.max(cap.hojas, 0);

  const avisos = [
    ...problemas,
    ...(recorteMm > 0.5
      ? [{
          campo: 'recorte',
          nivel: 'error',
          mensaje: `En esta etiqueta no cabe todo el texto: se recortan unos ${recorteMm} mm. Agranda la etiqueta o baja el tamaño del texto.`,
        }]
      : []),
  ];

  return (
    <>
      <Nav />

      <main className="gen-main">
      <div className="envoltura no-imprimir">
        <div className="gen-intro carga-1">
          <span className="rotulo">Para imprimir y pegar</span>
          <h1>Generador de etiquetas</h1>
          <p className="plomo">
            Cambia lo que quieras del rótulo —marca, nombre, cantidad, ingredientes, fabricante,
            registro, código de barras, lote, fechas y sellos—, ajusta el tamaño de impresión y
            guarda cada etiqueta con un nombre para volver a imprimirla cuando la necesites.
          </p>
        </div>
      </div>

      <div className="envoltura">
        <div className="gen">
          <div className="gen__vista carga-2">
            <div className="gen__barra no-imprimir">
              <div className="gen__pastillas">
                <span className="pastilla">{imp.ancho} × {imp.alto} mm</span>
                <span className="pastilla">
                  {cap.porHoja} por hoja ({cap.columnas} × {cap.filas})
                </span>
                <span className={`pastilla ${hojas > 1 ? 'pastilla--alerta' : ''}`}>
                  {imp.cantidad} {imp.cantidad === 1 ? 'etiqueta' : 'etiquetas'} ·{' '}
                  {hojas} {hojas === 1 ? 'hoja' : 'hojas'}
                </span>
                <span className="pastilla">Lote {r.lote}</span>
              </div>
              <button
                type="button"
                className="boton"
                disabled={!cap.porHoja}
                onClick={() => window.print()}
              >
                Imprimir
              </button>
            </div>

            <p className="gen__nota no-imprimir">
              En el diálogo de impresión deja la escala en 100 % y desactiva «ajustar a la página»,
              o las etiquetas saldrán más pequeñas de lo que miden. El tamaño de hoja ya va fijado
              en {cap.hojaAncho} × {cap.hojaAlto} mm.
            </p>

            {avisos.length > 0 && (
              <div className="problemas no-imprimir">
                {avisos.map((p) => (
                  <div key={`${p.campo}-${p.nivel}`} className={`problema problema--${p.nivel}`}>
                    <span className="problema__icono" aria-hidden="true">{p.nivel === 'error' ? '!' : '•'}</span>
                    <span>{p.mensaje}</span>
                  </div>
                ))}
              </div>
            )}

            {listo ? (
              <Hojas r={r} onRecorte={setRecortePx} />
            ) : (
              <p className="nota-campo">Preparando la vista previa…</p>
            )}
          </div>

          <div className="gen__panel no-imprimir carga-3">
            <Productos
              doc={doc}
              nombre={nombre}
              cambiarNombre={setNombre}
              idActual={idActual}
              sinGuardar={sinGuardar}
              foto={foto}
              miniatura={miniatura}
              cambiarFoto={cambiarFoto}
              onNueva={alNueva}
              onAbrir={cargarEtiqueta}
              onGuardado={cargarEtiqueta}
              onBorrado={alBorrado}
              onImprimir={alImprimirGuardada}
            />
            {listo && <Editor doc={doc} r={r} cambiar={cambiar} cambiarVarios={cambiarVarios} />}
          </div>
        </div>
      </div>
      </main>
    </>
  );
}
