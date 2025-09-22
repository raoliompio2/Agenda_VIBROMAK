'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ParticipantsManager, type Participant } from './ParticipantsManager'
import { useToast } from '@/components/ui/alert-toast'
import { validateEmail, validatePhone, formatDateTime, formatTimeRange } from '@/lib/utils'
import { User, Mail, Phone, Building, Calendar, Clock, FileText, Users, CheckCircle } from 'lucide-react'

interface SimpleAppointmentFormData {
  title: string
  description: string
  type: 'MEETING' | 'CALL' | 'PRESENTATION' | 'OTHER'
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCompany: string
  participants: Participant[]
}

interface SimpleAppointmentFormProps {
  onSubmit: (data: SimpleAppointmentFormData & { 
    startTime: Date
    endTime: Date
    duration: number
  }) => Promise<void>
  preSelectedSlot: {
    date: Date
    startTime: Date
    duration: number
  }
  disabled?: boolean
  submitText?: string
}

export function SimpleAppointmentForm({
  onSubmit,
  preSelectedSlot,
  disabled = false,
  submitText = 'Enviar Solicitação'
}: SimpleAppointmentFormProps) {
  const [isClient, setIsClient] = useState(false)
  const [formData, setFormData] = useState<SimpleAppointmentFormData>({
    title: '',
    description: '',
    type: 'MEETING',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    participants: []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { showToast, Toast } = useToast()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Assunto é obrigatório'
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Nome é obrigatório'
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Email é obrigatório'
    } else if (!validateEmail(formData.clientEmail)) {
      newErrors.clientEmail = 'Email inválido'
    }

    if (formData.clientPhone && !validatePhone(formData.clientPhone)) {
      newErrors.clientPhone = 'Telefone inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const endTime = new Date(preSelectedSlot.startTime.getTime() + preSelectedSlot.duration * 60000)

      await onSubmit({
        ...formData,
        startTime: preSelectedSlot.startTime,
        endTime,
        duration: preSelectedSlot.duration
      })
      
      setIsSuccess(true)
      showToast({
        type: 'success',
        title: 'Solicitação Enviada!',
        message: 'Sua solicitação foi enviada com sucesso. Você receberá uma confirmação por email.',
        duration: 5000
      })
    } catch (error) {
      console.error('Erro ao enviar formulário:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar solicitação. Tente novamente.'
      showToast({
        type: 'error',
        title: 'Erro ao Agendar',
        message: errorMessage,
        duration: 8000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: keyof SimpleAppointmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isClient) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Solicitação Enviada com Sucesso!
            </h2>
            <p className="text-gray-600 mb-6">
              Sua solicitação de agendamento foi recebida e será analisada em breve.
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">📋 Detalhes da Solicitação:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Assunto:</strong> {formData.title}</p>
                <p><strong>Data e Hora:</strong> {formatDateTime(preSelectedSlot.startTime)}</p>
                <p><strong>Duração:</strong> {preSelectedSlot.duration} minutos</p>
                <p><strong>Cliente:</strong> {formData.clientName}</p>
                <p><strong>Email:</strong> {formData.clientEmail}</p>
                {formData.clientCompany && <p><strong>Empresa:</strong> {formData.clientCompany}</p>}
                <p><strong>Status:</strong> <span className="text-yellow-600">Pendente de confirmação</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Você receberá um email de confirmação assim que sua solicitação for aprovada.
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Ver Agenda Pública
                </Button>
                <Button 
                  onClick={() => {
                    setIsSuccess(false)
                    setFormData({
                      title: '',
                      description: '',
                      type: 'MEETING',
                      clientName: '',
                      clientEmail: '',
                      clientPhone: '',
                      clientCompany: '',
                      participants: []
                    })
                  }}
                >
                  Nova Solicitação
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Horário Selecionado */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg text-green-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            ✅ Horário Selecionado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-green-900 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                📅 Data:
              </h4>
              <p className="text-green-800">
                {preSelectedSlot.date.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ⏰ Horário:
              </h4>
              <p className="text-green-800">
                {formatTimeRange(
                  preSelectedSlot.startTime, 
                  new Date(preSelectedSlot.startTime.getTime() + preSelectedSlot.duration * 60000)
                )}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">⏱️ Duração:</h4>
              <p className="text-green-800">
                {preSelectedSlot.duration} minutos
                {preSelectedSlot.duration >= 60 && ` (${Math.floor(preSelectedSlot.duration / 60)}h${preSelectedSlot.duration % 60 > 0 ? ` ${preSelectedSlot.duration % 60}min` : ''})`}
              </p>
            </div>
          </div>
          <p className="text-xs text-green-700 mt-3">
            💡 Este horário está reservado temporariamente enquanto você preenche o formulário.
          </p>
        </CardContent>
      </Card>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações da Reunião */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações da Reunião
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Assunto *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Ex: Reunião de negócios"
                  disabled={disabled || isSubmitting}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Tipo de Reunião</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => updateFormData('type', value)}
                  disabled={disabled || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEETING">🤝 Reunião Presencial</SelectItem>
                    <SelectItem value="CALL">📞 Ligação/Videochamada</SelectItem>
                    <SelectItem value="PRESENTATION">📊 Apresentação</SelectItem>
                    <SelectItem value="OTHER">📝 Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Detalhes adicionais sobre a reunião..."
                disabled={disabled || isSubmitting}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dados do Solicitante */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Nome Completo *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => updateFormData('clientName', e.target.value)}
                  placeholder="Seu nome completo"
                  disabled={disabled || isSubmitting}
                  className={errors.clientName ? 'border-red-500' : ''}
                />
                {errors.clientName && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clientEmail">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => updateFormData('clientEmail', e.target.value)}
                  placeholder="seu@email.com"
                  disabled={disabled || isSubmitting}
                  className={errors.clientEmail ? 'border-red-500' : ''}
                />
                {errors.clientEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientEmail}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => updateFormData('clientPhone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  disabled={disabled || isSubmitting}
                  className={errors.clientPhone ? 'border-red-500' : ''}
                />
                {errors.clientPhone && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientPhone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clientCompany">Empresa</Label>
                <Input
                  id="clientCompany"
                  value={formData.clientCompany}
                  onChange={(e) => updateFormData('clientCompany', e.target.value)}
                  placeholder="Nome da empresa"
                  disabled={disabled || isSubmitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participantes */}
        <ParticipantsManager
          participants={formData.participants}
          onChange={(participants) => updateFormData('participants', participants)}
          disabled={disabled || isSubmitting}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={disabled || isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Enviando...
            </>
          ) : (
            submitText
          )}
        </Button>
      </form>

      {/* Toast de notificação */}
      {Toast}
    </div>
  )
}
