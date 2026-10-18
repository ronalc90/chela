export const PASOS = [
  {
    titulo: 'Recepción de la mora',
    texto: 'Se recibe la mora de Castilla y se pesa. Ese peso de entrada es el que manda: de él salen las proporciones de toda la tanda y el rendimiento esperado.',
    dato: 'Registro del peso de entrada',
  },
  {
    titulo: 'Selección y descarte',
    texto: 'Se apartan las moras verdes, golpeadas o con moho. Una sola fruta en mal estado cambia el sabor del frasco y acorta la vida útil de todo el lote.',
    dato: 'Control de calidad',
  },
  {
    titulo: 'Lavado y desinfección',
    texto: 'Lavado con agua potable y escurrido completo. El agua que quede en la fruta diluye la mezcla y obliga a cocinar de más.',
    dato: 'Agua potable',
  },
  {
    titulo: 'Despulpado',
    texto: 'La mora se macera o se despulpa. Aquí se decide la textura final: con semilla, como la tradicional, o colada para una mermelada más lisa.',
    dato: 'Define la textura',
  },
  {
    titulo: 'Primer hervor',
    texto: 'La pulpa sola rompe hervor y empieza a soltar agua. Todavía no entra el azúcar: si entra antes de tiempo, la fruta se endurece y no se integra.',
    dato: 'Sin azúcar todavía',
  },
  {
    titulo: 'Adición del azúcar',
    texto: 'Entra el azúcar y se revuelve sin parar hasta disolverlo por completo. Desde este punto el fondo de la olla se quema con facilidad.',
    dato: 'Revolver constante',
  },
  {
    titulo: 'Adición del limón',
    texto: 'El limón entra como regulador de acidez. Baja el pH, ayuda a que la pectina natural de la mora gelifique y protege el color de la fruta.',
    dato: 'Regulador de acidez',
  },
  {
    titulo: 'Retiro de espuma',
    texto: 'Se retira la espuma que sube a la superficie. Si se deja, queda turbia dentro del frasco y se nota apenas se enfría.',
    dato: 'Claridad del producto',
  },
  {
    titulo: 'Prueba del punto',
    texto: 'Una gota sobre un plato frío: si al inclinarlo corre, falta cocción; si arruga al empujarla con el dedo, ya está en su punto.',
    dato: 'Prueba del plato frío',
  },
  {
    titulo: 'Esterilización de frascos',
    texto: 'Frascos y tapas hervidos y escurridos. Un frasco mal esterilizado es la causa más común de que una conserva casera se dañe.',
    dato: 'Punto crítico',
  },
  {
    titulo: 'Envasado en caliente',
    texto: 'Se envasa con la mermelada aún caliente, dejando un pequeño espacio de cabeza. Se tapa de inmediato y se invierte el frasco unos minutos.',
    dato: 'Sellado al vacío',
  },
  {
    titulo: 'Etiquetado y registro',
    texto: 'Se asigna el código de lote, se calcula el vencimiento y se registra la tanda. Ese código es el que permite devolver cualquier frasco a su día de producción.',
    dato: 'Trazabilidad',
  },
];

export default function Proceso() {
  return (
    <ol className="pasos">
      {PASOS.map((p, i) => (
        <li className="paso" key={p.titulo}>
          <span className="paso__numero" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="paso__titulo">{p.titulo}</h3>
          <p className="paso__texto">{p.texto}</p>
          {p.dato ? <span className="paso__dato">{p.dato}</span> : null}
        </li>
      ))}
    </ol>
  );
}
