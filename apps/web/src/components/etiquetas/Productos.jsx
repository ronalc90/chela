'use client';

/**
 * Catálogo de productos.
 *
 * Un producto es su rótulo más una foto: la plantilla guarda todo lo que se
 * imprime, y la foto sirve para reconocerlo en la lista (no se imprime).
 * Desde aquí se crea, se abre para editar, se imprime, se duplica y se
 * borra, y solo se pide la clave si el servidor no la tiene puesta.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { LIMITES } from '@chela/brand/plantilla';
import {
  ErrorApi,
  actualizarEtiqueta,
  borrarEtiqueta,
  crearEtiqueta,
  leerEtiqueta,
  listarEtiquetas,
} from '@/lib/etiquetasApi';
import { ErrorImagen, prepararFoto } from '@/lib/imagen';

const LLAVE_CLAVE = 'puro-etiquetas-clave';
const DESDE_CUANDO_BUSCAR = 6;

/** «Mora 100 g» → «Mora 100 g (copia)», «… (copia 2)», sin repetir. */
function nombreLibre(base, usados) {
  const limpio = base.replace(/\s*\(copia( \d+)?\)$/i, '').trim() || 'Producto';
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

/** Sin tildes y en minúsculas, para que el buscador no sea quisquilloso. */
const plano = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Miniatura({ src, nombre, grande = false }) {
  const clase = `producto-foto ${grande ? 'producto-foto--grande' : ''}`;
  if (!src) {
    return (
      <span className={`${clase} producto-foto--vacia`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <circle cx="8.5" cy="10" r="1.6" />
          <path d="M4 17l4.5-4.5 3 3 3-3L20 17" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return <img className={clase} src={src} alt={`Foto de ${nombre || 'el producto'}`} loading="lazy" />;
}

export default function Productos({
  doc,
  nombre,
  cambiarNombre,
  idActual,
  sinGuardar,
  foto,
  miniatura,
  cambiarFoto,
  onNueva,
  onAbrir,
  onGuardado,
  onBorrado,
  onImprimir,
}) {
  const idClave = useId();
  const idNombre = useId();
  const idBuscar = useId();
  const archivoRef = useRef(null);

  const [clave, setClave] = useState('');
  const [arrancado, setArrancado] = useState(false);
  const [pideClave, setPideClave] = useState(false);
  const [escrita, setEscrita] = useState('');
  const [lista, setLista] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [ocupado, setOcupado] = useState('');
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const guardarClave = (valor) => {
    setClave(valor);
    try {
      if (valor) localStorage.setItem(LLAVE_CLAVE, valor);
      else localStorage.removeItem(LLAVE_CLAVE);
    } catch {}
  };

  /** Un 401 solo significa «hace falta la clave»: se pide y ya. */
  const avisar = useCallback((e) => {
    const mensaje = e instanceof ErrorApi || e instanceof ErrorImagen
      ? e.message
      : 'Algo falló al hablar con el servidor.';
    if (e instanceof ErrorApi && e.estado === 401) {
      setPideClave(true);
      setLista(null);
      try {
        localStorage.removeItem(LLAVE_CLAVE);
      } catch {}
      setClave('');
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

  /* ------------------------------------------------------------- la foto */

  const elegirFoto = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setOcupado('foto');
    setError('');
    try {
      const { foto: grande, miniatura } = await prepararFoto(archivo);
      cambiarFoto(grande, miniatura);
    } catch (err) {
      avisar(err);
    } finally {
      setOcupado('');
    }
  };

  /* ------------------------------------------------------------ acciones */

  /** Lo que se manda al servidor: el rótulo, la foto y su miniatura. */
  const cuerpo = (nombreUsar) => ({
    nombre: nombreUsar,
    datos: doc,
    foto: foto || null,
    miniatura: miniatura || null,
  });

  const guardar = async () => {
    const limpio = nombre.trim();
    if (!limpio) {
      setError('Ponle un nombre al producto antes de guardarlo.');
      return;
    }
    setOcupado('guardar');
    setError('');
    try {
      const etq = idActual
        ? await actualizarEtiqueta(clave, idActual, cuerpo(limpio))
        : await crearEtiqueta(clave, cuerpo(limpio));
      onGuardado(etq);
      await cargar(clave);
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 404 && idActual) {
        try {
          const etq = await crearEtiqueta(clave, cuerpo(limpio));
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
      const etq = await crearEtiqueta(clave, cuerpo(nombreLibre(nombre || 'Producto', nombresUsados)));
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

  const nuevo = () => {
    setConfirmar(null);
    onNueva();
  };

  /* -------------------------------------------------------------- vistas */

  const visibles = useMemo(() => {
    const todos = lista || [];
    const q = plano(busqueda).trim();
    if (!q) return todos;
    return todos.filter((x) =>
      plano(`${x.nombre} ${x.resumen?.denominacion || ''} ${x.resumen?.contenido || ''}`).includes(q));
  }, [lista, busqueda]);

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
        <h2 className="biblioteca__titulo">Productos</h2>
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
        <h2 className="biblioteca__titulo">Productos</h2>
        <span className="pastilla">{(lista || []).length}</span>
      </div>

      <div className="producto-edita">
        <div className="producto-edita__foto">
          <Miniatura src={foto} nombre={nombre} grande />
          <div className="producto-edita__botones">
            <button
              type="button"
              className="boton boton--fantasma boton--chico"
              disabled={ocupado === 'foto'}
              onClick={() => archivoRef.current?.click()}
            >
              {ocupado === 'foto' ? 'Procesando…' : foto ? 'Cambiar foto' : 'Subir foto'}
            </button>
            {foto && (
              <button
                type="button"
                className="boton-enlace"
                onClick={() => cambiarFoto(null, null)}
              >
                Quitar
              </button>
            )}
          </div>
          <input
            ref={archivoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visualmente-oculto"
            onChange={elegirFoto}
          />
        </div>

        <div className="campo">
          <label htmlFor={idNombre}>Nombre del producto</label>
          <input
            id={idNombre}
            value={nombre}
            maxLength={LIMITES.nombre}
            placeholder="Mermelada de mora 100 g"
            onChange={(e) => cambiarNombre(e.target.value)}
          />
          <small className="campo__ayuda">
            La foto es para reconocerlo en esta lista; el rótulo que se imprime no la lleva.
          </small>
        </div>
      </div>

      <div className="biblioteca__estado">
        <span className="pastilla">{idActual ? 'Guardado en el servidor' : 'Todavía sin guardar'}</span>
        {sinGuardar && <span className="pastilla pastilla--alerta">Cambios sin guardar</span>}
      </div>

      <div className="biblioteca__acciones">
        <button
          type="button"
          className="boton boton--fantasma boton--chico"
          onClick={() => pedir({ tipo: 'nuevo' }, nuevo)}
        >
          Nuevo producto
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

      {confirmar?.tipo === 'nuevo' && (
        <Confirmacion
          texto="Hay cambios sin guardar. Si empiezas uno nuevo, se pierden."
          boton="Empezar nuevo"
          alAceptar={nuevo}
        />
      )}

      {error && <div className="aviso aviso--error">{error}</div>}

      {(lista || []).length >= DESDE_CUANDO_BUSCAR && (
        <div className="campo">
          <label htmlFor={idBuscar}>Buscar</label>
          <input
            id={idBuscar}
            type="search"
            value={busqueda}
            placeholder="Nombre, alimento o cantidad"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {cargando && !lista ? (
        <p className="nota-campo">Cargando el catálogo…</p>
      ) : lista && lista.length === 0 ? (
        <p className="nota-campo">
          Todavía no hay productos. Ponle un nombre a este, súbele una foto si quieres y pulsa
          «Guardar».
        </p>
      ) : visibles.length === 0 ? (
        <p className="nota-campo">Ningún producto coincide con «{busqueda}».</p>
      ) : (
        <ul className="biblioteca__lista">
          {visibles.map((x) => {
            const esperando = confirmar?.id === x.id ? confirmar : null;
            const estado = (accion) => ocupado === `${accion}-${x.id}`;
            return (
              <li key={x.id} className={`guardada ${x.id === idActual ? 'guardada--actual' : ''}`}>
                <div className="guardada__datos">
                  <Miniatura src={x.miniatura} nombre={x.nombre} />
                  <div className="guardada__texto">
                    <strong className="guardada__nombre">{x.nombre}</strong>
                    <span className="guardada__resumen">
                      {[x.resumen?.denominacion, x.resumen?.contenido, x.resumen?.tamano]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className="guardada__fecha">Guardado el {fechaCorta(x.actualizadoEn)}</span>
                  </div>
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
