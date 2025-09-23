import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('=== DEBUG SETTINGS ROUTE ===')
    
    // 1. Testar conexão com banco
    console.log('1. Testing database connection...')
    try {
      await prisma.$connect()
      console.log('✅ Database connection successful')
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      return NextResponse.json({
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      }, { status: 500 })
    }

    // 2. Verificar se a tabela SystemSettings existe
    console.log('2. Checking SystemSettings table...')
    try {
      const count = await prisma.systemSettings.count()
      console.log(`✅ SystemSettings table exists with ${count} records`)
    } catch (tableError) {
      console.error('❌ SystemSettings table error:', tableError)
      return NextResponse.json({
        error: 'SystemSettings table error',
        details: tableError instanceof Error ? tableError.message : 'Unknown table error'
      }, { status: 500 })
    }

    // 3. Tentar buscar configurações existentes
    console.log('3. Fetching existing settings...')
    let settings = null
    try {
      settings = await prisma.systemSettings.findUnique({
        where: { id: 'settings' }
      })
      console.log('Settings found:', settings ? 'yes' : 'no')
      if (settings) {
        console.log('Settings data:', JSON.stringify(settings, null, 2))
      }
    } catch (fetchError) {
      console.error('❌ Error fetching settings:', fetchError)
    }

    // 4. Verificar autenticação
    console.log('4. Testing authentication...')
    let sessionStatus = 'unknown'
    try {
      const session = await getServerSession(authOptions)
      sessionStatus = session ? 'authenticated' : 'not_authenticated'
      console.log(`Session status: ${sessionStatus}`)
    } catch (authError) {
      console.error('❌ Auth error:', authError)
      sessionStatus = 'auth_error'
    }

    return NextResponse.json({
      status: 'debug_complete',
      database: 'connected',
      table: 'exists',
      settings_exist: !!settings,
      authentication: sessionStatus,
      settings_data: settings,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('=== DEBUG ROUTE ERROR ===')
    console.error('Error:', error)
    
    return NextResponse.json({
      error: 'Debug route failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
