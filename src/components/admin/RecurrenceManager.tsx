'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  AlertCircle, 
  Calendar, 
  Repeat, 
  Trash2, 
  Edit, 
  X,
  CheckCircle,
  Clock
} from 'lucide-react'

interface RecurringAppointment {
  id: string
  title: string
  startTime: Date
  endTime: Date
  recurringGroupId: string
  recurrenceRule: any
  isRecurrenceException: boolean
  status: string
}

interface RecurrenceManagerProps {
  appointment: RecurringAppointment
  allInSeries?: RecurringAppointment[]
  onCancelSingle?: (appointmentId: string) => Promise<void>
  onCancelSeries?: (groupId: string) => Promise<void>
  onCancelFuture?: (groupId: string, fromDate: Date) => Promise<void>
  onEdit?: (appointmentId: string) => void
  disabled?: boolean
}

export function RecurrenceManager({
  appointment,
  allInSeries = [],
  onCancelSingle,
  onCancelSeries,
  onCancelFuture,
  onEdit,
  disabled = false
}: RecurrenceManagerProps) {
  const [showCancelOptions, setShowCancelOptions] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCancelSingle = async () => {
    if (!onCancelSingle) return
    
    setIsProcessing(true)
    try {
      await onCancelSingle(appointment.id)
      setShowCancelOptions(false)
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelSeries = async () => {
    if (!onCancelSeries || !appointment.recurringGroupId) return
    
    const confirmed = window.confirm(
      'Tem certeza que deseja cancelar TODOS os agendamentos desta série recorrente?'
    )
    
    if (!confirmed) return

    setIsProcessing(true)
    try {
      await onCancelSeries(appointment.recurringGroupId)
      setShowCancelOptions(false)
    } catch (error) {
      console.error('Erro ao cancelar série:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelFuture = async () => {
    if (!onCancelFuture || !appointment.recurringGroupId) return
    
    const confirmed = window.confirm(
      'Tem certeza que deseja cancelar este e todos os agendamentos futuros desta série?'
    )
    
    if (!confirmed) return

    setIsProcessing(true)
    try {
      await onCancelFuture(appointment.recurringGroupId, appointment.startTime)
      setShowCancelOptions(false)
    } catch (error) {
      console.error('Erro ao cancelar agendamentos futuros:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const futureAppointments = allInSeries.filter(
    apt => new Date(apt.startTime) >= appointment.startTime && apt.id !== appointment.id
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Repeat className="h-5 w-5 text-blue-600" />
          Agendamento Recorrente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da Série */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Série:</span>
            <span className="text-blue-900">{allInSeries.length} agendamentos</span>
          </div>
          
          {appointment.isRecurrenceException && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              <AlertCircle className="h-4 w-4" />
              <span>Este agendamento foi modificado individualmente</span>
            </div>
          )}
        </div>

        {/* Ações */}
        {!showCancelOptions ? (
          <div className="grid grid-cols-2 gap-2">
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => onEdit(appointment.id)}
                disabled={disabled}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowCancelOptions(true)}
              disabled={disabled}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Opções de Cancelamento</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCancelOptions(false)}
                disabled={isProcessing}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {/* Cancelar apenas este */}
              {onCancelSingle && (
                <Button
                  variant="outline"
                  onClick={handleCancelSingle}
                  disabled={disabled || isProcessing}
                  className="w-full justify-start gap-2 text-left h-auto py-3"
                >
                  <div className="flex flex-col items-start flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Apenas este agendamento
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {appointment.startTime.toLocaleDateString('pt-BR')} às{' '}
                      {appointment.startTime.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </Button>
              )}

              {/* Cancelar este e futuros */}
              {onCancelFuture && futureAppointments.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleCancelFuture}
                  disabled={disabled || isProcessing}
                  className="w-full justify-start gap-2 text-left h-auto py-3"
                >
                  <div className="flex flex-col items-start flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4" />
                      Este e todos os futuros
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {futureAppointments.length + 1} agendamentos serão cancelados
                    </div>
                  </div>
                </Button>
              )}

              {/* Cancelar toda a série */}
              {onCancelSeries && (
                <Button
                  variant="outline"
                  onClick={handleCancelSeries}
                  disabled={disabled || isProcessing}
                  className="w-full justify-start gap-2 text-left h-auto py-3 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <div className="flex flex-col items-start flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Trash2 className="h-4 w-4" />
                      Toda a série recorrente
                    </div>
                    <div className="text-xs mt-1">
                      Todos os {allInSeries.length} agendamentos serão cancelados
                    </div>
                  </div>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Lista de Próximos Agendamentos */}
        {futureAppointments.length > 0 && !showCancelOptions && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Próximos agendamentos:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {futureAppointments.slice(0, 5).map(apt => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between text-xs bg-gray-50 rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <span>
                      {new Date(apt.startTime).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(apt.startTime).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {apt.status === 'CONFIRMED' ? 'Confirmado' :
                     apt.status === 'PENDING' ? 'Pendente' : apt.status}
                  </span>
                </div>
              ))}
              {futureAppointments.length > 5 && (
                <div className="text-xs text-muted-foreground text-center">
                  E mais {futureAppointments.length - 5} agendamentos...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

