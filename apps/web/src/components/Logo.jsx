'use client';

/**
 * Logotipo de SaborPuro — ilustración original en SVG.
 *
 * Una canasta de mimbre trenzado, con asa torcida, llena de fruta: manzana
 * roja, manzana verde, naranja, frambuesa, fresa y, al frente, las moras de
 * Castilla, que son el producto de la casa. Se dibujó desde cero en código;
 * no se calcó ni se recortó ninguna imagen de banco.
 *
 * Tres variantes:
 *  - `completo`: con volumen, brillos y trenzado. Para la web.
 *  - `simple`:   menos piezas y trazos más gruesos. Para la etiqueta impresa
 *                (8–12 mm), el favicon y cualquier tamaño menor a 40 px.
 *  - `mono`:     un solo color (currentColor). Para sellos y troquelados.
 *
 * Los degradados llevan un prefijo único por instancia (useId) para que
 * doce etiquetas en la misma hoja no compartan ids.
 */

import { useId } from 'react';

const VB_ANCHO = 240;
const VB_ALTO = 220;

/* ------------------------------------------------------------- piezas */

/** Granos de una mora (drupas) alrededor de (0,0). */
const DRUPAS_MORA = [
  [-3, -9], [3, -9],
  [-6, -4.5], [0, -4.5], [6, -4.5],
  [-7, 0], [-2.3, 0], [2.3, 0], [7, 0],
  [-6, 4.5], [0, 4.5], [6, 4.5],
  [-3, 9], [3, 9],
  [0, 12.5],
];

const SEMILLAS_FRESA = [
  [-6, -6], [0, -8], [6, -6], [-9, 0], [-3, -1], [3, -1], [9, 0],
  [-6, 6], [0, 5], [6, 6], [-3, 11], [3, 11], [0, 15],
];

const HOJA = 'M0 0 C 9 -10 26 -12 38 -3 C 27 7 10 9 0 0 Z';
const MANZANA = 'M0 -17 C 7 -24 25 -22 26 -3 C 27 15 14 27 0 23 C -14 27 -27 15 -26 -3 C -25 -22 -7 -24 0 -17 Z';
const FRESA = 'M0 -13 C 11 -14 16 -5 14 3 C 12 11 5 18 0 20 C -5 18 -12 11 -14 3 C -16 -5 -11 -14 0 -13 Z';
const CALIZ = 'M0 -12 L -9 -15 L -4 -11 L -11 -8 L -3 -9 L 0 -5 L 3 -9 L 11 -8 L 4 -11 L 9 -15 Z';
const CUERPO = 'M40 132 L200 132 C 197 160 188 186 172 197 Q 120 210 68 197 C 52 186 43 160 40 132 Z';
const ASA = 'M46 124 C 46 26, 194 26, 194 124';

function Hoja({ x, y, rot = 0, esc = 1, p }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${esc})`}>
      <path d={HOJA} fill={p.hoja} />
      {!p.mono && (
        <path d="M2 0 C 14 -3 26 -4 36 -3" stroke={p.hojaVena} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

function Mora({ x, y, esc = 1, p, tipo = 'mora' }) {
  const relleno = tipo === 'mora' ? p.mora : p.frambuesa;
  return (
    <g transform={`translate(${x} ${y}) scale(${esc})`}>
      <path d="M0 -12 L -5 -16 L -1 -12.5 L 0 -18 L 1 -12.5 L 5 -16 Z" fill={p.hojaOscura} />
      {DRUPAS_MORA.map(([dx, dy]) => (
        <g key={`${dx}:${dy}`}>
          <circle cx={dx} cy={dy} r="3.4" fill={relleno} />
          {!p.mono && <circle cx={dx - 1.1} cy={dy - 1.2} r="1" fill={p.brillo} />}
        </g>
      ))}
    </g>
  );
}

function Manzana({ x, y, esc = 1, p, verde = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${esc})`}>
      <path d={MANZANA} fill={verde ? p.manzanaVerde : p.manzanaRoja} />
      <path d="M0 -17 C 0 -23 2 -28 5 -31" stroke={p.tallo} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <Hoja x={4} y={-27} rot={-28} esc={0.5} p={p} />
      {!p.mono && (
        <ellipse cx="-10" cy="-7" rx="5.5" ry="9" transform="rotate(-24 -10 -7)" fill={p.brillo} />
      )}
    </g>
  );
}

