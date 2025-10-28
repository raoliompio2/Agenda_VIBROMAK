'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarPicker } from '@/components/calendar/CalendarPicker'
import { TimeSlotPicker } from '@/components/calendar/TimeSlotPicker'
import { RangeTimeSlotPicker } from '@/components/calendar/RangeTimeSlotPicker'
import { DateRangePicker } from '@/components/calendar/DateRangePicker'
import { RecurrenceSelector, type RecurrenceConfig } from '@/components/calendar/RecurrenceSelector'
import { ParticipantsManager, type Participant } from './ParticipantsManager'
import { validateEmail, validatePhone, formatDateTime, formatDuration, formatTimeRange } from '@/lib/utils'
import { useToast } from '@/components/ui/alert-toast'
import { 
  User, Mail, Phone, Building, Calendar, Clock, FileText, Users,
  UserCheck, Video, Presentation, Lock, Plane
} from 'lucide-react'

interface RecurrenceData {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  endDate?: Date
  count?: number
  byWeekday?: string
  byMonthDay?: number
}

interface AppointmentFormData {
  title: string
  description: string
  type: 'MEETING' | 'CALL' | 'PRESENTATION' | 'PARTICULAR' | 'VIAGEM' | 'OTHER'
  duration: number // em minutos
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCompany: string
  participants: Participant[]
  selectedDate?: Date
  selectedDates: Date[]
  selectedTime?: Date
  selectedTimeEnd?: Date
  isRecurring: boolean
  recurrence?: RecurrenceData
}

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormData & { startTime: Date; endTime: Date }) => Promise<void>
  initialData?: Partial<AppointmentFormData>
  meetingDuration?: number
  workingDays?: number[]
  workingHoursStart?: string
  workingHoursEnd?: string
  existingAppointments?: Array<{ startTime: Date; endTime: Date }>
  disabled?: boolean
  submitText?: string
  onDateChange?: (date: Date) => void
}

