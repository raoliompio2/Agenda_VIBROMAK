import { prisma } from './prisma'
import { hash } from 'bcryptjs'

export async function setupInitialData() {
  try {
    console.log('🚀 Configurando dados iniciais...')

    // Criar usuário administrador padrão
    const existingUser = await prisma.user.findUnique({
      where: { email: 'recepcao@vibromak.com.br' }
    })

    if (!existingUser) {
      const hashedPassword = await hash('admin123', 12)
      
      await prisma.user.create({
        data: {
          email: 'recepcao@vibromak.com.br',
          name: 'Recepção',
          role: 'ADMIN',
          password: hashedPassword
        }
      })
      console.log('✅ Usuário administrador criado')
    }

    // Criar configurações do sistema
    const existingSettings = await prisma.systemSettings.findUnique({
      where: { id: 'settings' }
    })

    if (!existingSettings) {
      await prisma.systemSettings.create({
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
      console.log('✅ Configurações do sistema criadas')
    }

    console.log('🎉 Setup concluído com sucesso!')
    
    return {
      success: true,
      message: 'Dados iniciais configurados com sucesso'
    }

  } catch (error) {
    console.error('❌ Erro no setup:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}
