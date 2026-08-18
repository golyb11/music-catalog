'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Disc3, Music2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Нижняя навигация для мобильных и планшетов (до 1024px).
const TABS = [
  { href: '/artists', label: 'Исполнители', icon: Users },
  { href: '/albums', label: 'Альбомы', icon: Disc3 },
  { href: '/songs', label: 'Песни', icon: Music2 },
  { href: '/search', label: 'Поиск', icon: Search },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Нижняя навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-medium transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  active ? 'text-accent' : 'text-secondary'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
