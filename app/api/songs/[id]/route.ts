export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError, readValidatedBody } from '@/lib/api';
import { songSchema } from '@/lib/validation/schemas';
import type { SongDetail } from '@/types';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const song = await prisma.song.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          include: {
            album: {
              include: { artist: { select: { id: true, name: true } } },
            },
          },
          orderBy: [{ album: { title: 'asc' } }],
        },
      },
    });
    if (!song) return jsonError(404, 'Песня не найдена');

    const result: SongDetail = {
      id: song.id,
      title: song.title,
      albums: song.tracks.map((t) => ({
        trackId: t.id,
        trackNumber: t.trackNumber,
        album: {
          id: t.album.id,
          title: t.album.title,
          releaseYear: t.album.releaseYear,
          artist: t.album.artist,
        },
      })),
    };
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: Params) {
  const parsed = await readValidatedBody(req, songSchema);
  if ('response' in parsed) return parsed.response;

  try {
    await prisma.song.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    // Каскадное удаление связок AlbumTrack во всех альбомах задаётся в схеме
    // Prisma (onDelete: Cascade у AlbumTrack.song).
    const existing = await prisma.song.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError(404, 'Песня не найдена');

    await prisma.song.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
