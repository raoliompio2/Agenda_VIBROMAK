import { NextRequest, NextResponse } from 'next/server'

// Configuração para evitar pré-renderização
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  console.log('GET /api/test-simple called')
  return NextResponse.json({ 
    message: 'GET funcionando!', 
    timestamp: new Date().toISOString() 
  })
}

export async function PUT(request: NextRequest) {
  console.log('PUT /api/test-simple called')
  
  try {
    const body = await request.json()
    console.log('Body received:', body)
    
    return NextResponse.json({ 
      message: 'PUT funcionando!', 
      receivedData: body,
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    console.error('Error in test-simple PUT:', error)
    return NextResponse.json(
      { error: 'Erro no teste simples', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
