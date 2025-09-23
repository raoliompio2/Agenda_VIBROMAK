'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { AppointmentConfirmation } from '@/components/admin/AppointmentConfirmation'
import { AppointmentDetailsModal } from '@/components/admin/AppointmentDetailsModal'
import { CalendarPicker } from '@/components/calendar/CalendarPicker'
import { EmailTestPanel } from '@/components/admin/EmailTestPanel'
import { useToast } from '@/components/ui/alert-toast'
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  type: 'MEETING' | 'CALL' | 'PRESENTATION' | 'PARTICULAR' | 'VIAGEM' | 'OTHER'
  location?: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientCompany?: string
  createdAt: Date
  updatedAt: Date
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast, Toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    today: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/admin/login')
      return
    }
    fetchAppointments()
    fetchStats()
  }, [session, status, selectedDate, typeFilter])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const typeParam = typeFilter ? `&type=${typeFilter}` : ''
      const response = await fetch(`/api/appointments?date=${dateStr}${typeParam}`)
      const data = await response.json()
      
      setAppointments(data.appointments.map((apt: any) => ({
        ...apt,
        startTime: new Date(apt.startTime),
        endTime: new Date(apt.endTime),
        createdAt: new Date(apt.createdAt),
        updatedAt: new Date(apt.updatedAt)
      })))
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Buscar todos os agendamentos
      const allResponse = await fetch('/api/appointments')
      const allData = await allResponse.json()
      
      // Buscar agendamentos de hoje
      const todayResponse = await fetch(`/api/appointments?date=${today}`)
      const todayData = await todayResponse.json()
      
      const allAppointments = allData.appointments
      
      setStats({
        total: allAppointments.length,
        pending: allAppointments.filter((apt: any) => apt.status === 'PENDING').length,
        confirmed: allAppointments.filter((apt: any) => apt.status === 'CONFIRMED').length,
        cancelled: allAppointments.filter((apt: any) => apt.status === 'CANCELLED').length,
        completed: allAppointments.filter((apt: any) => apt.status === 'COMPLETED').length,
        today: todayData.appointments.length
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CONFIRMED' })
      })
      
      if (response.ok) {
        fetchAppointments()
        fetchStats()
      }
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      
      if (response.ok) {
        fetchAppointments()
        fetchStats()
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/appointments/${id}/edit`)
  }

  const handleReactivate = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PENDING' })
      })
      
      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Agendamento Reativado!',
          message: 'O agendamento foi reativado com sucesso.',
          duration: 5000
        })
        fetchAppointments()
        fetchStats()
      } else {
        const errorData = await response.json()
        if (errorData.conflictingAppointment) {
          showToast({
            type: 'error',
            title: 'Conflito de Horário',
            message: `Não é possível reativar este agendamento. Já existe um agendamento confirmado no mesmo horário: ${errorData.conflictingAppointment.title} (${new Date(errorData.conflictingAppointment.startTime).toLocaleString('pt-BR')} - ${new Date(errorData.conflictingAppointment.endTime).toLocaleString('pt-BR')})`,
            duration: 8000
          })
        } else {
          showToast({
            type: 'error',
            title: 'Erro ao Reativar',
            message: `Não foi possível reativar o agendamento: ${errorData.error}`,
            duration: 6000
          })
        }
      }
    } catch (error) {
      console.error('Erro ao reativar agendamento:', error)
      showToast({
        type: 'error',
        title: 'Erro de Conexão',
        message: 'Não foi possível conectar ao servidor. Tente novamente.',
        duration: 6000
      })
    }
  }

  const showAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailsModalOpen(true)
  }

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedAppointment(null)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const pendingAppointments = appointments.filter(apt => apt.status === 'PENDING')
  const confirmedAppointments = appointments.filter(apt => apt.status === 'CONFIRMED')
  const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED')
  const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cancelados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completados</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-700" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros (para ADMIN e SECRETARY) */}
        {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SECRETARY') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">🔍 Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={typeFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('')}
                >
                  Todos
                </Button>
                <Button
                  variant={typeFilter === 'MEETING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('MEETING')}
                >
                  🤝 Reuniões
                </Button>
                <Button
                  variant={typeFilter === 'CALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('CALL')}
                >
                  📞 Ligações
                </Button>
                <Button
                  variant={typeFilter === 'PRESENTATION' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('PRESENTATION')}
                >
                  📊 Apresentações
                </Button>
                <Button
                  variant={typeFilter === 'PARTICULAR' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('PARTICULAR')}
                >
                  🔒 Particulares
                </Button>
                <Button
                  variant={typeFilter === 'VIAGEM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('VIAGEM')}
                >
                  ✈️ Viagens
                </Button>
                <Button
                  variant={typeFilter === 'OTHER' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('OTHER')}
                >
                  📝 Outros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Calendário e Testes */}
          <div className="lg:col-span-1 space-y-6">
            <CalendarPicker
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              minDate={new Date(new Date().setDate(new Date().getDate() - 30))}
              workingDays={[1, 2, 3, 4, 5, 6, 0]}
            />
            
            {/* Painel de Testes de Email */}
            <EmailTestPanel />
          </div>

          {/* Lista de Agendamentos */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Solicitações Pendentes */}
            {pendingAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      Solicitações Pendentes
                    </CardTitle>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {pendingAppointments.length} pendente{pendingAppointments.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <AppointmentConfirmation
                    appointments={pendingAppointments}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    showDetails={showAppointmentDetails}
                    onEdit={handleEdit}
                    onUpdate={() => {
                      fetchAppointments()
                      fetchStats()
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Agendamentos Confirmados */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendamentos - {formatDate(selectedDate)}
                  </CardTitle>
                  <Badge variant="outline">
                    {confirmedAppointments.length} confirmado{confirmedAppointments.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <AppointmentConfirmation
                    appointments={confirmedAppointments}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    showDetails={showAppointmentDetails}
                    onEdit={handleEdit}
                    onUpdate={() => {
                      fetchAppointments()
                      fetchStats()
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Agendamentos Cancelados */}
            {cancelledAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      Agendamentos Cancelados - {formatDate(selectedDate)}
                    </CardTitle>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {cancelledAppointments.length} cancelado{cancelledAppointments.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <AppointmentConfirmation
                    appointments={cancelledAppointments}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    onReactivate={handleReactivate}
                    showDetails={showAppointmentDetails}
                    onEdit={handleEdit}
                    onUpdate={() => {
                      fetchAppointments()
                      fetchStats()
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Agendamentos Completados */}
            {completedAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-700" />
                      Agendamentos Completados - {formatDate(selectedDate)}
                    </CardTitle>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {completedAppointments.length} completado{completedAppointments.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <AppointmentConfirmation
                    appointments={completedAppointments}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    showDetails={showAppointmentDetails}
                    onEdit={handleEdit}
                    onUpdate={() => {
                      fetchAppointments()
                      fetchStats()
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
      />

      {/* Toast de notificação */}
      {Toast}
    </div>
  )
}
