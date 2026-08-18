import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers/Providers';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Каталог музыкальных альбомов',
    template: '%s — Каталог музыкальных альбомов',
  },
  description:
    'Веб-приложение для каталогизации музыкальных альбомов: исполнители, альбомы и песни с трек-листами.',
};

export const viewport: Viewport = {
  themeColor: '#0B0B0F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <Sidebar />
          <div className="flex min-h-screen flex-col lg:pl-60">
            <Header />
            <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
              {children}
            </main>
            <footer className="hidden px-8 pb-6 text-xs text-secondary lg:block">
              Каталог музыкальных альбомов — тестовое задание
            </footer>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
