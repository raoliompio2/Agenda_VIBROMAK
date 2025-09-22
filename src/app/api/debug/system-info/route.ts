import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const systemInfo = {
      smtpHost: process.env.SMTP_HOST || null,
      smtpPort: process.env.SMTP_PORT || null,
      smtpUser: process.env.SMTP_USER || null,
      secretaryEmail: process.env.SECRETARY_EMAIL || null,
      directorEmail: process.env.DIRECTOR_EMAIL || null,
      companyName: process.env.COMPANY_NAME || null,
      environment: process.env.NODE_ENV || 'development',
      forceRealEmails: process.env.FORCE_REAL_EMAILS === 'true',
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      emailsConfigured: !!(process.env.SECRETARY_EMAIL && process.env.DIRECTOR_EMAIL),
      emailsAreReal: process.env.NODE_ENV === 'production' || process.env.FORCE_REAL_EMAILS === 'true'
    }

    return NextResponse.json(systemInfo)
  } catch (error) {
    console.error('Erro ao buscar informações do sistema:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
