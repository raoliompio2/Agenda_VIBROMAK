'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/alert-toast'
import { 
  Mail, 
  Send, 
  TestTube, 
  Bell,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface SystemInfo {
  smtpHost: string | null
  smtpPort: string | null
  smtpUser: string | null
  secretaryEmail: string | null
  directorEmail: string | null
  companyName: string | null
  environment: string
  forceRealEmails: boolean
  smtpConfigured: boolean
  emailsConfigured: boolean
  emailsAreReal: boolean
}

export function EmailTestPanel() {
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loadingSystemInfo, setLoadingSystemInfo] = useState(true)
  const { showToast, Toast } = useToast()

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/debug/system-info')
      const data = await response.json()
      setSystemInfo(data)
    } catch (error) {
      console.error('Erro ao buscar informações do sistema:', error)
    } finally {
      setLoadingSystemInfo(false)
    }
  }

  const handleTestEmail = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'basic',
          to: testEmail || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Teste de Email Realizado!',
          message: `Email enviado com sucesso${testEmail ? ` para ${testEmail}` : ' para a secretária'}`,
          duration: 6000
        })
      } else {
        showToast({
          type: 'error',
          title: 'Falha no Teste de Email',
          message: result.message || 'Erro desconhecido',
          duration: 8000
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro no Teste',
        message: 'Não foi possível realizar o teste de email',
        duration: 8000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/test-email')
      const result = await response.json()

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Teste Rápido Realizado!',
          message: 'Email de teste enviado para a secretária',
          duration: 5000
        })
      } else {
        showToast({
          type: 'error',
          title: 'Falha no Teste Rápido',
          message: result.message || 'Erro desconhecido',
          duration: 8000
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro no Teste',
        message: 'Não foi possível realizar o teste rápido',
        duration: 8000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNotifySecretary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/notify-secretary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'summary'
        })
      })

      const result = await response.json()

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Resumo Enviado!',
          message: `${result.appointmentsCount} reuniões incluídas no resumo`,
          duration: 6000
        })
      } else {
        showToast({
          type: 'warning',
          title: 'Resumo não Enviado',
          message: result.message || 'Nenhuma reunião encontrada',
          duration: 8000
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao Enviar Resumo',
        message: 'Não foi possível enviar o resumo para a secretária',
        duration: 8000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            Testes de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Teste Rápido */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-600" />
              <Label className="font-medium">Teste Rápido</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Envia um email de teste para a secretária ({systemInfo?.secretaryEmail || 'Email não configurado'})
            </p>
            <Button
              onClick={handleQuickTest}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Teste Rápido
            </Button>
          </div>

          {/* Teste Personalizado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4 text-blue-600" />
              <Label className="font-medium">Teste Personalizado</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="testEmail">Email de Destino (opcional)</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="Digite um email ou deixe vazio para usar o padrão"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleTestEmail}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Enviar Teste Personalizado
            </Button>
          </div>

          {/* Resumo para Secretária */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-600" />
              <Label className="font-medium">Notificar Secretária</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Envia um resumo das reuniões confirmadas dos próximos 7 dias para a secretária
            </p>
            <Button
              onClick={handleNotifySecretary}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Enviar Resumo de Reuniões
            </Button>
          </div>

          {/* Status do Sistema */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              {systemInfo?.smtpConfigured && systemInfo?.emailsConfigured ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <Label className="font-medium">Status do Sistema</Label>
            </div>
            
            {loadingSystemInfo ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : systemInfo ? (
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMTP Host:</span>
                  <span className={`font-mono ${systemInfo.smtpHost ? 'text-green-600' : 'text-red-600'}`}>
                    {systemInfo.smtpHost || 'Não configurado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Secretária:</span>
                  <span className={`font-mono ${systemInfo.secretaryEmail ? 'text-green-600' : 'text-red-600'}`}>
                    {systemInfo.secretaryEmail || 'Não configurado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Diretor:</span>
                  <span className={`font-mono ${systemInfo.directorEmail ? 'text-green-600' : 'text-red-600'}`}>
                    {systemInfo.directorEmail || 'Não configurado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ambiente:</span>
                  <span className={`font-mono ${systemInfo.environment === 'production' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {systemInfo.environment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emails Reais:</span>
                  <span className={`font-mono ${systemInfo.emailsAreReal ? 'text-green-600' : 'text-red-600'}`}>
                    {systemInfo.emailsAreReal ? 'SIM' : 'NÃO (Simulados)'}
                  </span>
                </div>
                
                {/* Indicadores de Status */}
                <div className="pt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    {systemInfo.smtpConfigured ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs ${systemInfo.smtpConfigured ? 'text-green-600' : 'text-red-600'}`}>
                      SMTP {systemInfo.smtpConfigured ? 'Configurado' : 'Não Configurado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemInfo.emailsConfigured ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs ${systemInfo.emailsConfigured ? 'text-green-600' : 'text-red-600'}`}>
                      Emails {systemInfo.emailsConfigured ? 'Configurados' : 'Não Configurados'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-600">
                Erro ao carregar informações do sistema
              </div>
            )}
          </div>

          {/* Aviso de Desenvolvimento */}
          {systemInfo?.environment === 'development' && !systemInfo?.emailsAreReal && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Emails Simulados</p>
                <p className="text-yellow-700">
                  Os emails aparecem apenas no console do servidor. Para enviar emails reais em desenvolvimento, 
                  adicione <code className="bg-yellow-200 px-1 rounded">FORCE_REAL_EMAILS=true</code> no seu arquivo .env.local
                </p>
              </div>
            </div>
          )}

          {/* Aviso de Emails Reais em Desenvolvimento */}
          {systemInfo?.environment === 'development' && systemInfo?.emailsAreReal && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Emails Reais Ativados</p>
                <p className="text-green-700">
                  Os emails estão sendo enviados de verdade mesmo em desenvolvimento (FORCE_REAL_EMAILS=true)
                </p>
              </div>
            </div>
          )}

          {/* Aviso de Configuração */}
          {systemInfo && (!systemInfo.smtpConfigured || !systemInfo.emailsConfigured) && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Configuração Incompleta</p>
                <p className="text-red-700">
                  {!systemInfo.smtpConfigured && 'SMTP não configurado. '}
                  {!systemInfo.emailsConfigured && 'Emails de administradores não configurados. '}
                  Verifique o arquivo .env.local.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {Toast}
    </>
  )
}
