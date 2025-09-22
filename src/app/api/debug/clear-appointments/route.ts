import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // CUIDADO: Isso apaga todos os agendamentos
    const deleted = await prisma.appointment.deleteMany({})
    
    console.log('🗑️ Agendamentos removidos:', deleted.count)
    
    return NextResponse.json(
      { 
        message: `${deleted.count} agendamentos removidos com sucesso`,
        count: deleted.count
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao limpar agendamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

