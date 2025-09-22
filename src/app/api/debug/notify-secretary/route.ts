import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { appointmentIds, type = 'summary' } = await request.json()

    const secretaryEmail = process.env.SECRETARY_EMAIL || 'recepcao@vibromak.com.br'
    
    if (type === 'summary') {
      // Buscar reuniões confirmadas de hoje e próximos dias
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)

      const confirmedAppointments = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          startTime: {
            gte: today,
            lte: nextWeek
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      })

      if (confirmedAppointments.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Nenhuma reunião confirmada encontrada para os próximos 7 dias'
        })
      }

      // Gerar HTML do resumo
      const appointmentsHtml = confirmedAppointments.map(apt => `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #4CAF50;">
          <h4 style="margin: 0 0 10px 0; color: #2d5a27;">${apt.title}</h4>
          <p style="margin: 5px 0;"><strong>Cliente:</strong> ${apt.clientName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${apt.clientEmail}</p>
          ${apt.clientPhone ? `<p style="margin: 5px 0;"><strong>Telefone:</strong> ${apt.clientPhone}</p>` : ''}
          ${apt.clientCompany ? `<p style="margin: 5px 0;"><strong>Empresa:</strong> ${apt.clientCompany}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Data/Horário:</strong> ${new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(apt.startTime)} às ${new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }).format(apt.endTime)}</p>
          ${apt.description ? `<p style="margin: 5px 0;"><strong>Observações:</strong> ${apt.description}</p>` : ''}
        </div>
      `).join('')

      const result = await sendEmail({
        to: secretaryEmail,
        subject: `📅 Resumo de Reuniões Confirmadas - ${confirmedAppointments.length} agendamento${confirmedAppointments.length !== 1 ? 's' : ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
            <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin: 0;">📅 Resumo de Reuniões Confirmadas</h2>
              <p style="margin: 10px 0 0 0;">Próximos 7 dias - ${confirmedAppointments.length} reuniões agendadas</p>
            </div>
            
            <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
              <p>Olá,</p>
              <p>Segue o resumo das reuniões confirmadas para os próximos 7 dias:</p>
              
              ${appointmentsHtml}
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1565c0;">📋 Lembretes Importantes:</h3>
                <ul style="margin: 10px 0;">
                  <li>Confirmar se todas as salas estão reservadas</li>
                  <li>Verificar se há materiais especiais necessários</li>
                  <li>Preparar lista de presença quando necessário</li>
                  <li>Confirmar presença dos participantes 1 dia antes</li>
                </ul>
              </div>
              
              <p>Acesse o painel administrativo para mais detalhes ou alterações.</p>
              <p>Atenciosamente,<br>Sistema de Agenda Executiva</p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>Enviado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        `
      })

      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? `Resumo enviado com sucesso! ${confirmedAppointments.length} reuniões incluídas.`
          : 'Falha ao enviar resumo',
        appointmentsCount: confirmedAppointments.length,
        details: result.success ? { messageId: result.messageId } : { error: result.error }
      })
    }

    // Renotificar reuniões específicas
    if (type === 'specific' && appointmentIds && appointmentIds.length > 0) {
      const appointments = await prisma.appointment.findMany({
        where: {
          id: { in: appointmentIds },
          status: 'CONFIRMED'
        }
      })

      if (appointments.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Nenhuma reunião confirmada encontrada com os IDs fornecidos'
        })
      }

      const appointmentsHtml = appointments.map(apt => `
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107;">
          <h4 style="margin: 0 0 10px 0; color: #856404;">${apt.title}</h4>
          <p style="margin: 5px 0;"><strong>Cliente:</strong> ${apt.clientName} (${apt.clientEmail})</p>
          <p style="margin: 5px 0;"><strong>Data/Horário:</strong> ${new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(apt.startTime)}</p>
        </div>
      `).join('')

      const result = await sendEmail({
        to: secretaryEmail,
        subject: `🔔 Renotificação - ${appointments.length} Reunião${appointments.length !== 1 ? 'ões' : ''} Confirmada${appointments.length !== 1 ? 's' : ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: #ffc107; color: #212529; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin: 0;">🔔 Renotificação de Reuniões</h2>
            </div>
            
            <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
              <p>Esta é uma renotificação das seguintes reuniões confirmadas:</p>
              
              ${appointmentsHtml}
              
              <p><strong>Ação necessária:</strong> Verifique os detalhes e prepare-se para as reuniões.</p>
            </div>
          </div>
        `
      })

      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? `Renotificação enviada! ${appointments.length} reuniões incluídas.`
          : 'Falha ao enviar renotificação',
        appointmentsCount: appointments.length
      })
    }

    return NextResponse.json(
      { error: 'Tipo de notificação inválido ou parâmetros faltando' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro ao notificar secretária:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


