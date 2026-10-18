import Nav from '@/components/Nav';
import Proceso from '@/components/Proceso';
import EtiquetaViva from '@/components/EtiquetaViva';
import Calculadora from '@/components/Calculadora';
import Trazabilidad from '@/components/Trazabilidad';
import FrascoConEtiqueta from '@/components/FrascoConEtiqueta';
import { Emblema } from '@/components/Logo';
import { marca, producto } from '@chela/brand/tokens';

const FOTOS = [
  { src: '/fotos/frasco-01.jpg', pie: 'El frasco terminado, sellado al vacío con tapa metálica.' },
  { src: '/fotos/frasco-02.jpg', pie: 'La mora conserva la semilla: textura de mermelada casera, no de jalea.' },
];

export default function Pagina() {
  return (
    <>
      <div className="progreso" aria-hidden="true" />
      <Nav />

      <header className="hero" id="inicio">
        <div className="envoltura hero__rejilla">
          <div>
            <Emblema tamano={96} className="hero__emblema" />
            <h1 className="hero__titulo">
              <span className="hero__sabor">Sabor</span><span className="hero__puro">Puro</span>
            </h1>
            <p className="hero__sub">{marca.descriptor}</p>
            <p className="plomo">
              Mora, azúcar y limón. Nada más. Hecha por {marca.razonSocial} en {marca.localidad},
              {' '}{marca.ciudad} — y documentada paso a paso para que puedas ver exactamente qué
              hay dentro del frasco y de dónde salió.
            </p>
            <div className="botonera">
              <a className="boton" href="#proceso">Ver el proceso</a>
              <a className="boton boton--fantasma" href="/etiquetas">Generar etiquetas</a>
            </div>
          </div>

          <FrascoConEtiqueta />
        </div>
      </header>

      <section className="seccion seccion--alt" id="proceso">
        <div className="envoltura">
          <span className="rotulo">Cómo se hizo</span>
          <h2>Doce pasos, del canasto al frasco</h2>
          <p className="plomo" style={{ marginBottom: 48 }}>
            Cada paso tiene una razón técnica. Estos son los que de verdad deciden si la mermelada
            queda bien o se daña a los dos meses.
          </p>
          <Proceso />
        </div>
      </section>

      <section className="seccion" id="etiqueta">
        <div className="envoltura">
          <span className="rotulo">La etiqueta, campo por campo</span>
          <h2>De la hoja cuadriculada a la etiqueta exacta</h2>
          <p className="plomo" style={{ marginBottom: 40 }}>
            La primera etiqueta se dibujó a mano en un cuaderno. Esta es la misma, hecha digital:
            mismos datos, pero el código de barras ahora es un EAN-13 con dígito verificador real,
            el lote se calcula solo y el vencimiento sale de la fecha de producción.
          </p>
          <EtiquetaViva />
        </div>
      </section>

      <section className="seccion seccion--alt" id="calculadora">
        <div className="envoltura">
          <span className="rotulo">Planeador de tandas</span>
          <h2>Cambia la receta y mira qué pasa</h2>
          <p className="plomo" style={{ marginBottom: 40 }}>
            Ajusta las cantidades y el rendimiento: se recalculan los frascos, el porcentaje de
            fruta, los grados Brix, la tabla nutricional y los sellos de advertencia que tocaría
            poner en la etiqueta.
          </p>
          <Calculadora />
        </div>
      </section>

      <section className="seccion" id="trazabilidad">
        <div className="envoltura">
          <span className="rotulo">Trazabilidad</span>
          <h2>¿Qué hay detrás de tu frasco?</h2>
          <p className="plomo" style={{ marginBottom: 40 }}>
            Escribe el código de lote impreso en la etiqueta y te decimos qué día se produjo esa
            tanda, con qué proporciones y hasta cuándo rinde.
          </p>
          <Trazabilidad />
        </div>
      </section>

      <section className="seccion" id="imprimir">
        <div className="envoltura">
          <span className="rotulo">Para producción</span>
          <h2 className="anim-subir">Imprime las etiquetas de cada tanda</h2>
          <p className="plomo" style={{ marginBottom: 32 }}>
            Metes los datos de la tanda y sale una hoja A4 lista para papel adhesivo, con el lote,
            el vencimiento, la tabla nutricional y el código de barras ya calculados. Tres tamaños
            según el frasco.
          </p>
          <a className="boton" href="/etiquetas">Abrir el generador</a>
        </div>
      </section>

      <section className="seccion seccion--alt" id="galeria">
        <div className="envoltura">
          <span className="rotulo">Registro del proyecto</span>
          <h2>Las fotos del proceso</h2>
          <p className="plomo" style={{ marginBottom: 40 }}>
            El punto de partida: el producto terminado, la etiqueta hecha a mano y el tablero donde
            se desglosó qué exige la norma.
          </p>
          <div className="galeria">
            {FOTOS.map((f) => (
              <figure key={f.src}>
                <img src={f.src} alt={f.pie} loading="lazy" width="600" height="460" />
                <figcaption>{f.pie}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <footer className="pie">
        <div className="envoltura">
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
          <p style={{ marginTop: 36, fontSize: '0.84rem' }}>
            Los valores nutricionales de este sitio son estimaciones calculadas a partir de la
            receta. La etiqueta que se imprime y se radica ante el INVIMA debe sustentarse en un
            análisis bromatológico de laboratorio.
          </p>
        </div>
      </footer>
    </>
  );
}
