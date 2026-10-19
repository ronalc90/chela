'use client';

/**
 * Biblioteca de etiquetas guardadas.
 *
 * Abre mostrando la lista: cada etiqueta se puede editar, imprimir o
 * borrar desde su propia fila. Solo pide la clave si el servidor no la
 * tiene puesta (ver lib/etiquetasApi.js); entonces queda guardada en este
 * navegador y no se vuelve a preguntar.
 */

import { useCallback, useEffect, useId, useState } from 'react';
import { LIMITES } from '@chela/brand/plantilla';
import {
  ErrorApi,
  actualizarEtiqueta,
  borrarEtiqueta,
  crearEtiqueta,
  leerEtiqueta,
  listarEtiquetas,
  necesitaClave,
} from '@/lib/etiquetasApi';

const LLAVE_CLAVE = 'puro-etiquetas-clave';

/** «Mora 100 g» → «Mora 100 g (copia)», «… (copia 2)», sin repetir. */
function nombreLibre(base, usados) {
  const limpio = base.replace(/\s*\(copia( \d+)?\)$/i, '').trim() || 'Etiqueta';
  const tomados = new Set(usados.map((n) => n.trim().toLowerCase()));
  let intento = `${limpio} (copia)`;
  for (let i = 2; tomados.has(intento.toLowerCase()); i += 1) intento = `${limpio} (copia ${i})`;
  return intento.slice(0, LIMITES.nombre);
}

