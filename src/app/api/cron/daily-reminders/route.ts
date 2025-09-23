import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para ser chamado por um cron job diário
 * Chama o sistema de lembretes automáticos
 * 
 * Para usar com Vercel Cron:
 * 1. Criar arquivo vercel.json na raiz:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/daily-reminders",
 *       "schedule": "0 9 * * *"
 *     }
 *   ]
 * }
 * 
 * Ou configurar um webhook externo para chamar este endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se a requisição é de uma fonte autorizada
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('🔄 Executando job de lembretes diários...')

    // Chamar o sistema de lembretes
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/auto-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao processar lembretes: ${response.status}`)
    }

    const result = await response.json()
    
    console.log('✅ Job de lembretes concluído:', result)

    return NextResponse.json({
      success: true,
      message: 'Job de lembretes executado com sucesso',
      timestamp: new Date().toISOString(),
      ...result
    })

  } catch (error) {
    console.error('❌ Erro no job de lembretes:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno no job de lembretes',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Também permitir POST para webhooks
export const POST = GET
