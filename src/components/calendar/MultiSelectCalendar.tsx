'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, X } from 'lucide-react'

interface SelectedSlot {
  date: Date
  startTime: string
  endTime: string
  dateTime: Date
}

interface MultiSelectCalendarProps {
  onSlotsSelect: (slots: SelectedSlot[]) => void
  workingDays?: number[]
  workingHoursStart?: string
  workingHoursEnd?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  existingAppointments?: Array<{ startTime: Date; endTime: Date }>
  slotDuration?: number // em minutos
}

export function MultiSelectCalendar({
  onSlotsSelect,
  workingDays = [1, 2, 3, 4, 5],
  workingHoursStart = '09:00',
  workingHoursEnd = '18:00',
  minDate = new Date(),
  maxDate,
  disabled = false,
  existingAppointments = [],
  slotDuration = 60
}: MultiSelectCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [hoveredSlot, setHoveredSlot] = useState<SelectedSlot | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  useEffect(() => {
    onSlotsSelect(selectedSlots)
  }, [selectedSlots])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const generateTimeSlots = (date: Date) => {
    const slots: SelectedSlot[] = []
    const [startHour, startMin] = workingHoursStart.split(':').map(Number)
    const [endHour, endMin] = workingHoursEnd.split(':').map(Number)

    const start = new Date(date)
    start.setHours(startHour, startMin, 0, 0)

    const end = new Date(date)
    end.setHours(endHour, endMin, 0, 0)

    let current = new Date(start)

    while (current < end) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60000)
      
      if (slotEnd <= end) {
        const isOccupied = existingAppointments.some(apt => {
          const aptStart = new Date(apt.startTime)
          const aptEnd = new Date(apt.endTime)
          return (current >= aptStart && current < aptEnd) || 
                 (slotEnd > aptStart && slotEnd <= aptEnd) ||
                 (current <= aptStart && slotEnd >= aptEnd)
        })

        if (!isOccupied) {
          slots.push({
            date: new Date(date),
            startTime: current.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            endTime: slotEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            dateTime: new Date(current)
          })
        }
      }

      current = slotEnd
    }

    return slots
  }

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false
    
    const dayOfWeek = date.getDay()
    const isWorkingDay = workingDays.includes(dayOfWeek)
    const isAfterMinDate = date >= minDate
    const isBeforeMaxDate = !maxDate || date <= maxDate
    
    return isWorkingDay && isAfterMinDate && isBeforeMaxDate
  }

  const hasSelectedSlots = (date: Date | null) => {
    if (!date) return false
    return selectedSlots.some(slot => 
      slot.date.toDateString() === date.toDateString()
    )
  }

  const isSlotSelected = (slot: SelectedSlot) => {
    return selectedSlots.some(s => 
      s.dateTime.getTime() === slot.dateTime.getTime()
    )
  }

  const toggleSlot = (slot: SelectedSlot) => {
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.dateTime.getTime() === slot.dateTime.getTime())
      if (exists) {
        return prev.filter(s => s.dateTime.getTime() !== slot.dateTime.getTime())
      } else {
        return [...prev, slot].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      }
    })
  }

  const removeSlot = (slot: SelectedSlot) => {
    setSelectedSlots(prev => 
      prev.filter(s => s.dateTime.getTime() !== slot.dateTime.getTime())
    )
  }

  const clearAllSlots = () => {
    setSelectedSlots([])
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const days = getDaysInMonth(currentMonth)
  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendário */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={previousMonth}
                  disabled={disabled}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  disabled={disabled}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(name => (
                <div key={name} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {name}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                const isSelected = date && selectedDate?.toDateString() === date.toDateString()
                const hasSlotsSelected = hasSelectedSlots(date)
                
                return (
                  <Button
                    key={index}
                    type="button"
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    disabled={!isDateSelectable(date) || disabled}
                    onClick={() => date && setSelectedDate(date)}
                    className={`
                      h-10 w-10 p-0 relative
                      ${!date ? 'invisible' : ''}
                      ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${hasSlotsSelected && !isSelected ? 'bg-blue-100 border-blue-300 border-2' : ''}
                      ${date && !isDateSelectable(date) ? 'opacity-50 cursor-not-allowed' : ''}
                      ${date && date.toDateString() === today.toDateString() ? 'border border-primary' : ''}
                    `}
                  >
                    {date?.getDate()}
                    {hasSlotsSelected && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                    )}
                  </Button>
                )
              })}
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border-blue-300 border-2 rounded" />
                Tem horários selecionados
              </p>
              <p className="flex items-center gap-2">
                <div className="w-3 h-3 border border-primary rounded" />
                Data atual
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Horários Disponíveis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {selectedDate 
                ? `Horários - ${selectedDate.toLocaleDateString('pt-BR')}`
                : 'Selecione uma data'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <>
                {timeSlots.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Nenhum horário disponível para esta data
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                    {timeSlots.map((slot, index) => {
                      const selected = isSlotSelected(slot)
                      const hovered = hoveredSlot?.dateTime.getTime() === slot.dateTime.getTime()
                      
                      return (
                        <Button
                          key={index}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSlot(slot)}
                          onMouseEnter={() => setHoveredSlot(slot)}
                          onMouseLeave={() => setHoveredSlot(null)}
                          disabled={disabled}
                          className={`
                            relative transition-all
                            ${selected ? 'bg-primary text-primary-foreground shadow-md scale-105' : ''}
                            ${hovered && !selected ? 'bg-blue-50 border-blue-300' : ''}
                          `}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-medium">{slot.startTime}</span>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Selecione uma data no calendário para ver os horários disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slots Selecionados */}
      {selectedSlots.length > 0 && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Horários Selecionados ({selectedSlots.length})
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllSlots}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar Tudo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {selectedSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white rounded-lg p-2 border border-blue-200 shadow-sm"
                >
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-gray-900">
                      {slot.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSlot(slot)}
                    disabled={disabled}
                    className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

