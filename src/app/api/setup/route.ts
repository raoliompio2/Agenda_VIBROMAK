import { NextResponse } from 'next/server'
import { setupInitialData } from '@/lib/setup'

export async function POST() {
  try {
    const result = await setupInitialData()
    
    if (result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro no setup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

