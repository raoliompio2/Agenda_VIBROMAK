'use client'

import { useState, useEffect, Suspense } from 'react'

// Configuração para evitar pré-renderização
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SimpleAppointmentForm } from '@/components/forms/SimpleAppointmentForm'
import { ModernScheduler } from '@/components/scheduling/ModernScheduler'
import { useToast } from '@/components/ui/alert-toast'
import { Info, ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

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

function AgendarContent() {
  const [settings, setSettings] = useState<any>(null)
  const [existingAppointments, setExistingAppointments] = useState<any[]>([])
  const [appointmentsStatus, setAppointmentsStatus] = useState<AppointmentStatus[]>([])
  const [preSelectedSlot, setPreSelectedSlot] = useState<{
    date: Date
    startTime: Date
    duration: number
  } | null>(null)
  const [showScheduler, setShowScheduler] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast, Toast } = useToast()

  useEffect(() => {
    fetchSettings()
    fetchAppointmentsStatus()
    
    // Verificar se há parâmetros na URL (vindo do seletor)
    const dateParam = searchParams.get('date')
    const timeParam = searchParams.get('time')  
    const durationParam = searchParams.get('duration')
    
    if (dateParam && timeParam && durationParam) {
      const selectedDate = new Date(dateParam)
      const selectedTime = new Date(timeParam)
      const duration = parseInt(durationParam)
      
      setPreSelectedSlot({
        date: selectedDate,
        startTime: selectedTime,
        duration
      })
      setShowScheduler(false)
      
      console.log('📋 Agendamento pré-configurado:', {
        date: selectedDate.toLocaleDateString('pt-BR'),
        time: selectedTime.toLocaleTimeString('pt-BR'),
        duration: duration
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

  const fetchAppointmentsStatus = async () => {
    try {
      const response = await fetch('/api/appointments')
      const data = await response.json()
      
      // Agrupar agendamentos por data para status visual
      const statusMap = new Map<string, AppointmentStatus>()
      
      data.appointments.forEach((apt: any) => {
        const date = new Date(apt.startTime)
        const dateStr = date.toISOString().split('T')[0]
        
        if (!statusMap.has(dateStr)) {
          statusMap.set(dateStr, {
            date: dateStr,
            hasPending: false,
            hasConfirmed: false,
            total: 0,
            details: []
          })
        }
        
        const status = statusMap.get(dateStr)!
        status.total++
        
        if (apt.status === 'PENDING') status.hasPending = true
        if (apt.status === 'CONFIRMED') status.hasConfirmed = true
        
        status.details.push({
          id: apt.id,
          title: apt.title,
          startTime: new Date(apt.startTime),
          endTime: new Date(apt.endTime),
          status: apt.status,
          clientName: apt.clientName
        })
      })
      
      // Buscar agendamentos existentes para o seletor (com status)
      const existing = data.appointments
        .filter((apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
        .map((apt: any) => ({
          startTime: new Date(apt.startTime),
          endTime: new Date(apt.endTime),
          status: apt.status
        }))
      
      setAppointmentsStatus(Array.from(statusMap.values()))
      setExistingAppointments(existing)
    } catch (error) {
      console.error('Erro ao carregar status dos agendamentos:', error)
    }
  }

  const handleScheduleSelect = (startTime: Date, endTime: Date, duration: number) => {
    setPreSelectedSlot({
      date: startTime, // A data está contida no startTime
      startTime: startTime,
      duration
    })
    setShowScheduler(false)
  }

  const handleSubmit = async (formData: any) => {
    console.log('📝 Enviando solicitação:', {
      title: formData.title,
      startTime: formData.startTime,
      endTime: formData.endTime,
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
      
      // O componente SimpleAppointmentForm já trata o sucesso
      
    } catch (error) {
      console.error('Erro ao enviar agendamento:', error)
      throw error // Re-throw para o componente tratar
    }
  }

  const handleBackToScheduler = () => {
    setShowScheduler(true)
    setPreSelectedSlot(null)
    // Limpar parâmetros da URL
    const newUrl = new URL(window.location.href)
    newUrl.search = ''
    window.history.replaceState({}, '', newUrl.toString())
  }

  const workingDays = settings?.workingDays ? 
    settings.workingDays.split(',').map(Number) : [1, 2, 3, 4, 5]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {showScheduler ? (
            <ModernScheduler
              workingHoursStart={settings?.workingHoursStart || '09:00'}
              workingHoursEnd={settings?.workingHoursEnd || '18:00'}
              workingDays={workingDays}
              existingAppointments={existingAppointments}
              appointmentsStatus={appointmentsStatus}
              settings={settings}
              onScheduleSelect={handleScheduleSelect}
              showTitle={false}
            />
          ) : preSelectedSlot ? (
            <>
              {/* Botão para voltar ao seletor */}
              <div className="mb-6">
                <Button 
                  variant="outline" 
                  onClick={handleBackToScheduler}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Alterar Data/Horário
                </Button>
              </div>

              {/* Formulário Simples */}
              <SimpleAppointmentForm
                onSubmit={handleSubmit}
                preSelectedSlot={preSelectedSlot}
                submitText="Enviar Solicitação"
              />
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-lg font-medium text-muted-foreground">
                    Carregando formulário...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
        </div>
      </div>
      
      {/* Toast de notificação */}
      {Toast}
    </div>
  )
}

export default function AgendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <AgendarContent />
    </Suspense>
  )
}
