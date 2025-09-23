'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/alert-toast'
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Edit,
  FileText,
  RotateCcw,
  Eye
} from 'lucide-react'
import { formatDateTime, formatTime } from '@/lib/utils'

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

interface AppointmentConfirmationProps {
  appointments: Appointment[]
  onConfirm: (id: string) => Promise<void>
  onCancel: (id: string) => Promise<void>
  onReactivate?: (id: string) => Promise<void>
  onUpdate?: () => void
  showDetails?: (appointment: Appointment) => void
  onEdit?: (id: string) => void
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
}

const statusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado', 
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
}

const typeLabels = {
  MEETING: 'Reunião',
  CALL: 'Ligação', 
  PRESENTATION: 'Apresentação',
  PARTICULAR: 'Particular',
  VIAGEM: 'Viagem',
  OTHER: 'Outro',
}

export function AppointmentConfirmation({ 
  appointments, 
  onConfirm, 
  onCancel,
  onReactivate,
  onUpdate,
  showDetails,
  onEdit 
}: AppointmentConfirmationProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { showToast, Toast } = useToast()

  const pendingAppointments = appointments.filter(apt => apt.status === 'PENDING')
  const confirmedAppointments = appointments.filter(apt => apt.status === 'CONFIRMED')
  const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED')
  const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED')

  const handleConfirm = async (appointment: Appointment) => {
    setLoading(appointment.id)
    try {
      await onConfirm(appointment.id)
      showToast({
        type: 'success',
        title: 'Reunião Confirmada!',
        message: `${appointment.title} confirmada para ${formatDateTime(appointment.startTime)}`,
        duration: 5000
      })
      onUpdate?.()
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao Confirmar',
        message: 'Não foi possível confirmar a reunião. Tente novamente.',
        duration: 8000
      })
    } finally {
      setLoading(null)
    }
  }

  const handleCancel = async (appointment: Appointment) => {
    setLoading(appointment.id)
    try {
      await onCancel(appointment.id)
      showToast({
        type: 'warning',
        title: 'Reunião Cancelada',
        message: `${appointment.title} foi cancelada`,
        duration: 5000
      })
      onUpdate?.()
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao Cancelar',
        message: 'Não foi possível cancelar a reunião. Tente novamente.',
        duration: 8000
      })
    } finally {
      setLoading(null)
    }
  }

  const handleReactivate = async (appointment: Appointment) => {
    if (!onReactivate) return
    
    setLoading(appointment.id)
    try {
      await onReactivate(appointment.id)
      showToast({
        type: 'success',
        title: 'Reunião Reativada!',
        message: `${appointment.title} foi reativada com sucesso`,
        duration: 5000
      })
      onUpdate?.()
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao Reativar',
        message: 'Não foi possível reativar a reunião. Tente novamente.',
        duration: 8000
      })
    } finally {
      setLoading(null)
    }
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma reunião encontrada</p>
            <p className="text-sm text-muted-foreground">Quando houver solicitações, elas aparecerão aqui</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reuniões Pendentes */}
      {pendingAppointments.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="h-5 w-5" />
              Aguardando Confirmação
              <Badge variant="outline" className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-300">
                {pendingAppointments.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingAppointments.map((appointment) => (
              <Card key={appointment.id} className="bg-white border-yellow-200">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{appointment.title}</h4>
                        <Badge className={statusColors[appointment.status]}>
                          {statusLabels[appointment.status]}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDateTime(appointment.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{typeLabels[appointment.type]}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appointment.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.clientEmail}</span>
                          </div>
                          {appointment.clientPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{appointment.clientPhone}</span>
                            </div>
                          )}
                          {appointment.clientCompany && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span>{appointment.clientCompany}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {appointment.description && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{appointment.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    {showDetails && (
                      <Button
                        variant="outline"
                        onClick={() => showDetails(appointment)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="outline"
                        onClick={() => onEdit(appointment.id)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                    )}
                    <Button
                      onClick={() => handleConfirm(appointment)}
                      disabled={loading === appointment.id}
                      className="flex-1 gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {loading === appointment.id ? 'Confirmando...' : 'Confirmar Reunião'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancel(appointment)}
                      disabled={loading === appointment.id}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reuniões Confirmadas */}
      {confirmedAppointments.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              Reuniões Confirmadas
              <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-300">
                {confirmedAppointments.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {confirmedAppointments.map((appointment) => (
              <Card key={appointment.id} className="bg-white border-green-200">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold">{appointment.title}</h5>
                        <Badge className={statusColors[appointment.status]} >
                          {statusLabels[appointment.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDateTime(appointment.startTime)}</span>
                        <span>{appointment.clientName}</span>
                        {appointment.clientCompany && <span>{appointment.clientCompany}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {showDetails && (
                        <Button
                          variant="outline"
                          onClick={() => showDetails(appointment)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Detalhes
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="outline"
                          onClick={() => onEdit(appointment.id)}
                          className="gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleCancel(appointment)}
                        disabled={loading === appointment.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reuniões Canceladas */}
      {cancelledAppointments.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <XCircle className="h-5 w-5" />
              Reuniões Canceladas
              <Badge variant="outline" className="ml-auto bg-red-100 text-red-800 border-red-300">
                {cancelledAppointments.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cancelledAppointments.map((appointment) => (
              <Card key={appointment.id} className="bg-white border-red-200">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold">{appointment.title}</h5>
                        <Badge className={statusColors[appointment.status]} >
                          {statusLabels[appointment.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDateTime(appointment.startTime)}</span>
                        <span>{appointment.clientName}</span>
                        {appointment.clientCompany && <span>{appointment.clientCompany}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {showDetails && (
                        <Button
                          variant="outline"
                          onClick={() => showDetails(appointment)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Detalhes
                        </Button>
                      )}
                      {onReactivate && (
                        <Button
                          variant="outline"
                          onClick={() => handleReactivate(appointment)}
                          disabled={loading === appointment.id}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {loading === appointment.id ? 'Reativando...' : 'Reativar'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reuniões Completadas */}
      {completedAppointments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <CheckCircle className="h-5 w-5" />
              Reuniões Completadas
              <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-800 border-blue-300">
                {completedAppointments.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedAppointments.map((appointment) => (
              <Card key={appointment.id} className="bg-white border-blue-200">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold">{appointment.title}</h5>
                        <Badge className={statusColors[appointment.status]} >
                          {statusLabels[appointment.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDateTime(appointment.startTime)}</span>
                        <span>{appointment.clientName}</span>
                        {appointment.clientCompany && <span>{appointment.clientCompany}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {showDetails && (
                        <Button
                          variant="outline"
                          onClick={() => showDetails(appointment)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Detalhes
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Toast notifications */}
      {Toast}
    </div>
  )
}
