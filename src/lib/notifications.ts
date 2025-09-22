import { prisma } from '@/lib/prisma'
import { sendEmail, generateAppointmentRequestEmail, generateAppointmentConfirmationEmail, generateCancellationEmail } from '@/lib/email'

export interface NotificationData {
  appointmentId: string
  type: 'CONFIRMATION' | 'REMINDER' | 'CANCELLATION' | 'RESCHEDULED'
  recipientEmail: string
  scheduledFor?: Date
}

/**
 * Cria uma notificação no banco de dados
 */
export async function createNotification(data: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        appointmentId: data.appointmentId,
        type: data.type,
        status: 'PENDING',
        scheduledFor: data.scheduledFor || new Date()
      }
    })
    
    console.log(`📝 Notificação criada: ${data.type} para agendamento ${data.appointmentId}`)
    return notification
  } catch (error) {
    console.error('❌ Erro ao criar notificação:', error)
    return null
  }
}

/**
 * Envia notificação de nova solicitação para admin
 */
export async function sendNewAppointmentNotification(appointmentId: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { participants: true }
    })

    if (!appointment) {
      console.error('❌ Agendamento não encontrado:', appointmentId)
      return false
    }

    const directorEmail = process.env.DIRECTOR_EMAIL || ''
    const secretaryEmail = process.env.SECRETARY_EMAIL || ''
    const recipients = [directorEmail, secretaryEmail].filter(Boolean)

    if (recipients.length === 0) {
      console.warn('⚠️ Nenhum email de administrador configurado')
      return false
    }

    const emailHtml = generateAppointmentRequestEmail({
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail,
      clientPhone: appointment.clientPhone,
      clientCompany: appointment.clientCompany,
      title: appointment.title,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      duration: appointment.duration,
      description: appointment.description
    })

    const result = await sendEmail({
      to: recipients,
      subject: `Nova Solicitação de Agendamento - ${appointment.title}`,
      html: emailHtml
    })

    // Registrar notificação no banco
    await createNotification({
      appointmentId,
      type: 'CONFIRMATION',
      recipientEmail: recipients.join(', ')
    })

    if (result.success) {
      console.log('✅ Email de nova solicitação enviado com sucesso')
      return true
    } else {
      console.error('❌ Falha ao enviar email de nova solicitação:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de nova solicitação:', error)
    return false
  }
}

/**
 * Envia notificação de confirmação para o cliente
 */
export async function sendConfirmationNotification(appointmentId: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    })

    if (!appointment) {
      console.error('❌ Agendamento não encontrado:', appointmentId)
      return false
    }

    const emailHtml = generateAppointmentConfirmationEmail({
      clientName: appointment.clientName,
      title: appointment.title,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      description: appointment.description,
      location: appointment.location
    })

    const result = await sendEmail({
      to: appointment.clientEmail,
      subject: `Agendamento Confirmado - ${appointment.title}`,
      html: emailHtml
    })

    // Registrar notificação no banco
    await createNotification({
      appointmentId,
      type: 'CONFIRMATION',
      recipientEmail: appointment.clientEmail
    })

    // Marcar notificação como enviada se bem-sucedida
    if (result.success) {
      await prisma.notification.updateMany({
        where: {
          appointmentId,
          type: 'CONFIRMATION',
          status: 'PENDING'
        },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      })
      
      console.log('✅ Email de confirmação enviado com sucesso')
      return true
    } else {
      await prisma.notification.updateMany({
        where: {
          appointmentId,
          type: 'CONFIRMATION',
          status: 'PENDING'
        },
        data: {
          status: 'FAILED'
        }
      })
      
      console.error('❌ Falha ao enviar email de confirmação:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de confirmação:', error)
    return false
  }
}

/**
 * Envia notificação de cancelamento para o cliente
 */
export async function sendCancellationNotification(appointmentId: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    })

    if (!appointment) {
      console.error('❌ Agendamento não encontrado:', appointmentId)
      return false
    }

    const result = await sendEmail({
      to: appointment.clientEmail,
      subject: `Agendamento Cancelado - ${appointment.title}`,
      html: generateCancellationEmail({
        clientName: appointment.clientName,
        title: appointment.title,
        startTime: appointment.startTime,
        endTime: appointment.endTime
      })
    })

    // Registrar notificação no banco
    await createNotification({
      appointmentId,
      type: 'CANCELLATION',
      recipientEmail: appointment.clientEmail
    })

    if (result.success) {
      await prisma.notification.updateMany({
        where: {
          appointmentId,
          type: 'CANCELLATION',
          status: 'PENDING'
        },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      })
      
      console.log('✅ Email de cancelamento enviado com sucesso')
      return true
    } else {
      await prisma.notification.updateMany({
        where: {
          appointmentId,
          type: 'CANCELLATION',
          status: 'PENDING'
        },
        data: {
          status: 'FAILED'
        }
      })
      
      console.error('❌ Falha ao enviar email de cancelamento:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de cancelamento:', error)
    return false
  }
}

/**
 * Processa notificações pendentes (para uso em cron jobs futuros)
 */
export async function processPendingNotifications() {
  try {
    const pendingNotifications = await prisma.notification.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: new Date()
        }
      },
      include: {
        appointment: true
      }
    })

    console.log(`📋 Processando ${pendingNotifications.length} notificações pendentes`)

    for (const notification of pendingNotifications) {
      switch (notification.type) {
        case 'CONFIRMATION':
          await sendConfirmationNotification(notification.appointmentId)
          break
        case 'CANCELLATION':
          await sendCancellationNotification(notification.appointmentId)
          break
        case 'REMINDER':
          // TODO: Implementar lembretes
          console.log('📅 Lembrete não implementado ainda')
          break
      }
    }
  } catch (error) {
    console.error('❌ Erro ao processar notificações pendentes:', error)
  }
}
