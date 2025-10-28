'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText } from 'lucide-react'

interface AppointmentStatus {
  date: string // YYYY-MM-DD
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

interface VisualCalendarProps {
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  appointmentsStatus: AppointmentStatus[]
  settings?: any
  minDate?: Date
  maxDate?: Date
  workingDays?: number[]
  disabled?: boolean
  showLegend?: boolean
  // Novo: seleção múltipla
  allowMultiSelect?: boolean
  selectedDates?: Date[]
  onDatesSelect?: (dates: Date[]) => void
}

export function VisualCalendar({
  selectedDate,
  onDateSelect,
  appointmentsStatus,
  settings,
  minDate = new Date(),
  maxDate,
  workingDays = [1, 2, 3, 4, 5],
  disabled = false,
  showLegend = true,
  allowMultiSelect = false,
  selectedDates = [],
  onDatesSelect
}: VisualCalendarProps) {
  const [isClient, setIsClient] = useState(false)
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [today, setToday] = useState<Date>(new Date())
  
  // Estados para seleção múltipla
  const [firstSelectedDate, setFirstSelectedDate] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  
  // Sincronizar estado interno quando muda selectedDates externamente
  useEffect(() => {
    if (allowMultiSelect) {
      if (selectedDates.length === 0) {
        setFirstSelectedDate(null)
        setHoveredDate(null)
      } else if (selectedDates.length === 1) {
        setFirstSelectedDate(selectedDates[0])
      }
    }
  }, [selectedDates, allowMultiSelect])
  // Função para obter status simples de uma data
  const getDateStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointmentsStatus.find(status => status.date === dateStr)
  }

  // Função para calcular ocupação real baseada nas configurações
  const calculateOccupation = (date: Date, status: AppointmentStatus | undefined) => {
    if (!status || !settings) return { totalSlots: 8, occupiedSlots: 0, occupationRate: 0 }
    
    // Calcular slots totais no dia
    const workingHoursStart = settings.workingHoursStart || '09:00'
    const workingHoursEnd = settings.workingHoursEnd || '18:00'
    const meetingDuration = settings.meetingDuration || 60
    const bufferTime = settings.bufferTime || 15
    
    const [startHour, startMinute] = workingHoursStart.split(':').map(Number)
    const [endHour, endMinute] = workingHoursEnd.split(':').map(Number)
    
    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute
    const slotDuration = meetingDuration + bufferTime
    
    const totalMinutes = endTime - startTime
    const totalSlots = Math.floor(totalMinutes / slotDuration)
    
    const occupiedSlots = status.total
    const occupationRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0
    
    return { totalSlots, occupiedSlots, occupationRate }
  }

  // Função para determinar a cor baseada na ocupação real
  const getDateColorClass = (date: Date) => {
    const status = getDateStatus(date)
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
    const isToday = date.toDateString() === today.toDateString()
    
    // Estado selecionado
    if (isSelected) {
      return 'bg-primary text-primary-foreground hover:bg-primary/90'
    }
    
    // Se tem agendamentos, verificar o que mostrar
    if (status) {
      // Se tem agendamentos ativos (pending ou confirmed)
      if (status.total > 0) {
        const { occupationRate } = calculateOccupation(date, status)
        
        // Se ainda tem horários disponíveis (não está 100% ocupado)
        if (occupationRate < 100) {
          if (status.hasConfirmed && status.hasPending) {
            // Misto: confirmado + pendente = amarelo (pendente tem prioridade visual)
            return 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-150'
          } else if (status.hasPending) {
            // Só pendentes = amarelo
            return 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-150'
          } else if (status.hasConfirmed) {
            // Confirmados = vermelho claro (ocupado mas não lotado)
            return 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-150'
          }
        } else {
          // 100% ocupado = vermelho (indisponível)
          return 'bg-red-200 text-red-900 border border-red-300 hover:bg-red-250'
        }
      }
    }
    
    // Disponível (sem agendamentos) = verde suave
    if (isDateSelectable(date)) {
      return 'bg-green-50 text-green-900 border border-green-100 hover:bg-green-100'
    }
    
    // Data hoje (fallback)
    if (isToday) {
      return 'border-2 border-primary bg-background hover:bg-muted'
    }
    
    // Padrão
    return 'bg-background hover:bg-muted'
  }

