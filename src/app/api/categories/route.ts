import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CategoryDB, CategorySchema, Category } from '@/lib/database';

function getExpectedToken() {
  return process.env.ADMIN_TOKEN ?? process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? undefined;
}

function checkAuth(request: NextRequest): boolean {
  const authToken = request.headers.get('authorization');
  const expectedToken = getExpectedToken();

  if (!expectedToken) return true;

  return authToken === `Bearer ${expectedToken}`;
}

function formatCategory(category: Category) {
  return {
    ...category,
    createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : category.createdAt,
    updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : category.updatedAt,
  };
}

export async function GET() {
  try {
    const categories = CategoryDB.getAll();
    return NextResponse.json(categories.map(formatCategory));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CategorySchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(body);

    const category = CategoryDB.create(validatedData);

    return NextResponse.json(formatCategory(category), { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 400 });
  }
}