function Naranja({ x, y, r = 25, p }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={p.naranja} />
      {!p.mono && (
        <>
          {[[-8, 6], [6, 10], [12, -4], [-2, 14], [-14, -2], [4, -2]].map(([dx, dy]) => (
            <circle key={`${dx}${dy}`} cx={dx} cy={dy} r="0.9" fill={p.poro} />
          ))}
          <ellipse cx={-r * 0.36} cy={-r * 0.34} rx={r * 0.22} ry={r * 0.32} transform={`rotate(-30 ${-r * 0.36} ${-r * 0.34})`} fill={p.brillo} />
        </>
      )}
      <circle cx="1" cy={-r + 3} r="1.8" fill={p.tallo} />
      <Hoja x={2} y={-r + 2} rot={-40} esc={0.48} p={p} />
    </g>
  );
}

function Fresa({ x, y, esc = 1, rot = 0, p }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${esc})`}>
      <path d={FRESA} fill={p.fresa} />
      {!p.mono &&
        SEMILLAS_FRESA.map(([dx, dy]) => (
          <ellipse key={`${dx}:${dy}`} cx={dx} cy={dy} rx="0.9" ry="1.4" fill={p.semilla} />
        ))}
      <path d={CALIZ} fill={p.hojaOscura} />
    </g>
  );
}

/**
 * Mimbre tejido por encima y por debajo: varillas verticales oscuras y,
 * sobre ellas, tiras horizontales que se curvan hacia abajo en el centro
 * y se angostan en los costados, como se ve un canasto redondo desde
 * arriba. Todo recortado por la silueta del cuerpo.
 */
function Trenzado({ p, id }) {
  const varillas = [];
  for (let x = 34; x <= 206; x += 14) {
    const abajo = 120 + (x - 120) * 0.74;
    varillas.push(<path key={`v${x}`} d={`M${x} 132 L ${abajo} 210`} />);
  }

  const tiras = [];
  for (let fila = 0, y = 135; y < 210; fila += 1, y += 8.2) {
    const desfase = fila % 2 ? 7 : 0;
    for (let x = 27 + desfase; x < 214; x += 14) {
      const t = (x + 5.5 - 120) / 92;
      const caida = 4.2 * (1 - Math.min(1, t * t));
      const ancho = 12.4 * (1 - 0.3 * Math.min(1, t * t));
      tiras.push(
        <rect
          key={`${x}:${y}`}
          x={x + (12.4 - ancho) / 2}
          y={y + caida}
          width={ancho}
          height="7"
          rx="3.5"
          fill={p.trenza}
          stroke={p.trenzaBorde}
          strokeWidth="0.6"
        />,
      );
    }
  }

  return (
    <g clipPath={`url(#${id}-cuerpo)`}>
      <g stroke="#5e3214" strokeWidth="3.4" strokeLinecap="round" opacity="0.85">{varillas}</g>
      {tiras}
    </g>
  );
}

/* -------------------------------------------------------------- paleta */

function paleta(u, mono) {
  if (mono) {
    const c = 'currentColor';
    return {
      mono: true,
      asa: c, asaTorcida: 'transparent', asaLuz: 'transparent',
      borde: c, cuerpo: c, trenza: 'transparent', trenzaBorde: 'transparent',
      hoja: c, hojaVena: c, hojaOscura: c, tallo: c,
      manzanaRoja: c, manzanaVerde: c, naranja: c, fresa: c, mora: c, frambuesa: c,
      brillo: 'transparent', semilla: 'transparent', poro: 'transparent', sombra: 'transparent',
    };
  }
  const r = (n) => `url(#${u}-${n})`;
  return {
    mono: false,
    asa: r('asa'), asaTorcida: '#7a4520', asaLuz: 'rgba(255, 236, 200, 0.55)',
    borde: r('borde'), cuerpo: r('cuerpo-g'), trenza: r('trenza'), trenzaBorde: 'rgba(92, 48, 18, 0.55)',
    hoja: r('hoja'), hojaVena: 'rgba(30, 72, 34, 0.55)', hojaOscura: '#3d7a3a', tallo: '#6b3e1e',
    manzanaRoja: r('manzana'), manzanaVerde: r('verde'), naranja: r('naranja'),
    fresa: r('fresa'), mora: r('mora'), frambuesa: r('frambuesa'),
    brillo: 'rgba(255, 255, 255, 0.42)', semilla: '#f8dd8c', poro: 'rgba(120, 60, 0, 0.35)',
    sombra: 'rgba(58, 14, 36, 0.2)',
  };
}

