import './globals.css';
import './animaciones.css';
import './impresion.css';
import './responsive.css';
import { marca, producto, tipografia } from '@chela/brand/tokens';

export const metadata = {
  metadataBase: new URL('https://saborpuro.lat'),
  title: {
    default: `${marca.nombre} — ${marca.descriptor}`,
    template: `%s · ${marca.nombre}`,
  },
  description: `${producto.denominacion} elaborada por ${marca.razonSocial} en ${marca.localidad}, ${marca.ciudad}. Proceso, etiqueta y trazabilidad de lote abiertos al público.`,
  openGraph: {
    title: `${marca.nombre} — ${marca.descriptor}`,
    description: `${producto.denominacion} hecha en ${marca.localidad}. Mira el proceso completo y verifica tu lote.`,
    type: 'website',
    locale: 'es_CO',
    siteName: marca.nombre,
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfbf5' },
    { media: '(prefers-color-scheme: dark)', color: '#19090f' },
  ],
};

/** Aplica el tema guardado antes del primer pintado para evitar el parpadeo. */
const scriptTema = `
(function () {
  try {
    var t = localStorage.getItem('puro-tema');
    if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es-CO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={tipografia.googleFontsHref} />
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
