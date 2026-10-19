import Nav from '@/components/Nav';
import Proceso from '@/components/Proceso';
import EtiquetaViva from '@/components/EtiquetaViva';
import Calculadora from '@/components/Calculadora';
import Trazabilidad from '@/components/Trazabilidad';
import FrascoConEtiqueta from '@/components/FrascoConEtiqueta';
import { Emblema, Logotipo } from '@/components/Logo';
import { marca, producto } from '@chela/brand/tokens';

const CHIPS = [
  { texto: 'Mora de Castilla', color: '#a32c63' },
  { texto: `Hecha en ${marca.localidad}`, color: '#e8a33d' },
  { texto: 'Tres ingredientes', color: '#4e8352' },
  { texto: 'Lote verificable', color: '#d6457e' },
];

export default function Pagina() {
  return (
    <>
      <div className="progreso" aria-hidden="true" />
      <Nav />

      <header className="hero" id="inicio">
        <div className="envoltura hero__rejilla">
          <div className="hero__texto">
            {/* La canasta va ARRIBA del nombre: es el bloque de marca. */}
            <div className="hero__marca carga-1">
              <Emblema tamano={220} className="hero__emblema" titulo="Canasta de fruta de SaborPuro" />
              <h1 className="hero__titulo">
                <span className="hero__sabor">Sabor</span><span className="hero__puro">Puro</span>
              </h1>
            </div>
            <p className="hero__sub carga-2">{marca.descriptor}</p>
            <p className="plomo carga-2">
              Mora, azúcar y limón. Nada más. Hecha por {marca.razonSocial} en {marca.localidad},
              {' '}{marca.ciudad} — y documentada paso a paso para que puedas ver exactamente qué
              hay dentro del frasco y de dónde salió.
            </p>
            <div className="hero__chips carga-3">
              {CHIPS.map((c) => (
                <span key={c.texto} className="chip" style={{ '--c': c.color }}>
                  <i aria-hidden="true" />
                  {c.texto}
                </span>
              ))}
            </div>
            <div className="botonera carga-3">
              <a className="boton" href="#proceso">
                Ver el proceso <span className="boton__flecha" aria-hidden="true">→</span>
              </a>
              <a className="boton boton--fantasma" href="/etiquetas">Generar etiquetas</a>
            </div>
          </div>

          <div className="carga-4">
            <FrascoConEtiqueta />
          </div>
        </div>
      </header>

      <section className="seccion seccion--alt" id="proceso">
        <div className="envoltura">
          <div className="seccion__cabeza">
            <span className="rotulo">Cómo se hizo</span>
            <h2>Doce pasos, del canasto al frasco</h2>
            <p className="plomo">
              Cada paso tiene una razón técnica. Estos son los que de verdad deciden si la mermelada
              queda bien o se daña a los dos meses.
            </p>
          </div>
          <Proceso />
        </div>
      </section>

      <section className="seccion" id="etiqueta">
        <div className="envoltura">
          <div className="seccion__cabeza">
            <span className="rotulo">La etiqueta, campo por campo</span>
            <h2>De la hoja cuadriculada a la etiqueta exacta</h2>
            <p className="plomo">
              La primera etiqueta se dibujó a mano en un cuaderno. Esta es la misma, hecha digital:
              mismos datos, pero el código de barras ahora es un EAN-13 con dígito verificador real,
              el lote se calcula solo y el vencimiento sale de la fecha de producción.
            </p>
          </div>
          <EtiquetaViva />
        </div>
      </section>

      <section className="seccion seccion--alt" id="calculadora">
        <div className="envoltura">
          <div className="seccion__cabeza">
            <span className="rotulo">Planeador de tandas</span>
            <h2>Cambia la receta y mira qué pasa</h2>
            <p className="plomo">
              Ajusta las cantidades y el rendimiento: se recalculan los frascos, el porcentaje de
              fruta, los grados Brix, la tabla nutricional y los sellos de advertencia que tocaría
              poner en la etiqueta.
            </p>
          </div>
          <Calculadora />
        </div>
      </section>

      <section className="seccion" id="trazabilidad">
        <div className="envoltura">
          <div className="seccion__cabeza">
            <span className="rotulo">Trazabilidad</span>
            <h2>¿Qué hay detrás de tu frasco?</h2>
            <p className="plomo">
              Escribe el código de lote impreso en la etiqueta y te decimos qué día se produjo esa
              tanda, con qué proporciones y hasta cuándo rinde.
            </p>
          </div>
          <Trazabilidad />
        </div>
      </section>

      <section className="seccion" id="imprimir" style={{ paddingTop: 0 }}>
        <div className="envoltura">
          <div className="cta anim-subir">
            <div>
              <span className="rotulo">Para producción</span>
              <h2>Imprime las etiquetas de cada tanda</h2>
              <p className="plomo">
                Cambias lo que quieras del rótulo y sale la hoja lista para papel adhesivo, con el
                lote, el vencimiento y el código de barras ya calculados. El tamaño de la etiqueta y
                de la hoja los eliges tú, al milímetro.
              </p>
              <div className="botonera">
                <a className="boton boton--ambar" href="/etiquetas">
                  Abrir el generador <span className="boton__flecha" aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <Emblema tamano={210} className="cta__arte flotar-suave" decorativo />
          </div>
        </div>
      </section>

      <section className="seccion seccion--alt" id="galeria">
        <div className="envoltura">
          <div className="seccion__cabeza">
            <span className="rotulo">El frasco</span>
            <h2>Con etiqueta y sin etiqueta</h2>
            <p className="plomo">
              El frasco de 100 g, sellado al vacío con tapa metálica dorada: primero con la etiqueta
              puesta, tal como sale de la producción, y después sin ella, para ver la mora con su
              semilla.
            </p>
          </div>
          <div className="galeria galeria--frascos">
            <FrascoConEtiqueta conEtiqueta control={false} pie="Con la etiqueta de 100 g" />
            <FrascoConEtiqueta conEtiqueta={false} control={false} pie="Sin etiqueta" />
          </div>
        </div>
      </section>

      <footer className="pie">
        <div className="envoltura">
          <div className="pie__arriba">
            <div className="pie__marca">
              <Logotipo tamano={96} />
              <p className="pie__lema">{marca.eslogan}.</p>
            </div>
            <div className="pie__rejilla">
              <div>
                <h4>El producto</h4>
                <p>{producto.denominacion} {producto.calificativo?.toLowerCase()}</p>
                <p>Contenido neto: {producto.contenidoNetoGramos} g</p>
                <p>Reg. sanitario: {marca.registroSanitario}</p>
              </div>
              <div>
                <h4>Quién lo hace</h4>
                <p>{marca.razonSocial}</p>
                <p>{marca.direccion}</p>
                <p>{marca.localidad}, {marca.ciudad}</p>
              </div>
              <div>
                <h4>Contacto</h4>
                <p>Tel. {marca.contacto.telefono}</p>
              </div>
              <div>
                <h4>Marco normativo</h4>
                <p>Resolución 5109 de 2005</p>
                <p>Resolución 810 de 2021</p>
                <p>Resolución 2492 de 2022</p>
              </div>
            </div>
          </div>
          <p className="pie__nota">
            Los valores nutricionales de este sitio son estimaciones calculadas a partir de la
            receta. La etiqueta que se imprime y se radica ante el INVIMA debe sustentarse en un
            análisis bromatológico de laboratorio.
          </p>
        </div>
      </footer>
    </>
  );
}
