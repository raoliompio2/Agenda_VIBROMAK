'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, User, Building, Phone, Mail } from 'lucide-react'
import { formatDateTime, formatTime } from '@/lib/utils'

interface AppointmentCardProps {
  appointment: {
    id: string
    title: string
    description?: string
    startTime: Date
    endTime: Date
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
    type: 'MEETING' | 'CALL' | 'PRESENTATION' | 'OTHER'
    location?: string
    clientName: string
    clientEmail: string
    clientPhone?: string
    clientCompany?: string
  }
  showActions?: boolean
  onConfirm?: (id: string) => void
  onCancel?: (id: string) => void
  onReschedule?: (id: string) => void
  variant?: 'default' | 'compact' | 'public'
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
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
  OTHER: 'Outro',
}

export function AppointmentCard({
  appointment,
  showActions = false,
  onConfirm,
  onCancel,
  onReschedule,
  variant = 'default'
}: AppointmentCardProps) {
  const isPublicView = variant === 'public'
  const isCompact = variant === 'compact'

  return (
    <Card className={`
      ${appointment.status === 'CANCELLED' ? 'opacity-60' : ''}
      ${isCompact ? 'border-l-4' : ''}
      ${isCompact && appointment.status === 'CONFIRMED' ? 'border-l-green-500' : ''}
      ${isCompact && appointment.status === 'PENDING' ? 'border-l-yellow-500' : ''}
    `}>
      <CardHeader className={isCompact ? 'pb-2' : 'pb-4'}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`font-semibold ${isCompact ? 'text-base' : 'text-lg'} mb-1`}>
              {appointment.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDateTime(appointment.startTime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline"
              className={statusColors[appointment.status]}
            >
              {statusLabels[appointment.status]}
            </Badge>
            {!isPublicView && (
              <Badge variant="secondary">
                {typeLabels[appointment.type]}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={isCompact ? 'pt-0' : ''}>
        {appointment.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {appointment.description}
          </p>
        )}

        {appointment.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span>{appointment.location}</span>
          </div>
        )}

        {!isPublicView && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.clientName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{appointment.clientEmail}</span>
            </div>
            
            {appointment.clientPhone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{appointment.clientPhone}</span>
              </div>
            )}
            
            {appointment.clientCompany && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{appointment.clientCompany}</span>
              </div>
            )}
          </div>
        )}

        {showActions && appointment.status === 'PENDING' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              type="button"
              size="sm" 
              onClick={() => onConfirm?.(appointment.id)}
              className="flex-1"
            >
              Confirmar
            </Button>
            <Button 
              type="button"
              size="sm" 
              variant="outline"
              onClick={() => onReschedule?.(appointment.id)}
            >
              Reagendar
            </Button>
            <Button 
              type="button"
              size="sm" 
              variant="destructive"
              onClick={() => onCancel?.(appointment.id)}
            >
              Cancelar
            </Button>
          </div>
        )}

        {showActions && appointment.status === 'CONFIRMED' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              type="button"
              size="sm" 
              variant="outline"
              onClick={() => onReschedule?.(appointment.id)}
              className="flex-1"
            >
              Reagendar
            </Button>
            <Button 
              type="button"
              size="sm" 
              variant="destructive"
              onClick={() => onCancel?.(appointment.id)}
            >
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
