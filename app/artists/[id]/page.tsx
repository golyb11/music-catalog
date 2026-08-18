'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Disc3, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { ArtistAvatar } from '@/components/ui/ArtistAvatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ArtistFormModal } from '@/components/forms/ArtistFormModal';
import { AlbumFormModal } from '@/components/forms/AlbumFormModal';
import { AlbumCard } from '@/components/albums/AlbumCard';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api-client';
import type { ArtistDetail } from '@/types';

export default function ArtistDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [addAlbumOpen, setAddAlbumOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: artist, isLoading, isError } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => api.get<ArtistDetail>(`/api/artists/${id}`),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 1;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/artists/${id}`),
    onSuccess: async () => {
      toast.showToast('success', 'Исполнитель удалён');
      await queryClient.invalidateQueries({ queryKey: ['artists'] });
      router.push('/artists');
    },
    onError: (e) => {
      toast.showToast('error', e instanceof ApiError ? e.message : 'Не удалось удалить исполнителя');
      setDeleteOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-surface-2" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-surface-2" />
            <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
        <GridSkeleton count={4} />
      </div>
    );
  }

  if (isError || !artist) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <EmptyState
          icon={Users}
          title="Исполнитель не найден"
          description="Возможно, он был удалён."
          action={
            <Link href="/artists">
              <Button variant="secondary">К списку исполнителей</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const hasAlbums = artist.albums.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
        <ArtistAvatar name={artist.name} className="h-16 w-16 text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-primary" title={artist.name}>
            {artist.name}
          </h1>
          <p className="text-sm text-secondary">Альбомов: {artist.albums.length}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" aria-hidden />
            Редактировать
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (hasAlbums) {
                toast.showToast(
                  'error',
                  `Нельзя удалить исполнителя: у него есть альбомы (${artist.albums.length}). Сначала удалите их.`
                );
              } else {
                setDeleteOpen(true);
              }
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Удалить
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Альбомы</h2>
          <Button onClick={() => setAddAlbumOpen(true)}>Добавить альбом</Button>
        </div>

        {artist.albums.length === 0 ? (
          <EmptyState
            icon={Disc3}
            title="У исполнителя пока нет альбомов"
            description="Создайте первый альбом этого исполнителя."
            action={<Button onClick={() => setAddAlbumOpen(true)}>Добавить альбом</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artist.albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>

      <ArtistFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        artist={{ id: artist.id, name: artist.name }}
      />

      <AlbumFormModal open={addAlbumOpen} onClose={() => setAddAlbumOpen(false)} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title="Удалить исполнителя"
        message={`Удалить исполнителя «${artist.name}»? Это действие необратимо.`}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/artists"
      className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Все исполнители
    </Link>
  );
}
