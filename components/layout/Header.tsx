import { Disc3, Search } from 'lucide-react';
import Link from 'next/link';
import { GlobalSearch } from './GlobalSearch';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 lg:hidden"
          aria-label="На главную"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
            <Disc3 className="h-5 w-5 text-white" aria-hidden />
          </span>
          <span className="text-sm font-bold text-primary">Каталог музыки</span>
        </Link>

        <div className="ml-auto hidden w-full max-w-md md:block">
          <GlobalSearch />
        </div>

        <a
          href="/search"
          aria-label="Поиск по каталогу"
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-2 hover:text-primary md:hidden"
        >
          <Search className="h-5 w-5" aria-hidden />
        </a>
      </div>
    </header>
  );
}
