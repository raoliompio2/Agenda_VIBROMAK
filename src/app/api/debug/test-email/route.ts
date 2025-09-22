import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { type, to } = await request.json()

    // Email de teste básico
    if (type === 'basic') {
      const result = await sendEmail({
        to: to || process.env.SECRETARY_EMAIL || 'recepcao@vibromak.com.br',
        subject: 'Teste de Email - Sistema de Agenda',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
              <title>Teste de Email - Vibromak</title>
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
                  .success-box {
                      background-color: #d4edda;
                      border-left: 4px solid #28a745;
                      padding: 15px;
                      margin: 20px 0;
                      border-radius: 0 4px 4px 0;
                      color: #155724;
                  }
                  .info-box {
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
                  .vibromak-orange {
                      color: #F37021;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <img src="https://vibromak.com.br/wp-content/uploads/2024/05/cropped-Design-sem-nome-300x47.png" alt="Vibromak" class="logo" />
                      <h1 class="header-title">Teste de Email</h1>
                  </div>
                  
                  <div class="content">
                      <div class="success-box">
                          <strong>Teste realizado com sucesso!</strong> O sistema de notificações está funcionando perfeitamente.
                      </div>

                      <div class="info-box">
                          <h3 style="margin-top: 0; color: #1E1E1E;">Informações do Sistema</h3>
                          <p><strong>Data/Hora:</strong> ${new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }).format(new Date())}</p>
                          <p><strong>Host SMTP:</strong> ${process.env.SMTP_HOST || 'Não configurado'}</p>
                          <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
                      </div>

                      <p>Se você recebeu este email, significa que todas as configurações estão corretas e o sistema está pronto para uso.</p>
                  </div>
                  
                  <div class="footer">
                      <p><strong>Sistema funcionando corretamente!</strong></p>
                      <p>Sistema de Agendamento <span class="vibromak-orange">Vibromak</span> | Teste automático</p>
                  </div>
              </div>
          </body>
          </html>
        `
      })

      return NextResponse.json({
        success: result.success,
        message: result.success ? 'Email de teste enviado com sucesso!' : 'Falha ao enviar email de teste',
        details: result.success ? { messageId: result.messageId } : { error: result.error }
      })
    }

    return NextResponse.json(
      { error: 'Tipo de teste não reconhecido' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro no teste de email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Teste rápido via GET
  try {
    const result = await sendEmail({
      to: process.env.SECRETARY_EMAIL || 'recepcao@vibromak.com.br',
      subject: 'Teste Rápido - Sistema de Agenda',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4CAF50;">✅ Teste de Email - ${new Date().toLocaleString('pt-BR')}</h2>
          <p>Sistema de email funcionando corretamente!</p>
          <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
      `
    })

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Teste de email enviado!' : 'Falha no teste',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro no teste de email', details: error },
      { status: 500 }
    )
  }
}
