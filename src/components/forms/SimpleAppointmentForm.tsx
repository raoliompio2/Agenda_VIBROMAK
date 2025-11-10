'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/calendar/DateRangePicker'
import { ParticipantsManager, type Participant } from './ParticipantsManager'
import { useToast } from '@/components/ui/alert-toast'
import { validateEmail, validatePhone, formatDateTime, formatTimeRange } from '@/lib/utils'
import { 
  User, Mail, Phone, Building, Calendar, Clock, FileText, Users, CheckCircle,
  UserCheck, Video, Presentation, Lock, Plane, Lightbulb, Timer
} from 'lucide-react'

interface SimpleAppointmentFormData {
  title: string
  description: string
  type: 'MEETING' | 'CALL' | 'PRESENTATION' | 'PARTICULAR' | 'VIAGEM' | 'OTHER'
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
    multipleDates?: Date[] // Para agendamentos recorrentes
  }) => Promise<void>
  preSelectedSlot: {
    date: Date
    startTime: Date
    duration: number
    multipleDates?: Date[] // Datas múltiplas selecionadas
  }
  disabled?: boolean
  submitText?: string
  allowMultipleDays?: boolean
  workingDays?: number[]
}

export function SimpleAppointmentForm({
  onSubmit,
  preSelectedSlot,
  disabled = false,
  submitText = 'Enviar Solicitação',
  allowMultipleDays = false,
  workingDays = [1, 2, 3, 4, 5]
}: SimpleAppointmentFormProps) {
  const { data: session } = useSession()
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
  const [useMultipleDays, setUseMultipleDays] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
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
      if (allowMultipleDays && useMultipleDays && selectedDates.length > 0) {
        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        for (const selectedDate of selectedDates) {
          try {
            // Usar o construtor de Date com ano, mês, dia para evitar problemas de timezone
            const year = selectedDate.getFullYear()
            const month = selectedDate.getMonth()
            const day = selectedDate.getDate()
            
            const startTime = new Date(year, month, day,
              preSelectedSlot.startTime.getHours(),
              preSelectedSlot.startTime.getMinutes(),
              0,
              0)

            const endTime = new Date(startTime.getTime() + preSelectedSlot.duration * 60000)

            // Validar que as datas são válidas
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
              throw new Error('Data ou horário inválido')
            }

            // Criar objeto de dados apenas com campos válidos para a API
            await onSubmit({
              title: formData.title,
              description: formData.description || '',
              type: formData.type,
              duration: preSelectedSlot.duration,
              clientName: formData.clientName,
              clientEmail: formData.clientEmail,
              clientPhone: formData.clientPhone || '',
              clientCompany: formData.clientCompany || '',
              participants: formData.participants || [],
              startTime,
              endTime
            })
            successCount++
          } catch (error) {
            errorCount++
            const dateStr = selectedDate.toLocaleDateString('pt-BR')
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
            console.error(`Erro ao criar agendamento para ${dateStr}:`, error)
            errors.push(`${dateStr}: ${errorMessage}`)
          }
        }

        if (successCount > 0) {
          setIsSuccess(true)
          showToast({
            type: 'success',
            title: 'Solicitações Enviadas!',
            message: `${successCount} de ${selectedDates.length} solicitações enviadas com sucesso. Você receberá confirmação por email.`,
            duration: 5000
          })
        }

        if (errorCount > 0) {
          showToast({
            type: 'error',
            title: 'Alguns agendamentos falharam',
            message: errors.join('\n'),
            duration: 10000
          })
        }
      } else {
        const endTime = new Date(preSelectedSlot.startTime.getTime() + preSelectedSlot.duration * 60000)

        await onSubmit({
          ...formData,
          startTime: preSelectedSlot.startTime,
          endTime,
          duration: preSelectedSlot.duration,
          multipleDates: preSelectedSlot.multipleDates // Passa as múltiplas datas se existirem
        })
        
        const daysCount = preSelectedSlot.multipleDates?.length || 1
        setIsSuccess(true)
        showToast({
          type: 'success',
          title: 'Solicitação Enviada!',
          message: daysCount > 1 
            ? `${daysCount} agendamentos criados com sucesso! Você receberá confirmações por email.`
            : 'Sua solicitação foi enviada com sucesso. Você receberá uma confirmação por email.',
          duration: 5000
        })
      }
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
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Detalhes da Solicitação:
              </h3>
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
      {preSelectedSlot.multipleDates && preSelectedSlot.multipleDates.length > 0 ? (
        // Modo Multi-Seleção: Mostrar todas as datas
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Agendamento em Múltiplas Datas - {preSelectedSlot.multipleDates.length} {preSelectedSlot.multipleDates.length === 1 ? 'Dia' : 'Dias'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Horário (aplicado a todos os dias):
                </h4>
                <p className="text-blue-800 text-base font-medium">
                  {formatTimeRange(
                    preSelectedSlot.startTime, 
                    new Date(preSelectedSlot.startTime.getTime() + preSelectedSlot.duration * 60000)
                  )}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  Duração:
                </h4>
                <p className="text-blue-800">{preSelectedSlot.duration} minutos</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Datas Selecionadas:
              </h4>
              <div className="flex flex-wrap gap-2">
                {preSelectedSlot.multipleDates.map((date, index) => (
                  <div 
                    key={index} 
                    className="bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-medium text-blue-900"
                  >
                    {date.toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Atenção:</strong> Este formulário criará <strong>{preSelectedSlot.multipleDates.length} {preSelectedSlot.multipleDates.length === 1 ? 'agendamento' : 'agendamentos'}</strong> com o mesmo horário e informações nas datas selecionadas acima.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Modo Single: Mostrar data única
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Horário Selecionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-green-900 mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data:
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
                  Horário:
                </h4>
                <p className="text-green-800">
                  {formatTimeRange(
                    preSelectedSlot.startTime, 
                    new Date(preSelectedSlot.startTime.getTime() + preSelectedSlot.duration * 60000)
                  )}
                </p>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1 flex items-center gap-1">
                <Timer className="h-4 w-4" />
                Duração:
              </h4>
              <p className="text-green-800">
                {preSelectedSlot.duration} minutos
                {preSelectedSlot.duration >= 60 && ` (${Math.floor(preSelectedSlot.duration / 60)}h${preSelectedSlot.duration % 60 > 0 ? ` ${preSelectedSlot.duration % 60}min` : ''})`}
              </p>
            </div>
          </div>
          <p className="text-xs text-green-700 mt-3 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Este horário está reservado temporariamente enquanto você preenche o formulário.
          </p>
        </CardContent>
      </Card>
      )}

      {/* Toggle para múltiplos dias */}
      {allowMultipleDays && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="multiple-days-toggle" className="text-sm font-medium">
                Repetir para múltiplos dias
              </Label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="multiple-days-toggle"
                  checked={useMultipleDays}
                  onChange={(e) => setUseMultipleDays(e.target.checked)}
                  disabled={disabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {useMultipleDays 
                ? 'Selecione os dias abaixo. O mesmo horário será aplicado para todos.'
                : 'Ative para agendar o mesmo horário em vários dias úteis'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Seletor de múltiplos dias */}
      {allowMultipleDays && useMultipleDays && (
        <DateRangePicker
          selectedDates={selectedDates}
          onDatesSelect={setSelectedDates}
          workingDays={workingDays}
          disabled={disabled}
          showLegend={true}
        />
      )}

      {/* Aviso de múltiplos dias */}
      {useMultipleDays && selectedDates.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-900 font-medium">
              {selectedDates.length} dias selecionados - O mesmo horário será aplicado para todos
            </p>
          </CardContent>
        </Card>
      )}

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
                    <SelectItem value="MEETING">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Reunião Presencial
                      </div>
                    </SelectItem>
                    <SelectItem value="CALL">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Ligação/Videochamada
                      </div>
                    </SelectItem>
                    <SelectItem value="PRESENTATION">
                      <div className="flex items-center gap-2">
                        <Presentation className="h-4 w-4" />
                        Apresentação
                      </div>
                    </SelectItem>
                    {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SECRETARY') && (
                      <>
                        <SelectItem value="PARTICULAR">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Compromisso Particular
                          </div>
                        </SelectItem>
                        <SelectItem value="VIAGEM">
                          <div className="flex items-center gap-2">
                            <Plane className="h-4 w-4" />
                            Viagem
                          </div>
                        </SelectItem>
                      </>
                    )}
                    <SelectItem value="OTHER">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Outro
                      </div>
                    </SelectItem>
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
