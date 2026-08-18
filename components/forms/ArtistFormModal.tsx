'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';
import { artistSchema } from '@/lib/validation/schemas';

export function ArtistFormModal({
  open,
  onClose,
  artist,
}: {
  open: boolean;
  onClose: () => void;
  artist?: { id: string; name: string } | null;
}) {
  const [name, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setName(artist?.name ?? '');
      setFieldErrors({});
    }
  }, [open, artist]);

  const mutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      if (artist) {
        return api.put(`/api/artists/${artist.id}`, data);
      }
      return api.post('/api/artists', data);
    },
    onSuccess: () => {
      toast.showToast('success', artist ? 'Исполнитель обновлён' : 'Исполнитель добавлен');
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        if (e.fieldErrors?.name) {
          setFieldErrors({ name: e.fieldErrors.name[0] });
        } else {
          toast.showToast('error', e.message);
        }
      } else {
        toast.showToast('error', 'Не удалось сохранить исполнителя');
      }
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = artistSchema.safeParse({ name });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ name: flat.name?.[0] ?? 'Проверьте поле' });
      return;
    }
    setFieldErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <Modal open={open} onClose={onClose} title={artist ? 'Редактировать исполнителя' : 'Добавить исполнителя'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Имя исполнителя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          placeholder="Например, Pink Floyd"
          autoFocus
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
