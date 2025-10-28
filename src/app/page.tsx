'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VisualCalendar } from '@/components/calendar/VisualCalendar'
import { FlexibleTimeSlots } from '@/components/scheduling/FlexibleTimeSlots-clean'
import { SimpleAppointmentForm } from '@/components/forms/SimpleAppointmentForm'
import { useAlertModal } from '@/components/ui/alert-modal'
import { ArrowLeft, CheckCircle } from 'lucide-react'

interface AppointmentStatus {
  date: string
  hasPending: boolean
  hasConfirmed: boolean
  total: number
  details: Array<{
    id: string
    title: string
    startTime: Date
    endTime: Date
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
    clientName: string
  }>
}

export default function PublicAgendaPage() {
  const [settings, setSettings] = useState<any>(null)
  const [existingAppointments, setExistingAppointments] = useState<Array<{ startTime: Date; endTime: Date; status: 'PENDING' | 'CONFIRMED' }>>([])
  const [appointmentsStatus, setAppointmentsStatus] = useState<AppointmentStatus[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Novo: seleção múltipla
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  
  // Estado do formulário
  const [showForm, setShowForm] = useState(false)
  const [preSelectedSlot, setPreSelectedSlot] = useState<{
    date: Date
    startTime: Date
    duration: number
    multipleDates?: Date[] // Para modo multi-seleção
  } | null>(null)
  
  // Modal de alerta customizado
  const { showAlert, AlertModal } = useAlertModal()

  useEffect(() => {
    Promise.all([
      fetchSettings(),
      fetchAppointmentsStatus()
    ]).finally(() => {
      setLoading(false)
    })
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const fetchAppointmentsStatus = async () => {
    try {
      // Usar a API day-status para buscar status de múltiplos dias
      const response = await fetch('/api/appointments/day-status')
      const data = await response.json()
      
      setAppointmentsStatus(data.days || [])
      
      // Buscar agendamentos existentes para o seletor
      const appointmentsResponse = await fetch('/api/appointments')
      const appointmentsData = await appointmentsResponse.json()
      
      const existing = appointmentsData.appointments
        .filter((apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
        .map((apt: any) => ({
          startTime: new Date(apt.startTime),
          endTime: new Date(apt.endTime),
          status: apt.status
        }))
      
      setExistingAppointments(existing)
    } catch (error) {
      console.error('Erro ao carregar status dos agendamentos:', error)
    }
  }

  const handleTimeSelect = (startTime: Date, endTime: Date, duration: number) => {
    // Verificar se está no modo multi-seleção
    if (multiSelectMode && selectedDates.length > 0) {
      // Validar conflitos em todas as datas
      const conflictingDates = validateConflictsInMultipleDates(startTime, endTime, selectedDates)
      
      if (conflictingDates.length > 0) {
        const conflictMessage = (
          <div className="space-y-3">
            <p className="text-gray-700">
              O horário selecionado <strong>conflita com agendamentos existentes</strong> nas seguintes datas:
            </p>
            <div className="bg-white rounded-lg p-4 border border-yellow-300">
              <div className="flex flex-wrap gap-2">
                {conflictingDates.map((date, index) => (
                  <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-300">
                    {date.toLocaleDateString('pt-BR', { 
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Sugestões:</strong>
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Escolha outro horário disponível</li>
              <li>Ou volte e remova as datas com conflito da seleção</li>
            </ul>
          </div>
        )
        
        showAlert(
          'Conflito de Horários',
          conflictMessage,
          'warning'
        )
        return
      }
      
      setPreSelectedSlot({
        date: startTime,
        startTime: startTime,
        duration,
        multipleDates: selectedDates
      })
    } else {
      setPreSelectedSlot({
        date: startTime,
        startTime: startTime,
        duration
      })
    }
    setShowForm(true)
  }
  
  const validateConflictsInMultipleDates = (startTime: Date, endTime: Date, dates: Date[]): Date[] => {
    const conflictingDates: Date[] = []
    
    const selectedTimeStart = startTime.getHours() * 60 + startTime.getMinutes()
    const selectedTimeEnd = endTime.getHours() * 60 + endTime.getMinutes()
    
    dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0]
      
      // Verificar se há agendamentos nessa data
      const appointmentsOnDate = existingAppointments.filter(apt => {
        const aptDateStr = apt.startTime.toISOString().split('T')[0]
        return aptDateStr === dateStr
      })
      
      // Verificar se o horário selecionado conflita com algum agendamento
      const hasConflict = appointmentsOnDate.some(apt => {
        const aptStart = apt.startTime.getHours() * 60 + apt.startTime.getMinutes()
        const aptEnd = apt.endTime.getHours() * 60 + apt.endTime.getMinutes()
        
        // Verifica se há sobreposição de horários
        return (
          (selectedTimeStart >= aptStart && selectedTimeStart < aptEnd) ||
          (selectedTimeEnd > aptStart && selectedTimeEnd <= aptEnd) ||
          (selectedTimeStart <= aptStart && selectedTimeEnd >= aptEnd)
        )
      })
      
      if (hasConflict) {
        conflictingDates.push(date)
      }
    })
    
    return conflictingDates
  }
  
  const handleBackToCalendar = () => {
    setShowForm(false)
    setPreSelectedSlot(null)
  }
  
  const handleSubmit = async (formData: any) => {
    try {
      // Se tem múltiplas datas, criar um agendamento para cada uma
      if (formData.multipleDates && formData.multipleDates.length > 0) {
        const promises = formData.multipleDates.map(async (date: Date) => {
          // Ajustar o startTime e endTime para cada data
          const startTime = new Date(date)
          startTime.setHours(formData.startTime.getHours(), formData.startTime.getMinutes())
          
          const endTime = new Date(date)
          endTime.setHours(formData.endTime.getHours(), formData.endTime.getMinutes())
          
          const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              type: formData.type,
              duration: formData.duration,
              clientName: formData.clientName,
              clientEmail: formData.clientEmail,
              clientPhone: formData.clientPhone,
              clientCompany: formData.clientCompany,
              participants: formData.participants || []
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(`Erro em ${date.toLocaleDateString('pt-BR')}: ${error.error}`)
          }

          return await response.json()
        })
        
        const results = await Promise.all(promises)
        console.log(`✅ ${results.length} agendamentos criados`)
        
      } else {
        // Agendamento único
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            startTime: formData.startTime.toISOString(),
            endTime: formData.endTime.toISOString(),
            type: formData.type,
            duration: formData.duration,
            clientName: formData.clientName,
            clientEmail: formData.clientEmail,
            clientPhone: formData.clientPhone,
            clientCompany: formData.clientCompany,
            participants: formData.participants || []
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao enviar solicitação')
        }

        const result = await response.json()
        console.log('✅ Agendamento criado:', result.appointment.id)
      }
      
      // Recarregar status e resetar estados
      await fetchAppointmentsStatus()
      setShowForm(false)
      setPreSelectedSlot(null)
      setMultiSelectMode(false)
      setSelectedDates([])
      setSelectedDate(null)
      
    } catch (error) {
      console.error('Erro ao enviar agendamento:', error)
      throw error
    }
  }

  const workingDays = settings?.workingDays ? 
    settings.workingDays.split(',').map(Number) : [1, 2, 3, 4, 5]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {showForm && preSelectedSlot ? (
            // Formulário de agendamento
            <>
              <div className="mb-6">
                <Button 
                  variant="outline" 
                  onClick={handleBackToCalendar}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o Calendário
                </Button>
              </div>

              <SimpleAppointmentForm
                onSubmit={handleSubmit}
                preSelectedSlot={preSelectedSlot}
                submitText="Enviar Solicitação de Agendamento"
                allowMultipleDays={true}
                workingDays={workingDays}
              />
            </>
          ) : (
            // Seletor de data e horário
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Calendário */}
            <div>
              {/* Toggle para modo seleção múltipla */}
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="multi-select-toggle" className="text-sm font-medium">
                      Modo Seleção Múltipla de Dias
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="multi-select-toggle"
                        checked={multiSelectMode}
                        onChange={(e) => {
                          setMultiSelectMode(e.target.checked)
                          if (!e.target.checked) {
                            setSelectedDates([])
                            setSelectedDate(null)
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {multiSelectMode 
                      ? 'Clique no primeiro dia, depois no último para selecionar o intervalo'
                      : 'Selecione um dia para ver horários disponíveis'
                    }
                  </p>
                </CardContent>
              </Card>
              
              <VisualCalendar
                selectedDate={!multiSelectMode ? (selectedDate || undefined) : undefined}
                onDateSelect={!multiSelectMode ? setSelectedDate : () => {}}
                appointmentsStatus={appointmentsStatus}
                settings={settings}
                workingDays={workingDays}
                showLegend={true}
                allowMultiSelect={multiSelectMode}
                selectedDates={selectedDates}
                onDatesSelect={setSelectedDates}
              />
            </div>

            {/* Horários */}
            <div>
                {/* Modo Single: Mostra horários da data selecionada */}
                {selectedDate && !multiSelectMode ? (
                <FlexibleTimeSlots
                  selectedDate={selectedDate}
                  workingHoursStart={settings?.workingHoursStart || '09:00'}
                  workingHoursEnd={settings?.workingHoursEnd || '18:00'}
                  existingAppointments={existingAppointments}
                  onTimeSelect={handleTimeSelect}
                />
                ) : multiSelectMode && selectedDates.length > 0 ? (
                  // Modo Multi: Mostra horários baseado na primeira data
                  <div className="space-y-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 mb-1">
                              {selectedDates.length} dia{selectedDates.length !== 1 ? 's' : ''} selecionado{selectedDates.length !== 1 ? 's' : ''}
                            </h3>
                            <p className="text-sm text-blue-800">
                              Escolha um horário abaixo. O mesmo horário será aplicado para <strong>todos os dias selecionados</strong>.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <FlexibleTimeSlots
                      selectedDate={selectedDates[0]}
                      workingHoursStart={settings?.workingHoursStart || '09:00'}
                      workingHoursEnd={settings?.workingHoursEnd || '18:00'}
                      existingAppointments={existingAppointments}
                      onTimeSelect={handleTimeSelect}
                    />
                  </div>
              ) : (
                <Card>
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900 mb-2">
                          {multiSelectMode 
                            ? 'Selecione as datas'
                            : 'Selecione uma data'
                          }
                      </p>
                      <p className="text-sm text-gray-500">
                          {multiSelectMode
                            ? 'Use o calendário para selecionar múltiplos dias'
                            : 'Clique em uma data no calendário para ver horários'
                          }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
      
      {/* Modal de Alerta */}
      <AlertModal />
    </div>
  )
}
