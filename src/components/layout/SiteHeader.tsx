import { SearchBox } from '@/components/search/SearchBox'
import { Logo } from './Logo'
import { MainNav } from './MainNav'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 px-4 pt-3 pb-2 sm:px-8 md:grid-cols-[auto_1fr_auto] md:py-4">
        <Logo />
        <SearchBox className="col-span-2 row-start-2 md:col-span-1 md:row-start-1 md:col-start-2 md:mx-auto md:w-full md:max-w-md" />
        <MainNav className="justify-self-end" />
      </div>
    </header>
  )
}
