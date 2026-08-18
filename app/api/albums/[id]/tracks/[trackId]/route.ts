export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError, readValidatedBody } from '@/lib/api';
import { trackNumberSchema } from '@/lib/validation/schemas';
import type { AlbumTrackItem } from '@/types';

type Params = { params: { id: string; trackId: string } };

// Изменение номера трека. Если новый номер уже занят в этом альбоме,
// треки меняются местами (swap) в одной транзакции.
export async function PUT(req: Request, { params }: Params) {
  const parsed = await readValidatedBody(req, trackNumberSchema);
  if ('response' in parsed) return parsed.response;

  const { id: albumId, trackId } = params;
  const newNumber = parsed.data.trackNumber;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const target = await tx.albumTrack.findFirst({ where: { id: trackId, albumId } });
      if (!target) return null;

      if (target.trackNumber === newNumber) return target;

      const occupier = await tx.albumTrack.findFirst({
        where: { albumId, trackNumber: newNumber, NOT: { id: trackId } },
      });

      if (occupier) {
        // Промежуточный отрицательный номер, чтобы не нарушить уникальность
        // (albumId, trackNumber) во время обмена.
        await tx.albumTrack.update({
          where: { id: occupier.id },
          data: { trackNumber: -1 },
        });
        await tx.albumTrack.update({
          where: { id: trackId },
          data: { trackNumber: newNumber },
        });
        await tx.albumTrack.update({
          where: { id: occupier.id },
          data: { trackNumber: target.trackNumber },
        });
        return tx.albumTrack.findUniqueOrThrow({ where: { id: trackId } });
      }

      return tx.albumTrack.update({ where: { id: trackId }, data: { trackNumber: newNumber } });
    });

    if (!updated) return jsonError(404, 'Трек не найден в этом альбоме');

    const song = await prisma.song.findUniqueOrThrow({ where: { id: updated.songId } });
    const result: AlbumTrackItem = {
      trackId: updated.id,
      trackNumber: updated.trackNumber,
      song: { id: song.id, title: song.title },
    };
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id: albumId, trackId } = params;
  try {
    // Убираем песню из альбома; сама песня остаётся в каталоге.
    const deleted = await prisma.albumTrack.deleteMany({
      where: { id: trackId, albumId },
    });
    if (deleted.count === 0) return jsonError(404, 'Трек не найден в этом альбоме');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
