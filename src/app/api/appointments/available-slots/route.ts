import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTimeSlots } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      )
    }

    const date = new Date(dateParam)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Buscar configurações do sistema
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'settings' }
    })

    if (!settings) {
      // Criar configurações padrão se não existirem
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
          companyName: 'Empresa',
          directorName: 'Diretor',
          directorEmail: '',
          secretaryEmail: ''
        }
      })
    }

    // Verificar se é um dia útil
    const dayOfWeek = date.getDay()
    const workingDays = settings.workingDays.split(',').map(Number)
    
    if (!workingDays.includes(dayOfWeek)) {
      return NextResponse.json({
        availableSlots: [],
        message: 'Data não é um dia útil'
      })
    }

    // Buscar agendamentos existentes para o dia
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    })

    // Gerar slots disponíveis
    const availableSlots = generateTimeSlots(
      date,
      settings.workingHoursStart,
      settings.workingHoursEnd,
      settings.meetingDuration,
      settings.bufferTime,
      existingAppointments
    )

    return NextResponse.json({
      availableSlots,
      settings: {
        workingHoursStart: settings.workingHoursStart,
        workingHoursEnd: settings.workingHoursEnd,
        meetingDuration: settings.meetingDuration,
        bufferTime: settings.bufferTime
      }
    })

  } catch (error) {
    console.error('Erro ao buscar slots disponíveis:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

