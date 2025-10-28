import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const cancelSeriesSchema = z.object({
  recurringGroupId: z.string(),
  cancelType: z.enum(['single', 'future', 'all']),
  appointmentId: z.string().optional(), // Obrigatório para 'single' e 'future'
  fromDate: z.string().datetime().optional(), // Obrigatório para 'future'
})

/**
 * DELETE - Cancelar agendamentos recorrentes
 * Tipos de cancelamento:
 * - single: Cancela apenas um agendamento específico
 * - future: Cancela um agendamento e todos os futuros da série
 * - all: Cancela toda a série recorrente
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { recurringGroupId, cancelType, appointmentId, fromDate } = cancelSeriesSchema.parse(body)

    console.log('🔄 Cancelando recorrência:', { recurringGroupId, cancelType, appointmentId, fromDate })

    if (cancelType === 'single') {
      if (!appointmentId) {
        return NextResponse.json(
          { error: 'appointmentId é obrigatório para cancelamento único' },
          { status: 400 }
        )
      }

      // Cancela apenas um agendamento específico
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          isRecurrenceException: true,
        }
      })

      return NextResponse.json({
        message: 'Agendamento cancelado com sucesso',
        cancelled: 1,
        appointment
      })
    }

    if (cancelType === 'future') {
      if (!appointmentId || !fromDate) {
        return NextResponse.json(
          { error: 'appointmentId e fromDate são obrigatórios para cancelamento futuro' },
          { status: 400 }
        )
      }

      const fromDateTime = new Date(fromDate)

      // Cancela o agendamento atual e todos os futuros
      const result = await prisma.appointment.updateMany({
        where: {
          recurringGroupId,
          startTime: {
            gte: fromDateTime
          },
          status: {
            not: 'CANCELLED'
          }
        },
        data: {
          status: 'CANCELLED'
        }
      })

      return NextResponse.json({
        message: `${result.count} agendamentos futuros cancelados com sucesso`,
        cancelled: result.count
      })
    }

    if (cancelType === 'all') {
      // Cancela toda a série
      const result = await prisma.appointment.updateMany({
        where: {
          recurringGroupId,
          status: {
            not: 'CANCELLED'
          }
        },
        data: {
          status: 'CANCELLED'
        }
      })

      return NextResponse.json({
        message: `Toda a série (${result.count} agendamentos) foi cancelada com sucesso`,
        cancelled: result.count
      })
    }

    return NextResponse.json(
      { error: 'Tipo de cancelamento inválido' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro ao cancelar recorrência:', error)

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

/**
 * GET - Buscar todas as instâncias de uma série recorrente
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recurringGroupId = searchParams.get('groupId')

    if (!recurringGroupId) {
      return NextResponse.json(
        { error: 'groupId é obrigatório' },
        { status: 400 }
      )
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        recurringGroupId
      },
      orderBy: {
        startTime: 'asc'
      },
      include: {
        recurrenceRule: true,
        participants: true
      }
    })

    return NextResponse.json({ appointments, total: appointments.length })

  } catch (error) {
    console.error('Erro ao buscar série recorrente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar uma instância específica da recorrência
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, ...updateData } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId é obrigatório' },
        { status: 400 }
      )
    }

    // Atualizar o agendamento e marcar como exceção
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...updateData,
        isRecurrenceException: true,
        originalStartTime: updateData.startTime ? new Date(updateData.startTime) : undefined
      }
    })

    return NextResponse.json({
      message: 'Agendamento atualizado com sucesso',
      appointment
    })

  } catch (error) {
    console.error('Erro ao atualizar agendamento recorrente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

