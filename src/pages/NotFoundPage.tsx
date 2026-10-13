import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/buttonStyles'
import { StateMessage } from '@/components/ui/StateMessage'

export function NotFoundPage() {
  return (
    <StateMessage
      eyebrow="Error 404"
      title="Este pasillo no existe"
      action={<Link to="/" className={buttonClass('primary')}>Volver a mi tienda</Link>}
      headingLevel="h1"
      className="mt-14"
    >
      La página que buscas no está en la tienda.
    </StateMessage>
  )
}
