import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FormulaDB, FormulaSchema, formatFormulaForResponse } from '@/lib/database';

const querySchema = z.object({
  categoryIds: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

function checkAuth(request: NextRequest): boolean {
  const authToken = request.headers.get('authorization');
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) return true;

  return authToken === `Bearer ${expectedToken}`;
}

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

    let formulas = FormulaDB.getAllByCategories(categoryIds);

    if (parsed.page && parsed.pageSize) {
      const start = (parsed.page - 1) * parsed.pageSize;
      formulas = formulas.slice(start, start + parsed.pageSize);
    }

    return NextResponse.json(formulas.map(formatFormulaForResponse));
  } catch (error) {
    console.error('Error fetching formulas:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parâmetros inválidos', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = FormulaSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(body);

    const formula = FormulaDB.create(validatedData);

    return NextResponse.json(formatFormulaForResponse(formula), { status: 201 });
  } catch (error) {
    console.error('Error creating formula:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro ao criar fórmula' }, { status: 400 });
  }
}