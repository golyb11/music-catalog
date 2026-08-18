'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Disc3, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CoverPlaceholder } from '@/components/ui/CoverPlaceholder';
import { TrackList } from '@/components/tracks/TrackList';
import { AlbumFormModal } from '@/components/forms/AlbumFormModal';
import { AddTrackModal } from '@/components/forms/AddTrackModal';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api-client';
import type { AlbumDetail } from '@/types';

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: album, isLoading, isError } = useQuery({
    queryKey: ['album', id],
    queryFn: () => api.get<AlbumDetail>(`/api/albums/${id}`),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 1;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/albums/${id}`),
    onSuccess: async () => {
      toast.showToast('success', 'Альбом удалён (песни сохранены в каталоге)');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['albums'] }),
        queryClient.invalidateQueries({ queryKey: ['artists'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]);
      router.push('/albums');
    },
    onError: (e) => {
      toast.showToast('error', e instanceof ApiError ? e.message : 'Не удалось удалить альбом');
      setDeleteOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-6 w-40 animate-pulse rounded bg-surface-2" />
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="h-48 w-48 animate-pulse rounded-2xl bg-surface-2" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-2/3 animate-pulse rounded bg-surface-2" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !album) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <EmptyState
          icon={Disc3}
          title="Альбом не найден"
          description="Возможно, он был удалён."
          action={
            <Link href="/albums">
              <Button variant="secondary">К списку альбомов</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const nextTrackNumber =
    album.tracks.reduce((max, t) => Math.max(max, t.trackNumber), 0) + 1;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-start">
        <CoverPlaceholder
          title={album.title}
          className="h-40 w-40 shrink-0 rounded-2xl text-6xl sm:h-48 sm:w-48"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{album.releaseYear}</Badge>
            <span className="text-sm text-secondary">
              Треков: {album.tracks.length}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl" title={album.title}>
            {album.title}
          </h1>
          <Link
            href={`/artists/${album.artist.id}`}
            className="w-fit text-base font-medium text-secondary transition-colors hover:text-accent"
          >
            {album.artist.name}
          </Link>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Редактировать
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Удалить альбом
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Трек-лист</h2>
          <Button onClick={() => setAddTrackOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Добавить трек
          </Button>
        </div>
        <p className="text-xs text-secondary">
          Перетаскивайте треки на десктопе или используйте кнопки вверх и вниз. Одна и та же
          песня может быть в разных альбомах с разными номерами.
        </p>
        <TrackList albumId={album.id} tracks={album.tracks} />
      </section>

      <AlbumFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        album={{
          id: album.id,
          title: album.title,
          releaseYear: album.releaseYear,
          artistId: album.artist.id,
        }}
      />

      <AddTrackModal
        open={addTrackOpen}
        onClose={() => setAddTrackOpen(false)}
        albumId={album.id}
        nextTrackNumber={nextTrackNumber}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title="Удалить альбом"
        message={`Удалить альбом «${album.title}» вместе с трек-листом? Сами песни останутся в каталоге и в других альбомах.`}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/albums"
      className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Все альбомы
    </Link>
  );
}
