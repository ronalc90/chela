/**
 * Logotipo de SaborPuro — dibujo original en SVG.
 *
 * Una canasta de mimbre con fruta encima. Vectorial a propósito: se
 * imprime nítida a 10 mm en la etiqueta y a pantalla completa en la web,
 * y la versión de un solo color sirve para sellos y troquelados.
 */

export function Emblema({ tamano = 72, mono = false, className = '' }) {
  const c = mono
    ? {
        mimbre: 'currentColor', mimbreOsc: 'currentColor', rim: 'currentColor',
        mora: 'currentColor', moraOsc: 'currentColor', ambar: 'currentColor',
        rojo: 'currentColor', hoja: 'currentColor', brillo: 'transparent',
      }
    : {
        mimbre: '#B5783F', mimbreOsc: '#8C5A2E', rim: '#9A6433',
        mora: '#6B1F46', moraOsc: '#45102C', ambar: '#E8A33D',
        rojo: '#C8365E', hoja: '#4E8352', brillo: 'rgba(255,255,255,0.45)',
      };

  const opa = mono ? 0.55 : 1;

  return (
    <svg
      viewBox="0 0 120 108"
      width={tamano}
      height={(tamano * 108) / 120}
      className={className}
      role="img"
      aria-label="Canasta de fruta, emblema de SaborPuro"
      fill="none"
    >
      {/* Asa de la canasta */}
      <path
        d="M30 62 A30 26 0 0 1 90 62"
        stroke={c.mimbre}
        strokeWidth="5.5"
        strokeLinecap="round"
        opacity={opa}
      />
      <path
        d="M30 62 A30 26 0 0 1 90 62"
        stroke={c.mimbreOsc}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="4 5"
        opacity={mono ? 0.3 : 0.55}
      />

      {/* Hojas que asoman */}
      <path d="M26 60 q-9 -10 -3 -18 q10 3 11 16z" fill={c.hoja} opacity={opa} />
      <path d="M96 58 q10 -9 5 -18 q-11 4 -12 17z" fill={c.hoja} opacity={opa} />

      {/* Fruta grande de ámbar */}
      <circle cx="44" cy="50" r="14" fill={c.ambar} opacity={opa} />
      <path d="M44 36 q3 -5 8 -6 q-2 5 -6 7z" fill={c.hoja} opacity={opa} />
      <circle cx="39" cy="45" r="4" fill={c.brillo} />

      {/* Fruta roja */}
      <circle cx="74" cy="52" r="12.5" fill={c.rojo} opacity={opa} />
      <circle cx="69.5" cy="47.5" r="3.4" fill={c.brillo} />

      {/* Racimo de mora: el producto de la casa */}
      <g opacity={opa}>
        <circle cx="59" cy="42" r="5" fill={c.mora} />
        <circle cx="66" cy="40" r="4.6" fill={c.moraOsc} />
        <circle cx="62.5" cy="34.5" r="4.4" fill={c.mora} />
        <circle cx="55.5" cy="35.5" r="4.2" fill={c.moraOsc} />
        <circle cx="69.5" cy="34" r="3.6" fill={c.mora} />
        <path d="M62 29 q1.5 -6 7 -7 q-2 6 -5 8z" fill={c.hoja} />
      </g>

      {/* Borde superior de la canasta */}
      <rect x="18" y="60" width="84" height="9" rx="4.5" fill={c.rim} opacity={opa} />

      {/* Cuerpo de la canasta */}
      <path
        d="M22 69 L98 69 L91 97 Q60 104 29 97 Z"
        fill={c.mimbre}
        opacity={opa}
      />

      {/* Trenzado del mimbre */}
      <g stroke={c.mimbreOsc} strokeWidth="1.5" opacity={mono ? 0.32 : 0.52} strokeLinecap="round">
        <path d="M26 77 Q60 82 94 77" />
        <path d="M27.5 85 Q60 90 92.5 85" />
        <path d="M29 93 Q60 98.5 91 93" />
        <path d="M34 70 L36 99" />
        <path d="M47 70 L48 101" />
        <path d="M60 70 L60 102" />
        <path d="M73 70 L72 101" />
        <path d="M86 70 L84 99" />
      </g>
    </svg>
  );
}

/** Emblema + nombre, apilados. El nombre va arriba. */
export function Logotipo({ tamano = 72, className = '' }) {
  return (
    <span className={`logotipo ${className}`}>
      <span className="logotipo__nombre">
        <span className="marca-wm__sabor">Sabor</span>
        <span className="marca-wm__puro">Puro</span>
      </span>
      <Emblema tamano={tamano} className="logotipo__emblema" />
    </span>
  );
}

export default Logotipo;
