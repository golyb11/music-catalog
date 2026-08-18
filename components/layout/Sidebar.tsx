'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Disc3, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/artists', label: 'Исполнители', icon: Users },
  { href: '/albums', label: 'Альбомы', icon: Disc3 },
  { href: '/songs', label: 'Песни', icon: Music2 },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
      <Link
        href="/"
        className="flex items-center gap-3 px-6 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <Disc3 className="h-6 w-6 text-white" aria-hidden />
        </span>
        <span className="text-base font-bold leading-tight text-primary">
          Каталог
          <br />
          музыки
        </span>
      </Link>

      <nav aria-label="Основная навигация" className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                active
                  ? 'bg-accent/15 text-accent'
                  : 'text-secondary hover:bg-surface-2 hover:text-primary'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <p className="px-6 py-6 text-xs text-secondary">
        Каталог музыкальных альбомов
      </p>
    </aside>
  );
}
