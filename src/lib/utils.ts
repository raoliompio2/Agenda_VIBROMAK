import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

export function isTimeSlotAvailable(
  startTime: Date,
  endTime: Date,
  existingAppointments: Array<{ startTime: Date; endTime: Date }>
): boolean {
  return !existingAppointments.some(appointment => 
    (startTime >= appointment.startTime && startTime < appointment.endTime) ||
    (endTime > appointment.startTime && endTime <= appointment.endTime) ||
    (startTime <= appointment.startTime && endTime >= appointment.endTime)
  )
}

export function generateTimeSlots(
  date: Date,
  workingHoursStart: string,
  workingHoursEnd: string,
  meetingDuration: number,
  bufferTime: number,
  existingAppointments: Array<{ startTime: Date; endTime: Date }> = []
): Array<{ time: string; available: boolean; dateTime: Date }> {
  const slots: Array<{ time: string; available: boolean; dateTime: Date }> = []
  
  const [startHour, startMinute] = workingHoursStart.split(':').map(Number)
  const [endHour, endMinute] = workingHoursEnd.split(':').map(Number)
  
  const startDateTime = new Date(date)
  startDateTime.setHours(startHour, startMinute, 0, 0)
  
  const endDateTime = new Date(date)
  endDateTime.setHours(endHour, endMinute, 0, 0)
  
  let currentTime = new Date(startDateTime)
  
  while (currentTime < endDateTime) {
    const slotEndTime = addMinutes(currentTime, meetingDuration)
    
    if (slotEndTime <= endDateTime) {
      const available = isTimeSlotAvailable(
        currentTime,
        slotEndTime,
        existingAppointments
      )
      
      slots.push({
        time: formatTime(currentTime),
        available,
        dateTime: new Date(currentTime)
      })
    }
    
    currentTime = addMinutes(currentTime, meetingDuration + bufferTime)
  }
  
  return slots
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutos`
  } else if (minutes === 60) {
    return '1 hora'
  } else if (minutes < 120) {
    const extraMinutes = minutes - 60
    return `1h ${extraMinutes}min`
  } else if (minutes % 60 === 0) {
    const hours = minutes / 60
    return `${hours} hora${hours > 1 ? 's' : ''}`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }
}

export function formatTimeRange(startTime: Date, endTime: Date): string {
  const start = formatTime(startTime)
  const end = formatTime(endTime)
  return `${start} às ${end}`
}
