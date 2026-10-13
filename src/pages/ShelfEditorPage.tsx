import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/buttonStyles'
import { PageHeader } from '@/components/ui/PageHeader'
import { StateMessage } from '@/components/ui/StateMessage'

/** Fase 1: ruta reservada. El configurador de estanterías se implementa en la fase 3. */
export function ShelfEditorPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/" className="transition-colors hover:text-signal">
            ← Mi tienda
          </Link>
        }
        title="Nueva estantería"
      />
      <StateMessage
        tone="pending"
        eyebrow="En construcción"
        title="El configurador de estanterías todavía no está disponible"
        action={<Link to="/" className={buttonClass('quiet')}>Volver a mi tienda</Link>}
      >
        Aquí podrás combinar tipos de disco, décadas, géneros, estilos y colecciones, previsualizar el resultado y
        ponerle nombre a tu estantería.
      </StateMessage>
    </>
  )
}
