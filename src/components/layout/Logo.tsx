import { Link } from 'react-router-dom'

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Vinyl Club, ir a mi tienda">
      <span aria-hidden className="vinyl block size-7 transition-transform duration-700 ease-out-soft group-hover:rotate-180" />
      <span className="font-display text-[1.4rem] leading-none font-semibold tracking-[-0.03em]">
        Vinyl <em className="font-normal">Club</em>
      </span>
    </Link>
  )
}
