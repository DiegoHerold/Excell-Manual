import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FormulaDB, FormulaSchema, formatFormulaForResponse } from '@/lib/database';

const updateSchema = FormulaSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial();

function checkAuth(request: NextRequest): boolean {
  const authToken = request.headers.get('authorization');
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) return true;

  return authToken === `Bearer ${expectedToken}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const formula = FormulaDB.getById(id);

    if (!formula) {
      return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 });
    }

    return NextResponse.json(formatFormulaForResponse(formula));
  } catch (error) {
    console.error('Error fetching formula:', error);
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

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const formula = FormulaDB.update(id, validatedData);

    if (!formula) {
      return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 });
    }

    return NextResponse.json(formatFormulaForResponse(formula));
  } catch (error) {
    console.error('Error updating formula:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro ao atualizar fórmula' }, { status: 400 });
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

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const deleted = FormulaDB.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting formula:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