function Degradados({ u }) {
  const radial = (id, paradas, cx = '35%', cy = '30%', r = '72%') => (
    <radialGradient id={`${u}-${id}`} cx={cx} cy={cy} r={r}>
      {paradas.map(([o, c]) => (
        <stop key={o} offset={o} stopColor={c} />
      ))}
    </radialGradient>
  );
  const lineal = (id, paradas, x2 = '0', y2 = '1') => (
    <linearGradient id={`${u}-${id}`} x1="0" y1="0" x2={x2} y2={y2}>
      {paradas.map(([o, c]) => (
        <stop key={o} offset={o} stopColor={c} />
      ))}
    </linearGradient>
  );
  return (
    <defs>
      {lineal('asa', [['0', '#e2ab6c'], ['1', '#a8672e']], '1', '1')}
      {lineal('borde', [['0', '#dca067'], ['0.55', '#b97a3e'], ['1', '#8d5326']])}
      {lineal('cuerpo-g', [['0', '#c7894c'], ['1', '#7d4720']])}
      {lineal('trenza', [['0', '#ebbd83'], ['0.6', '#c98b4c'], ['1', '#a2622c']])}
      {lineal('hoja', [['0', '#86cf72'], ['1', '#3b7b37']], '1', '0')}
      {lineal('sombraBorde', [['0', 'rgba(50, 20, 5, 0.6)'], ['1', 'rgba(50, 20, 5, 0)']])}
      {lineal('volumen',[['0', 'rgba(60, 25, 5, 0.5)'], ['0.22', 'rgba(60, 25, 5, 0)'], ['0.78', 'rgba(60, 25, 5, 0)'], ['1', 'rgba(60, 25, 5, 0.55)']], '1', '0')}
      {radial('manzana', [['0', '#ff9a8f'], ['0.45', '#e23b4e'], ['1', '#8e1a33']])}
      {radial('verde', [['0', '#effab0'], ['0.5', '#9ccc4f'], ['1', '#4e7f27']])}
      {radial('naranja', [['0', '#ffe2a3'], ['0.5', '#f4a63b'], ['1', '#c4620f']])}
      {radial('fresa', [['0', '#ff8f86'], ['0.5', '#e3283f'], ['1', '#97102c']])}
      {radial('mora', [['0', '#a2649a'], ['0.45', '#4f1239'], ['1', '#22051a']])}
      {radial('frambuesa', [['0', '#ffb0c6'], ['0.5', '#d6457e'], ['1', '#8a1c4a']])}
      <clipPath id={`${u}-cuerpo`}>
        <path d={CUERPO} />
      </clipPath>
    </defs>
  );
}

/* ------------------------------------------------------------ emblema */

