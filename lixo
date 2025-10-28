'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { ModernScheduler } from '@/components/scheduling/ModernScheduler'
import { CalendarPicker } from '@/components/calendar/CalendarPicker'
import { AvailableTimeSlots } from '@/components/public/AvailableTimeSlots'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Building2, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  type: 'MEETING' | 'CALL' | 'PRESENTATION' | 'OTHER'
  location?: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientCompany?: string
  createdAt: Date
  updatedAt: Date
}

export default function PublicAgendaPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [existingAppointments, setExistingAppointments] = useState<Array<{ startTime: Date; endTime: Date }>>([])
  const [showAvailableSlots, setShowAvailableSlots] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    fetchAppointments(selectedDate)
  }, [selectedDate])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const fetchAppointments = async (date: Date) => {
    setLoading(true)
    try {
      const dateStr = date.toISOString().split('T')[0]
      
      // Buscar agendamentos públicos (confirmados)
      const publicResponse = await fetch(`/api/appointments?date=${dateStr}&public=true`)
      const publicData = await publicResponse.json()
      
      const confirmedAppointments = publicData.appointments.map((apt: any) => ({
        ...apt,
        startTime: new Date(apt.startTime),
        endTime: new Date(apt.endTime)
      }))
      
      setAppointments(confirmedAppointments)
      
      // Buscar todos agendamentos (incluindo pendentes) para cálculo de disponibilidade
      const allResponse = await fetch(`/api/appointments?date=${dateStr}`)
      const allData = await allResponse.json()
      
      const allAppointments = allData.appointments
        .filter((apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
        .map((apt: any) => ({
          startTime: new Date(apt.startTime),
          endTime: new Date(apt.endTime)
        }))
      
      setExistingAppointments(allAppointments)
      
      // Determinar se deve mostrar slots disponíveis
      setShowAvailableSlots(confirmedAppointments.length === 0)
      
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const todayAppointments = appointments.filter(apt => {
    const today = new Date()
    const aptDate = apt.startTime
    return aptDate.toDateString() === today.toDateString()
  })

  const upcomingAppointments = appointments.filter(apt => {
    const today = new Date()
    const aptDate = apt.startTime
    return aptDate > today && aptDate.toDateString() !== today.toDateString()
  }).slice(0, 3)

  const workingDays = settings?.workingDays ? 
    settings.workingDays.split(',').map(Number) : [1, 2, 3, 4, 5]

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
                  Agenda Pública - {settings?.directorName || 'Diretor'}
                </p>
              </div>
            </div>
            
            <Link href="/agendar">
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Solicitar Reunião
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Calendário */}
          <div className="lg:col-span-1">
            <CalendarPicker
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              workingDays={workingDays}
            />

            {/* Estatísticas rápidas */}
            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {todayAppointments.length} compromisso{todayAppointments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Horário de Funcionamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {settings?.workingHoursStart || '09:00'} às {settings?.workingHoursEnd || '18:00'}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Segunda a Sexta-feira
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lista de Agendamentos */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              
              {/* Agendamentos do dia selecionado */}
              {loading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                      <div className="loading-spinner"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : appointments.length > 0 ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Agenda - {formatDate(selectedDate)}
                      </CardTitle>
                      <Badge variant="outline">
                        {appointments.length} compromisso{appointments.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          variant="public"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <AvailableTimeSlots
                  selectedDate={selectedDate}
                  workingHoursStart={settings?.workingHoursStart || '09:00'}
                  workingHoursEnd={settings?.workingHoursEnd || '18:00'}
                  existingAppointments={existingAppointments}
                />
              )}

              {/* Próximos compromissos */}
              {upcomingAppointments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Próximos Compromissos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          variant="compact"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call to Action */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      Precisa agendar uma reunião?
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Solicite um horário e receba a confirmação por email
                    </p>
                    <Link href="/agendar">
                      <Button size="lg" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Solicitar Agendamento
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 {settings?.companyName || 'Empresa'}. Sistema de Agendamento Online.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
