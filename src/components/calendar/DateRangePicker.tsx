'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAlertModal } from '@/components/ui/alert-modal'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react'

interface DateRangePickerProps {
  selectedDates?: Date[]
  onDatesSelect: (dates: Date[]) => void
  workingDays?: number[]
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  showLegend?: boolean
}

export function DateRangePicker({
  selectedDates = [],
  onDatesSelect,
  workingDays = [1, 2, 3, 4, 5],
  minDate = new Date(),
  maxDate,
  disabled = false,
  showLegend = true
}: DateRangePickerProps) {
  // Inicializar com o mês da primeira data selecionada, ou mês atual
  const [currentMonth, setCurrentMonth] = useState(
    selectedDates.length > 0 ? new Date(selectedDates[0]) : new Date()
  )
  const [firstSelectedDate, setFirstSelectedDate] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  
  // Atualizar mês quando selectedDates mudar
  useEffect(() => {
    if (selectedDates.length > 0) {
      setCurrentMonth(new Date(selectedDates[0]))
    }
  }, [selectedDates.length])
  
  // Modal de alerta customizado
  const { showAlert, AlertModal } = useAlertModal()

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

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false
    
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    
    const dayOfWeek = date.getDay()
    const isWorkingDay = workingDays.includes(dayOfWeek)
    const isAfterMinDate = dateOnly >= minDateOnly
    const isBeforeMaxDate = !maxDate || dateOnly <= maxDate
    
    const result = isWorkingDay && isAfterMinDate && isBeforeMaxDate
    
    // Debug apenas quando for chamar de dentro do handleDateClick (e se window estiver disponível)
    if (typeof window !== 'undefined' && (window.location.pathname === '/teste-dias' || window.location.pathname === '/')) {
      console.log('   📅 isDateSelectable para', date.toLocaleDateString('pt-BR'), ':', {
        dayOfWeek,
        workingDays,
        isWorkingDay,
        isAfterMinDate,
        isBeforeMaxDate,
        result
      })
    }
    
    return result
  }

  // Sincronizar estado interno com selectedDates externo
  useEffect(() => {
    if (selectedDates.length === 0) {
      setFirstSelectedDate(null)
    } else if (selectedDates.length === 1) {
      setFirstSelectedDate(selectedDates[0])
    }
  }, [selectedDates])

  const isDateSelected = (date: Date | null) => {
    if (!date) return false
    return selectedDates.some(d => d.toDateString() === date.toDateString())
  }

  // Função para obter preview da seleção (igual ao FlexibleTimeSlots)
  const getPreviewDates = (): Date[] => {
    // Se não tem seleção ou não está com hover, retorna a seleção atual
    if (selectedDates.length === 0 || hoveredDate === null) {
      return selectedDates
    }
    
    // Se já tem seleção completa (mais de 1 dia), apenas retorna a seleção atual
    if (selectedDates.length > 1) {
      return selectedDates
    }
    
    // Se tem apenas o primeiro dia selecionado, mostra preview do range
    const startDate = selectedDates[0]
    const start = startDate < hoveredDate ? startDate : hoveredDate
    const end = startDate < hoveredDate ? hoveredDate : startDate
    
    // Gerar preview de TODAS as datas entre o início e o fim
    const preview: Date[] = []
    const currentDate = new Date(start)
    
    while (currentDate <= end) {
      const dateToAdd = new Date(currentDate)
      // No preview, adiciona TODOS os dias (não filtra por selecionável aqui)
      // A validação será feita no clique
      preview.push(dateToAdd)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return preview
  }

  const previewDates = getPreviewDates()

  const isDateInPreview = (date: Date | null) => {
    if (!date) return false
    return previewDates.some(d => d.toDateString() === date.toDateString()) && !isDateSelected(date)
  }

  const handleDateClick = (date: Date) => {
    console.log('🖱️ CLICK NA DATA:', date.toLocaleDateString('pt-BR'))
    console.log('   - isDateSelectable:', isDateSelectable(date))
    console.log('   - disabled:', disabled)
    console.log('   - selectedDates.length:', selectedDates.length)
    
    if (!isDateSelectable(date) || disabled) {
      console.log('   ❌ Data não selecionável ou componente desabilitado')
      return
    }

    if (selectedDates.length === 0) {
      // Primeira seleção - define o INÍCIO
      console.log('   ✅ PRIMEIRA SELEÇÃO - definindo início')
      setFirstSelectedDate(date)
      onDatesSelect([date])
    } else if (selectedDates.length === 1) {
      // Segunda seleção - define o FIM e seleciona TUDO NO MEIO
      console.log('   ✅ SEGUNDA SELEÇÃO - selecionando range')
      const start = firstSelectedDate! < date ? firstSelectedDate! : date
      const end = firstSelectedDate! < date ? date : firstSelectedDate!
      
      console.log('   - Range:', start.toLocaleDateString('pt-BR'), 'até', end.toLocaleDateString('pt-BR'))

      // Gerar todas as datas entre start e end
      const datesInRange: Date[] = []
      const currentDate = new Date(start)
      
      while (currentDate <= end) {
        const dateToAdd = new Date(currentDate)
        
        // Verificar se a data é selecionável
        if (isDateSelectable(dateToAdd)) {
          datesInRange.push(dateToAdd)
          console.log('     ✓ Adicionado:', dateToAdd.toLocaleDateString('pt-BR'))
        } else {
          console.log('     ✗ Pulado (não selecionável):', dateToAdd.toLocaleDateString('pt-BR'))
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }

      console.log('   - Total de datas no range:', datesInRange.length)

      // Se não há datas selecionáveis no range
      if (datesInRange.length === 0) {
        console.log('   ❌ Nenhuma data selecionável no range!')
        showAlert(
          'Nenhum Dia Útil Disponível',
          'Não há dias úteis disponíveis no intervalo selecionado. Por favor, escolha outras datas.',
          'warning'
        )
        setFirstSelectedDate(null)
        onDatesSelect([])
        return
      }

      // Selecionar TODAS as datas no range
      console.log('   ✅ Selecionando', datesInRange.length, 'datas')
      onDatesSelect(datesInRange)
    } else {
      // Já tem uma seleção completa - resetar e começar nova seleção
      console.log('   🔄 RESET - começando nova seleção')
      setFirstSelectedDate(date)
      onDatesSelect([date])
    }
  }

  const handleMouseEnter = (date: Date) => {
    if (selectedDates.length > 0) {
      setHoveredDate(date)
    }
  }

  const handleMouseLeave = () => {
    setHoveredDate(null)
  }

  const clearSelection = () => {
    setFirstSelectedDate(null)
    setHoveredDate(null)
    onDatesSelect([])
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedDates.length === 0 ? (
                  '1. Clique no dia inicial'
                ) : selectedDates.length === 1 ? (
                  '2. Agora clique no dia final'
                ) : (
                  `${selectedDates.length} dia${selectedDates.length !== 1 ? 's' : ''} selecionado${selectedDates.length !== 1 ? 's' : ''}! Confirme ou escolha outro`
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
              {selectedDates.length > 0 && (
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
              const isSelected = isDateSelected(date)
              const isInPreview = isDateInPreview(date)
              const isSelectable = isDateSelectable(date)
              const isToday = date && date.toDateString() === today.toDateString()
              
              return (
                <Button
                  key={index}
                  type="button"
                  variant={isSelected ? "default" : isInPreview ? "secondary" : "ghost"}
                  size="sm"
                  disabled={!isSelectable || disabled}
                  onClick={() => date && handleDateClick(date)}
                  onMouseEnter={() => date && handleMouseEnter(date)}
                  onMouseLeave={handleMouseLeave}
                  className={`
                    h-12 w-full p-0 relative transition-all duration-200 font-medium
                    ${!date ? 'invisible' : ''}
                    ${!isSelectable && date 
                      ? 'opacity-40 cursor-not-allowed' 
                      : isSelected
                        ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
                        : isInPreview && isSelectable
                          ? 'bg-primary/20 border-primary/40 text-primary hover:bg-primary/30'
                          : isInPreview && !isSelectable
                            ? 'bg-red-50 border-red-200 text-red-400 opacity-60'
                            : 'hover:bg-primary/10 hover:border-primary/30'
                    }
                    ${isToday && !isSelected && !isInPreview ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                  `}
                  title={
                    !isSelectable && date
                      ? `${date.toLocaleDateString('pt-BR')} - Não disponível`
                      : date?.toLocaleDateString('pt-BR', { 
                          weekday: 'long',
                          day: '2-digit', 
                          month: 'long'
                        })
                  }
                >
                  <span className="text-lg">
                    {date?.getDate()}
                  </span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {showLegend && (
        <Card className="bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Como usar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-semibold mb-2">Como selecionar:</p>
              <ul className="space-y-1 text-xs ml-4 list-disc">
                <li><strong>1.</strong> Clique no dia inicial desejado</li>
                <li><strong>2.</strong> Clique no dia final para selecionar TODOS os dias úteis entre eles</li>
                <li><strong>3.</strong> Passe o mouse para ver preview do que será selecionado</li>
                <li><strong>4.</strong> Clique novamente para resetar e começar nova seleção</li>
              </ul>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span>Selecionado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary/20 border border-primary/40 rounded"></div>
                  <span>Preview</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-input rounded bg-white"></div>
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded ring-2 ring-blue-400"></div>
                  <span>Hoje</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview da seleção (quando hovering) */}
      {previewDates.length > selectedDates.length && hoveredDate !== null && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-sm text-blue-800">
                <strong>Preview:</strong> {previewDates.length} dia{previewDates.length !== 1 ? 's' : ''} será{previewDates.length !== 1 ? 'ão' : ''} selecionado{previewDates.length !== 1 ? 's' : ''}
                <span className="text-xs text-blue-600 ml-2">
                  (Clique para confirmar esta seleção)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo da seleção */}
      {selectedDates.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base text-green-900">
              {selectedDates.length} Dia{selectedDates.length !== 1 ? 's' : ''} Selecionado{selectedDates.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date, index) => (
                <Badge key={index} variant="outline" className="bg-white text-green-900 border-green-300">
                  {date.toLocaleDateString('pt-BR', { 
                    weekday: 'short', 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Modal de Alerta */}
      <AlertModal />
    </div>
  )
}