function fechaCorta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function Biblioteca({
  doc,
  nombre,
  cambiarNombre,
  idActual,
  sinGuardar,
  onNueva,
  onAbrir,
  onGuardado,
  onBorrado,
  onImprimir,
}) {
  const idClave = useId();
  const idNombre = useId();

  const [clave, setClave] = useState('');
  const [arrancado, setArrancado] = useState(false);
  const [pideClave, setPideClave] = useState(false);
  const [escrita, setEscrita] = useState('');
  const [lista, setLista] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [ocupado, setOcupado] = useState('');
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState(null);

  const guardarClave = (valor) => {
    setClave(valor);
    try {
      if (valor) localStorage.setItem(LLAVE_CLAVE, valor);
      else localStorage.removeItem(LLAVE_CLAVE);
    } catch {}
  };

  /** Un 401 solo significa «hace falta la clave»: se pide y ya. */
  const avisar = useCallback((e) => {
    const mensaje = e instanceof ErrorApi ? e.message : 'Algo falló al hablar con el servidor.';
    if (e instanceof ErrorApi && e.estado === 401) {
      setPideClave(true);
      setLista(null);
      try {
        localStorage.removeItem(LLAVE_CLAVE);
      } catch {}
      setClave('');
      setError(mensaje);
      return;
    }
    setError(mensaje);
  }, []);

  const cargar = useCallback(
    async (conClave) => {
      setCargando(true);
      setError('');
      try {
        setLista(await listarEtiquetas(conClave));
        setPideClave(false);
      } catch (e) {
        avisar(e);
      } finally {
        setCargando(false);
      }
    },
    [avisar],
  );

  // Primer intento: por el puente del servidor, con la clave guardada por si
  // hace falta. Si no hace falta, la persona no se entera de que existe.
  useEffect(() => {
    let guardada = '';
    try {
      guardada = localStorage.getItem(LLAVE_CLAVE) || '';
    } catch {}
    setClave(guardada);
    setArrancado(true);
    cargar(guardada);
  }, [cargar]);

  const entrar = (e) => {
    e.preventDefault();
    const v = escrita.trim();
    if (!v) return;
    setEscrita('');
    guardarClave(v);
    cargar(v);
  };

  const nombresUsados = (lista || []).map((x) => x.nombre);

  /* ------------------------------------------------------------ acciones */

  const guardar = async () => {
    const limpio = nombre.trim();
    if (!limpio) {
      setError('Ponle un nombre a la etiqueta antes de guardarla.');
      return;
    }
    setOcupado('guardar');
    setError('');
    try {
      const etq = idActual
        ? await actualizarEtiqueta(clave, idActual, { nombre: limpio, datos: doc })
        : await crearEtiqueta(clave, { nombre: limpio, datos: doc });
      onGuardado(etq);
      await cargar(clave);
    } catch (e) {
      // Si la que creíamos guardada ya no existe, se vuelve a crear.
      if (e instanceof ErrorApi && e.estado === 404 && idActual) {
        try {
          const etq = await crearEtiqueta(clave, { nombre: limpio, datos: doc });
          onGuardado(etq);
          await cargar(clave);
          return;
        } catch (e2) {
          avisar(e2);
          return;
        }
      }
      avisar(e);
    } finally {
      setOcupado('');
    }
  };

  const duplicar = async () => {
    setOcupado('duplicar');
    setError('');
    try {
      const etq = await crearEtiqueta(clave, {
        nombre: nombreLibre(nombre || 'Etiqueta', nombresUsados),
        datos: doc,
      });
      onGuardado(etq);
      await cargar(clave);
    } catch (e) {
      avisar(e);
    } finally {
      setOcupado('');
    }
  };

  const eliminar = async (id) => {
    setConfirmar(null);
    setOcupado(`eliminar-${id}`);
    setError('');
    try {
      await borrarEtiqueta(clave, id);
      onBorrado(id);
      await cargar(clave);
    } catch (e) {
      // Ya no estaba: el resultado es el que buscaba la persona.
      if (e instanceof ErrorApi && e.estado === 404) {
        onBorrado(id);
        await cargar(clave);
      } else avisar(e);
    } finally {
      setOcupado('');
    }
  };

  const traer = async (id, imprimir) => {
    setConfirmar(null);
    setOcupado(`${imprimir ? 'imprimir' : 'editar'}-${id}`);
    setError('');
    try {
      const etq = await leerEtiqueta(clave, id);
      if (imprimir) onImprimir(etq);
      else onAbrir(etq);
    } catch (e) {
      avisar(e);
      if (e instanceof ErrorApi && e.estado === 404) await cargar(clave);
    } finally {
      setOcupado('');
    }
  };

  /** Nada que pise cambios sin guardar ocurre sin preguntar. */
  const pedir = (accion, hacer) => {
    if (sinGuardar) setConfirmar(accion);
    else hacer();
  };

  const nueva = () => {
    setConfirmar(null);
    onNueva();
  };

  /* -------------------------------------------------------------- vistas */

  const Confirmacion = ({ texto, boton, alAceptar }) => (
    <div className="confirmar">
      <span>{texto}</span>
      <span className="confirmar__botones">
        <button type="button" className="boton boton--chico" onClick={alAceptar}>{boton}</button>
        <button type="button" className="boton boton--fantasma boton--chico" onClick={() => setConfirmar(null)}>
          Cancelar
        </button>
      </span>
    </div>
  );

  if (!arrancado) return <section className="biblioteca" aria-busy="true" />;

  if (pideClave) {
    return (
      <section className="biblioteca">
        <h2 className="biblioteca__titulo">Etiquetas guardadas</h2>
        <form className="biblioteca__clave" onSubmit={entrar}>
          <div className="campo">
            <label htmlFor={idClave}>Clave de acceso</label>
            <input
              id={idClave}
              type="password"
              value={escrita}
              autoComplete="current-password"
              placeholder="La clave del servidor"
              onChange={(e) => setEscrita(e.target.value)}
            />
            <small className="campo__ayuda">
              Queda guardada en este navegador y no se vuelve a pedir. Sin ella puedes editar e
              imprimir igual, pero no guardar.
            </small>
          </div>
          <button type="submit" className="boton boton--chico" disabled={!escrita.trim()}>Entrar</button>
        </form>
        {error && <div className="aviso aviso--error">{error}</div>}
      </section>
    );
  }

  return (
    <section className="biblioteca">
      <div className="biblioteca__cabeza">
        <h2 className="biblioteca__titulo">Etiquetas guardadas</h2>
        <span className="pastilla">{(lista || []).length}</span>
      </div>

      <div className="campo">
        <label htmlFor={idNombre}>Nombre de esta etiqueta</label>
        <input
          id={idNombre}
          value={nombre}
          maxLength={LIMITES.nombre}
          placeholder="Mora 100 g — frasco chico"
          onChange={(e) => cambiarNombre(e.target.value)}
        />
      </div>

      <div className="biblioteca__estado">
        <span className="pastilla">{idActual ? 'Guardada en el servidor' : 'Todavía sin guardar'}</span>
        {sinGuardar && <span className="pastilla pastilla--alerta">Cambios sin guardar</span>}
      </div>

      <div className="biblioteca__acciones">
        <button
          type="button"
          className="boton boton--fantasma boton--chico"
          onClick={() => pedir({ tipo: 'nueva' }, nueva)}
        >
          Nueva
        </button>
        <button type="button" className="boton boton--chico" disabled={Boolean(ocupado)} onClick={guardar}>
          {ocupado === 'guardar' ? 'Guardando…' : idActual ? 'Guardar cambios' : 'Guardar'}
        </button>
        <button
          type="button"
          className="boton boton--fantasma boton--chico"
          disabled={Boolean(ocupado)}
          onClick={duplicar}
        >
          {ocupado === 'duplicar' ? 'Duplicando…' : 'Duplicar'}
        </button>
      </div>

      {confirmar?.tipo === 'nueva' && (
        <Confirmacion
          texto="Hay cambios sin guardar. Si empiezas una nueva, se pierden."
          boton="Empezar nueva"
          alAceptar={nueva}
        />
      )}

      {error && <div className="aviso aviso--error">{error}</div>}

      {cargando && !lista ? (
        <p className="nota-campo">Cargando lo guardado…</p>
      ) : lista && lista.length === 0 ? (
        <p className="nota-campo">
          Todavía no hay etiquetas guardadas. Ponle un nombre a esta y pulsa «Guardar».
        </p>
      ) : (
        <ul className="biblioteca__lista">
          {(lista || []).map((x) => {
            const esperando = confirmar?.id === x.id ? confirmar : null;
            const estado = (accion) => ocupado === `${accion}-${x.id}`;
            return (
              <li key={x.id} className={`guardada ${x.id === idActual ? 'guardada--actual' : ''}`}>
                <div className="guardada__datos">
                  <strong className="guardada__nombre">{x.nombre}</strong>
                  <span className="guardada__resumen">
                    {[x.resumen?.denominacion, x.resumen?.contenido, x.resumen?.tamano]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <span className="guardada__fecha">Guardada el {fechaCorta(x.actualizadoEn)}</span>
                </div>
                <div className="guardada__botones">
                  <button
                    type="button"
                    className="boton boton--fantasma boton--chico"
                    disabled={Boolean(ocupado)}
                    onClick={() => pedir({ tipo: 'editar', id: x.id }, () => traer(x.id, false))}
                  >
                    {estado('editar') ? 'Abriendo…' : 'Editar'}
                  </button>
                  <button
                    type="button"
                    className="boton boton--fantasma boton--chico"
                    disabled={Boolean(ocupado)}
                    onClick={() => pedir({ tipo: 'imprimir', id: x.id }, () => traer(x.id, true))}
                  >
                    {estado('imprimir') ? 'Preparando…' : 'Imprimir'}
                  </button>
                  <button
                    type="button"
                    className="boton boton--fantasma boton--chico boton--peligro"
                    disabled={Boolean(ocupado)}
                    onClick={() => setConfirmar({ tipo: 'eliminar', id: x.id, nombre: x.nombre })}
                  >
                    {estado('eliminar') ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
                {esperando?.tipo === 'eliminar' && (
                  <Confirmacion
                    texto={`¿Borrar «${esperando.nombre}» del servidor? No se puede deshacer.`}
                    boton="Sí, borrar"
                    alAceptar={() => eliminar(x.id)}
                  />
                )}
                {(esperando?.tipo === 'editar' || esperando?.tipo === 'imprimir') && (
                  <Confirmacion
                    texto="Hay cambios sin guardar en lo que tienes abierto."
                    boton={esperando.tipo === 'imprimir' ? 'Abrir e imprimir' : 'Abrir de todos modos'}
                    alAceptar={() => traer(x.id, esperando.tipo === 'imprimir')}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
