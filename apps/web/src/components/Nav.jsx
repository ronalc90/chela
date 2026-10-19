'use client';

import { useEffect, useState } from 'react';
import { Emblema, Logotipo } from './Logo';
import { marca } from '@chela/brand/tokens';

const ENLACES = [
  { href: '/#proceso', texto: 'El proceso' },
  { href: '/#etiqueta', texto: 'La etiqueta' },
  { href: '/#calculadora', texto: 'Calculadora' },
  { href: '/#trazabilidad', texto: 'Verifica tu lote' },
  { href: '/etiquetas', texto: 'Generar etiquetas', cta: true },
];

export default function Nav() {
  const [tema, setTema] = useState('auto');
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let guardado = null;
    try {
      guardado = localStorage.getItem('puro-tema');
    } catch {}
    if (guardado === 'dark' || guardado === 'light') setTema(guardado);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTema('dark');
  }, []);

  // Bloquea el scroll del fondo mientras el menú está abierto.
  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  // Escape cierra el menú; si la ventana se agranda a escritorio, también.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    const mq = window.matchMedia('(min-width: 861px)');
    const alCambiar = (e) => e.matches && setAbierto(false);
    window.addEventListener('keydown', alPulsar);
    mq.addEventListener('change', alCambiar);
    return () => {
      window.removeEventListener('keydown', alPulsar);
      mq.removeEventListener('change', alCambiar);
    };
  }, [abierto]);

  function alternarTema() {
    const actual = document.documentElement.dataset.theme;
    const oscuroActivo =
      actual === 'dark' ||
      (!actual && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const siguiente = oscuroActivo ? 'light' : 'dark';
    const aplicar = () => {
      document.documentElement.dataset.theme = siguiente;
      setTema(siguiente);
    };
    // Transición suave entre temas donde el navegador la soporta.
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(aplicar);
    } else {
      aplicar();
    }
    try {
      localStorage.setItem('puro-tema', siguiente);
    } catch {}
  }

  return (
    <nav className={`nav no-imprimir ${abierto ? 'nav--abierto' : ''}`}>
      <div className="envoltura nav__interior">
        <a className="nav__marca" href="/" aria-label="SaborPuro, inicio">
          <Logotipo tamano={44} />
        </a>

        <div className="nav__enlaces">
          {ENLACES.map((e) => (
            <a key={e.href} href={e.href} className={e.cta ? 'nav__cta' : undefined}>
              {e.texto}
            </a>
          ))}
        </div>

        <div className="nav__acciones">
          <button
            className="tema"
            onClick={alternarTema}
            aria-label={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title="Cambiar tema"
            type="button"
          >
            {tema === 'dark' ? '☀' : '☾'}
          </button>

          <button
            className="hamburguesa"
            type="button"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            onClick={() => setAbierto((v) => !v)}
          >
            <span className={`hamburguesa__linea ${abierto ? 'hamburguesa__linea--x1' : ''}`} />
            <span className={`hamburguesa__linea ${abierto ? 'hamburguesa__linea--oculta' : ''}`} />
            <span className={`hamburguesa__linea ${abierto ? 'hamburguesa__linea--x2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Menú móvil a pantalla completa. */}
      <div
        id="menu-movil"
        className={`menu-movil ${abierto ? 'menu-movil--abierto' : ''}`}
        hidden={!abierto}
      >
        <div className="menu-movil__interior envoltura">
          <ul className="menu-movil__lista">
            {ENLACES.map((e, i) => (
              <li key={e.href} style={{ '--n': i }}>
                <a href={e.href} onClick={() => setAbierto(false)}>
                  <span className="menu-movil__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="menu-movil__texto">{e.texto}</span>
                  <span className="menu-movil__flecha" aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="menu-movil__pie" style={{ '--n': ENLACES.length }}>
            <Emblema tamano={86} className="menu-movil__emblema" decorativo />
            <div>
              <p className="menu-movil__lema">{marca.descriptor}</p>
              <p className="menu-movil__dato">
                {marca.razonSocial} · {marca.localidad}, {marca.ciudad}
              </p>
              <p className="menu-movil__dato">Tel. {marca.contacto.telefono}</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
