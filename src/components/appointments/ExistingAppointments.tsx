'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Building, AlertCircle } from 'lucide-react'
import { formatTime, formatTimeRange } from '@/lib/utils'

interface ExistingAppointment {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  type?: 'MEETING' | 'CALL' | 'PRESENTATION' | 'PARTICULAR' | 'VIAGEM' | 'OTHER'
  clientName: string
  clientEmail?: string
  clientCompany?: string
}

interface ExistingAppointmentsProps {
  appointments: ExistingAppointment[]
  selectedDate: Date
  showClientInfo?: boolean
  variant?: 'default' | 'compact'
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200'
}

const statusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado'
}

const typeIcons = {
  MEETING: '🤝',
  CALL: '📞',
  PRESENTATION: '📊',
  PARTICULAR: '🔒',
  VIAGEM: '✈️',
  OTHER: '📝'
}

export function ExistingAppointments({
  appointments,
  selectedDate,
  showClientInfo = false,
  variant = 'default'
}: ExistingAppointmentsProps) {
  if (appointments.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-green-900 font-medium">✅ Nenhum agendamento nesta data</p>
            <p className="text-sm text-green-700">
              A agenda está livre para {selectedDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long' 
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isCompact = variant === 'compact'

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className={isCompact ? 'pb-3' : 'pb-4'}>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <AlertCircle className="h-5 w-5" />
          ⚠️ Horários já Ocupados - {selectedDate.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long' 
          })}
          <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-800 border-amber-300">
            {appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        {!isCompact && (
          <p className="text-sm text-amber-700">
            Os horários abaixo já estão ocupados e não estarão disponíveis para novo agendamento:
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
            .map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200 shadow-sm"
            >
              {/* Ícone do tipo */}
              <div className="flex-shrink-0 mt-1">
                <span className="text-lg">
                  {appointment.type ? typeIcons[appointment.type] : '📅'}
                </span>
              </div>
              
              {/* Informações principais */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                      {appointment.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          {formatTimeRange(appointment.startTime, appointment.endTime)}
                        </span>
                      </div>
                      {appointment.clientName && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{appointment.clientName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge
                    variant="outline"
                    className={`${statusColors[appointment.status]} text-xs ml-2`}
                  >
                    {statusLabels[appointment.status]}
                  </Badge>
                </div>

                {/* Informações adicionais */}
                {showClientInfo && appointment.clientCompany && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Building className="h-3 w-3" />
                    <span>{appointment.clientCompany}</span>
                  </div>
                )}

                {appointment.description && !isCompact && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {appointment.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {!isCompact && (
          <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800">
              💡 <strong>Dica:</strong> Escolha um horário que não conflite com os agendamentos acima. 
              O sistema só permitirá selecionar horários livres.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

