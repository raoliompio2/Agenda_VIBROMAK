import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendConfirmationNotification, sendCancellationNotification } from '@/lib/notifications'
import { z } from 'zod'

const updateAppointmentSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ appointment })

  } catch (error) {
    console.error('Erro ao buscar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação para operações administrativas
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateAppointmentSchema.parse(body)

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: params.id }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar conflitos se:
    // 1. Está alterando horário OU
    // 2. Está reativando um agendamento (mudando status para PENDING/CONFIRMED)
    const shouldCheckConflicts = (validatedData.startTime && validatedData.endTime) || 
                                (validatedData.status && ['PENDING', 'CONFIRMED'].includes(validatedData.status))

    if (shouldCheckConflicts) {
      const startTime = validatedData.startTime ? 
        new Date(validatedData.startTime) : 
        existingAppointment.startTime
      const endTime = validatedData.endTime ? 
        new Date(validatedData.endTime) : 
        existingAppointment.endTime

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          AND: [
            { id: { not: params.id } }, // Excluir o próprio agendamento
            {
              OR: [
                {
                  AND: [
                    { startTime: { lte: startTime } },
                    { endTime: { gt: startTime } }
                  ]
                },
                {
                  AND: [
                    { startTime: { lt: endTime } },
                    { endTime: { gte: endTime } }
                  ]
                },
                {
                  AND: [
                    { startTime: { gte: startTime } },
                    { endTime: { lte: endTime } }
                  ]
                }
              ]
            },
            {
              status: { in: ['PENDING', 'CONFIRMED'] }
            }
          ]
        }
      })

      if (conflictingAppointment) {
        return NextResponse.json(
          { 
            error: 'Horário não disponível. Já existe um agendamento confirmado neste horário.',
            conflictingAppointment: {
              id: conflictingAppointment.id,
              title: conflictingAppointment.title,
              startTime: conflictingAppointment.startTime,
              endTime: conflictingAppointment.endTime,
              status: conflictingAppointment.status
            }
          },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.location !== undefined) updateData.location = validatedData.location
    if (validatedData.startTime) updateData.startTime = new Date(validatedData.startTime)
    if (validatedData.endTime) updateData.endTime = new Date(validatedData.endTime)

    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData
    })

    // Enviar notificações baseadas na mudança de status
    if (validatedData.status === 'CONFIRMED' && existingAppointment.status !== 'CONFIRMED') {
      await sendConfirmationNotification(params.id)
    }

    if (validatedData.status === 'CANCELLED' && existingAppointment.status !== 'CANCELLED') {
      await sendCancellationNotification(params.id)
    }

    return NextResponse.json({
      message: 'Agendamento atualizado com sucesso',
      appointment: updatedAppointment
    })

  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 401 }
      )
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    await prisma.appointment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Agendamento excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir agendamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
