import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function POST() {
  try {
    seedDatabase();
    return NextResponse.json({ message: 'Banco de dados populado com sucesso!' });
  } catch (error) {
    console.error('Erro ao popular banco de dados:', error);
    return NextResponse.json({ error: 'Erro ao popular banco de dados' }, { status: 500 });
  }
}