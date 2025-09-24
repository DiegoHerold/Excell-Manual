import { NextRequest, NextResponse } from 'next/server';
import { FormulaDB, FormulaSchema } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (category) {
      const formulas = FormulaDB.getByCategory(category);
      return NextResponse.json(formulas);
    }

    const formulas = FormulaDB.getAll();
    return NextResponse.json(formulas);
  } catch (error) {
    console.error('Error fetching formulas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = FormulaSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(body);
    
    const formula = FormulaDB.create(validatedData);
    
    return NextResponse.json(formula, { status: 201 });
  } catch (error) {
    console.error('Error creating formula:', error);
    return NextResponse.json({ error: 'Erro ao criar fórmula' }, { status: 400 });
  }
}