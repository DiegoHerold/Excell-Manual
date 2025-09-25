import { NextRequest, NextResponse } from 'next/server';
import { CategoryDB, CategorySchema } from '@/lib/database';

export async function GET() {
  try {
    const categories = CategoryDB.getAll();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = CategorySchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(body);
    
    const category = CategoryDB.create(validatedData);
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    const validatedData = CategorySchema.omit({ id: true, createdAt: true, updatedAt: true }).partial().parse(updateData);
    
    const category = CategoryDB.update(id, validatedData);
    
    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    const deleted = CategoryDB.delete(parseInt(id));
    
    if (!deleted) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}