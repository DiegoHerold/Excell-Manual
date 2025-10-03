import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CategoryDB, CategorySchema, Category } from '@/lib/database';

const updateSchema = CategorySchema.omit({ id: true, createdAt: true, updatedAt: true }).partial();

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const category = CategoryDB.getById(id);

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json(formatCategory(category));
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const category = CategoryDB.update(id, validatedData);

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json(formatCategory(category));
  } catch (error) {
    console.error('Error updating category:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const deleted = CategoryDB.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
