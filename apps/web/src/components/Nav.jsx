'use client';

import { useEffect, useState } from 'react';

const ENLACES = [
  { href: '#proceso', texto: 'El proceso' },
  { href: '#etiqueta', texto: 'La etiqueta' },
  { href: '#calculadora', texto: 'Calculadora' },
  { href: '#trazabilidad', texto: 'Verifica tu lote' },
];

export default function Nav() {
  const [tema, setTema] = useState('auto');

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('garo-tema');
      if (guardado === 'dark' || guardado === 'light') setTema(guardado);
    } catch {}
  }, []);

  function alternar() {
    const actual = document.documentElement.dataset.theme;
    const oscuroActivo =
      actual === 'dark' ||
      (!actual && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const siguiente = oscuroActivo ? 'light' : 'dark';
    document.documentElement.dataset.theme = siguiente;
    setTema(siguiente);
    try {
      localStorage.setItem('garo-tema', siguiente);
    } catch {}
  }

  return (
    <nav className="nav">
      <div className="envoltura nav__interior">
        <a className="nav__marca" href="#inicio" aria-label="GaRo, inicio">
          <span>G</span><span>a</span><span>R</span><span>o</span>
        </a>
        <div className="nav__enlaces">
          {ENLACES.map((e) => (
            <a key={e.href} href={e.href}>{e.texto}</a>
          ))}
          <button
            className="tema"
            onClick={alternar}
            aria-label={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title="Cambiar tema"
            type="button"
          >
            {tema === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </nav>
  );
}
