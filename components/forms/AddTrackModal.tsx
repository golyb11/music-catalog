'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api-client';
import { addTrackSchema } from '@/lib/validation/schemas';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { SongListItem } from '@/types';

type Mode = 'existing' | 'new';

// Добавление трека в альбом: выбор существующей песни или создание новой,
// с обязательным номером трека (по умолчанию — следующий свободный).
export function AddTrackModal({
  open,
  onClose,
  albumId,
  nextTrackNumber,
}: {
  open: boolean;
  onClose: () => void;
  albumId: string;
  nextTrackNumber: number;
}) {
  const [mode, setMode] = useState<Mode>('existing');
  const [search, setSearch] = useState('');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [trackNumber, setTrackNumber] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setMode('existing');
      setSearch('');
      setSelectedSongId(null);
      setNewSongTitle('');
      setTrackNumber(String(nextTrackNumber));
      setFieldErrors({});
    }
  }, [open, nextTrackNumber]);

  const debouncedSearch = useDebounce(search.trim(), 300);

  const { data: songs, isFetching } = useQuery({
    queryKey: ['songs', debouncedSearch],
    queryFn: () =>
      api.get<SongListItem[]>(`/api/songs?search=${encodeURIComponent(debouncedSearch)}`),
    enabled: open && mode === 'existing',
  });

  const mutation = useMutation({
    mutationFn: (data: {
      songId?: string;
      newSongTitle?: string;
      trackNumber?: number;
    }) => api.post(`/api/albums/${albumId}/tracks`, data),
    onSuccess: async () => {
      toast.showToast('success', 'Трек добавлен в альбом');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['album', albumId] }),
        queryClient.invalidateQueries({ queryKey: ['songs'] }),
        queryClient.invalidateQueries({ queryKey: ['albums'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]);
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors?.trackNumber) {
        setFieldErrors({ trackNumber: e.fieldErrors.trackNumber[0] });
      } else if (e instanceof ApiError) {
        toast.showToast('error', e.message);
      } else {
        toast.showToast('error', 'Не удалось добавить трек');
      }
    },
  });

  const submitDisabled = useMemo(
    () => mode === 'existing' ? !selectedSongId : newSongTitle.trim().length === 0,
    [mode, selectedSongId, newSongTitle]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...(mode === 'existing'
        ? { songId: selectedSongId ?? undefined }
        : { newSongTitle: newSongTitle.trim() }),
      trackNumber: trackNumber ? Number(trackNumber) : undefined,
    };
    const parsed = addTrackSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const errors: Record<string, string> = {};
      if (flat.fieldErrors.songId?.[0]) errors.songId = flat.fieldErrors.songId[0];
      if (flat.fieldErrors.newSongTitle?.[0]) errors.newSongTitle = flat.fieldErrors.newSongTitle[0];
      if (flat.fieldErrors.trackNumber?.[0]) errors.trackNumber = flat.fieldErrors.trackNumber[0];
      if (flat.formErrors[0]) errors.songId = flat.formErrors[0];
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить трек">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <fieldset>
          <legend className="mb-2 text-sm text-secondary">Песня</legend>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-2 p-1">
            {(
              [
                { key: 'existing', label: 'Существующая' },
                { key: 'new', label: 'Новая песня' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setMode(tab.key);
                  setFieldErrors({});
                }}
                aria-pressed={mode === tab.key}
                className={
                  mode === tab.key
                    ? 'rounded-md bg-accent px-3 py-2 text-sm font-medium text-white'
                    : 'rounded-md px-3 py-2 text-sm font-medium text-secondary transition-colors hover:text-primary'
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </fieldset>

        {mode === 'existing' ? (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary"
                aria-hidden
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск песни по названию…"
                aria-label="Поиск песни"
                className="h-11 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/70"
              />
            </div>

            <div
              role="radiogroup"
              aria-label="Выбор песни"
              className="max-h-56 overflow-y-auto rounded-lg border border-border"
            >
              {isFetching && songs === undefined ? (
                <p className="px-3 py-6 text-center text-sm text-secondary">Загрузка…</p>
              ) : (songs ?? []).length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-secondary">
                  Песни не найдены. Создайте новую на вкладке «Новая песня».
                </p>
              ) : (
                (songs ?? []).map((song) => (
                  <label
                    key={song.id}
                    className={
                      selectedSongId === song.id
                        ? 'flex cursor-pointer items-center justify-between gap-3 border-l-2 border-accent bg-accent/10 px-3 py-3 text-sm'
                        : 'flex cursor-pointer items-center justify-between gap-3 border-l-2 border-transparent px-3 py-3 text-sm transition-colors hover:bg-surface-2'
                    }
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="song"
                        checked={selectedSongId === song.id}
                        onChange={() => setSelectedSongId(song.id)}
                        className="h-4 w-4 accent-[#7C5CFC]"
                      />
                      <span className="text-primary">{song.title}</span>
                    </span>
                    <span className="shrink-0 text-xs text-secondary">
                      в {song.albumsCount} альб.
                    </span>
                  </label>
                ))
              )}
            </div>
            {fieldErrors.songId && (
              <p role="alert" className="text-xs text-danger">
                {fieldErrors.songId}
              </p>
            )}
          </div>
        ) : (
          <Input
            label="Название новой песни"
            value={newSongTitle}
            onChange={(e) => setNewSongTitle(e.target.value)}
            error={fieldErrors.newSongTitle}
            placeholder="Например, Echoes"
          />
        )}

        <Input
          label="Номер трека в альбоме"
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          value={trackNumber}
          onChange={(e) => setTrackNumber(e.target.value)}
          error={fieldErrors.trackNumber}
          hint="По умолчанию — следующий свободный номер"
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={submitDisabled}>
            <Plus className="h-4 w-4" aria-hidden />
            Добавить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
