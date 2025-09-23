import nodemailer from 'nodemailer'
import { prisma } from './prisma'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  cc?: string | string[]
}

export const emailConfig = {
  host: process.env.SMTP_HOST || 'smtppro.zoho.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
}

export const transporter = nodemailer.createTransport(emailConfig)

// Função para buscar configurações de contato
async function getContactSettings() {
  const settings = await prisma.systemSettings.findFirst()
  return {
    companyPhone: settings?.companyPhone || '(14) 3415-4493',
    contactEmail: settings?.contactEmail || 'recepcao@vibromak.com.br',
    companyName: settings?.companyName || 'Vibromak'
  }
}

export async function sendEmail({ to, subject, html, cc }: EmailOptions) {
  try {
    // Para desenvolvimento: apenas log os emails (a menos que FORCE_REAL_EMAILS=true)
    if (process.env.NODE_ENV === 'development' && process.env.FORCE_REAL_EMAILS !== 'true') {
      console.log('📧 EMAIL SIMULADO:')
      console.log('Para:', Array.isArray(to) ? to.join(', ') : to)
      console.log('Assunto:', subject)
      console.log('CC:', cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : 'Nenhum')
      console.log('---')
      console.log('💡 Para enviar emails reais em desenvolvimento, adicione FORCE_REAL_EMAILS=true no .env.local')
      return { success: true, messageId: 'dev-' + Date.now() }
    }

    // Para produção OU desenvolvimento com FORCE_REAL_EMAILS=true: enviar email real
    console.log('📧 ENVIANDO EMAIL REAL...')
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      subject,
      html,
    })

    console.log('Email enviado:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error }
  }
}

