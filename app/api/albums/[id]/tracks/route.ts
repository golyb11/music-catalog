export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError, readValidatedBody } from '@/lib/api';
import { addTrackSchema } from '@/lib/validation/schemas';

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const parsed = await readValidatedBody(req, addTrackSchema);
  if ('response' in parsed) return parsed.response;

  const albumId = params.id;
  const { songId, newSongTitle } = parsed.data;
  let trackNumber: number | undefined = parsed.data.trackNumber;

  try {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) return jsonError(404, 'Альбом не найден');

    if (songId) {
      const song = await prisma.song.findUnique({ where: { id: songId } });
      if (!song) return jsonError(404, 'Песня не найдена');
    }

    // Номер трека не передан — подставляем следующий свободный.
    if (!trackNumber) {
      const max = await prisma.albumTrack.aggregate({
        where: { albumId },
        _max: { trackNumber: true },
      });
      trackNumber = (max._max.trackNumber ?? 0) + 1;
    }
    const finalTrackNumber = trackNumber;

    const track = await prisma.$transaction(async (tx) => {
      let finalSongId = songId;
      if (!finalSongId && newSongTitle) {
        const created = await tx.song.create({ data: { title: newSongTitle } });
        finalSongId = created.id;
      }
      return tx.albumTrack.create({
        data: { albumId, songId: finalSongId as string, trackNumber: finalTrackNumber },
        include: { song: { select: { id: true, title: true } } },
      });
    });

    return NextResponse.json(
      { trackId: track.id, trackNumber: track.trackNumber, song: track.song },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const target = Array.isArray(e.meta?.target)
        ? (e.meta?.target as string[]).join(',')
        : String(e.meta?.target ?? '');
      if (target.includes('trackNumber')) {
        return jsonError(409, `Трек № ${trackNumber} в этом альбоме уже занят`);
      }
      return jsonError(409, 'Эта песня уже добавлена в альбом');
    }
    return handleApiError(e);
  }
}
