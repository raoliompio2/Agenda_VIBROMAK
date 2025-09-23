import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint para migrar configurações existentes adicionando novos campos
 * Chame uma vez após deploy para atualizar dados existentes
 */
export async function POST() {
  try {
    console.log('🔄 Migrando configurações do sistema...')

    // Verificar se as configurações existem
    const existingSettings = await prisma.systemSettings.findUnique({
      where: { id: 'settings' }
    })

    if (existingSettings) {
      // Atualizar apenas se os novos campos estão vazios/ausentes
      const needsUpdate = !existingSettings.companyPhone || !existingSettings.contactEmail

      if (needsUpdate) {
        const updatedSettings = await prisma.systemSettings.update({
          where: { id: 'settings' },
          data: {
            companyPhone: existingSettings.companyPhone || '(14) 3415-4493',
            contactEmail: existingSettings.contactEmail || 'recepcao@vibromak.com.br',
            // Garantir que outros campos estão corretos
            companyName: existingSettings.companyName || 'Vibromak',
            directorName: existingSettings.directorName || 'Rogério',
            directorEmail: existingSettings.directorEmail || 'rogerio@vibromak.com.br',
            secretaryEmail: existingSettings.secretaryEmail || 'recepcao@vibromak.com.br'
          }
        })

        console.log('✅ Configurações migradas com sucesso!')
        return NextResponse.json({
          success: true,
          message: 'Configurações migradas com sucesso',
          settings: updatedSettings
        })
      } else {
        console.log('ℹ️ Configurações já estão atualizadas')
        return NextResponse.json({
          success: true,
          message: 'Configurações já estão atualizadas',
          settings: existingSettings
        })
      }
    } else {
      // Criar configurações se não existem
      const newSettings = await prisma.systemSettings.create({
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

      console.log('✅ Configurações criadas com sucesso!')
      return NextResponse.json({
        success: true,
        message: 'Configurações criadas com sucesso',
        settings: newSettings
      })
    }

  } catch (error) {
    console.error('❌ Erro ao migrar configurações:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