  useEffect(() => {
    setIsClient(true)
    setToday(new Date())
  }, [])

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDate = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Dias do mês anterior
    for (let i = 0; i < startDate; i++) {
      days.push(null)
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }


  const isDateSelectable = (date: Date) => {
    if (!date) return false
    if (disabled) return false
    
    const dayOfWeek = date.getDay()
    if (!workingDays.includes(dayOfWeek)) return false
    
    // Comparar apenas datas (sem horário) para permitir clique no dia atual
    if (minDate) {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
      if (dateOnly < minDateOnly) return false
    }
    
    if (maxDate) {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const maxDateOnly = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
      if (dateOnly > maxDateOnly) return false
    }
    
    return true
  }

  const isSelected = (date: Date | null) => {
    if (!date) return false
    
    if (allowMultiSelect) {
      // Modo múltiplo: verificar se está no array
      return selectedDates.some(d => d.toDateString() === date.toDateString())
    } else {
      // Modo single: verificar se é a data selecionada
      if (!selectedDate) return false
      return date.toDateString() === selectedDate.toDateString()
    }
  }
  
  // Funções para seleção múltipla (igual ao DateRangePicker)
  const getPreviewDates = (): Date[] => {
    if (!allowMultiSelect) return []
    
    // Se não tem seleção ou não está com hover, retorna a seleção atual
    if (selectedDates.length === 0 || hoveredDate === null) {
      return selectedDates
    }
    
    // Se já tem seleção completa, retorna a seleção atual
    if (selectedDates.length > 1) {
      return selectedDates
    }
    
    // Se tem apenas o primeiro dia, mostra preview do range
    const startDate = selectedDates[0]
    const start = startDate < hoveredDate ? startDate : hoveredDate
    const end = startDate < hoveredDate ? hoveredDate : startDate
    
    const preview: Date[] = []
    const currentDate = new Date(start)
    
    while (currentDate <= end) {
      const dateToAdd = new Date(currentDate)
      preview.push(dateToAdd)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return preview
  }
  
  const previewDates = getPreviewDates()
  
  const isDateInPreview = (date: Date | null) => {
    if (!date || !allowMultiSelect) return false
    return previewDates.some(d => d.toDateString() === date.toDateString()) && !isSelected(date)
  }
  
  const handleDateClickMulti = (date: Date) => {
    if (!onDatesSelect) return
    
    console.log('🖱️ VisualCalendar MULTI-SELECT:', date.toLocaleDateString('pt-BR'), 'selectedDates.length:', selectedDates.length)
    
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
        alert('Não há dias úteis disponíveis no intervalo selecionado.')
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const days = getDaysInMonth(currentDate)

  if (!isClient) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando calendário...</p>
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
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              
              {/* Instruções do modo multi-seleção */}
              {allowMultiSelect && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedDates.length === 0 ? (
                    '1. Clique no dia inicial'
                  ) : selectedDates.length === 1 ? (
                    '2. Agora clique no dia final'
                  ) : (
                    `${selectedDates.length} dia${selectedDates.length !== 1 ? 's' : ''} selecionado${selectedDates.length !== 1 ? 's' : ''}!`
                  )}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {allowMultiSelect && selectedDates.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFirstSelectedDate(null)
                    setHoveredDate(null)
                    onDatesSelect?.([])
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 mr-2"
                >
                  Limpar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={disabled}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={disabled}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(name => (
              <div key={name} className="text-center text-sm font-medium text-muted-foreground p-2">
                {name}
              </div>
            ))}
          </div>
          
          {/* Grade do calendário */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const status = date ? getDateStatus(date) : null
              const occupation = date && status ? calculateOccupation(date, status) : null
              const isSelectableDate = date ? isDateSelectable(date) : false
              const isInPreview = date ? isDateInPreview(date) : false
              const isSelectedDate = date ? isSelected(date) : false
              
              return (
                <div key={index} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!date || !isSelectableDate || disabled}
                    onClick={() => {
                      if (!date || !isSelectableDate) return
                      if (allowMultiSelect) {
                        handleDateClickMulti(date)
                      } else {
                        onDateSelect(date)
                      }
                    }}
                    onMouseEnter={() => {
                      if (allowMultiSelect && date && isSelectableDate && selectedDates.length === 1) {
                        setHoveredDate(date)
                      }
                    }}
                    onMouseLeave={() => {
                      if (allowMultiSelect) {
                        setHoveredDate(null)
                      }
                    }}
                    className={`
                      h-12 w-full p-1 relative flex flex-col items-center justify-center
                      ${!date ? 'invisible' : ''}
                      ${
                        !date ? '' :
                        // Modo multi-select tem PRIORIDADE TOTAL sobre cores de status
                        allowMultiSelect && (isSelectedDate || isInPreview) ? (
                          isSelectedDate
                            ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 font-bold border-2 border-primary'
                            : isInPreview && isSelectableDate
                              ? 'bg-primary/30 border-2 border-primary/50 text-primary hover:bg-primary/40'
                              : isInPreview && !isSelectableDate
                                ? 'bg-red-50 border-2 border-red-300 text-red-400 opacity-60'
                                : getDateColorClass(date)
                        ) : (
                          // Modo single OU multi sem seleção: usa cores de status normalmente
                          getDateColorClass(date)
                        )
                      }
                      ${!isSelectableDate && date ? 'opacity-40 cursor-not-allowed' : ''}
                      transition-all duration-200
                    `}
                    title={
                      date && occupation 
                        ? `${date.getDate()}/${currentDate.getMonth() + 1} - ${occupation.occupiedSlots} de ${occupation.totalSlots} horários ocupados (${Math.round(occupation.occupationRate)}%)`
                        : date?.toLocaleDateString('pt-BR')
                    }
                  >
                    {date && (
                      <>
                        <span className="text-sm font-medium">
                          {date.getDate()}
                        </span>
                        {status && status.total > 0 && (
                          <div className="absolute top-1 right-1">
                            <div className="h-2 w-2 rounded-full bg-current opacity-60"></div>
                          </div>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview da seleção no modo multi (quando hovering) */}
      {allowMultiSelect && previewDates.length > selectedDates.length && hoveredDate !== null && (
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

      {/* Resumo da seleção múltipla */}
      {allowMultiSelect && selectedDates.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
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

      {/* Legenda */}
      {showLegend && !allowMultiSelect && (
        <Card className="bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Legenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-50 border border-green-100"></div>
                <span>Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-yellow-100 border border-yellow-200"></div>
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-red-200 border border-red-300"></div>
                <span>Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-100 border border-gray-200"></div>
                <span>Cancelado/Completo</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <p>• Pontos no canto superior direito indicam agendamentos</p>
              <p>• Passe o mouse sobre as datas para ver quantos horários estão ocupados</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo da data selecionada */}
      {selectedDate && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-primary">
              📅 {selectedDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long',
                year: 'numeric'
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const status = getDateStatus(selectedDate)
              const occupation = selectedDate && status ? calculateOccupation(selectedDate, status) : null
              
              if (!status) {
                return (
                  <div className="flex items-center gap-2 text-green-700">
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    <span className="font-medium">Agenda livre</span>
                  </div>
                )
              }
              
              // Se não tem nenhum agendamento
              if (status.total === 0) {
                return (
                  <div className="flex items-center gap-2 text-green-700">
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    <span className="font-medium">Agenda livre</span>
                  </div>
                )
              }
              
              if (!occupation) {
                return (
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                    <span className="font-medium">Calculando...</span>
                  </div>
                )
              }
              
              const availableSlots = occupation.totalSlots - occupation.occupiedSlots
              
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {occupation.occupiedSlots} de {occupation.totalSlots} horários ocupados ({Math.round(occupation.occupationRate)}%)
                    </span>
                    <div className="flex gap-1">
                      {occupation.occupationRate >= 100 ? (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                          Indisponível
                        </Badge>
                      ) : status.hasPending && status.hasConfirmed ? (
                        // Tem os dois - mostrar ambos
                        <>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                            Pendente
                          </Badge>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                            Confirmado
                          </Badge>
                        </>
                      ) : status.hasPending ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                          Pendente
                        </Badge>
                      ) : status.hasConfirmed ? (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                          Confirmado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                          Livre
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {availableSlots > 0 ? (
                      <span className="text-green-600">
                        {availableSlots} horário{availableSlots !== 1 ? 's' : ''} disponível{availableSlots !== 1 ? 'eis' : ''}
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        Agenda lotada
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
