'use client';

/**
 * Respaldo de las entradas al hacer scroll.
 *
 * El sitio anima con animation-timeline: view(), que es nativo y no cuesta
 * JavaScript. Donde el navegador no lo soporta, este componente hace lo
 * mismo con un IntersectionObserver.
 *
 * Es deliberadamente cobarde: si algo no está disponible —el soporte existe,
 * la persona pidió menos movimiento, no hay IntersectionObserver— no toca
 * nada y la página se ve completa. La clase `js-mov` que pone en <html> es
 * la que habilita el estado inicial escondido en movimiento.css, así que sin
 * este script no hay nada invisible esperando.
 */

import { useEffect } from 'react';

const SELECTOR = '.anim-subir, .anim-lado, .anim-posar, .anim-enfocar, .anim-revelar';

export default function Movimiento() {
  useEffect(() => {
    const raiz = document.documentElement;
    const soportaNativo =
      typeof CSS !== 'undefined' &&
      CSS.supports &&
      CSS.supports('animation-timeline', 'view()');
    const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (soportaNativo || menosMovimiento || !('IntersectionObserver' in window)) return undefined;

    raiz.classList.add('js-mov');
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('visto');
          observador.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    const elementos = document.querySelectorAll(SELECTOR);
    elementos.forEach((el) => observador.observe(el));

    return () => {
      observador.disconnect();
      raiz.classList.remove('js-mov');
    };
  }, []);

  return null;
}
