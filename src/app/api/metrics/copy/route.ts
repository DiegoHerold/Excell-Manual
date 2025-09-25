import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FormulaDB } from '@/lib/database';
import { getSessionIdFromRequest, setSessionCookie } from '@/lib/session';

const CopyRequestSchema = z.object({
  formulaId: z.string().min(1, 'Formula ID é obrigatório'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formulaId } = CopyRequestSchema.parse(body);
    
    const sessionId = getSessionIdFromRequest(request);
    
    // Check if formula exists
    const formula = FormulaDB.getById(formulaId);
    if (!formula) {
      return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 });
    }
    
    // Record the copy event (with rate limiting)
    const recorded = FormulaDB.recordCopy(formulaId, sessionId);
    
    const response = NextResponse.json({ 
      success: true, 
      recorded,
      message: recorded ? 'Cópia registrada' : 'Rate limited'
    });
    
    // Set session cookie if it didn't exist
    return setSessionCookie(response, sessionId);
    
  } catch (error) {
    console.error('Error recording copy:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}