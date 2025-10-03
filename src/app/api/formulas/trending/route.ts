import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FormulaDB, formatFormulaForResponse } from '@/lib/database';

const querySchema = z.object({
  categoryIds: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      categoryIds: searchParams.get('categoryIds') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    });

    const categoryIds = parsed.categoryIds
      ? parsed.categoryIds
          .split(',')
          .map((value) => Number(value))
          .filter((value) => !Number.isNaN(value))
      : undefined;

    const formulas = FormulaDB.getTrending(categoryIds, parsed.page, parsed.pageSize);

    return NextResponse.json(formulas.map(formatFormulaForResponse));
  } catch (error) {
    console.error('Error fetching trending formulas:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parâmetros inválidos', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
