'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Calendar, Plus, ArrowRight } from 'lucide-react'
import { formatTime, generateTimeSlots, formatDuration } from '@/lib/utils'
import Link from 'next/link'

interface TimeSlot {
  time: string
  available: boolean
  dateTime: Date
}

interface AvailableTimeSlotsProps {
  selectedDate: Date
  workingHoursStart: string
  workingHoursEnd: string
  existingAppointments: Array<{ startTime: Date; endTime: Date }>
}

interface SlotSelection {
  startTime: Date
  duration: number
}

export function AvailableTimeSlots({
  selectedDate,
  workingHoursStart,
  workingHoursEnd,
  existingAppointments
}: AvailableTimeSlotsProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(60)

  useEffect(() => {
    // Gerar slots de 30 em 30 minutos
    const slots = generateTimeSlots(
      selectedDate,
      workingHoursStart,
      workingHoursEnd,
      30, // intervalos de 30min
      0,  // sem buffer
      existingAppointments
    )
    setTimeSlots(slots)
  }, [selectedDate, workingHoursStart, workingHoursEnd, existingAppointments])

  const durations = [
    { value: 30, label: '30 min', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 60, label: '1h', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 90, label: '1h 30min', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 120, label: '2h', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 180, label: '3h', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 240, label: '4h', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 480, label: 'Dia todo', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
  ]

  const availableSlots = timeSlots.filter(slot => slot.available)

  const canScheduleAtTime = (startTime: Date, duration: number) => {
    const endTime = new Date(startTime.getTime() + duration * 60000)
    
    // Verificar se não ultrapassa horário de trabalho
    const workingEnd = new Date(selectedDate)
    const [endHour, endMinute] = workingHoursEnd.split(':').map(Number)
    workingEnd.setHours(endHour, endMinute, 0, 0)
    
    if (endTime > workingEnd) return false
    
    // Verificar conflitos com agendamentos existentes
    return !existingAppointments.some(apt => 
      (startTime < apt.endTime) && (endTime > apt.startTime)
    )
  }

  const getAvailableDurations = (startTime: Date) => {
    return durations.filter(d => canScheduleAtTime(startTime, d.value))
  }

  const selectSlot = (slot: TimeSlot, duration: number) => {
    if (canScheduleAtTime(slot.dateTime, duration)) {
      setSelectedSlot({
        startTime: slot.dateTime,
        duration
      })
    }
  }

  const buildScheduleUrl = () => {
    if (!selectedSlot) return '/agendar'
    
    const params = new URLSearchParams({
      date: selectedSlot.startTime.toISOString().split('T')[0],
      time: selectedSlot.startTime.toISOString(),
      duration: selectedSlot.duration.toString()
    })
    
    return `/agendar?${params.toString()}`
  }

  if (availableSlots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Nenhum horário disponível</p>
            <p className="text-sm">Tente selecionar outra data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Seleção de Duração */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-900">⏱️ Duração da Reunião</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {durations.map(duration => (
              <Button
                key={duration.value}
                type="button"
                variant={selectedDuration === duration.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDuration(duration.value)}
                className={selectedDuration === duration.value ? '' : duration.color}
              >
                {duration.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-blue-700 mt-2">
            💡 Selecione a duração desejada e depois escolha um horário abaixo
          </p>
        </CardContent>
      </Card>

      {/* Horários Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários Disponíveis - {selectedDate.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: '2-digit', 
              month: '2-digit' 
            })}
            <Badge variant="outline" className="ml-auto">
              {availableSlots.length} horário{availableSlots.length !== 1 ? 's' : ''} livre{availableSlots.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {availableSlots.map((slot, index) => {
              const availableDurations = getAvailableDurations(slot.dateTime)
              const canSchedule = availableDurations.some(d => d.value === selectedDuration)
              const isSelected = selectedSlot?.startTime.getTime() === slot.dateTime.getTime() && 
                               selectedSlot?.duration === selectedDuration
              
              return (
                <div
                  key={index}
                  className={`
                    border rounded-lg p-3 transition-all cursor-pointer hover:shadow-md
                    ${canSchedule 
                      ? isSelected 
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20' 
                        : 'border-gray-200 bg-white hover:border-primary/50 hover:bg-primary/5'
                      : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                    }
                  `}
                  onClick={() => canSchedule && selectSlot(slot, selectedDuration)}
                >
                  <div className="text-center">
                    <div className={`font-semibold text-sm mb-1 ${isSelected ? 'text-primary-foreground' : 'text-gray-900'}`}>
                      {slot.time}
                    </div>
                    
                    {canSchedule ? (
                      <div className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-gray-600'}`}>
                        até {formatTime(new Date(slot.dateTime.getTime() + selectedDuration * 60000))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">
                        Indisponível
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumo da Seleção */}
          {selectedSlot && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">✅ Horário Selecionado</h4>
                  <p className="text-sm text-green-800">
                    <Clock className="inline h-4 w-4 mr-1" />
                    {formatTime(selectedSlot.startTime)} às {formatTime(new Date(selectedSlot.startTime.getTime() + selectedSlot.duration * 60000))}
                  </p>
                  <p className="text-xs text-green-700">
                    Duração: {formatDuration(selectedSlot.duration)}
                  </p>
                </div>
                
                <Link href={buildScheduleUrl()}>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Solicitar Agendamento
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Dicas */}
          <div className="mt-4 text-xs text-muted-foreground bg-slate-50 rounded p-3">
            <p className="font-medium mb-1">📋 Como usar:</p>
            <ul className="space-y-1">
              <li>1️⃣ Escolha a <strong>duração</strong> desejada acima</li>
              <li>2️⃣ Clique no <strong>horário de início</strong> preferido</li>
              <li>3️⃣ Clique em "<strong>Solicitar Agendamento</strong>" para preencher o formulário</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

