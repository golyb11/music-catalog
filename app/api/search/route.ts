export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api';
import type { SearchResults } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() ?? '';

    if (q.length < 1) {
      const empty: SearchResults = { artists: [], albums: [], songs: [] };
      return NextResponse.json(empty);
    }

    const [artists, albums, songs] = await Promise.all([
      prisma.artist.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        include: { _count: { select: { albums: true } } },
        take: 5,
        orderBy: { name: 'asc' },
      }),
      prisma.album.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        include: { artist: { select: { name: true } } },
        take: 5,
        orderBy: { title: 'asc' },
      }),
      prisma.song.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        include: { _count: { select: { tracks: true } } },
        take: 5,
        orderBy: { title: 'asc' },
      }),
    ]);

    const result: SearchResults = {
      artists: artists.map((a) => ({ id: a.id, name: a.name, albumsCount: a._count.albums })),
      albums: albums.map((a) => ({
        id: a.id,
        title: a.title,
        releaseYear: a.releaseYear,
        artistName: a.artist.name,
      })),
      songs: songs.map((s) => ({ id: s.id, title: s.title, albumsCount: s._count.tracks })),
    };
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}
