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

    // Se está alterando horário, verificar conflitos
    if (validatedData.startTime && validatedData.endTime) {
      const startTime = new Date(validatedData.startTime)
      const endTime = new Date(validatedData.endTime)

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
          { error: 'Horário não disponível' },
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
