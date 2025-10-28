'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, Plus, ArrowRight, Info, Lightbulb, CheckCircle } from 'lucide-react'
import { formatTime, formatDuration } from '@/lib/utils'

interface TimeSlot {
  time: string
  dateTime: Date
  available: boolean
  index: number
}

interface FlexibleTimeSlotsProps {
  selectedDate: Date
  workingHoursStart: string
  workingHoursEnd: string
  existingAppointments: Array<{ startTime: Date; endTime: Date }>
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
        const slotEndTime = new Date(currentTime.getTime() + 15 * 60000) // 15 minutos
        
        // Verificar se o slot está ocupado
        const isOccupied = existingAppointments.some(appointment => 
          (currentTime >= appointment.startTime && currentTime < appointment.endTime) ||
          (slotEndTime > appointment.startTime && slotEndTime <= appointment.endTime) ||
          (currentTime <= appointment.startTime && slotEndTime >= appointment.endTime)
        )
        
        slots.push({
          time: formatTime(currentTime),
          dateTime: new Date(currentTime),
          available: !isOccupied,
          index
        })
        
        currentTime = new Date(currentTime.getTime() + 15 * 60000) // Próximo slot de 15 min
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

  const handleMouseEnter = (index: number) => {
    if (selectedSlots.length > 0) {
      setHoveredSlot(index)
    }
  }

  const handleMouseLeave = () => {
    setHoveredSlot(null)
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
  const previewDuration = previewSlots.length * 15

  const handleConfirmSelection = () => {
    if (selectedSlots.length === 0) return
    
    const sortedSlots = [...selectedSlots].sort((a, b) => a - b)
    const startTime = timeSlots[sortedSlots[0]].dateTime
    const endTime = new Date(timeSlots[sortedSlots[sortedSlots.length - 1]].dateTime.getTime() + 15 * 60000)
    const duration = selectedSlots.length * 15
    
    onTimeSelect?.(startTime, endTime, duration)
  }

  const availableSlots = timeSlots.filter(slot => slot.available)

  if (timeSlots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Carregando horários...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (availableSlots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium mb-1">Nenhum horário disponível</p>
            <p className="text-sm">
              Todos os slots de 15 minutos estão ocupados para {selectedDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: '2-digit', 
                month: '2-digit' 
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 mb-1">
                <Clock className="h-5 w-5" />
                Horários Disponíveis - {selectedDate.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: '2-digit', 
                  month: '2-digit' 
                })}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedSlots.length === 0 ? (
                  '1️⃣ Clique no horário inicial'
                ) : selectedSlots.length === 1 ? (
                  '2️⃣ Agora clique no horário final'
                ) : (
                  `✅ ${selectedDuration} min selecionados! Confirme ou escolha outro`
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {availableSlots.length} slots livres
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
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
            {timeSlots.map((slot) => {
              const isSelected = selectedSlots.includes(slot.index)
              const isPreview = previewSlots.includes(slot.index) && !isSelected
              const isAvailable = slot.available
              
              return (
                <Button
                  key={slot.index}
                  type="button"
                  variant={isSelected ? "default" : isPreview ? "secondary" : isAvailable ? "outline" : "ghost"}
                  size="sm"
                  disabled={!isAvailable || disabled}
                  onClick={() => handleSlotClick(slot.index)}
                  onMouseEnter={() => handleMouseEnter(slot.index)}
                  onMouseLeave={handleMouseLeave}
                  className={`
                    h-12 text-xs transition-all duration-200
                    ${!isAvailable 
                      ? 'bg-red-50 border-red-200 text-red-700 opacity-60 cursor-not-allowed hover:bg-red-50 line-through' 
                      : isSelected
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : isPreview
                          ? 'bg-primary/20 border-primary/40 text-primary'
                          : 'hover:bg-primary/10 hover:border-primary/30'
                    }
                  `}
                  title={
                    !isAvailable 
                      ? `Ocupado - ${slot.time}`
                      : `Disponível - ${slot.time} (15 min)`
                  }
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="font-medium">{slot.time}</span>
                    {!isAvailable && (
                      <span className="text-xs text-red-600">Ocupado</span>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>

          {/* Dicas de uso */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  Como selecionar seu horário:
                </p>
                <ul className="space-y-1 text-xs">
                  <li><strong>1.</strong> Clique no horário de início desejado</li>
                  <li><strong>2.</strong> Clique nos slots seguintes para expandir o tempo</li>
                  <li><strong>3.</strong> Clique novamente nas bordas para diminuir</li>
                  <li><strong>4.</strong> Cada slot = 15 minutos</li>
                </ul>
                <div className="flex items-center gap-4 mt-3 text-xs">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Seleção */}
      {selectedSlots.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-green-900 mb-1 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Horário Selecionado
                </h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {selectedDate.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {(() => {
                      const sortedSlots = [...selectedSlots].sort((a, b) => a - b)
                      const startTime = timeSlots[sortedSlots[0]].dateTime
                      const endTime = new Date(timeSlots[sortedSlots[sortedSlots.length - 1]].dateTime.getTime() + 15 * 60000)
                      return `${formatTime(startTime)} às ${formatTime(endTime)}`
                    })()}
                  </p>
                  <p className="text-xs text-green-700">
                    Duração: {formatDuration(selectedDuration)} ({selectedSlots.length} slots de 15min)
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleConfirmSelection}
                className="gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                Solicitar Agendamento
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview da seleção (quando hovering) */}
      {previewSlots.length > selectedSlots.length && hoveredSlot !== null && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-sm text-blue-800">
                <strong>Preview:</strong> {formatDuration(previewDuration)} 
                <span className="text-xs text-blue-600 ml-2">
                  (Clique para confirmar esta seleção)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

