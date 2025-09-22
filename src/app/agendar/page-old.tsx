'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppointmentForm } from '@/components/forms/AppointmentForm'
import { ExistingAppointments } from '@/components/appointments/ExistingAppointments'
import { useToast } from '@/components/ui/alert-toast'
import { ArrowLeft, CheckCircle, Building2, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatTime, formatDuration } from '@/lib/utils'

export default function AgendarPage() {
  const [settings, setSettings] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [existingAppointments, setExistingAppointments] = useState<any[]>([])
  const [fullAppointments, setFullAppointments] = useState<any[]>([])
  const [selectedDateForAppointments, setSelectedDateForAppointments] = useState<Date | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedAppointment, setSubmittedAppointment] = useState<any>(null)
  const [prefilledData, setPrefilledData] = useState<any>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast, Toast } = useToast()

  useEffect(() => {
    fetchSettings()
    
    // Ler parâmetros da URL para pré-configurar
    const dateParam = searchParams.get('date')
    const timeParam = searchParams.get('time')
    const durationParam = searchParams.get('duration')
    
    if (dateParam && timeParam && durationParam) {
      const selectedDate = new Date(dateParam)
      const selectedTime = new Date(timeParam)
      const duration = parseInt(durationParam)
      
      setPrefilledData({
        selectedDate,
        selectedTime,
        duration
      })
      
      console.log('📋 Dados pré-configurados:', {
        date: selectedDate.toLocaleDateString('pt-BR'),
        time: formatTime(selectedTime),
        duration: formatDuration(duration)
      })
    }
  }, [searchParams])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const fetchExistingAppointments = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0]
      console.log('🔍 Buscando agendamentos para:', dateStr)
      
      // Buscar agendamentos diretamente da API
      const response = await fetch(`/api/appointments?date=${dateStr}`)
      const data = await response.json()
      
      console.log('📋 Agendamentos encontrados:', data.appointments)
      
      // Filtrar agendamentos ativos
      const activeAppointments = data.appointments.filter(
        (apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED'
      )
      
      // Para o TimeSlotPicker (formato simplificado)
      const appointmentsForSlots = activeAppointments.map((apt: any) => ({
        startTime: new Date(apt.startTime),
        endTime: new Date(apt.endTime)
      }))
      
      // Para exibição completa (formato completo)
      const fullAppointmentData = activeAppointments.map((apt: any) => ({
        id: apt.id,
        title: apt.title,
        description: apt.description,
        startTime: new Date(apt.startTime),
        endTime: new Date(apt.endTime),
        status: apt.status,
        type: apt.type,
        clientName: apt.clientName,
        clientEmail: apt.clientEmail,
        clientCompany: apt.clientCompany
      }))
      
      console.log('📅 Agendamentos processados:', appointmentsForSlots)
      setExistingAppointments(appointmentsForSlots)
      setFullAppointments(fullAppointmentData)
      setSelectedDateForAppointments(date)
    } catch (error) {
      console.error('Erro ao carregar compromissos existentes:', error)
      setExistingAppointments([])
      setFullAppointments([])
      setSelectedDateForAppointments(null)
    }
  }

  const handleSubmit = async (formData: any) => {
    console.log('📝 Enviando solicitação:', {
      title: formData.title,
      startTime: formData.startTime,
      endTime: formData.endTime,
      startTimeISO: formData.startTime.toISOString(),
      endTimeISO: formData.endTime.toISOString(),
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
    })
    
    try {
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
          clientCompany: formData.clientCompany
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao enviar solicitação')
      }

      const result = await response.json()
      setSubmittedAppointment(result.appointment)
      setIsSubmitted(true)
      
    } catch (error) {
      console.error('Erro ao enviar agendamento:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar solicitação. Tente novamente.'
      showToast({
        type: 'error',
        title: 'Erro ao Agendar',
        message: errorMessage,
        duration: 8000
      })
    }
  }

  const workingDays = settings?.workingDays ? 
    settings.workingDays.split(',').map(Number) : [1, 2, 3, 4, 5]

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {settings?.companyName || 'Empresa'}
                </h1>
                <p className="text-sm text-gray-600">
                  Solicitação de Agendamento
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
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
                  
                  {submittedAppointment && (
                    <div className="bg-white rounded-lg p-4 mb-6 text-left">
                      <h3 className="font-semibold mb-2">Detalhes da Solicitação:</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Assunto:</strong> {submittedAppointment.title}</p>
                        <p><strong>Data e Hora:</strong> {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(submittedAppointment.startTime))}</p>
                        <p><strong>Status:</strong> Pendente de confirmação</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Você receberá um email de confirmação assim que sua solicitação for aprovada.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Link href="/">
                        <Button variant="outline">
                          Ver Agenda Pública
                        </Button>
                      </Link>
                      <Button 
                        type="button"
                        onClick={() => {
                          setIsSubmitted(false)
                          setSubmittedAppointment(null)
                        }}
                      >
                        Nova Solicitação
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {settings?.companyName || 'Empresa'}
                </h1>
                <p className="text-sm text-gray-600">
                  Solicitar Agendamento - {settings?.directorName || 'Diretor'}
                </p>
              </div>
            </div>
            
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar à Agenda
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Horário Pré-selecionado */}
          {prefilledData.selectedTime && (
            <Card className="mb-8 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  ✅ Horário Pré-selecionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">📅 Data:</h4>
                    <p className="text-green-800">
                      {prefilledData.selectedDate?.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">⏰ Horário:</h4>
                    <p className="text-green-800">
                      {formatTime(prefilledData.selectedTime)} às {formatTime(
                        new Date(prefilledData.selectedTime.getTime() + prefilledData.duration * 60000)
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">⏱️ Duração:</h4>
                    <p className="text-green-800">
                      {formatDuration(prefilledData.duration)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  💡 Estes horários já estão configurados no formulário abaixo. Você pode alterá-los se necessário.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Informações importantes */}
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">
                Instruções para Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Horário de Funcionamento:</h4>
                  <p className="text-blue-800">
                    {settings?.workingHoursStart || '09:00'} às {settings?.workingHoursEnd || '18:00'}
                  </p>
                  <p className="text-blue-800">Segunda a Sexta-feira</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Processo:</h4>
                  <ul className="text-blue-800 space-y-1">
                    <li>• Preencha o formulário abaixo</li>
                    <li>• Aguarde confirmação por email</li>
                    <li>• Duração personalizada disponível</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agendamentos Existentes */}
          {selectedDateForAppointments && (
            <ExistingAppointments
              appointments={fullAppointments}
              selectedDate={selectedDateForAppointments}
              showClientInfo={false}
              variant="default"
            />
          )}

          {/* Formulário de Agendamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Solicitar Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
            <AppointmentForm
              onSubmit={handleSubmit}
              initialData={prefilledData}
              meetingDuration={settings?.meetingDuration || 60}
              workingDays={workingDays}
              workingHoursStart={settings?.workingHoursStart || '09:00'}
              workingHoursEnd={settings?.workingHoursEnd || '18:00'}
              existingAppointments={existingAppointments}
              submitText="Enviar Solicitação"
              onDateChange={fetchExistingAppointments}
            />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Toast de notificação */}
      {Toast}
    </div>
  )
}
