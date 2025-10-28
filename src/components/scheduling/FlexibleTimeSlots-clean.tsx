'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Plus, ArrowRight } from 'lucide-react'
import { formatTime, formatDuration } from '@/lib/utils'

interface TimeSlot {
  time: string
  dateTime: Date
  available: boolean
  status?: 'PENDING' | 'CONFIRMED'
  index: number
}

interface FlexibleTimeSlotsProps {
  selectedDate: Date
  workingHoursStart: string
  workingHoursEnd: string
  existingAppointments: Array<{ startTime: Date; endTime: Date; status: 'PENDING' | 'CONFIRMED' }>
  onTimeSelect?: (startTime: Date, endTime: Date, duration: number) => void
  disabled?: boolean
}

export function FlexibleTimeSlots({
  selectedDate,
  workingHoursStart,
  workingHoursEnd,
  existingAppointments,
  onTimeSelect,
  disabled = false
}: FlexibleTimeSlotsProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)

  // Gerar slots de 15 em 15 minutos
  useEffect(() => {
    const generateSlots = () => {
      const slots: TimeSlot[] = []
      const [startHour, startMinute] = workingHoursStart.split(':').map(Number)
      const [endHour, endMinute] = workingHoursEnd.split(':').map(Number)
      
      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)
      
      const endDateTime = new Date(selectedDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)
      
      let currentTime = new Date(startDateTime)
      let index = 0
      
      while (currentTime < endDateTime) {
        const slotEndTime = new Date(currentTime.getTime() + 15 * 60000)
        
        // Encontrar qual agendamento está ocupando este slot
        const occupyingAppointment = existingAppointments.find(appointment => 
          (currentTime >= appointment.startTime && currentTime < appointment.endTime) ||
          (slotEndTime > appointment.startTime && slotEndTime <= appointment.endTime) ||
          (currentTime <= appointment.startTime && slotEndTime >= appointment.endTime)
        )
        
        slots.push({
          time: formatTime(currentTime),
          dateTime: new Date(currentTime),
          available: !occupyingAppointment,
          status: occupyingAppointment?.status,
          index
        })
        
        currentTime = new Date(currentTime.getTime() + 15 * 60000)
        index++
      }
      
      setTimeSlots(slots)
    }
    
    generateSlots()
  }, [selectedDate, workingHoursStart, workingHoursEnd, existingAppointments])

  const handleSlotClick = (clickedIndex: number) => {
    if (!timeSlots[clickedIndex]?.available || disabled) return

    if (selectedSlots.length === 0) {
      // Primeira seleção - define o INÍCIO
      setSelectedSlots([clickedIndex])
    } else if (selectedSlots.length === 1) {
      // Segunda seleção - define o FIM e seleciona TUDO NO MEIO
      const startIndex = selectedSlots[0]
      const endIndex = clickedIndex
      
      const minIndex = Math.min(startIndex, endIndex)
      const maxIndex = Math.max(startIndex, endIndex)
      
      // Verificar se todos os slots no range estão disponíveis
      const allAvailable = timeSlots
        .slice(minIndex, maxIndex + 1)
        .every(slot => slot.available)
      
      if (!allAvailable) {
        alert('Alguns horários no intervalo selecionado não estão disponíveis. Por favor, selecione outro intervalo.')
        setSelectedSlots([])
        return
      }
      
      // Selecionar TODOS os slots entre o início e o fim
      const range = []
      for (let i = minIndex; i <= maxIndex; i++) {
        range.push(i)
      }
      setSelectedSlots(range)
    } else {
      // Já tem uma seleção completa - resetar e começar nova seleção
      setSelectedSlots([clickedIndex])
    }
  }

  const handleConfirmSelection = () => {
    if (selectedSlots.length === 0) return
    
    const sortedSlots = [...selectedSlots].sort((a, b) => a - b)
    const startTime = timeSlots[sortedSlots[0]].dateTime
    const endTime = new Date(timeSlots[sortedSlots[sortedSlots.length - 1]].dateTime.getTime() + 15 * 60000)
    const duration = selectedSlots.length * 15
    
    onTimeSelect?.(startTime, endTime, duration)
  }

  const getPreviewSelection = () => {
    // Se não tem seleção ou não está com mouse em cima, retorna a seleção atual
    if (selectedSlots.length === 0 || hoveredSlot === null) {
      return selectedSlots
    }
    
    // Se já tem seleção completa (range), apenas retorna a seleção
    if (selectedSlots.length > 1) {
      return selectedSlots
    }
    
    // Se tem apenas o primeiro slot selecionado, mostra preview do range
    const startIndex = selectedSlots[0]
    const endIndex = hoveredSlot
    
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    
    // Criar preview de TODOS os slots entre o início e o fim
    const preview = []
    for (let i = minIndex; i <= maxIndex; i++) {
      preview.push(i)
    }
    
    return preview
  }

  const previewSlots = getPreviewSelection()
  const selectedDuration = selectedSlots.length * 15
  const availableSlots = timeSlots.filter(slot => slot.available)

  if (timeSlots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <p className="text-gray-500">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (availableSlots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">
              Sem horários livres
            </p>
            <p className="text-sm text-gray-500">
              Escolha outra data
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg mb-1">Horários Livres</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedSlots.length === 0 ? (
                  '1️⃣ Clique no horário inicial'
                ) : selectedSlots.length === 1 ? (
                  '2️⃣ Agora clique no horário final'
                ) : (
                  `✅ ${selectedDuration} min selecionados!`
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {availableSlots.length} disponíveis
              </Badge>
              {selectedSlots.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedSlots([]); setHoveredSlot(null); }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {timeSlots.map((slot) => {
              const isSelected = selectedSlots.includes(slot.index)
              const isPreview = previewSlots.includes(slot.index) && !isSelected
              const isAvailable = slot.available
              
              // Definir cores baseadas no status
              let slotColorClass = ''
              if (isSelected) {
                slotColorClass = 'bg-primary text-primary-foreground shadow-md'
              } else if (isPreview) {
                slotColorClass = 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm'
              } else if (isAvailable) {
                slotColorClass = 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              } else {
                if (slot.status === 'PENDING') {
                  slotColorClass = 'bg-yellow-50 border-yellow-200 text-yellow-700 opacity-60 cursor-not-allowed hover:bg-yellow-50 line-through'
                } else {
                  slotColorClass = 'bg-red-50 border-red-200 text-red-700 opacity-60 cursor-not-allowed hover:bg-red-50 line-through'
                }
              }
              
              return (
                <Button
                  key={slot.index}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!isAvailable || disabled}
                  onClick={() => handleSlotClick(slot.index)}
                  onMouseEnter={() => isAvailable && setHoveredSlot(slot.index)}
                  onMouseLeave={() => setHoveredSlot(null)}
                  className={`h-12 text-sm transition-all ${slotColorClass}`}
                >
                  {slot.time}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Seleção */}
      {selectedSlots.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-900">
                  {(() => {
                    const sortedSlots = [...selectedSlots].sort((a, b) => a - b)
                    const startTime = timeSlots[sortedSlots[0]].dateTime
                    const endTime = new Date(timeSlots[sortedSlots[sortedSlots.length - 1]].dateTime.getTime() + 15 * 60000)
                    return `${formatTime(startTime)} às ${formatTime(endTime)}`
                  })()}
                </p>
                <p className="text-sm text-green-700">
                  {formatDuration(selectedDuration)}
                </p>
              </div>
              
              <Button 
                onClick={handleConfirmSelection}
                className="gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                Agendar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