export function Emblema({
  tamano = 72,
  detalle = 'completo',
  mono = false,
  className = '',
  titulo = 'Canasta de fruta, emblema de SaborPuro',
  decorativo = false,
}) {
  const u = `sp${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const p = paleta(u, mono);
  const simple = detalle === 'simple' || mono;

  return (
    <svg
      viewBox={`0 0 ${VB_ANCHO} ${VB_ALTO}`}
      width={tamano}
      height={(tamano * VB_ALTO) / VB_ANCHO}
      className={`emblema ${className}`}
      {...(decorativo ? { 'aria-hidden': true } : { role: 'img', 'aria-label': titulo })}
      fill="none"
    >
      {!mono && <Degradados u={u} />}
      {mono && (
        <defs>
          <clipPath id={`${u}-cuerpo`}>
            <path d={CUERPO} />
          </clipPath>
        </defs>
      )}

      {/* Sombra en la mesa */}
      {!simple && <ellipse cx="120" cy="208" rx="90" ry="7" fill={p.sombra} />}

      {/* Asa torcida */}
      <path d={ASA} stroke={p.asa} strokeWidth={simple ? 13 : 12} strokeLinecap="round" />
      {!simple && (
        <>
          <path d={ASA} stroke={p.asaTorcida} strokeWidth="12" strokeDasharray="4 7" opacity="0.5" />
          <path d={ASA} stroke={p.asaLuz} strokeWidth="2.4" strokeDasharray="4 7" strokeDashoffset="2" strokeLinecap="round" transform="translate(-1.5 -2)" />
        </>
      )}

      {/* Hojas del fondo */}
      {!mono && <Hoja x={66} y={84} rot={-150} esc={simple ? 1.15 : 1.05} p={p} />}
      {!mono && <Hoja x={176} y={84} rot={-30} esc={simple ? 1.15 : 1.05} p={p} />}
      {!simple && <Hoja x={126} y={56} rot={-98} esc={0.82} p={p} />}

      {/* Fruta de atrás */}
      {!simple && <Manzana x={123} y={72} esc={0.86} p={p} verde />}
      <Manzana x={80} y={86} esc={simple ? 1.18 : 1.1} p={p} />
      <Naranja x={163} y={88} r={simple ? 29 : 27} p={p} />

      {/* Fruta del frente */}
      {!simple && <Fresa x={52} y={108} esc={1.12} rot={-24} p={p} />}
      {!simple && <Mora x={184} y={108} esc={1.05} p={p} tipo="frambuesa" />}
      {!simple && <Mora x={120} y={90} esc={1.05} p={p} />}
      <Mora x={simple ? 108 : 102} y={simple ? 106 : 106} esc={simple ? 1.45 : 1.28} p={p} />
      <Mora x={simple ? 138 : 138} y={simple ? 108 : 105} esc={simple ? 1.4 : 1.32} p={p} />
      {!simple && <Hoja x={152} y={118} rot={14} esc={0.6} p={p} />}
      {!simple && <Hoja x={86} y={121} rot={166} esc={0.6} p={p} />}

      {/* Cuerpo de la canasta */}
      <path d={CUERPO} fill={p.cuerpo} opacity={mono ? 0.85 : 1} />
      {simple ? (
        <g stroke={mono ? 'var(--emblema-fondo, #fff)' : 'rgba(92, 48, 18, 0.6)'} strokeWidth="3" strokeLinecap="round" opacity={mono ? 0.9 : 1}>
          <path d="M45 150 Q 120 160 195 150" />
          <path d="M51 170 Q 120 181 189 170" />
          <path d="M63 189 Q 120 199 177 189" />
        </g>
      ) : (
        <>
          <Trenzado p={p} id={u} />
          <path d={CUERPO} fill={`url(#${u}-volumen)`} />
          <rect x="30" y="133" width="180" height="11" fill={`url(#${u}-sombraBorde)`} clipPath={`url(#${u}-cuerpo)`} />
        </>
      )}

      {/* Borde trenzado */}
      <rect x="32" y="118" width="176" height="17" rx="8.5" fill={p.borde} />
      {!simple && (
        <g stroke="rgba(92, 48, 18, 0.45)" strokeWidth="1.6" strokeLinecap="round">
          {Array.from({ length: 24 }, (_, i) => 38 + i * 7).map((x) => (
            <path key={x} d={`M${x} 121 L ${x + 5} 132`} />
          ))}
        </g>
      )}
      {!simple && <path d="M42 121.5 L 198 121.5" stroke="rgba(255, 236, 200, 0.6)" strokeWidth="1.6" strokeLinecap="round" />}

      {/* Moras que se salieron de la canasta */}
      {!simple && <Mora x={196} y={199} esc={0.78} p={p} />}
      {!simple && <Mora x={214} y={203} esc={0.62} p={p} />}
      {!simple && <Hoja x={178} y={205} rot={-170} esc={0.55} p={p} />}
    </svg>
  );
}

/* ------------------------------------------------------------ nombre */

export function Marca({ className = '' }) {
  return (
    <span className={`marca-wm ${className}`}>
      <span className="marca-wm__sabor">Sabor</span>
      <span className="marca-wm__puro">Puro</span>
    </span>
  );
}

/**
 * Bloque de marca: la canasta ARRIBA y el nombre debajo, centrados.
 * `tamano` es el ancho de la canasta en px; el nombre escala con él
 * a través de la variable --logo-tamano.
 */
export function Logotipo({ tamano = 72, detalle = 'completo', className = '', decorativo = false }) {
  return (
    <span className={`logotipo ${className}`} style={{ '--logo-tamano': `${tamano}px` }}>
      <Emblema tamano={tamano} detalle={detalle} className="logotipo__emblema" decorativo />
      <Marca className="logotipo__nombre" />
    </span>
  );
}

export default Logotipo;
