import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// Função para buscar configurações de contato
async function getContactSettings() {
  const settings = await prisma.systemSettings.findFirst()
  return {
    companyPhone: settings?.companyPhone || '(14) 3415-4493',
    contactEmail: settings?.contactEmail || 'recepcao@vibromak.com.br',
    companyName: settings?.companyName || 'Vibromak'
  }
}

export async function POST() {
  try {
    console.log('⏰ Iniciando processamento de lembretes imediatos...')

    const now = new Date()
    
    // Reuniões que começam nas próximas 2 horas
    const in2Hours = new Date(now.getTime() + (2 * 60 * 60 * 1000))
    const in30Minutes = new Date(now.getTime() + (30 * 60 * 1000))

    // Buscar agendamentos próximos que ainda não receberam lembrete imediato
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        startTime: {
          gte: in30Minutes, // Mínimo 30min antes
          lte: in2Hours     // Máximo 2h antes
        }
      },
      include: {
        notifications: {
          where: {
            type: 'REMINDER',
            status: 'SENT',
            sentAt: {
              gte: new Date(now.getTime() - (6 * 60 * 60 * 1000)) // Últimas 6h
            }
          }
        }
      }
    })

    // Filtrar apenas os que não receberam lembrete imediato recentemente
    const appointmentsNeedingImmediateReminder = upcomingAppointments.filter(
      appointment => {
        // Verificar se já recebeu lembrete nas últimas 6 horas
        const recentReminders = appointment.notifications.filter(notification => 
          notification.sentAt && notification.sentAt > new Date(now.getTime() - (6 * 60 * 60 * 1000))
        )
        return recentReminders.length === 0
      }
    )

    console.log(`📋 Encontrados ${appointmentsNeedingImmediateReminder.length} agendamentos precisando de lembrete imediato`)

    let sentReminders = 0
    let failedReminders = 0

    for (const appointment of appointmentsNeedingImmediateReminder) {
      try {
        const hoursUntilMeeting = (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        const timeText = hoursUntilMeeting < 1 
          ? `${Math.round(hoursUntilMeeting * 60)} minutos`
          : `${Math.round(hoursUntilMeeting)} hora${hoursUntilMeeting > 1 ? 's' : ''}`

        // Gerar email de lembrete imediato
        const reminderHtml = await generateImmediateReminderEmail({
          clientName: appointment.clientName,
          title: appointment.title,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          description: appointment.description,
          location: appointment.location,
          timeUntilMeeting: timeText
        })

        // Enviar email
        const result = await sendEmail({
          to: appointment.clientEmail,
          subject: `🔔 Lembrete: Sua reunião é em ${timeText} - ${appointment.title}`,
          html: reminderHtml
        })

        // Registrar notificação no banco
        await prisma.notification.create({
          data: {
            appointmentId: appointment.id,
            type: 'REMINDER',
            status: result.success ? 'SENT' : 'FAILED',
            scheduledFor: new Date(),
            sentAt: result.success ? new Date() : null
          }
        })

        if (result.success) {
          sentReminders++
          console.log(`✅ Lembrete imediato enviado: ${appointment.title} - ${appointment.clientName} (em ${timeText})`)
        } else {
          failedReminders++
          console.log(`❌ Falha no lembrete imediato: ${appointment.title} - ${appointment.clientName}`)
        }

      } catch (error) {
        failedReminders++
        console.error(`❌ Erro ao processar lembrete imediato para ${appointment.id}:`, error)
      }
    }

    console.log(`🎯 Processamento de lembretes imediatos concluído: ${sentReminders} enviados, ${failedReminders} falharam`)

    return NextResponse.json({
      success: true,
      message: `Processamento de lembretes imediatos concluído`,
      stats: {
        total: appointmentsNeedingImmediateReminder.length,
        sent: sentReminders,
        failed: failedReminders
      }
    })

  } catch (error) {
    console.error('❌ Erro no processamento de lembretes imediatos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function generateImmediateReminderEmail(appointment: {
  clientName: string
  title: string
  startTime: Date
  endTime: Date
  description?: string | null
  location?: string | null
  timeUntilMeeting: string
}): Promise<string> {
  const contact = await getContactSettings()
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>🔔 Lembrete Urgente - ${contact.companyName}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0;
                background-color: #f5f5f5;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background-color: #dc3545; 
                padding: 30px 20px; 
                text-align: center;
            }
            .logo {
                max-width: 200px;
                height: auto;
                margin-bottom: 15px;
            }
            .header-title {
                color: #ffffff;
                font-size: 24px;
                font-weight: 600;
                margin: 0;
            }
            .content { 
                padding: 30px; 
            }
            .greeting {
                font-size: 16px;
                margin-bottom: 20px;
            }
            .urgent-box {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 4px 4px 0;
                color: #856404;
            }
            .section-title {
                color: #1E1E1E;
                font-size: 18px;
                font-weight: 600;
                margin: 25px 0 15px 0;
                border-bottom: 2px solid #F37021;
                padding-bottom: 8px;
            }
            .info-row { 
                margin: 12px 0;
                display: flex;
                align-items: flex-start;
            }
            .label { 
                font-weight: 600; 
                color: #1E1E1E;
                min-width: 120px;
                margin-right: 10px;
            }
            .value {
                color: #555;
                flex: 1;
            }
            .time-highlight {
                background-color: #dc3545;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                margin: 15px 0;
            }
            .contact-info {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
            }
            .footer { 
                background-color: #f8f9fa;
                padding: 20px 30px;
                border-top: 1px solid #e9ecef;
                font-size: 14px; 
                color: #666;
                text-align: center;
            }
            .footer p {
                margin: 5px 0;
            }
            .vibromak-orange {
                color: #F37021;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://vibromak.com.br/wp-content/uploads/2024/05/cropped-Design-sem-nome-300x47.png" alt="${contact.companyName}" class="logo" />
                <h1 class="header-title">🔔 Lembrete Urgente</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    <p>Olá <strong>${appointment.clientName}</strong>,</p>
                </div>

                <div class="urgent-box">
                    <strong>⚠️ ATENÇÃO:</strong> Sua reunião está próxima de começar!
                </div>

                <div class="time-highlight">
                    🕐 SUA REUNIÃO É EM ${appointment.timeUntilMeeting.toUpperCase()}
                </div>

                <h2 class="section-title">Detalhes da Reunião</h2>
                <div class="info-row">
                    <span class="label">Assunto:</span>
                    <span class="value"><strong>${appointment.title}</strong></span>
                </div>
                <div class="info-row">
                    <span class="label">Data:</span>
                    <span class="value">${new Intl.DateTimeFormat('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    }).format(appointment.startTime)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Horário:</span>
                    <span class="value">${new Intl.DateTimeFormat('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }).format(appointment.startTime)} às ${new Intl.DateTimeFormat('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }).format(appointment.endTime)}</span>
                </div>
                ${appointment.location ? `
                <div class="info-row">
                    <span class="label">Local:</span>
                    <span class="value">${appointment.location}</span>
                </div>
                ` : ''}
                ${appointment.description ? `
                <div class="info-row">
                    <span class="label">Observações:</span>
                    <span class="value">${appointment.description}</span>
                </div>
                ` : ''}

                <div class="urgent-box">
                    <strong>📍 Lembre-se:</strong> Chegue 10 minutos antes do horário agendado.
                </div>

                <div class="contact-info">
                    <h3 style="margin-top: 0; color: #1E1E1E;">Contato de Emergência</h3>
                    <p>Telefone: <strong>${contact.companyPhone}</strong> | Email: <strong>${contact.contactEmail}</strong></p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Aguardamos você!</strong></p>
                <p>Sistema de Agendamento <span class="vibromak-orange">${contact.companyName}</span> | Lembrete automático</p>
            </div>
        </div>
    </body>
    </html>
  `
}
