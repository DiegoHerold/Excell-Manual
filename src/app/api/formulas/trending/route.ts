import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FormulaDB } from '@/lib/database';

const QuerySchema = z.object({
  categoryIds: z.string().optional().transform(val => 
    val ? val.split(',').map(Number).filter(n => !isNaN(n)) : undefined
  ),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  pageSize: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      categoryIds: searchParams.get('categoryIds') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    });
    
    const formulas = FormulaDB.getTrending(query.categoryIds, query.page, query.pageSize);
    
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
    console.error('Error fetching trending formulas:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Parâmetros inválidos', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}