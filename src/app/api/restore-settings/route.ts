import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🔄 Restaurando configurações padrão...')
    
    // Criar configurações padrão da Vibromak
    const defaultSettings = await prisma.systemSettings.upsert({
      where: { id: 'settings' },
      update: {
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
        workingDays: '1,2,3,4,5', // Segunda a sexta
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
      },
      create: {
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

    console.log('✅ Configurações restauradas:', defaultSettings)

    return NextResponse.json({
      success: true,
      message: 'Configurações padrão restauradas com sucesso',
      settings: defaultSettings
    })

  } catch (error) {
    console.error('❌ Erro ao restaurar configurações:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao restaurar configurações',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
