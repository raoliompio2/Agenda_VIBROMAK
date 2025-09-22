'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { VisualCalendar } from '@/components/calendar/VisualCalendar'
import { FlexibleTimeSlots } from '@/components/scheduling/FlexibleTimeSlots-clean'

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
        
        // NÃO incluir detalhes privados - só para contagem
        status.details.push({
          id: apt.id,
          title: '', // Sem título
          startTime: new Date(apt.startTime),
          endTime: new Date(apt.endTime),
          status: apt.status,
          clientName: '' // Sem nome do cliente
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

  const handleTimeSelect = (startTime: Date, endTime: Date, duration: number) => {
    const params = new URLSearchParams({
      date: startTime.toISOString().split('T')[0],
      time: startTime.toISOString(),
      duration: duration.toString()
    })
    window.location.href = `/agendar?${params.toString()}`
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
          
          {/* Interface Limpa */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Calendário */}
            <div>
              <VisualCalendar
                selectedDate={selectedDate || undefined}
                onDateSelect={setSelectedDate}
                appointmentsStatus={appointmentsStatus}
                settings={settings}
                workingDays={workingDays}
                showLegend={false} // SEM LEGENDA
              />
            </div>

            {/* Horários */}
            <div>
              {selectedDate ? (
                <FlexibleTimeSlots
                  selectedDate={selectedDate}
                  workingHoursStart={settings?.workingHoursStart || '09:00'}
                  workingHoursEnd={settings?.workingHoursEnd || '18:00'}
                  existingAppointments={existingAppointments}
                  onTimeSelect={handleTimeSelect}
                />
              ) : (
                <Card>
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Selecione uma data
                      </p>
                      <p className="text-sm text-gray-500">
                        Clique em uma data no calendário
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
