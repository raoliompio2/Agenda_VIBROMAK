import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewAppointmentNotification } from '@/lib/notifications'
import { generateRecurrenceInstances } from '@/lib/recurrence'
import { z } from 'zod'

const participantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  isOptional: z.boolean().optional().default(false)
})

const recurrenceSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().min(1).max(12),
  byWeekday: z.array(z.number().min(0).max(6)).optional(),
  byMonthDay: z.number().min(1).max(31).optional(),
  bySetPos: z.number().optional(),
  endType: z.enum(['never', 'date', 'count']),
  endDate: z.string().datetime().optional(),
  count: z.number().min(1).max(365).optional(),
}).optional()

const appointmentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  duration: z.number().min(15).max(43200).optional(), // Opcional - será calculado automaticamente a partir de startTime e endTime (até 30 dias)
  type: z.enum(['MEETING', 'CALL', 'PRESENTATION', 'PARTICULAR', 'VIAGEM', 'OTHER']),
  location: z.string().optional(),
  clientName: z.string().min(1, 'Nome é obrigatório'),
  clientEmail: z.string().email('Email inválido'),
  clientPhone: z.string().optional(),
  clientCompany: z.string().optional(),
  participants: z.array(participantSchema).optional().default([]),
  recurrence: recurrenceSchema,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Nova solicitação de agendamento:', body)
    
    const validatedData = appointmentSchema.parse(body)

    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)
    
    // Calcular a duração real a partir do startTime e endTime
    const calculatedDuration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
    
    // Usar a duração calculada se for diferente da fornecida ou se não foi fornecida
    const finalDuration = calculatedDuration > 0 ? calculatedDuration : (validatedData.duration || 60)
    
    // Validar que a duração calculada está dentro dos limites
    if (finalDuration < 15) {
      return NextResponse.json(
        { error: 'A duração do agendamento deve ser de pelo menos 15 minutos' },
        { status: 400 }
      )
    }
    
    if (finalDuration > 43200) {
      return NextResponse.json(
        { error: 'A duração do agendamento não pode exceder 30 dias (43200 minutos)' },
        { status: 400 }
      )
    }
    
    console.log('📅 Horário solicitado:', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      startTimeLocal: startTime.toLocaleString('pt-BR'),
      endTimeLocal: endTime.toLocaleString('pt-BR'),
      durationFornecida: validatedData.duration,
      durationCalculada: calculatedDuration,
      durationFinal: finalDuration
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

    // Verificar se há recorrência configurada
    const hasRecurrence = validatedData.recurrence?.enabled
    let createdAppointments: any[] = []
    let recurringGroupId: string | undefined
    
    if (hasRecurrence && validatedData.recurrence) {
      // Gerar ID único para o grupo de recorrências
      recurringGroupId = `rec_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Criar regra de recorrência
      const recurrenceRule = await prisma.recurrenceRule.create({
        data: {
          frequency: validatedData.recurrence.frequency,
          interval: validatedData.recurrence.interval,
          byWeekday: validatedData.recurrence.byWeekday?.join(','),
          byMonthDay: validatedData.recurrence.byMonthDay,
          bySetPos: validatedData.recurrence.bySetPos,
          endDate: validatedData.recurrence.endDate ? new Date(validatedData.recurrence.endDate) : null,
          count: validatedData.recurrence.count,
        }
      })
      
      // Converter endDate de string para Date se necessário
      const recurrenceConfig = {
        ...validatedData.recurrence,
        endDate: validatedData.recurrence.endDate ? new Date(validatedData.recurrence.endDate) : undefined
      }
      
      // Gerar todas as instâncias da recorrência
      const instances = generateRecurrenceInstances(
        startTime,
        finalDuration,
        recurrenceConfig
      )
      
      console.log(`📅 Criando ${instances.length} instâncias recorrentes`)
      
      // Criar todos os agendamentos da série
      for (const instance of instances) {
        const appointment = await prisma.appointment.create({
          data: {
            title: validatedData.title,
            description: validatedData.description,
            startTime: instance.startTime,
            endTime: instance.endTime,
            duration: finalDuration,
            type: validatedData.type,
            location: validatedData.location,
            clientName: validatedData.clientName,
            clientEmail: validatedData.clientEmail,
            clientPhone: validatedData.clientPhone,
            clientCompany: validatedData.clientCompany,
            status: 'PENDING',
            isRecurring: true,
            recurrenceRuleId: recurrenceRule.id,
            recurringGroupId,
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
        
        createdAppointments.push(appointment)
      }
      
      // Enviar notificação apenas do primeiro agendamento
      if (createdAppointments.length > 0) {
        await sendNewAppointmentNotification(createdAppointments[0].id)
      }
    } else {
      // Criar agendamento único
      const appointment = await prisma.appointment.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          startTime,
          endTime,
          duration: finalDuration,
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
      
      createdAppointments.push(appointment)
      
      // Enviar notificação de nova solicitação
      await sendNewAppointmentNotification(appointment.id)
    }

    return NextResponse.json(
      { 
        message: hasRecurrence 
          ? `${createdAppointments.length} agendamentos recorrentes solicitados com sucesso!`
          : 'Agendamento solicitado com sucesso!',
        appointment: {
          id: createdAppointments[0].id,
          title: createdAppointments[0].title,
          startTime: createdAppointments[0].startTime,
          endTime: createdAppointments[0].endTime,
          status: createdAppointments[0].status
        },
        recurringGroupId: hasRecurrence ? recurringGroupId : undefined,
        totalCreated: createdAppointments.length
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Erros de validação Zod:', error.errors)
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: error.errors,
          message: `Erros de validação: ${errorMessages}`
        },
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
