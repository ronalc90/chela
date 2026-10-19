/**
 * Identidad de marca — ARCHIVO UNICO DE CONFIGURACION.
 *
 * Cambiar algo aqui se propaga a la web, a la etiqueta digital, al
 * generador de etiquetas para imprimir y al libro de recetas sin tocar
 * nada mas.
 *
 * DATOS DE EJEMPLO. Lo que hay aqui de fabricante, contacto y registro es
 * de relleno a proposito: direccion de Calle Falsa, telefonos 300 000 0000,
 * NIT y registro sanitario con ceros. Ningun dato personal real vive en el
 * repositorio ni sale publicado por defecto.
 *
 * Los de verdad se escriben en el generador (/etiquetas, seccion Fabricante
 * y seccion Registro) y se guardan con cada etiqueta en el servidor, que no
 * es publico. Para que el sitio los muestre, cambialos aqui.
 */

export const SITIO = 'https://saborpuro.lat';

export const marca = {
  nombre: 'SaborPuro',
  nombreCorto: 'SaborPuro',
  descriptor: 'Mermelada artesanal de mora',
  eslogan: 'Del cultivo a la mesa, sin atajos',
  // Quien elabora la mermelada; es lo que sale impreso en «Fabricado por».
  razonSocial: 'Fabricante de ejemplo',
  nit: '900.000.000-0',
  direccion: 'Calle Falsa 123',
  // La localidad y la ciudad se quedan: son de donde es la marca, no de
  // quien la hace, y sin ellas el relato del sitio no se sostiene.
  localidad: 'Usme',
  ciudad: 'Bogotá D.C.',
  pais: 'Colombia',
  registroSanitario: 'RSA-0000000000',
  sitio: SITIO,
  contacto: {
    telefono: '300 000 0000',
    whatsapp: '+57 300 000 0000',
    email: 'contacto@ejemplo.com',
  },
};

export const producto = {
  denominacion: 'Mermelada de mora',
  calificativo: 'Artesanal',
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

/** Paleta: morados de la mora con ámbar de miel. */
export const colores = {
  mora: '#3A0E24',
  moraClara: '#68203F',
  moraBrillante: '#A32C63',
  pulpa: '#D6457E',
  ambarHondo: '#B57618',
  ambar: '#E8A33D',
  ambarClaro: '#F6CE87',
  tapa: '#D9A521',
  tierra: '#8C5A3C',
  crema: '#F7F1E6',
  cremaOscura: '#E9DFCB',
  papel: '#FCFAF4',
  tinta: '#241B1E',
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
  sombra: '0 2px 8px rgba(36, 27, 30, 0.08), 0 12px 32px rgba(36, 27, 30, 0.10)',
  sombraFuerte: '0 4px 16px rgba(36, 27, 30, 0.16), 0 24px 56px rgba(36, 27, 30, 0.18)',
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
