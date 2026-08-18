'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, Disc3, Music2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlbumCard } from '@/components/albums/AlbumCard';
import { api } from '@/lib/api-client';
import type { Stats } from '@/types';

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<Stats>('/api/stats'),
  });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">Каталог музыкальных альбомов</h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary sm:text-base">
          Исполнители, альбомы и песни. Одна и та же песня может входить в разные альбомы
          с разными порядковыми номерами треков.
        </p>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <GridSkeleton count={3} />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Не удалось загрузить сводку"
          description="Проверьте подключение к базе данных и попробуйте снова."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Повторить
            </Button>
          }
        />
      ) : data ? (
        <>
          <section aria-label="Статистика каталога" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard href="/artists" icon={Users} label="Исполнителей" value={data.artistsCount} />
            <StatCard href="/albums" icon={Disc3} label="Альбомов" value={data.albumsCount} />
            <StatCard href="/songs" icon={Music2} label="Песен" value={data.songsCount} />
          </section>

          <section aria-label="Последние добавленные альбомы">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Последние альбомы</h2>
              <Link
                href="/albums"
                className="rounded-lg px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
              >
                Все альбомы
              </Link>
            </div>
            {data.recentAlbums.length === 0 ? (
              <EmptyState
                icon={Disc3}
                title="Пока нет альбомов"
                description="Добавьте первого исполнителя и первый альбом."
                action={
                  <Link href="/artists">
                    <Button>Перейти к исполнителям</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.recentAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card transition-colors hover:border-accent/50"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
        <Icon className="h-6 w-6 text-accent" aria-hidden />
      </span>
      <div>
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-sm text-secondary">{label}</p>
      </div>
    </Link>
  );
}
