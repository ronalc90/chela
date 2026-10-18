'use client';

import { useEffect, useState } from 'react';

const ENLACES = [
  { href: '/#proceso', texto: 'El proceso' },
  { href: '/#etiqueta', texto: 'La etiqueta' },
  { href: '/#calculadora', texto: 'Calculadora' },
  { href: '/#trazabilidad', texto: 'Verifica tu lote' },
  { href: '/etiquetas', texto: 'Generar etiquetas' },
];

export default function Nav() {
  const [tema, setTema] = useState('auto');
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('eco-tema');
      if (guardado === 'dark' || guardado === 'light') setTema(guardado);
    } catch {}
  }, []);

  // Bloquea el scroll del fondo mientras el menú está abierto.
  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  // Escape cierra el menú.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [abierto]);

  function alternarTema() {
    const actual = document.documentElement.dataset.theme;
    const oscuroActivo =
      actual === 'dark' ||
      (!actual && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const siguiente = oscuroActivo ? 'light' : 'dark';
    document.documentElement.dataset.theme = siguiente;
    setTema(siguiente);
    try {
      localStorage.setItem('eco-tema', siguiente);
    } catch {}
  }

  return (
    <nav className="nav no-imprimir">
      <div className="envoltura nav__interior">
        <a className="nav__marca" href="/" aria-label="EcoCreaciones, inicio">
          <span className="nav__hoja" aria-hidden="true">&#10087;</span>
          EcoCreaciones
        </a>

        <div className="nav__enlaces">
          {ENLACES.map((e) => (
            <a key={e.href} href={e.href}>{e.texto}</a>
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

      <div
        id="menu-movil"
        className={`menu-movil ${abierto ? 'menu-movil--abierto' : ''}`}
        hidden={!abierto}
      >
        {ENLACES.map((e, i) => (
          <a
            key={e.href}
            href={e.href}
            onClick={() => setAbierto(false)}
            style={{ '--n': i }}
          >
            {e.texto}
          </a>
        ))}
      </div>
    </nav>
  );
}
