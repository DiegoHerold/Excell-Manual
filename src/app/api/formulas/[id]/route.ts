import { NextRequest, NextResponse } from 'next/server';
import { FormulaDB, FormulaSchema } from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formula = FormulaDB.getById(params.id);
    
    if (!formula) {
      return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(formula);
  } catch (error) {
    console.error('Error fetching formula:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    const validatedData = FormulaSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial().parse(body);
    
    const formula = FormulaDB.update(params.id, validatedData);
    
    if (!formula) {
      return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(formula);
  } catch (error) {
    console.error('Error updating formula:', error);
    return NextResponse.json({ error: 'Erro ao atualizar fórmula' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = FormulaDB.delete(params.id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Fórmula excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting formula:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}