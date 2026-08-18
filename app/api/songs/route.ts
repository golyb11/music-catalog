export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, readValidatedBody } from '@/lib/api';
import { songSchema } from '@/lib/validation/schemas';
import type { SongListItem } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();

    const songs = await prisma.song.findMany({
      where: search ? { title: { contains: search, mode: 'insensitive' } } : undefined,
      include: { _count: { select: { tracks: true } } },
      orderBy: { title: 'asc' },
    });

    const result: SongListItem[] = songs.map((s) => ({
      id: s.id,
      title: s.title,
      albumsCount: s._count.tracks,
    }));
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  const parsed = await readValidatedBody(req, songSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const song = await prisma.song.create({ data: parsed.data });
    return NextResponse.json({ id: song.id, title: song.title }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
