import { NextRequest, NextResponse } from 'next/server';
import { ClickDB, CardDB } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId } = body;
    
    if (!cardId) {
      return NextResponse.json({ error: 'cardId é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o card existe
    const card = CardDB.getById(cardId);
    if (!card) {
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });
    }
    
    // Registrar o clique
    ClickDB.create(cardId);
    
    return NextResponse.json({ message: 'Clique registrado com sucesso' }, { status: 201 });
  } catch (error) {
    console.error('Error registering click:', error);
    return NextResponse.json({ error: 'Erro ao registrar clique' }, { status: 500 });
  }
}