export function AppointmentForm({
  onSubmit,
  initialData = {},
  meetingDuration = 60,
  workingDays = [1, 2, 3, 4, 5],
  workingHoursStart = '09:00',
  workingHoursEnd = '18:00',
  existingAppointments = [],
  disabled = false,
  submitText = 'Solicitar Agendamento',
  onDateChange
}: AppointmentFormProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState<AppointmentFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    type: initialData.type || 'MEETING',
    duration: initialData.duration || 60, // 1 hora padrão
    clientName: initialData.clientName || '',
    clientEmail: initialData.clientEmail || '',
    clientPhone: initialData.clientPhone || '',
    clientCompany: initialData.clientCompany || '',
    participants: initialData.participants || [],
    selectedDate: initialData.selectedDate,
    selectedDates: [],
    selectedTime: initialData.selectedTime,
    selectedTimeEnd: undefined,
    isRecurring: false,
    recurrence: undefined
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast, Toast } = useToast()
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({
    enabled: false,
    frequency: 'WEEKLY',
    interval: 1,
    endType: 'never'
  })
  const [useMultipleDays, setUseMultipleDays] = useState(false)

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

    if (useMultipleDays) {
      if (formData.selectedDates.length === 0) {
        newErrors.selectedDate = 'Selecione pelo menos um dia'
      }
    } else {
      if (!formData.selectedDate) {
        newErrors.selectedDate = 'Selecione uma data'
      }
    }

    if (!formData.selectedTime) {
      newErrors.selectedTime = 'Selecione um horário'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !formData.selectedTime) return

    setIsSubmitting(true)
    
    try {
      // Se está usando múltiplos dias, criar um agendamento para cada dia
      if (useMultipleDays && formData.selectedDates.length > 0) {
        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        for (const selectedDate of formData.selectedDates) {
          try {
            // Combinar a data selecionada com o horário
            const startTime = new Date(selectedDate)
            startTime.setHours(formData.selectedTime.getHours())
            startTime.setMinutes(formData.selectedTime.getMinutes())
            startTime.setSeconds(0)
            startTime.setMilliseconds(0)

            const endTime = formData.selectedTimeEnd 
              ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
                  formData.selectedTimeEnd.getHours(), formData.selectedTimeEnd.getMinutes())
              : new Date(startTime.getTime() + formData.duration * 60000)

            const submissionData: any = {
              ...formData,
              startTime,
              endTime
            }

            // Multi-seleção NÃO suporta recorrência
            // Cada data selecionada cria um agendamento individual

            await onSubmit(submissionData)
            successCount++
          } catch (error) {
            errorCount++
            const dateStr = selectedDate.toLocaleDateString('pt-BR')
            errors.push(`${dateStr}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
          }
        }

        if (successCount > 0) {
          showToast({
            type: 'success',
            title: 'Agendamentos Criados',
            message: `${successCount} de ${formData.selectedDates.length} agendamentos criados com sucesso`,
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

        if (successCount > 0) {
          // Resetar formulário se pelo menos um sucesso
          setFormData({
            title: '',
            description: '',
            type: 'MEETING',
            duration: 60,
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            clientCompany: '',
            participants: [],
            selectedDate: undefined,
            selectedDates: [],
            selectedTime: undefined,
            selectedTimeEnd: undefined,
            isRecurring: false,
            recurrence: undefined
          })
          setUseMultipleDays(false)
        }
      } else {
        // Modo de dia único (original)
        const startTime = formData.selectedTime
        const endTime = formData.selectedTimeEnd || new Date(startTime.getTime() + formData.duration * 60000)

        const submissionData: any = {
          ...formData,
          startTime,
          endTime
        }

        if (recurrenceConfig.enabled) {
          submissionData.recurrence = {
            enabled: true,
            frequency: recurrenceConfig.frequency,
            interval: recurrenceConfig.interval,
            byWeekday: recurrenceConfig.byWeekday,
            byMonthDay: recurrenceConfig.byMonthDay,
            bySetPos: recurrenceConfig.bySetPos,
            endType: recurrenceConfig.endType,
            endDate: recurrenceConfig.endDate?.toISOString(),
            count: recurrenceConfig.count
          }
        }

        await onSubmit(submissionData)
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

  const updateFormData = (field: keyof AppointmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
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
                placeholder="Assunto da reunião"
                disabled={disabled}
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
                    disabled={disabled}
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

                <div>
                  <Label htmlFor="duration">Duração Estimada</Label>
                  <Select 
                    value={formData.duration.toString()} 
                    onValueChange={(value: string) => {
                      updateFormData('duration', parseInt(value))
                      // Reset time selection when duration changes
                      updateFormData('selectedTime', undefined)
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h 30min</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                      <SelectItem value="150">2h 30min</SelectItem>
                      <SelectItem value="180">3 horas</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                      <SelectItem value="300">5 horas</SelectItem>
                      <SelectItem value="360">6 horas</SelectItem>
                      <SelectItem value="420">Meio período (7h)</SelectItem>
                      <SelectItem value="480">Dia todo (8h)</SelectItem>
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
                  disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participantes */}
      <ParticipantsManager
        participants={formData.participants}
        onChange={(participants) => updateFormData('participants', participants)}
        disabled={disabled}
      />

      {/* Recorrência - SÓ para modo de data única */}
      {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SECRETARY') && !useMultipleDays && (
        <RecurrenceSelector
          value={recurrenceConfig}
          onChange={(config) => {
            setRecurrenceConfig(config)
            updateFormData('isRecurring', config.enabled)
            if (config.enabled) {
              updateFormData('recurrence', {
                frequency: config.frequency,
                interval: config.interval,
                endDate: config.endDate,
                count: config.count,
                byWeekday: config.byWeekday?.join(','),
                byMonthDay: config.byMonthDay
              })
            } else {
              updateFormData('recurrence', undefined)
            }
          }}
          baseDate={formData.selectedDate}
          disabled={disabled}
        />
      )}

      {/* Aviso quando multi-seleção está ativa */}
      {useMultipleDays && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <div className="text-amber-600 mt-0.5">⚠️</div>
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Modo Multi-Seleção Ativo
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Recorrência não está disponível quando você seleciona múltiplas datas. 
                  Cada data selecionada criará um agendamento individual.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seleção de Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="multiple-days" className="text-sm font-medium">
                  Selecionar múltiplos dias
                </Label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="multiple-days"
                    checked={useMultipleDays}
                    onChange={(e) => {
                      setUseMultipleDays(e.target.checked)
                      if (e.target.checked) {
                        updateFormData('selectedDate', undefined)
                      } else {
                        updateFormData('selectedDates', [])
                      }
                    }}
                    disabled={disabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {useMultipleDays 
                  ? 'Clique no dia inicial e depois no final para selecionar o intervalo'
                  : 'Selecione apenas um dia para o agendamento'
                }
              </p>
            </CardContent>
          </Card>

          {useMultipleDays ? (
            <DateRangePicker
              selectedDates={formData.selectedDates}
              onDatesSelect={(dates) => {
                updateFormData('selectedDates', dates)
                updateFormData('selectedTime', undefined)
              }}
              workingDays={workingDays}
              disabled={disabled}
              showLegend={true}
            />
          ) : (
            <CalendarPicker
              selectedDate={formData.selectedDate}
              onDateSelect={(date) => {
                updateFormData('selectedDate', date)
                updateFormData('selectedTime', undefined)
                onDateChange?.(date)
              }}
              workingDays={workingDays}
              disabled={disabled}
            />
          )}
          {errors.selectedDate && (
            <p className="text-sm text-red-500 mt-2">{errors.selectedDate}</p>
          )}
        </div>

        <div>
          {((useMultipleDays && formData.selectedDates.length > 0) || (!useMultipleDays && formData.selectedDate)) && (
            <RangeTimeSlotPicker
              selectedDate={useMultipleDays ? formData.selectedDates[0] : formData.selectedDate!}
              selectedTimeRange={formData.selectedTime && formData.selectedTimeEnd ? { 
                start: formData.selectedTime, 
                end: formData.selectedTimeEnd 
              } : undefined}
              onTimeRangeSelect={(start, end) => {
                updateFormData('selectedTime', start)
                updateFormData('selectedTimeEnd', end)
                if (start && end) {
                  const durationMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
                  updateFormData('duration', durationMinutes)
                }
              }}
              workingHoursStart={workingHoursStart}
              workingHoursEnd={workingHoursEnd}
              meetingDuration={60}
              bufferTime={0}
              existingAppointments={existingAppointments}
              disabled={disabled}
            />
          )}
          {useMultipleDays && formData.selectedDates.length > 0 && (
            <Card className="mt-4">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-600 font-medium">
                  O mesmo horário será aplicado para todos os {formData.selectedDates.length} dias selecionados
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Cada data criará um agendamento individual (sem recorrência)
                </p>
              </CardContent>
            </Card>
          )}
          {errors.selectedTime && (
            <p className="text-sm text-red-500 mt-2">{errors.selectedTime}</p>
          )}
        </div>
      </div>

      {/* Resumo e Submit */}
      {formData.selectedTime && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900">Assunto:</span>
                    <br />
                    <span className="text-blue-800">{formData.title}</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900">Data:</span>
                    <br />
                    <span className="text-blue-800">{formData.selectedDate?.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900">Horário:</span>
                    <br />
                    <span className="text-blue-800">
                      {formatTimeRange(
                        formData.selectedTime, 
                        formData.selectedTimeEnd || new Date(formData.selectedTime.getTime() + formData.duration * 60000)
                      )}
                    </span>
                    <br />
                    <span className="text-blue-600 text-xs">
                      ({formatDuration(formData.duration)})
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900">Solicitante:</span>
                    <br />
                    <span className="text-blue-800">{formData.clientName}</span>
                    <br />
                    <span className="text-blue-600 text-xs">{formData.clientEmail}</span>
                  </div>
                </div>
                
                {formData.clientCompany && (
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-900">Empresa:</span>
                      <br />
                      <span className="text-blue-800">{formData.clientCompany}</span>
                    </div>
                  </div>
                )}
                
                {formData.clientPhone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-900">Telefone:</span>
                      <br />
                      <span className="text-blue-800">{formData.clientPhone}</span>
                    </div>
                  </div>
                )}
                
                {formData.participants.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-900">Participantes:</span>
                      <br />
                      <div className="text-blue-800 text-xs space-y-1">
                        {formData.participants.map((participant, index) => (
                          <div key={participant.id} className="flex items-center gap-1">
                            <span>{participant.name}</span>
                            <span className="text-blue-600">({participant.email})</span>
                            {participant.isOptional && (
                              <span className="text-amber-600 text-xs">• opcional</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {formData.description && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-900">Descrição:</span>
                    <br />
                    <span className="text-blue-800 text-xs">{formData.description}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={disabled || isSubmitting}
        size="lg"
      >
        {isSubmitting ? 'Enviando...' : submitText}
      </Button>
      
      {/* Toast de notificação */}
      {Toast}
    </form>
  )
}
