import { NextRequest, NextResponse } from 'next/server';
import { CardDB, CardSchema } from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const card = CardDB.getById(parseInt(params.id));
    
    if (!card) {
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { categoryIds, ...updateData } = body;
    
    const validatedData = CardSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial().parse(updateData);
    
    const card = CardDB.update(parseInt(params.id), validatedData, categoryIds);
    
    if (!card) {
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json({ error: 'Erro ao atualizar card' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = CardDB.delete(parseInt(params.id));
    
    if (!deleted) {
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Card excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}