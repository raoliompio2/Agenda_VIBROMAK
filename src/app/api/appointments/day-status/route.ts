import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTimeSlots } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    
    if (!dateStr) {
      return NextResponse.json({ error: 'Data é obrigatória' }, { status: 400 })
    }

    // Buscar configurações do sistema
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'settings' }
    })

    if (!settings) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 500 })
    }

    // Converter data
    const date = new Date(dateStr)
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)

    // Buscar agendamentos do dia
    const appointments = await prisma.appointment.findMany({
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
        endTime: true,
        status: true
      }
    })

    // Verificar se é dia útil
    const dayOfWeek = date.getDay()
    const workingDays = settings.workingDays.split(',').map(Number)
    
    if (!workingDays.includes(dayOfWeek)) {
      return NextResponse.json({
        date: dateStr,
        isWorkingDay: false,
        occupationRate: 0,
        status: 'non_working',
        totalSlots: 0,
        occupiedSlots: 0,
        availableSlots: 0
      })
    }

    // Gerar slots disponíveis do dia
    const allSlots = generateTimeSlots(
      date,
      settings.workingHoursStart,
      settings.workingHoursEnd,
      settings.meetingDuration,
      settings.bufferTime,
      [] // Sem filtrar por agendamentos para contar total
    )

    const totalSlots = allSlots.length

    // Contar slots ocupados
    let occupiedSlots = 0
    let hasPending = false
    let hasConfirmed = false

    appointments.forEach(apt => {
      occupiedSlots++
      if (apt.status === 'PENDING') hasPending = true
      if (apt.status === 'CONFIRMED') hasConfirmed = true
    })

    const availableSlots = totalSlots - occupiedSlots
    const occupationRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0

    // Determinar status baseado na ocupação
    let status = 'available' // Verde - disponível
    
    if (occupationRate >= 100) {
      status = 'full' // Vermelho - 100% ocupado
    } else if (occupationRate >= 75) {
      status = 'busy' // Laranja - muito ocupado
    } else if (occupationRate > 0) {
      if (hasConfirmed && hasPending) {
        status = 'mixed' // Laranja - misto
      } else if (hasConfirmed) {
        status = 'partial' // Verde claro - parcialmente ocupado
      } else if (hasPending) {
        status = 'pending' // Amarelo - só pendentes
      }
    }

    return NextResponse.json({
      date: dateStr,
      isWorkingDay: true,
      occupationRate: Math.round(occupationRate),
      status,
      totalSlots,
      occupiedSlots,
      availableSlots,
      hasPending,
      hasConfirmed
    })

  } catch (error) {
    console.error('Erro ao calcular status do dia:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
