'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarPickerProps {
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  workingDays?: number[] // 0=domingo, 1=segunda, etc.
  disabled?: boolean
}

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  minDate = new Date(),
  maxDate,
  workingDays = [1, 2, 3, 4, 5], // segunda a sexta por padrão
  disabled = false
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Dias vazios no início do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false
    
    const dayOfWeek = date.getDay()
    const isWorkingDay = workingDays.includes(dayOfWeek)
    const isAfterMinDate = date >= minDate
    const isBeforeMaxDate = !maxDate || date <= maxDate
    
    return isWorkingDay && isAfterMinDate && isBeforeMaxDate
  }

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
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
          {days.map((date, index) => (
            <Button
              key={index}
              type="button"
              variant={isSelected(date) ? "default" : "ghost"}
              size="sm"
              disabled={!isDateSelectable(date) || disabled}
              onClick={() => date && onDateSelect(date)}
              className={`
                h-10 w-10 p-0
                ${!date ? 'invisible' : ''}
                ${isSelected(date) ? 'bg-primary text-primary-foreground' : ''}
                ${date && !isDateSelectable(date) ? 'opacity-50 cursor-not-allowed' : ''}
                ${date && date.toDateString() === today.toDateString() ? 'border border-primary' : ''}
              `}
            >
              {date?.getDate()}
            </Button>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Apenas dias úteis estão disponíveis</p>
          <p>• Data atual tem borda destacada</p>
        </div>
      </CardContent>
    </Card>
  )
}
