import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Configuração para evitar pré-renderização
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  console.log('GET /api/settings-simple called')
  
  // Retornar configurações fixas sem banco
  const defaultSettings = {
    id: 'settings',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    workingDays: '1,2,3,4,5',
    meetingDuration: 60,
    bufferTime: 15,
    reminderHours: 24,
    autoApproval: false,
    companyName: 'Vibromak',
    directorName: 'Rogério',
    directorEmail: 'rogerio@vibromak.com.br',
    secretaryEmail: 'recepcao@vibromak.com.br',
    companyPhone: '(14) 3415-4493',
    contactEmail: 'recepcao@vibromak.com.br'
  }
  
  return NextResponse.json({ settings: defaultSettings })
}

export async function PUT(request: NextRequest) {
  console.log('PUT /api/settings-simple called')
  
  try {
    // 1. Testar autenticação
    console.log('Checking session...')
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('No session found')
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    console.log('Session OK, user:', session.user?.email)
    
    // 2. Testar leitura do body
    console.log('Reading request body...')
    const body = await request.json()
    console.log('Body received successfully, keys:', Object.keys(body))
    
    // 3. Simular sucesso sem validação nem banco
    console.log('Simulating success...')
    
    return NextResponse.json({
      message: 'Teste de settings simples - sucesso!',
      receivedKeys: Object.keys(body),
      userEmail: session.user?.email,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in settings-simple PUT:', error)
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown message')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json(
      { 
        error: 'Erro no teste de settings simples',
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown message'
      },
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
