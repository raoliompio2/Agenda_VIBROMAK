'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModernScheduler } from '@/components/scheduling/ModernScheduler'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Building2, Users, TrendingUp } from 'lucide-react'

interface Appointment {
  id: string
  title: string
  startTime: Date
  endTime: Date
  type: 'MEETING' | 'CALL' | 'PRESENTATION' | 'OTHER'
  location?: string
  status: 'CONFIRMED'
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientCompany?: string
}

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
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [existingAppointments, setExistingAppointments] = useState<Array<{ startTime: Date; endTime: Date }>>([])
  const [appointmentsStatus, setAppointmentsStatus] = useState<AppointmentStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchSettings(),
      fetchTodayAppointments(),
      fetchUpcomingAppointments(),
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

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/appointments?date=${today}&public=true`)
      const data = await response.json()
      
      const appointments = data.appointments.map((apt: any) => ({
        ...apt,
        startTime: new Date(apt.startTime),
        endTime: new Date(apt.endTime)
      }))
      
      setTodayAppointments(appointments)
    } catch (error) {
      console.error('Erro ao carregar agendamentos de hoje:', error)
    }
  }

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await fetch('/api/appointments?public=true')
      const data = await response.json()
      
      const now = new Date()
      const appointments = data.appointments
        .map((apt: any) => ({
          ...apt,
          startTime: new Date(apt.startTime),
          endTime: new Date(apt.endTime)
        }))
        .filter((apt: any) => apt.startTime > now)
        .sort((a: any, b: any) => a.startTime.getTime() - b.startTime.getTime())
        .slice(0, 5)
      
      setUpcomingAppointments(appointments)
    } catch (error) {
      console.error('Erro ao carregar próximos agendamentos:', error)
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
      
      // Buscar agendamentos existentes para o seletor (todos os status ativos)
      const existing = data.appointments
        .filter((apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
        .map((apt: any) => ({
          startTime: new Date(apt.startTime),
          endTime: new Date(apt.endTime)
        }))
      
      setAppointmentsStatus(Array.from(statusMap.values()))
      setExistingAppointments(existing)
    } catch (error) {
      console.error('Erro ao carregar status dos agendamentos:', error)
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
            
            <div className="flex items-center gap-4 text-sm">
              <div className="hidden md:flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {settings?.workingHoursStart || '09:00'} às {settings?.workingHoursEnd || '18:00'}
                </span>
              </div>
              <Badge variant="outline">
                {todayAppointments.length} hoje
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Seletor Moderno */}
          <div className="xl:col-span-3">
            <ModernScheduler
              workingHoursStart={settings?.workingHoursStart || '09:00'}
              workingHoursEnd={settings?.workingHoursEnd || '18:00'}
              workingDays={workingDays}
              existingAppointments={existingAppointments}
              appointmentsStatus={appointmentsStatus}
              settings={settings}
              showTitle={true}
            />
          </div>

          {/* Painel Lateral - Informações */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Estatísticas Hoje */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reuniões</span>
                    <Badge variant={todayAppointments.length > 0 ? "default" : "outline"}>
                      {todayAppointments.length}
                    </Badge>
                  </div>
                  
                  {todayAppointments.length > 0 && (
                    <div className="space-y-2">
                      {todayAppointments.slice(0, 3).map((apt) => (
                        <div key={apt.id} className="text-xs p-2 bg-muted/50 rounded">
                          <p className="font-medium">{apt.title}</p>
                          <p className="text-muted-foreground">
                            {apt.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                      {todayAppointments.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{todayAppointments.length - 3} outros
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Horário de Funcionamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Segunda a Sexta</span>
                    <span className="font-medium">
                      {settings?.workingHoursStart || '09:00'} - {settings?.workingHoursEnd || '18:00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Final de semana</span>
                    <span className="text-red-600">Fechado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Próximos Compromissos */}
            {upcomingAppointments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Próximos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="text-xs p-2 bg-muted/30 rounded">
                        <p className="font-medium mb-1">{appointment.title}</p>
                        <p className="text-muted-foreground">
                          {appointment.startTime.toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          })} às {appointment.startTime.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações de Contato */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Como Funciona
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-primary/80">
                  <p>• Selecione uma data no calendário</p>
                  <p>• Escolha a duração desejada</p>
                  <p>• Clique em um horário disponível</p>
                  <p>• Preencha seus dados</p>
                  <p>• Aguarde a confirmação</p>
                </div>
              </CardContent>
            </Card>
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
