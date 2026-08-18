import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import type { ZodType } from 'zod';

export function jsonError(
  status: number,
  error: string,
  fieldErrors?: Record<string, string[]>
) {
  return NextResponse.json({ error, fieldErrors }, { status });
}

export function handleApiError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      return jsonError(409, 'Запись с такими данными уже существует');
    }
    if (e.code === 'P2025') {
      return jsonError(404, 'Запись не найдена');
    }
    if (e.code === 'P2003') {
      return jsonError(400, 'Ссылка на несуществующую запись');
    }
  }
  console.error('API error:', e);
  return jsonError(500, 'Внутренняя ошибка сервера');
}

export async function readValidatedBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { response: jsonError(400, 'Некорректный JSON в теле запроса') };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return {
      response: jsonError(400, 'Проверьте правильность заполнения полей', flat),
    };
  }
  return { data: parsed.data };
}
