'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VisualCalendar } from '@/components/calendar/VisualCalendar'
import { FlexibleTimeSlots } from './FlexibleTimeSlots-clean'
import { Clock, Calendar, Info } from 'lucide-react'
import Link from 'next/link'

interface AppointmentStatus {
  date: string
  hasPending: boolean
  hasConfirmed: boolean
  total: number
  details: Array<{
    id: string
    title: string
    startTime: Date
    endTime: Date
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
    clientName: string
  }>
}

interface ModernSchedulerProps {
  workingHoursStart: string
  workingHoursEnd: string
  workingDays: number[]
  existingAppointments: Array<{ startTime: Date; endTime: Date; status: 'PENDING' | 'CONFIRMED' }>
  appointmentsStatus: AppointmentStatus[]
  settings?: any
  onScheduleSelect?: (startTime: Date, endTime: Date, duration: number) => void
  showTitle?: boolean
  variant?: 'full' | 'compact'
}

export function ModernScheduler({
  workingHoursStart,
  workingHoursEnd,
  workingDays,
  existingAppointments,
  appointmentsStatus,
  settings,
  onScheduleSelect,
  showTitle = true,
  variant = 'full'
}: ModernSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTimeSelect = (startTime: Date, endTime: Date, duration: number) => {
    if (onScheduleSelect) {
      onScheduleSelect(startTime, endTime, duration)
    } else {
      // Fallback: navegar para página de agendamento
      const params = new URLSearchParams({
        date: startTime.toISOString().split('T')[0],
        time: startTime.toISOString(),
        duration: duration.toString()
      })
      window.location.href = `/?${params.toString()}`
    }
  }

  const isCompact = variant === 'compact'

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Agendar Reunião</h2>
        </div>
      )}

      <div className={`grid ${isCompact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
        {/* Calendário Visual */}
        <div>
          <VisualCalendar
            selectedDate={selectedDate || undefined}
            onDateSelect={handleDateSelect}
            appointmentsStatus={appointmentsStatus}
            settings={settings}
            workingDays={workingDays}
            showLegend={!isCompact}
          />
        </div>

        {/* Slots de Horário Flexíveis */}
        <div>
          {selectedDate ? (
            <FlexibleTimeSlots
              selectedDate={selectedDate}
              workingHoursStart={workingHoursStart}
              workingHoursEnd={workingHoursEnd}
              existingAppointments={existingAppointments}
              onTimeSelect={handleTimeSelect}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Selecione uma data no calendário</p>
                  <p className="text-sm">Os horários de 15 em 15 minutos aparecerão aqui</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
