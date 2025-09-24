import { NextRequest, NextResponse } from 'next/server';
import { CardDB, CardSchema } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (categoryId) {
      const cards = CardDB.getByCategoryId(parseInt(categoryId));
      return NextResponse.json(cards);
    }

    const cards = CardDB.getAll();
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryIds = [], ...cardData } = body;
    
    const validatedData = CardSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(cardData);
    
    const card = CardDB.create(validatedData, categoryIds);
    
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Erro ao criar card' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, categoryIds, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    const validatedData = CardSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial().parse(updateData);
    
    const card = CardDB.update(id, validatedData, categoryIds);
    
    if (!card) {
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json({ error: 'Erro ao atualizar card' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    const deleted = CardDB.delete(parseInt(id));
    
    if (!deleted) {
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Card excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}