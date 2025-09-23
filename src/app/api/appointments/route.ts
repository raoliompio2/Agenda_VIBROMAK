import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewAppointmentNotification } from '@/lib/notifications'
import { z } from 'zod'

const participantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  isOptional: z.boolean().optional().default(false)
})

const appointmentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  duration: z.number().min(15).max(480).optional().default(60),
  type: z.enum(['MEETING', 'CALL', 'PRESENTATION', 'PARTICULAR', 'VIAGEM', 'OTHER']),
  location: z.string().optional(),
  clientName: z.string().min(1, 'Nome é obrigatório'),
  clientEmail: z.string().email('Email inválido'),
  clientPhone: z.string().optional(),
  clientCompany: z.string().optional(),
  participants: z.array(participantSchema).optional().default([]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Nova solicitação de agendamento:', body)
    
    const validatedData = appointmentSchema.parse(body)

    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)
    
    console.log('📅 Horário solicitado:', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      startTimeLocal: startTime.toLocaleString('pt-BR'),
      endTimeLocal: endTime.toLocaleString('pt-BR')
    })

    // Buscar todos os agendamentos para debug
    const allAppointments = await prisma.appointment.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        title: true
      },
      orderBy: { startTime: 'asc' }
    })
    
    console.log('📋 Agendamentos existentes:', allAppointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      status: apt.status,
      startTime: apt.startTime.toLocaleString('pt-BR'),
      endTime: apt.endTime.toLocaleString('pt-BR')
    })))

    // Verificar se o horário não conflita com outros agendamentos
    // Dois intervalos se sobrepõem se: startTime < existente.endTime AND endTime > existente.startTime
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        AND: [
          { startTime: { lt: endTime } },        // Início do existente < fim do novo
          { endTime: { gt: startTime } },        // Fim do existente > início do novo
          { status: { in: ['PENDING', 'CONFIRMED'] } }
        ]
      }
    })

    if (conflictingAppointment) {
      console.log('🚫 Conflito encontrado:', {
        novo: { startTime, endTime },
        existente: { 
          startTime: conflictingAppointment.startTime, 
          endTime: conflictingAppointment.endTime,
          status: conflictingAppointment.status
        }
      })
      
      return NextResponse.json(
        { error: `Horário não disponível. Conflito com agendamento existente (${conflictingAppointment.status})` },
        { status: 400 }
      )
    }

    // Criar o agendamento com participantes
    const appointment = await prisma.appointment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime,
        endTime,
        duration: validatedData.duration,
        type: validatedData.type,
        location: validatedData.location,
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail,
        clientPhone: validatedData.clientPhone,
        clientCompany: validatedData.clientCompany,
        status: 'PENDING',
        participants: {
          create: validatedData.participants.map(participant => ({
            name: participant.name,
            email: participant.email.toLowerCase(),
            isOptional: participant.isOptional
          }))
        }
      },
      include: {
        participants: true
      }
    })

    // Enviar notificação de nova solicitação
    await sendNewAppointmentNotification(appointment.id)

    return NextResponse.json(
      { 
        message: 'Agendamento solicitado com sucesso!',
        appointment: {
          id: appointment.id,
          title: appointment.title,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const publicView = searchParams.get('public') === 'true'

    let whereClause: any = {}

    if (date) {
      // Usar UTC explicitamente para evitar problemas de timezone
      const startOfDay = new Date(`${date}T00:00:00.000Z`)
      const endOfDay = new Date(`${date}T23:59:59.999Z`)

      console.log(`🔍 Buscando agendamentos entre:`, {
        date,
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        startOfDayLocal: startOfDay.toLocaleString('pt-BR'),
        endOfDayLocal: endOfDay.toLocaleString('pt-BR')
      })

      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (status) {
      whereClause.status = status
    }

    if (type) {
      whereClause.type = type
    }

    // Para visualização pública, mostrar apenas agendamentos confirmados E não particulares
    if (publicView) {
      whereClause.status = 'CONFIRMED'
      whereClause.type = { notIn: ['PARTICULAR', 'VIAGEM'] }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: {
        startTime: 'asc'
      },
      select: publicView ? {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        type: true,
        location: true,
        status: true
      } : {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        type: true,
        location: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        clientCompany: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ appointments })

  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
