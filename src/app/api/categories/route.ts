import { NextResponse } from 'next/server';
import { FormulaDB } from '@/lib/database';

export async function GET() {
  try {
    const categories = FormulaDB.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}