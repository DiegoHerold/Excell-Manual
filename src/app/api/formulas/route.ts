import { NextRequest, NextResponse } from 'next/server';
import { FormulaDB, FormulaSchema } from '@/lib/database';

// Simple auth check for write operations
function checkAuth(request: NextRequest): boolean {
  const authToken = request.headers.get('authorization');
  const expectedToken = process.env.ADMIN_TOKEN;
  
  if (!expectedToken) return true; // No auth required if not set
  
  return authToken === `Bearer ${expectedToken}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get('categoryIds');

    let formulas;
    if (categoryIds) {
      const ids = categoryIds.split(',').map(Number).filter(n => !isNaN(n));
      formulas = FormulaDB.getRecent(ids);
    } else {
      formulas = FormulaDB.getAll();
    }

    // Remove internal metrics from response
    const cleanFormulas = formulas.map(formula => ({
      id: formula.id,
      name: formula.name,
      description: formula.description,
      formula: formula.formula,
      videoUrl: formula.videoUrl,
      categoryIds: formula.categoryIds,
      createdAt: formula.createdAt,
      updatedAt: formula.updatedAt,
    }));

    return NextResponse.json(cleanFormulas);
  } catch (error) {
    console.error('Error fetching formulas:', error);
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
    
    // Remove internal metrics from response
    const cleanFormula = {
      id: formula.id,
      name: formula.name,
      description: formula.description,
      formula: formula.formula,
      videoUrl: formula.videoUrl,
      categoryIds: formula.categoryIds,
      createdAt: formula.createdAt,
      updatedAt: formula.updatedAt,
    };
    
    return NextResponse.json(cleanFormula, { status: 201 });
  } catch (error) {
    console.error('Error creating formula:', error);
    return NextResponse.json({ error: 'Erro ao criar fórmula' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    const validatedData = FormulaSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial().parse(updateData);
    
    const formula = FormulaDB.update(id, validatedData);
    
    if (!formula) {
      return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 });
    }
    
    // Remove internal metrics from response
    const cleanFormula = {
      id: formula.id,
      name: formula.name,
      description: formula.description,
      formula: formula.formula,
      videoUrl: formula.videoUrl,
      categoryIds: formula.categoryIds,
      createdAt: formula.createdAt,
      updatedAt: formula.updatedAt,
    };
    
    return NextResponse.json(cleanFormula);
  } catch (error) {
    console.error('Error updating formula:', error);
    return NextResponse.json({ error: 'Erro ao atualizar fórmula' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    const deleted = FormulaDB.delete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Fórmula excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting formula:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}