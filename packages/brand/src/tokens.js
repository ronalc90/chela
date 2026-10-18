/**
 * Identidad de marca — ARCHIVO UNICO DE CONFIGURACION.
 *
 * Los datos salen de la etiqueta hecha a mano y del tablero de referencia
 * (Resolucion 5109 de 2005). Cambiar algo aqui se propaga a la web, a la
 * etiqueta digital, al sticker y al libro de recetas sin tocar nada mas.
 *
 * PENDIENTES POR RESOLVER (hay dos versiones distintas en las fuentes):
 *  - Telefono: 311 583 9051 (tablero) vs 321 383 8226 (etiqueta a mano).
 *  - Registro sanitario: NSA-8520-951 (tablero) vs RSA 11783305 (etiqueta).
 *  - Direccion: TV 7D 67-80 sur, Monteblanco (tablero) vs la version de la
 *    etiqueta, que no se alcanza a leer completa en la foto.
 * Los campos marcados VERIFICAR usan la version del tablero, que es la que
 * sigue la norma, pero hay que confirmarlos antes de mandar a imprenta.
 */

export const marca = {
  nombre: 'GaRo',
  nombreCorto: 'GaRo',
  descriptor: 'Mermelada de mora casera',
  eslogan: 'Hecha por mujeres usmeñas',
  razonSocial: 'Mujeres Usmeñas',
  nit: 'PENDIENTE — NIT',
  direccion: 'TV 7D 67-80 sur, Monteblanco',
  localidad: 'Usme',
  ciudad: 'Bogotá D.C.',
  pais: 'Colombia',
  // VERIFICAR: el tablero dice NSA-8520-951; la etiqueta a mano, RSA 11783305.
  registroSanitario: 'NSA-8520-951',
  registroSanitarioAlterno: 'RSA 11783305',
  contacto: {
    // VERIFICAR: la etiqueta a mano trae 321 383 8226.
    telefono: '311 583 9051',
    telefonoAlterno: '321 383 8226',
    whatsapp: '+57 311 583 9051',
    email: 'PENDIENTE — correo',
  },
};

export const producto = {
  denominacion: 'Mermelada de mora',
  calificativo: 'Casera',
  // Orden decreciente de proporcion, con la funcion tecnologica del limon
  // declarada entre parentesis como exige el rotulado.
  ingredientes: [
    { nombre: 'Mora', funcion: null },
    { nombre: 'Azúcar', funcion: null },
    { nombre: 'Limón', funcion: 'regulador de acidez' },
  ],
  contenidoNetoGramos: 100,
  conservacion:
    'Conservar a temperatura ambiente, en un lugar fresco y seco, alejado de la luz directa. Después de abierto, refrigerar entre 0 °C y 4 °C.',
  modoDeUso: 'Acompáñela con galletas, pan o tostadas.',
  // Prefijo interno (2xx) mientras no haya prefijo GS1 asignado por LOGYCA.
  prefijoEan: '200',
  referenciaEan: '10100',
};

/** Paleta: morados profundos de la mora, con los acentos vivos del logo a mano. */
export const colores = {
  mora: '#3E1026',
  moraClara: '#6E2245',
  moraBrillante: '#9C2F5E',
  pulpa: '#C44B7B',
  // Los puntos de colores del logotipo dibujado a mano.
  puntoRosa: '#E8617F',
  puntoNaranja: '#F09A3E',
  puntoVerde: '#4FB06A',
  puntoAzul: '#4A9BC4',
  tapa: '#D9A521',
  tierra: '#8C5A3C',
  hoja: '#3F5D3A',
  crema: '#F7F0E4',
  cremaOscura: '#E8DCC8',
  papel: '#FDFBF5',
  tinta: '#2A1A20',
};

export const tipografia = {
  titulo: "'Fraunces', Georgia, serif",
  cuerpo: "'Karla', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  googleFontsHref:
    'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..700&family=Karla:ital,wght@0,300..800;1,300..800&family=JetBrains+Mono:wght@400;600&display=swap',
};

export const espaciado = {
  radio: '14px',
  radioGrande: '28px',
  sombra: '0 2px 8px rgba(42, 26, 32, 0.08), 0 12px 32px rgba(42, 26, 32, 0.10)',
  sombraFuerte: '0 4px 16px rgba(42, 26, 32, 0.16), 0 24px 56px rgba(42, 26, 32, 0.18)',
};

/** Texto de la lista de ingredientes tal como va impreso. */
export function listaIngredientes(p = producto) {
  const partes = p.ingredientes.map((i) => (i.funcion ? `${i.nombre} (${i.funcion})` : i.nombre));
  return `Ingredientes: ${partes.join(', ')}.`;
}

/** Variables CSS listas para inyectar en :root. */
export function cssVariables() {
  const lineas = [];
  for (const [k, v] of Object.entries(colores)) {
    lineas.push(`  --c-${k}: ${v};`);
  }
  lineas.push(`  --f-titulo: ${tipografia.titulo};`);
  lineas.push(`  --f-cuerpo: ${tipografia.cuerpo};`);
  lineas.push(`  --f-mono: ${tipografia.mono};`);
  lineas.push(`  --radio: ${espaciado.radio};`);
  lineas.push(`  --radio-g: ${espaciado.radioGrande};`);
  lineas.push(`  --sombra: ${espaciado.sombra};`);
  lineas.push(`  --sombra-f: ${espaciado.sombraFuerte};`);
  return lineas.join('\n');
}
