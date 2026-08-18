export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api';
import type { Stats } from '@/types';

export async function GET() {
  try {
    const [artistsCount, albumsCount, songsCount, recentAlbums] = await Promise.all([
      prisma.artist.count(),
      prisma.album.count(),
      prisma.song.count(),
      prisma.album.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: { select: { id: true, name: true } },
          _count: { select: { tracks: true } },
        },
      }),
    ]);

    const result: Stats = {
      artistsCount,
      albumsCount,
      songsCount,
      recentAlbums: recentAlbums.map((album) => ({
        id: album.id,
        title: album.title,
        releaseYear: album.releaseYear,
        artist: album.artist,
        tracksCount: album._count.tracks,
      })),
    };
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}
