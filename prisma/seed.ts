import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type TrackSeed = { title: string; trackNumber: number };
type AlbumSeed = { title: string; releaseYear: number; tracks: TrackSeed[] };
type ArtistSeed = { name: string; albums: AlbumSeed[] };

const DATA: ArtistSeed[] = [
  {
    name: 'Pink Floyd',
    albums: [
      {
        title: 'The Dark Side of the Moon',
        releaseYear: 1973,
        tracks: [
          { title: 'Speak to Me', trackNumber: 1 },
          { title: 'Breathe (In the Air)', trackNumber: 2 },
          { title: 'On the Run', trackNumber: 3 },
          { title: 'Time', trackNumber: 4 },
          { title: 'The Great Gig in the Sky', trackNumber: 5 },
          { title: 'Money', trackNumber: 6 },
          { title: 'Us and Them', trackNumber: 7 },
          { title: 'Any Colour You Like', trackNumber: 8 },
          { title: 'Brain Damage', trackNumber: 9 },
          { title: 'Eclipse', trackNumber: 10 },
        ],
      },
      {
        title: 'The Wall',
        releaseYear: 1979,
        tracks: [
          { title: 'In the Flesh?', trackNumber: 1 },
          { title: 'The Thin Ice', trackNumber: 2 },
          { title: 'Another Brick in the Wall, Part 1', trackNumber: 3 },
          { title: 'The Happiest Days of Our Lives', trackNumber: 4 },
          { title: 'Another Brick in the Wall, Part 2', trackNumber: 5 },
          { title: 'Goodbye Blue Sky', trackNumber: 6 },
        ],
      },
    ],
  },
  {
    name: 'Queen',
    albums: [
      {
        title: 'A Night at the Opera',
        releaseYear: 1975,
        tracks: [
          { title: 'Death on Two Legs', trackNumber: 1 },
          { title: "You're My Best Friend", trackNumber: 2 },
          { title: 'Love of My Life', trackNumber: 3 },
          { title: 'Bohemian Rhapsody', trackNumber: 4 },
          { title: 'The Prophet\u2019s Song', trackNumber: 5 },
          { title: 'God Save the Queen', trackNumber: 6 },
        ],
      },
    ],
  },
  {
    name: 'Radiohead',
    albums: [
      {
        title: 'Pablo Honey',
        releaseYear: 1993,
        tracks: [
          { title: 'You', trackNumber: 1 },
          { title: 'Creep', trackNumber: 2 },
          { title: 'Stop Whispering', trackNumber: 3 },
          { title: 'Thinking About You', trackNumber: 4 },
        ],
      },
      {
        title: 'OK Computer',
        releaseYear: 1997,
        tracks: [
          { title: 'Airbag', trackNumber: 1 },
          { title: 'Paranoid Android', trackNumber: 2 },
          { title: 'Exit Music (For a Film)', trackNumber: 3 },
          { title: 'Karma Police', trackNumber: 4 },
          { title: 'No Surprises', trackNumber: 5 },
          { title: 'The Tourist', trackNumber: 6 },
        ],
      },
      {
        title: 'In Rainbows',
        releaseYear: 2007,
        tracks: [
          { title: '15 Step', trackNumber: 1 },
          { title: 'Bodysnatchers', trackNumber: 2 },
          { title: 'Nude', trackNumber: 3 },
          { title: 'Weird Fishes/Arpeggi', trackNumber: 4 },
          { title: 'All I Need', trackNumber: 5 },
          { title: 'Reckoner', trackNumber: 6 },
        ],
      },
    ],
  },
  {
    name: 'Daft Punk',
    albums: [
      {
        title: 'Discovery',
        releaseYear: 2001,
        tracks: [
          { title: 'One More Time', trackNumber: 1 },
          { title: 'Aerodynamic', trackNumber: 2 },
          { title: 'Digital Love', trackNumber: 3 },
          { title: 'Harder, Better, Faster, Stronger', trackNumber: 4 },
          { title: 'Crescendolls', trackNumber: 5 },
          { title: 'Nightvision', trackNumber: 6 },
        ],
      },
      {
        title: 'Random Access Memories',
        releaseYear: 2013,
        tracks: [
          { title: 'Give Life Back to Music', trackNumber: 1 },
          { title: 'Giorgio by Moroder', trackNumber: 2 },
          { title: 'Instant Crush', trackNumber: 3 },
          { title: 'Lose Yourself to Dance', trackNumber: 4 },
          { title: 'Get Lucky', trackNumber: 5 },
          { title: 'Motherboard', trackNumber: 6 },
        ],
      },
    ],
  },
  {
    name: 'Various Artists',
    albums: [
      {
        title: 'Legends of Rock',
        releaseYear: 2020,
        tracks: [
          // Демонстрация ключевого требования ТЗ: одни и те же песни
          // входят в разные альбомы с разными порядковыми номерами.
          { title: 'Bohemian Rhapsody', trackNumber: 1 }, // в "A Night at the Opera" — № 4
          { title: 'Money', trackNumber: 2 },             // в "The Dark Side of the Moon" — № 6
          { title: 'Creep', trackNumber: 3 },             // в "Pablo Honey" — № 2
          { title: 'Get Lucky', trackNumber: 4 },         // в "Random Access Memories" — № 5
          { title: 'Time', trackNumber: 5 },              // в "The Dark Side of the Moon" — № 4
        ],
      },
    ],
  },
];

async function main() {
  const existing = await prisma.artist.count();
  if (existing > 0) {
    console.log('База данных не пуста — сидирование пропущено.');
    return;
  }

  const songByTitle = new Map<string, string>();

  for (const artistSeed of DATA) {
    const artist = await prisma.artist.create({
      data: { name: artistSeed.name },
    });

    for (const albumSeed of artistSeed.albums) {
      const album = await prisma.album.create({
        data: {
          title: albumSeed.title,
          releaseYear: albumSeed.releaseYear,
          artistId: artist.id,
        },
      });

      for (const track of albumSeed.tracks) {
        let songId = songByTitle.get(track.title);
        if (!songId) {
          const song = await prisma.song.create({ data: { title: track.title } });
          songId = song.id;
          songByTitle.set(track.title, song.id);
        }
        await prisma.albumTrack.create({
          data: {
            albumId: album.id,
            songId,
            trackNumber: track.trackNumber,
          },
        });
      }
    }
    console.log(`Исполнитель "${artistSeed.name}": добавлено альбомов — ${artistSeed.albums.length}`);
  }

  console.log('Сидирование завершено.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
