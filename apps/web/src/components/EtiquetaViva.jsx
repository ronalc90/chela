'use client';

import { useMemo, useState } from 'react';
import { svgEan13 } from '@chela/brand/barcode';
import { svgSello } from '@chela/brand/nutricional';
import { construirEtiqueta } from '@chela/brand/etiqueta';

/**
 * La etiqueta hecha a mano, ahora digital y verificable.
 * Cada campo explica por que esta ahi y que norma lo exige.
 */

const EXPLICACIONES = {
  marca: {
    titulo: 'Marca',
    texto: 'El nombre comercial. No es obligatorio por norma, pero sí lo es que no induzca a error sobre lo que hay dentro del frasco.',
    norma: 'Resolución 5109 de 2005, art. 4',
  },
  denominacion: {
    titulo: 'Nombre del alimento',
    texto: 'Tiene que decir qué es el producto, con un nombre que lo describa sin ambigüedad. "Mermelada de mora" cumple; un nombre de fantasía solo, no.',
    norma: 'Resolución 5109 de 2005, art. 5',
  },
  peso: {
    titulo: 'Contenido neto',
    texto: 'El peso del alimento sin el envase. En alimentos semisólidos como la mermelada se declara en peso, no en volumen.',
    norma: 'Resolución 5109 de 2005',
  },
  ingredientes: {
    titulo: 'Lista de ingredientes',
    texto: 'Todos los ingredientes en orden decreciente de proporción. Los aditivos llevan declarada su función tecnológica entre paréntesis: por eso el limón aparece como regulador de acidez.',
    norma: 'Resolución 5109 de 2005, art. 6',
  },
  conservacion: {
    titulo: 'Instrucciones de conservación',
    texto: 'Cómo guardar el producto antes y después de abrirlo. Una vez abierto, la mermelada pierde la protección del sellado al vacío y necesita frío.',
    norma: 'Resolución 5109 de 2005',
  },
  modoUso: {
    titulo: 'Modo de uso',
    texto: 'No siempre es obligatorio, pero la norma sí exige instrucciones cuando el producto las necesita para usarse bien.',
    norma: 'Resolución 5109 de 2005',
  },
  fabricante: {
    titulo: 'Fabricante',
    texto: 'Nombre, razón social y dirección de quien fabrica. Es el dato que permite rastrear responsabilidad sanitaria si algo sale mal.',
    norma: 'Resolución 5109 de 2005, art. 4',
  },
  origen: {
    titulo: 'País de origen',
    texto: 'Dónde se fabricó el producto. Obligatorio tanto para producto nacional como importado.',
    norma: 'Resolución 5109 de 2005',
  },
  lote: {
    titulo: 'Identificación del lote',
    texto: 'El código que agrupa todo lo producido en una misma tanda. Si aparece un problema, este código define exactamente qué frascos se retiran y cuáles no.',
    norma: 'Resolución 5109 de 2005, art. 11',
  },
  vencimiento: {
    titulo: 'Fecha de vencimiento',
    texto: 'Hasta cuándo el producto conserva sus condiciones. Se calcula desde la fecha de producción más la vida útil validada para el producto.',
    norma: 'Resolución 5109 de 2005, art. 10',
  },
  registro: {
    titulo: 'Registro sanitario',
    texto: 'El número que expide el INVIMA. Según el riesgo del alimento puede ser Notificación (NSA), Permiso o Registro Sanitario. Sin él, el producto no se puede comercializar.',
    norma: 'Resolución 2674 de 2013 y Resolución 719 de 2015',
  },
  ean: {
    titulo: 'Código de barras',
    texto: 'Un EAN-13. El que ves aquí usa prefijo interno 200, válido para control propio pero no para supermercados: ese prefijo lo asigna GS1 Colombia a través de LOGYCA, y el de país es 770.',
    norma: 'Estándar GS1',
  },
  sello: {
    titulo: 'Sello frontal de advertencia',
    texto: 'Octágono negro obligatorio cuando el 10 % o más de la energía proviene de azúcares libres. Una mermelada tradicional siempre lo supera. Llevarlo prohíbe cualquier declaración de propiedad nutricional o de salud.',
    norma: 'Resolución 810 de 2021, modificada por la 2492 de 2022',
  },
};

