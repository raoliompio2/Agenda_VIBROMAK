import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTimeSlots } from '@/lib/utils'

// Configuração para evitar pré-renderização
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Função para buscar status de múltiplos dias
async function getMultipleDaysStatus() {
  try {
    // Buscar configurações
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'settings' }
    })

    if (!settings) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 500 })
    }

    // Buscar agendamentos dos últimos 30 dias e próximos 60 dias
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - 30)
    
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 60)

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: pastDate,
          lte: futureDate
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
        }
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true,
        clientName: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Agrupar por data
    const dayMap = new Map<string, any>()

    appointments.forEach(apt => {
      const dateStr = apt.startTime.toISOString().split('T')[0]
      
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, {
          date: dateStr,
          hasPending: false,
          hasConfirmed: false,
          hasCancelled: false,
          hasCompleted: false,
          total: 0,
          details: []
        })
      }

      const dayData = dayMap.get(dateStr)
      
      // Só contar PENDING e CONFIRMED para ocupação (slots realmente ocupados)
      if (apt.status === 'PENDING' || apt.status === 'CONFIRMED') {
        dayData.total++
      }
      
      if (apt.status === 'PENDING') dayData.hasPending = true
      if (apt.status === 'CONFIRMED') dayData.hasConfirmed = true
      if (apt.status === 'CANCELLED') dayData.hasCancelled = true
      if (apt.status === 'COMPLETED') dayData.hasCompleted = true
      
      dayData.details.push({
        id: apt.id,
        title: apt.title,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        clientName: apt.clientName
      })
    })

    const days = Array.from(dayMap.values())

    return NextResponse.json({ days })
  } catch (error) {
    console.error('Erro ao buscar status de múltiplos dias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    
    // Se não passar data, retorna status de múltiplos dias (próximos 60 dias)
    if (!dateStr) {
      return getMultipleDaysStatus()
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
