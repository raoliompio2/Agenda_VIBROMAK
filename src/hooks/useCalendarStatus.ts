import { useState, useEffect } from 'react'

interface DayStatus {
  date: string
  isWorkingDay: boolean
  occupationRate: number
  status: 'available' | 'partial' | 'busy' | 'full' | 'pending' | 'mixed' | 'non_working'
  totalSlots: number
  occupiedSlots: number
  availableSlots: number
  hasPending: boolean
  hasConfirmed: boolean
}

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
    status: string
    clientName: string
  }>
}

export function useCalendarStatus(appointmentsStatus: AppointmentStatus[], settings: any) {
  const [dayStatuses, setDayStatuses] = useState<Map<string, DayStatus>>(new Map())

  useEffect(() => {
    if (!settings || !appointmentsStatus.length) return

    const calculateDayStatus = async (status: AppointmentStatus): Promise<DayStatus> => {
      const date = new Date(status.date)
      const dayOfWeek = date.getDay()
      const workingDays = settings.workingDays?.split(',').map(Number) || [1, 2, 3, 4, 5]

      if (!workingDays.includes(dayOfWeek)) {
        return {
          date: status.date,
          isWorkingDay: false,
          occupationRate: 0,
          status: 'non_working',
          totalSlots: 0,
          occupiedSlots: status.total,
          availableSlots: 0,
          hasPending: status.hasPending,
          hasConfirmed: status.hasConfirmed
        }
      }

      // Calcular slots totais disponíveis no dia
      const workingHoursStart = settings?.workingHoursStart || '09:00'
      const workingHoursEnd = settings?.workingHoursEnd || '18:00'
      const meetingDuration = settings?.meetingDuration || 60
      const bufferTime = settings?.bufferTime || 15

      console.log('🔧 Debug Calendar Status:', {
        date: status.date,
        settings,
        workingHoursStart,
        workingHoursEnd,
        meetingDuration,
        bufferTime
      })

      const [startHour, startMinute] = workingHoursStart.split(':').map(Number)
      const [endHour, endMinute] = workingHoursEnd.split(':').map(Number)
      
      const startTime = startHour * 60 + startMinute // em minutos
      const endTime = endHour * 60 + endMinute // em minutos
      const slotDuration = meetingDuration + bufferTime

      const totalMinutes = endTime - startTime
      const totalSlots = Math.floor(totalMinutes / slotDuration)

      console.log('📊 Slots calculation:', {
        startTime, endTime, totalMinutes, slotDuration, totalSlots
      })

      const occupiedSlots = status.total
      const availableSlots = Math.max(0, totalSlots - occupiedSlots)
      const occupationRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0

      // Determinar status baseado na ocupação real
      let dayStatus: DayStatus['status'] = 'available'
      
      if (occupationRate >= 100) {
        dayStatus = 'full' // Vermelho - 100% ocupado
      } else if (occupationRate >= 75) {
        dayStatus = 'busy' // Laranja - muito ocupado (75%+)
      } else if (occupationRate > 0) {
        if (status.hasConfirmed && status.hasPending) {
          dayStatus = 'mixed' // Laranja suave - misto
        } else if (status.hasConfirmed) {
          dayStatus = 'partial' // Verde com borda - parcialmente ocupado
        } else if (status.hasPending) {
          dayStatus = 'pending' // Amarelo - só pendentes
        }
      } else {
        dayStatus = 'available' // Verde - disponível
      }

      return {
        date: status.date,
        isWorkingDay: true,
        occupationRate: Math.round(occupationRate),
        status: dayStatus,
        totalSlots,
        occupiedSlots,
        availableSlots,
        hasPending: status.hasPending,
        hasConfirmed: status.hasConfirmed
      }
    }

    const updateStatuses = async () => {
      const newStatuses = new Map<string, DayStatus>()
      
      for (const status of appointmentsStatus) {
        const dayStatus = await calculateDayStatus(status)
        newStatuses.set(status.date, dayStatus)
      }
      
      setDayStatuses(newStatuses)
    }

    updateStatuses()
  }, [appointmentsStatus, settings])

  const getDayStatus = (date: Date): DayStatus | null => {
    const dateStr = date.toISOString().split('T')[0]
    return dayStatuses.get(dateStr) || null
  }

  const getDateColorClass = (date: Date, isSelected: boolean, isToday: boolean): string => {
    const dayStatus = getDayStatus(date)
    
    // Estado selecionado
    if (isSelected) {
      return 'bg-primary text-primary-foreground hover:bg-primary/90'
    }
    
    // Se tem status calculado
    if (dayStatus) {
      switch (dayStatus.status) {
        case 'full':
          // 100% ocupado = vermelho forte
          return 'bg-red-200 text-red-900 border border-red-300 hover:bg-red-250'
        case 'busy':
          // 75%+ ocupado = laranja
          return 'bg-orange-200 text-orange-900 border border-orange-300 hover:bg-orange-250'
        case 'mixed':
          // Misto: confirmado + pendente = laranja suave
          return 'bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-150'
        case 'partial':
          // Parcialmente ocupado = verde com borda azul
          return 'bg-green-50 text-green-800 border border-blue-300 hover:bg-green-100'
        case 'pending':
          // Só pendentes = amarelo
          return 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-150'
        case 'non_working':
          // Não é dia útil = cinza
          return 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-50'
        case 'available':
        default:
          // Disponível = verde suave
          return 'bg-green-50 text-green-900 border border-green-100 hover:bg-green-100'
      }
    }
    
    // Verificar se é dia útil (fallback)
    if (settings) {
      const dayOfWeek = date.getDay()
      const workingDays = settings.workingDays?.split(',').map(Number) || [1, 2, 3, 4, 5]
      
      if (workingDays.includes(dayOfWeek)) {
        // Dia útil disponível
        return 'bg-green-50 text-green-900 border border-green-100 hover:bg-green-100'
      } else {
        // Não é dia útil
        return 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-50'
      }
    }
    
    // Data hoje (fallback)
    if (isToday) {
      return 'border-2 border-primary bg-background hover:bg-muted'
    }
    
    // Padrão
    return 'bg-background hover:bg-muted'
  }

  return { getDayStatus, getDateColorClass }
}