export default function EtiquetaViva({ etiqueta: etiquetaProp }) {
  const [activo, setActivo] = useState('lote');

  const etiqueta = useMemo(
    () =>
      etiquetaProp ||
      construirEtiqueta({
        fechaProduccion: '2026-10-18',
        tanda: 1,
        gramosMora: 1000,
        gramosAzucar: 700,
        gramosLimon: 30,
        gramosRendimiento: 1200,
      }),
    [etiquetaProp],
  );

  const barras = useMemo(
    () => svgEan13(etiqueta.reverso.ean, { anchoModulo: 2, alto: 90, mostrarTexto: true }),
    [etiqueta.reverso.ean],
  );

  const sellosSvg = useMemo(
    () => etiqueta.frente.sellos.map((s) => ({ clave: s.clave, svg: svgSello(s.texto, { tamano: 150 }) })),
    [etiqueta.frente.sellos],
  );

  const info = EXPLICACIONES[activo];

  const campo = (clave, children) => (
    <span
      className="etiqueta__campo"
      data-obligatorio="si"
      tabIndex={0}
      role="button"
      onMouseEnter={() => setActivo(clave)}
      onFocus={() => setActivo(clave)}
      onClick={() => setActivo(clave)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActivo(clave);
        }
      }}
    >
      {children}
    </span>
  );

  return (
    <div className="rejilla rejilla--2" style={{ alignItems: 'start' }}>
      <div className="etiqueta-marco">
        <div className="etiqueta">
          <div className="etiqueta__cara">
            <div className="etiqueta__sellos">
              {sellosSvg.map((s) => (
                <span
                  key={s.clave}
                  className="etiqueta__sello"
                  onMouseEnter={() => setActivo('sello')}
                  onClick={() => setActivo('sello')}
                  dangerouslySetInnerHTML={{ __html: s.svg }}
                />
              ))}
            </div>

            <div className="etiqueta__puntos" aria-hidden="true">
              <i style={{ background: 'var(--c-puntoRosa)' }} />
              <i style={{ background: 'var(--c-puntoNaranja)' }} />
              <i style={{ background: 'var(--c-puntoVerde)' }} />
              <i style={{ background: 'var(--c-puntoAzul)' }} />
            </div>

            <h3 className="etiqueta__marca">
              {campo('marca', (
                <>
                  <span>G</span><span>a</span><span>R</span><span>o</span>
                </>
              ))}
            </h3>

            <p className="etiqueta__denominacion">
              {campo('denominacion', etiqueta.frente.denominacion)}
            </p>
            <p className="etiqueta__calificativo">{etiqueta.frente.calificativo}</p>
            <p className="etiqueta__peso">
              {campo('peso', <>Peso neto: {etiqueta.frente.contenidoNeto}</>)}
            </p>

            <p className="etiqueta__linea">
              {campo('ingredientes', etiqueta.reverso.listaIngredientes)}
            </p>

            <p className="etiqueta__linea">
              {campo('conservacion', etiqueta.reverso.conservacion)}
            </p>

            <p className="etiqueta__linea">
              {campo('modoUso', <><strong>Modo de uso:</strong> {etiqueta.reverso.modoDeUso}</>)}
            </p>

            <p className="etiqueta__linea">
              {campo('fabricante', (
                <>
                  <strong>Fabricado por:</strong> {etiqueta.reverso.fabricante}, {etiqueta.reverso.direccion}.
                  Tel. {etiqueta.reverso.telefono}
                </>
              ))}
            </p>

            <p className="etiqueta__linea">
              {campo('origen', etiqueta.reverso.origen)}
            </p>

            <div className="etiqueta__pie">
              <div className="etiqueta__codigos">
                <div>{campo('lote', <>Lote: {etiqueta.reverso.lote}</>)}</div>
                <div>{campo('vencimiento', <>Vence: {etiqueta.reverso.fechaVencimiento}</>)}</div>
                <div>{campo('registro', <>Reg. sanitario: {etiqueta.reverso.registroSanitario}</>)}</div>
              </div>
              <div
                className="etiqueta__barras"
                onMouseEnter={() => setActivo('ean')}
                onClick={() => setActivo('ean')}
                dangerouslySetInnerHTML={{ __html: barras }}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="explica" aria-live="polite">
          <p className="explica__titulo">{info.titulo}</p>
          <p style={{ margin: 0 }}>{info.texto}</p>
          <p className="explica__norma">{info.norma}</p>
        </div>

        <p style={{ marginTop: 18, fontSize: '0.92rem', color: 'var(--texto-suave)' }}>
          Pasa el cursor por cualquier campo de la etiqueta —o tócalo en el celular— para ver qué
          exige la norma en ese punto. Los puntos rosados marcan los campos obligatorios.
        </p>

        <table className="tabla-nut" style={{ marginTop: 26 }}>
          <caption>Información nutricional</caption>
          <thead>
            <tr>
              <th scope="col">&nbsp;</th>
              <th scope="col">Por 100 g</th>
              <th scope="col">{etiqueta.tablaNutricional.porcionDescripcion}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="destacada">
              <td>Energía</td>
              <td>{etiqueta.tablaNutricional.por100g.energiaKcal} kcal</td>
              <td>{etiqueta.tablaNutricional.porPorcion.energiaKcal} kcal</td>
            </tr>
            <tr>
              <td>Carbohidratos</td>
              <td>{etiqueta.tablaNutricional.por100g.carbohidratos} g</td>
              <td>{etiqueta.tablaNutricional.porPorcion.carbohidratos} g</td>
            </tr>
            <tr className="destacada">
              <td>— Azúcares</td>
              <td>{etiqueta.tablaNutricional.por100g.azucares} g</td>
              <td>{etiqueta.tablaNutricional.porPorcion.azucares} g</td>
            </tr>
            <tr>
              <td>Fibra</td>
              <td>{etiqueta.tablaNutricional.por100g.fibra} g</td>
              <td>{etiqueta.tablaNutricional.porPorcion.fibra} g</td>
            </tr>
            <tr>
              <td>Proteína</td>
              <td>{etiqueta.tablaNutricional.por100g.proteina} g</td>
              <td>{etiqueta.tablaNutricional.porPorcion.proteina} g</td>
            </tr>
            <tr>
              <td>Grasa total</td>
              <td>{etiqueta.tablaNutricional.por100g.grasaTotal} g</td>
              <td>{etiqueta.tablaNutricional.porPorcion.grasaTotal} g</td>
            </tr>
            <tr>
              <td>Sodio</td>
              <td>{etiqueta.tablaNutricional.por100g.sodioMg} mg</td>
              <td>{etiqueta.tablaNutricional.porPorcion.sodioMg} mg</td>
            </tr>
          </tbody>
        </table>

        <div className="aviso">{etiqueta.advertencia}</div>
      </div>
    </div>
  );
}
