'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { generateTimeSlots, formatDate } from '@/lib/utils'

interface TimeSlot {
  time: string
  available: boolean
  dateTime: Date
}

interface TimeSlotPickerProps {
  selectedDate: Date
  selectedTime?: Date
  onTimeSelect: (time: Date) => void
  workingHoursStart?: string
  workingHoursEnd?: string
  meetingDuration?: number
  bufferTime?: number
  existingAppointments?: Array<{ startTime: Date; endTime: Date }>
  disabled?: boolean
}

export function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onTimeSelect,
  workingHoursStart = '09:00',
  workingHoursEnd = '18:00',
  meetingDuration = 60,
  bufferTime = 15,
  existingAppointments = [],
  disabled = false
}: TimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

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

  const isSelected = (dateTime: Date) => {
    return selectedTime?.getTime() === dateTime.getTime()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Horários Disponíveis - {formatDate(selectedDate)}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Duração: {meetingDuration} min ({Math.floor(meetingDuration / 60)}h{meetingDuration % 60 > 0 ? ` ${meetingDuration % 60}min` : ''})
        </p>
      </CardHeader>
      <CardContent>
        {timeSlots.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">
              {meetingDuration >= 240 ? 
                '⏰ Nenhum horário disponível para reunião longa nesta data' :
                'Nenhum horário disponível para esta data'
              }
            </p>
            {meetingDuration >= 240 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded p-2 mt-2 inline-block">
                💡 Sugestão: Considere dividir em reuniões menores ou escolher outra data
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {timeSlots.map((slot, index) => {
              const isSlotSelected = isSelected(slot.dateTime)
              
              return (
                <Button
                  key={index}
                  type="button"
                  variant={isSlotSelected ? "default" : slot.available ? "outline" : "secondary"}
                  size="sm"
                  disabled={!slot.available || disabled}
                  onClick={() => slot.available && onTimeSelect(slot.dateTime)}
                  className={`
                    relative
                    ${!slot.available 
                      ? 'bg-red-50 border-red-200 text-red-700 opacity-75 cursor-not-allowed hover:bg-red-50' 
                      : ''
                    }
                    ${isSlotSelected ? 'ring-2 ring-primary' : ''}
                  `}
                  title={!slot.available 
                    ? `Horário ocupado - ${slot.time}` 
                    : `Disponível - ${slot.time}`
                  }
                >
                  <div className="flex flex-col items-center">
                    <span className={`text-sm ${!slot.available ? 'line-through' : ''}`}>
                      {slot.time}
                    </span>
                    {!slot.available && (
                      <span className="text-xs text-red-600">Ocupado</span>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        )}
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span>Selecionado</span>
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
          <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
            💡 <strong>Dica:</strong> Horários ocupados aparecem riscados e em vermelho. 
            Passe o mouse sobre um horário para ver se está disponível ou ocupado.
          </div>
          {meetingDuration >= 120 && (
            <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">
              ℹ️ <strong>Reunião longa:</strong> Os horários mostram quando sua reunião pode iniciar. 
              Ela durará {Math.floor(meetingDuration / 60)}h{meetingDuration % 60 > 0 ? ` ${meetingDuration % 60}min` : ''} após o horário selecionado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