export function generateAppointmentRequestEmail(appointment: {
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientCompany?: string
  title: string
  startTime: Date
  endTime: Date
  duration?: number
  description?: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Nova Solicitação de Agendamento - Vibromak</title>
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
                background-color: #1E1E1E; 
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
            .highlight-box {
                background-color: #f8f9fa;
                border-left: 4px solid #F37021;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 4px 4px 0;
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
                <img src="https://vibromak.com.br/wp-content/uploads/2024/05/cropped-Design-sem-nome-300x47.png" alt="Vibromak" class="logo" />
                <h1 class="header-title">Nova Solicitação de Agendamento</h1>
            </div>
            
            <div class="content">
                <div class="highlight-box">
                    <strong>Uma nova solicitação de agendamento foi recebida e aguarda sua aprovação.</strong>
                </div>

                <h2 class="section-title">Dados da Reunião</h2>
                <div class="info-row">
                    <span class="label">Assunto:</span>
                    <span class="value">${appointment.title}</span>
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
                ${appointment.duration ? `
                <div class="info-row">
                    <span class="label">Duração:</span>
                    <span class="value">${appointment.duration >= 60 ? 
                      `${Math.floor(appointment.duration / 60)}h${appointment.duration % 60 > 0 ? ` ${appointment.duration % 60}min` : ''}` :
                      `${appointment.duration} minutos`
                    }</span>
                </div>
                ` : ''}
                ${appointment.description ? `
                <div class="info-row">
                    <span class="label">Descrição:</span>
                    <span class="value">${appointment.description}</span>
                </div>
                ` : ''}
                
                <h2 class="section-title">Dados do Solicitante</h2>
                <div class="info-row">
                    <span class="label">Nome:</span>
                    <span class="value"><strong>${appointment.clientName}</strong></span>
                </div>
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${appointment.clientEmail}</span>
                </div>
                ${appointment.clientPhone ? `
                <div class="info-row">
                    <span class="label">Telefone:</span>
                    <span class="value">${appointment.clientPhone}</span>
                </div>
                ` : ''}
                ${appointment.clientCompany ? `
                <div class="info-row">
                    <span class="label">Empresa:</span>
                    <span class="value">${appointment.clientCompany}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <p><strong>Próximos passos:</strong> Acesse o painel administrativo para confirmar ou recusar este agendamento.</p>
                <p>Sistema de Agendamento <span class="vibromak-orange">Vibromak</span> | Enviado automaticamente</p>
            </div>
        </div>
    </body>
    </html>
  `
}

export async function generateAppointmentConfirmationEmail(appointment: {
  clientName: string
  title: string
  startTime: Date
  endTime: Date
  description?: string
  location?: string
}): Promise<string> {
  const contact = await getContactSettings()
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Agendamento Confirmado - Vibromak</title>
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
                background-color: #1E1E1E; 
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
            .success-box {
                background-color: #d4edda;
                border-left: 4px solid #28a745;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 4px 4px 0;
                color: #155724;
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
            .important-box {
                background-color: #fff3cd;
                border-left: 4px solid #F37021;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 4px 4px 0;
                color: #856404;
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
            .contact-info {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://vibromak.com.br/wp-content/uploads/2024/05/cropped-Design-sem-nome-300x47.png" alt="Vibromak" class="logo" />
                <h1 class="header-title">Agendamento Confirmado</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    <p>Olá <strong>${appointment.clientName}</strong>,</p>
                </div>

                <div class="success-box">
                    <strong>Sua reunião foi confirmada com sucesso!</strong> Aguardamos você na data e horário agendados.
                </div>

                <h2 class="section-title">Detalhes do Agendamento</h2>
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
                
                <div class="important-box">
                    <strong>Importante:</strong> Por favor, chegue 10 minutos antes do horário agendado para que possamos recebê-lo adequadamente.
                </div>

                <div class="contact-info">
                    <h3 style="margin-top: 0; color: #1E1E1E;">Informações de Contato</h3>
                    <p><strong>Em caso de cancelamento ou reagendamento</strong>, entre em contato conosco com antecedência mínima de 24 horas.</p>
                    <p>Telefone: <strong>${contact.companyPhone}</strong> | Email: <strong>${contact.contactEmail}</strong></p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Obrigado por escolher a ${contact.companyName}!</strong></p>
                <p>Sistema de Agendamento <span class="vibromak-orange">${contact.companyName}</span> | Enviado automaticamente</p>
            </div>
        </div>
    </body>
    </html>
  `
}

export async function generateCancellationEmail(appointment: {
  clientName: string
  title: string
  startTime: Date
  endTime: Date
}): Promise<string> {
  const contact = await getContactSettings()
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Agendamento Cancelado - Vibromak</title>
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
                background-color: #1E1E1E; 
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
            .cancellation-box {
                background-color: #f8d7da;
                border-left: 4px solid #dc3545;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 4px 4px 0;
                color: #721c24;
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
                <img src="https://vibromak.com.br/wp-content/uploads/2024/05/cropped-Design-sem-nome-300x47.png" alt="Vibromak" class="logo" />
                <h1 class="header-title">Agendamento Cancelado</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    <p>Olá <strong>${appointment.clientName}</strong>,</p>
                </div>

                <div class="cancellation-box">
                    <strong>Informamos que seu agendamento foi cancelado.</strong> Lamentamos qualquer inconveniente causado.
                </div>

                <h2 class="section-title">Detalhes do Agendamento Cancelado</h2>
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

                <div class="contact-info">
                    <h3 style="margin-top: 0; color: #1E1E1E;">Reagendar ou Dúvidas</h3>
                    <p>Se desejar reagendar ou tiver alguma dúvida, entre em contato conosco:</p>
                    <p>Telefone: <strong>${contact.companyPhone}</strong> | Email: <strong>${contact.contactEmail}</strong></p>
                    <p>Ou acesse nosso sistema de agendamento online para uma nova solicitação.</p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Agradecemos sua compreensão.</strong></p>
                <p>Sistema de Agendamento <span class="vibromak-orange">${contact.companyName}</span> | Enviado automaticamente</p>
            </div>
        </div>
    </body>
    </html>
  `
}
