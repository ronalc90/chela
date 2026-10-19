'use client';

/**
 * Biblioteca de etiquetas guardadas en el servidor.
 *
 * Pide la clave una sola vez (queda en este navegador), lista lo guardado
 * y deja abrir, imprimir, guardar, duplicar y borrar. Toda la
 * conversación con /api/etiquetas pasa por aquí; la página solo recibe
 * avisos de qué cambió.
 */

import { useCallback, useEffect, useId, useState } from 'react';
import { LIMITES } from '@chela/brand/plantilla';
import {
  API,
  ErrorApi,
  actualizarEtiqueta,
  borrarEtiqueta,
  crearEtiqueta,
  leerEtiqueta,
  listarEtiquetas,
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
  const [claveLeida, setClaveLeida] = useState(false);
  const [escrita, setEscrita] = useState('');
  const [lista, setLista] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [ocupado, setOcupado] = useState('');
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState(null);

  // La clave vive en este navegador: así no hay que teclearla cada vez.
  useEffect(() => {
    try {
      setClave(localStorage.getItem(LLAVE_CLAVE) || '');
    } catch {}
    setClaveLeida(true);
  }, []);

  const guardarClave = (valor) => {
    setClave(valor);
    try {
      if (valor) localStorage.setItem(LLAVE_CLAVE, valor);
      else localStorage.removeItem(LLAVE_CLAVE);
    } catch {}
  };

  /** Una clave rechazada se borra: si no, cada recarga volvería a fallar. */
  const avisar = useCallback((e) => {
    const mensaje = e instanceof ErrorApi ? e.message : 'Algo falló al hablar con el servidor.';
    setError(mensaje);
    if (e instanceof ErrorApi && e.estado === 401) {
      guardarClave('');
      setLista(null);
    }
  }, []);

  const cargar = useCallback(
    async (conClave) => {
      setCargando(true);
      setError('');
      try {
        setLista(await listarEtiquetas(conClave));
      } catch (e) {
        avisar(e);
      } finally {
        setCargando(false);
      }
    },
    [avisar],
  );

  useEffect(() => {
    if (clave) cargar(clave);
  }, [clave, cargar]);

  const entrar = (e) => {
    e.preventDefault();
    const v = escrita.trim();
    if (!v) return;
    setEscrita('');
    guardarClave(v);
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

  const eliminar = async () => {
    setConfirmar(null);
    setOcupado('eliminar');
    setError('');
    try {
      await borrarEtiqueta(clave, idActual);
      onBorrado(idActual);
      await cargar(clave);
    } catch (e) {
      // Ya no estaba: el resultado es el mismo que buscaba la persona.
      if (e instanceof ErrorApi && e.estado === 404) {
        onBorrado(idActual);
        await cargar(clave);
      } else avisar(e);
    } finally {
      setOcupado('');
    }
  };

  const traer = async (id, imprimir) => {
    setConfirmar(null);
    setOcupado(`${imprimir ? 'imprimir' : 'abrir'}-${id}`);
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

  if (!claveLeida) return <section className="biblioteca" aria-busy="true" />;

  if (!API) {
    return (
      <section className="biblioteca">
        <h2 className="biblioteca__titulo">Etiquetas guardadas</h2>
        <div className="aviso aviso--error">
          El guardado no está conectado en esta copia del sitio (falta <code>NEXT_PUBLIC_API_URL</code>).
          Puedes editar e imprimir igual; lo que escribas queda en este navegador.
        </div>
      </section>
    );
  }

  if (!clave) {
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
              Queda guardada en este navegador. Sin ella se puede editar e imprimir, pero no
              guardar en el servidor.
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
        <button type="button" className="boton-enlace" onClick={() => { guardarClave(''); setLista(null); }}>
          Cambiar clave
        </button>
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
        <button
          type="button"
          className="boton boton--fantasma boton--chico"
          disabled={!idActual || Boolean(ocupado)}
          onClick={() => setConfirmar({ tipo: 'eliminar' })}
        >
          {ocupado === 'eliminar' ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>

      {confirmar?.tipo === 'eliminar' && (
        <Confirmacion
          texto={`¿Borrar «${nombre.trim() || 'sin nombre'}» del servidor? No se puede deshacer.`}
          boton="Sí, borrar"
          alAceptar={eliminar}
        />
      )}
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
            const abriendo = ocupado === `abrir-${x.id}`;
            const imprimiendo = ocupado === `imprimir-${x.id}`;
            const esperando = confirmar?.id === x.id ? confirmar : null;
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
                    onClick={() => pedir({ tipo: 'abrir', id: x.id }, () => traer(x.id, false))}
                  >
                    {abriendo ? 'Abriendo…' : 'Abrir'}
                  </button>
                  <button
                    type="button"
                    className="boton boton--fantasma boton--chico"
                    disabled={Boolean(ocupado)}
                    onClick={() => pedir({ tipo: 'imprimir', id: x.id }, () => traer(x.id, true))}
                  >
                    {imprimiendo ? 'Preparando…' : 'Imprimir'}
                  </button>
                </div>
                {esperando && (
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
