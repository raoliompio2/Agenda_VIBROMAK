'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { generateTimeSlots, formatDate } from '@/lib/utils'
import { Clock, Lightbulb, Info, AlertCircle, CheckCircle2 } from 'lucide-react'

interface TimeSlot {
  time: string
  available: boolean
  dateTime: Date
}

interface RangeTimeSlotPickerProps {
  selectedDate: Date
  selectedTimeRange?: { start: Date; end: Date }
  onTimeRangeSelect: (start: Date, end: Date) => void
  workingHoursStart?: string
  workingHoursEnd?: string
  meetingDuration?: number
  bufferTime?: number
  existingAppointments?: Array<{ startTime: Date; endTime: Date }>
  disabled?: boolean
}

export function RangeTimeSlotPicker({
  selectedDate,
  selectedTimeRange,
  onTimeRangeSelect,
  workingHoursStart = '09:00',
  workingHoursEnd = '18:00',
  meetingDuration = 60,
  bufferTime = 15,
  existingAppointments = [],
  disabled = false
}: RangeTimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<Date | null>(null)

  useEffect(() => {
    const slots = generateTimeSlots(
      selectedDate,
      workingHoursStart,
      workingHoursEnd,
      meetingDuration,
      bufferTime,
      existingAppointments
    )
    setTimeSlots(slots)
  }, [selectedDate, workingHoursStart, workingHoursEnd, meetingDuration, bufferTime, existingAppointments])

  useEffect(() => {
    if (selectedTimeRange) {
      setRangeStart(selectedTimeRange.start)
    } else {
      setRangeStart(null)
    }
  }, [selectedTimeRange])

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available || disabled) return

    // Se não tem início de range ainda, define o início
    if (!rangeStart) {
      setRangeStart(slot.dateTime)
      return
    }

    // Se já tem início, define o fim e calcula o range
    const start = rangeStart
    const end = slot.dateTime

    // Garante que start < end
    const [finalStart, finalEnd] = start < end ? [start, end] : [end, start]

    // Verifica se todos os slots no range estão disponíveis
    const rangeSlots = timeSlots.filter(s => 
      s.dateTime >= finalStart && s.dateTime <= finalEnd
    )

    const allAvailable = rangeSlots.every(s => s.available)

    if (!allAvailable) {
      // Se algum slot no range não está disponível, mostra erro
      alert('Alguns horários no intervalo selecionado não estão disponíveis. Por favor, selecione outro intervalo.')
      setRangeStart(null)
      return
    }

    // Calcula a duração total em minutos
    const durationMinutes = Math.floor((finalEnd.getTime() - finalStart.getTime()) / (1000 * 60))
    
    // Adiciona a duração do último slot
    const totalDuration = durationMinutes + meetingDuration

    onTimeRangeSelect(finalStart, new Date(finalStart.getTime() + totalDuration * 60 * 1000))
    setRangeStart(null)
  }

  const isInRange = (dateTime: Date): boolean => {
    if (!rangeStart) return false
    
    const compareTime = hoveredSlot || (selectedTimeRange?.end || rangeStart)
    const [start, end] = rangeStart < compareTime ? [rangeStart, compareTime] : [compareTime, rangeStart]
    
    return dateTime >= start && dateTime <= end
  }

  const isRangeEndpoint = (dateTime: Date): boolean => {
    if (!rangeStart) return false
    
    if (hoveredSlot) {
      return dateTime.getTime() === rangeStart.getTime() || dateTime.getTime() === hoveredSlot.getTime()
    }
    
    if (selectedTimeRange) {
      return dateTime.getTime() === selectedTimeRange.start.getTime() || dateTime.getTime() === selectedTimeRange.end.getTime()
    }
    
    return dateTime.getTime() === rangeStart.getTime()
  }

  const clearSelection = () => {
    setRangeStart(null)
    setHoveredSlot(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Seleção de Horários - {formatDate(selectedDate)}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Clique no horário inicial e depois no horário final para selecionar um intervalo
            </p>
          </div>
          {rangeStart && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {timeSlots.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-muted-foreground mb-2">
              Nenhum horário disponível para esta data
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {timeSlots.map((slot, index) => {
                const isSlotInRange = isInRange(slot.dateTime)
                const isEndpoint = isRangeEndpoint(slot.dateTime)
                const isStartPoint = rangeStart && slot.dateTime.getTime() === rangeStart.getTime()
                
                return (
                  <Button
                    key={index}
                    type="button"
                    variant={isSlotInRange ? "default" : slot.available ? "outline" : "secondary"}
                    size="sm"
                    disabled={!slot.available || disabled}
                    onClick={() => handleSlotClick(slot)}
                    onMouseEnter={() => rangeStart && setHoveredSlot(slot.dateTime)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    className={`
                      relative transition-all duration-150
                      ${!slot.available 
                        ? 'bg-red-50 border-red-200 text-red-700 opacity-75 cursor-not-allowed hover:bg-red-50' 
                        : ''
                      }
                      ${isSlotInRange && slot.available
                        ? 'bg-primary/80 text-primary-foreground hover:bg-primary/90' 
                        : ''
                      }
                      ${isEndpoint && slot.available
                        ? 'ring-2 ring-primary ring-offset-2 bg-primary' 
                        : ''
                      }
                      ${isStartPoint && slot.available
                        ? 'ring-2 ring-green-500 ring-offset-2' 
                        : ''
                      }
                    `}
                    title={
                      !slot.available 
                        ? `Horário ocupado - ${slot.time}` 
                        : isStartPoint
                        ? `Início selecionado - ${slot.time}`
                        : `${slot.available ? 'Disponível' : 'Ocupado'} - ${slot.time}`
                    }
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-sm ${!slot.available ? 'line-through' : ''}`}>
                        {slot.time}
                      </span>
                      {!slot.available && (
                        <span className="text-xs text-red-600">Ocupado</span>
                      )}
                      {isStartPoint && slot.available && (
                        <CheckCircle2 className="h-3 w-3 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>

            {rangeStart && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2 text-sm text-blue-900">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Horário inicial selecionado: {rangeStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs mt-1">Agora clique no horário final para completar a seleção do intervalo</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary rounded ring-2 ring-primary ring-offset-1"></div>
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary/80 rounded"></div>
              <span>No intervalo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-input rounded bg-white"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
              <span>Ocupado</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2 flex items-start gap-1">
            <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Como usar a seleção de intervalo:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Clique em um horário disponível para definir o início</li>
                <li>Depois clique em outro horário para definir o fim</li>
                <li>Todos os horários entre os dois selecionados serão incluídos</li>
                <li>Passe o mouse sobre os horários para pré-visualizar o intervalo</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

