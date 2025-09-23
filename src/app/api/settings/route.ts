import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Configuração para evitar pré-renderização
export const dynamic = 'force-dynamic'
export const revalidate = 0

const settingsSchema = z.object({
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  workingDays: z.string().regex(/^[\d,]+$/, 'Formato inválido (números separados por vírgula)'),
  meetingDuration: z.number().min(15).max(480),
  bufferTime: z.number().min(0).max(120),
  reminderHours: z.number().min(1).max(168),
  autoApproval: z.boolean(),
  companyName: z.string().min(1),
  directorName: z.string().min(1),
  directorEmail: z.string().email().optional().or(z.literal('')),
  secretaryEmail: z.string().email().optional().or(z.literal('')),
  companyPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal(''))
})

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'settings' }
    })

    if (!settings) {
      // Tentar criar configurações padrão (com campos antigos primeiro)
      try {
        settings = await prisma.systemSettings.create({
          data: {
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
        })
      } catch (createError) {
        // Se falhar com novos campos, tentar apenas com campos antigos
        console.warn('Tentando criar com campos básicos...', createError)
        settings = await prisma.systemSettings.create({
          data: {
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
            secretaryEmail: 'recepcao@vibromak.com.br'
          }
        })
      }
    }

    // Garantir que todos os campos existem (backward compatibility)
    const settingsWithDefaults = {
      ...settings,
      companyPhone: settings.companyPhone || '(14) 3415-4493',
      contactEmail: settings.contactEmail || 'recepcao@vibromak.com.br'
    }

    return NextResponse.json({ settings: settingsWithDefaults })

  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    
    // Fallback: retornar configurações padrão se tudo falhar
    const fallbackSettings = {
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
      contactEmail: 'recepcao@vibromak.com.br',
      updatedAt: new Date()
    }
    
    return NextResponse.json({ settings: fallbackSettings })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar método permitido
    console.log('PUT method called on /api/settings')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Request body received:', JSON.stringify(body, null, 2))
    
    const validatedData = settingsSchema.parse(body)
    console.log('Data validated successfully:', JSON.stringify(validatedData, null, 2))

    // Separar campos que podem não existir no schema atual
    const { companyPhone, contactEmail, ...basicData } = validatedData

    try {
      // Tentar atualizar com todos os campos
      console.log('Attempting database upsert with all fields...')
      const settings = await prisma.systemSettings.upsert({
        where: { id: 'settings' },
        update: validatedData,
        create: {
          id: 'settings',
          ...validatedData
        }
      })
      console.log('Database upsert successful:', settings)

      return NextResponse.json({
        message: 'Configurações atualizadas com sucesso',
        settings
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    } catch (updateError) {
      // Se falhar, tentar apenas com campos básicos
      console.error('Database upsert failed:', updateError)
      console.warn('Tentando atualizar apenas campos básicos...', updateError)
      
      const settings = await prisma.systemSettings.upsert({
        where: { id: 'settings' },
        update: basicData,
        create: {
          id: 'settings',
          ...basicData
        }
      })

      // Adicionar campos que podem estar faltando na resposta
      const settingsWithDefaults = {
        ...settings,
        companyPhone: companyPhone || '(14) 3415-4493',
        contactEmail: contactEmail || 'recepcao@vibromak.com.br'
      }

      return NextResponse.json({
        message: 'Configurações atualizadas com sucesso (modo compatibilidade)',
        settings: settingsWithDefaults
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available')
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Handler para requisições OPTIONS (CORS preflight)
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

