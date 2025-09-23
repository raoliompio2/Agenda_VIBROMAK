'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Building2, Clock, Mail, User, Calendar } from 'lucide-react'
import Link from 'next/link'

interface SystemSettings {
  workingHoursStart: string
  workingHoursEnd: string
  workingDays: string
  meetingDuration: number
  bufferTime: number
  reminderHours: number
  autoApproval: boolean
  companyName: string
  directorName: string
  directorEmail: string
  secretaryEmail: string
  companyPhone?: string
  contactEmail?: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings>({
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    workingDays: '1,2,3,4,5',
    meetingDuration: 60,
    bufferTime: 15,
    reminderHours: 24,
    autoApproval: false,
    companyName: '',
    directorName: '',
    directorEmail: '',
    secretaryEmail: '',
    companyPhone: '',
    contactEmail: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/admin/login')
      return
    }
    fetchSettings()
  }, [session, status])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      // TESTE: Usar rota simplificada primeiro
      console.log('Testando rota simplificada...')
      const response = await fetch('/api/settings-simple', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(`TESTE: ${result.message} (${result.timestamp})`)
        setTimeout(() => setMessage(''), 5000)
      } else {
        const error = await response.json()
        setMessage(`ERRO ${response.status}: ${error.error} - ${error.errorMessage || ''}`)
        console.error('Erro completo:', error)
      }
    } catch (error) {
      setMessage('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const dayNames = {
    '0': 'Domingo',
    '1': 'Segunda-feira', 
    '2': 'Terça-feira',
    '3': 'Quarta-feira',
    '4': 'Quinta-feira',
    '5': 'Sexta-feira',
    '6': 'Sábado'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Configurações do Sistema
                </h1>
                <p className="text-sm text-gray-600">
                  Configure os parâmetros do sistema de agendamento
                </p>
              </div>
            </div>
            
            <Button 
              type="button"
              onClick={handleSave} 
              disabled={saving} 
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('sucesso') 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Informações da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={settings?.companyName || ''}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="directorName">Nome do Diretor</Label>
                  <Input
                    id="directorName"
                    value={settings?.directorName || ''}
                    onChange={(e) => updateSetting('directorName', e.target.value)}
                    placeholder="Nome do diretor"
                  />
                </div>
                <div>
                  <Label htmlFor="companyPhone">Telefone da Empresa</Label>
                  <Input
                    id="companyPhone"
                    value={settings?.companyPhone || ''}
                    onChange={(e) => updateSetting('companyPhone', e.target.value)}
                    placeholder="(14) 3415-4493"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email de Contato</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings?.contactEmail || ''}
                    onChange={(e) => updateSetting('contactEmail', e.target.value)}
                    placeholder="contato@seudominio.com.br"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="directorEmail">Email do Diretor</Label>
                  <Input
                    id="directorEmail"
                    type="email"
                    value={settings?.directorEmail || ''}
                    onChange={(e) => updateSetting('directorEmail', e.target.value)}
                    placeholder="diretor@seudominio.com.br"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email que receberá notificações de novos agendamentos
                  </p>
                </div>
                <div>
                  <Label htmlFor="secretaryEmail">Email da Secretária</Label>
                  <Input
                    id="secretaryEmail"
                    type="email"
                    value={settings?.secretaryEmail || ''}
                    onChange={(e) => updateSetting('secretaryEmail', e.target.value)}
                    placeholder="secretaria@seudominio.com.br"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email da secretária para notificações
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Horário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horário de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workingHoursStart">Horário de Início</Label>
                  <Input
                    id="workingHoursStart"
                    type="time"
                    value={settings?.workingHoursStart || '09:00'}
                    onChange={(e) => updateSetting('workingHoursStart', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="workingHoursEnd">Horário de Término</Label>
                  <Input
                    id="workingHoursEnd"
                    type="time"
                    value={settings?.workingHoursEnd || '18:00'}
                    onChange={(e) => updateSetting('workingHoursEnd', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Dias de Funcionamento</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {Object.entries(dayNames).map(([value, label]) => {
                    const isSelected = (settings?.workingDays || '1,2,3,4,5').split(',').includes(value)
                    return (
                      <Button
                        key={value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const days = (settings?.workingDays || '1,2,3,4,5').split(',').filter(Boolean)
                          if (isSelected) {
                            const newDays = days.filter(day => day !== value)
                            updateSetting('workingDays', newDays.join(','))
                          } else {
                            const newDays = [...days, value].sort()
                            updateSetting('workingDays', newDays.join(','))
                          }
                        }}
                      >
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Agendamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configurações de Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="meetingDuration">Duração da Reunião (minutos)</Label>
                  <Select 
                    value={(settings?.meetingDuration || 60).toString()} 
                    onValueChange={(value) => updateSetting('meetingDuration', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bufferTime">Tempo entre Reuniões (minutos)</Label>
                  <Select 
                    value={(settings?.bufferTime || 15).toString()} 
                    onValueChange={(value) => updateSetting('bufferTime', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reminderHours">Lembrete Antes (horas)</Label>
                  <Select 
                    value={(settings?.reminderHours || 24).toString()} 
                    onValueChange={(value) => updateSetting('reminderHours', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="4">4 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="48">48 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
