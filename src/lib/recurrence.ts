import { RecurrenceConfig } from '@/components/calendar/RecurrenceSelector'

export interface RecurrenceInstance {
  startTime: Date
  endTime: Date
  occurrenceIndex: number
}

/**
 * Gera todas as ocorrências de um agendamento recorrente
 */
export function generateRecurrenceInstances(
  baseStartTime: Date,
  duration: number, // em minutos
  config: RecurrenceConfig,
  maxInstances: number = 365 // limite de segurança
): RecurrenceInstance[] {
  if (!config.enabled) {
    return [{
      startTime: baseStartTime,
      endTime: new Date(baseStartTime.getTime() + duration * 60000),
      occurrenceIndex: 0
    }]
  }

  const instances: RecurrenceInstance[] = []
  let currentDate = new Date(baseStartTime)
  let occurrenceCount = 0

  const maxEndDate = config.endType === 'date' && config.endDate 
    ? config.endDate 
    : new Date(baseStartTime.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 ano no futuro

  const targetCount = config.endType === 'count' && config.count 
    ? config.count 
    : maxInstances

  while (occurrenceCount < targetCount && currentDate <= maxEndDate && occurrenceCount < maxInstances) {
    // Verificar se a data atende aos critérios
    let shouldInclude = true

    if (config.frequency === 'WEEKLY' && config.byWeekday && config.byWeekday.length > 0) {
      shouldInclude = config.byWeekday.includes(currentDate.getDay())
    }

    if (config.frequency === 'MONTHLY' && config.byMonthDay) {
      shouldInclude = currentDate.getDate() === config.byMonthDay
    }

    if (shouldInclude) {
      const startTime = new Date(currentDate)
      const endTime = new Date(startTime.getTime() + duration * 60000)
      
      instances.push({
        startTime,
        endTime,
        occurrenceIndex: occurrenceCount
      })
      
      occurrenceCount++
    }

    // Avançar para a próxima data
    currentDate = getNextOccurrence(currentDate, config)
  }

  return instances
}

/**
 * Calcula a próxima ocorrência baseada na configuração de recorrência
 */
function getNextOccurrence(currentDate: Date, config: RecurrenceConfig): Date {
  const next = new Date(currentDate)

  switch (config.frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + config.interval)
      break

    case 'WEEKLY':
      // Se temos dias específicos da semana
      if (config.byWeekday && config.byWeekday.length > 0) {
        const currentDay = next.getDay()
        const sortedDays = [...config.byWeekday].sort()
        
        // Encontrar o próximo dia válido
        let nextDay = sortedDays.find(day => day > currentDay)
        
        if (nextDay !== undefined) {
          // Próximo dia válido está na mesma semana
          next.setDate(next.getDate() + (nextDay - currentDay))
        } else {
          // Próximo dia válido está na próxima semana (ou intervalo de semanas)
          const firstDay = sortedDays[0]
          const daysUntilNextWeek = 7 - currentDay + firstDay + (config.interval - 1) * 7
          next.setDate(next.getDate() + daysUntilNextWeek)
        }
      } else {
        next.setDate(next.getDate() + config.interval * 7)
      }
      break

    case 'MONTHLY':
      next.setMonth(next.getMonth() + config.interval)
      // Ajustar o dia se necessário (ex: 31 de janeiro -> 28 de fevereiro)
      if (config.byMonthDay) {
        next.setDate(Math.min(config.byMonthDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
      }
      break

    case 'YEARLY':
      next.setFullYear(next.getFullYear() + config.interval)
      break
  }

  return next
}

/**
 * Valida se uma configuração de recorrência é válida
 */
export function validateRecurrenceConfig(config: RecurrenceConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.enabled) {
    return { valid: true, errors: [] }
  }

  if (config.interval < 1) {
    errors.push('O intervalo deve ser maior que zero')
  }

  if (config.frequency === 'WEEKLY') {
    if (!config.byWeekday || config.byWeekday.length === 0) {
      errors.push('Selecione pelo menos um dia da semana')
    }
  }

  if (config.frequency === 'MONTHLY') {
    if (!config.byMonthDay || config.byMonthDay < 1 || config.byMonthDay > 31) {
      errors.push('Selecione um dia do mês válido')
    }
  }

  if (config.endType === 'date' && config.endDate) {
    if (config.endDate <= new Date()) {
      errors.push('A data final deve ser no futuro')
    }
  }

  if (config.endType === 'count' && config.count) {
    if (config.count < 1) {
      errors.push('O número de ocorrências deve ser maior que zero')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Formata uma descrição legível da recorrência
 */
export function formatRecurrenceDescription(config: RecurrenceConfig): string {
  if (!config.enabled) return 'Não se repete'

  const weekDays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
  
  let description = 'Repete '

  switch (config.frequency) {
    case 'DAILY':
      description += config.interval === 1 ? 'diariamente' : `a cada ${config.interval} dias`
      break
    case 'WEEKLY':
      description += config.interval === 1 ? 'semanalmente' : `a cada ${config.interval} semanas`
      if (config.byWeekday && config.byWeekday.length > 0) {
        const days = config.byWeekday.map(d => weekDays[d]).join(', ')
        description += ` (${days})`
      }
      break
    case 'MONTHLY':
      description += config.interval === 1 ? 'mensalmente' : `a cada ${config.interval} meses`
      if (config.byMonthDay) {
        description += ` no dia ${config.byMonthDay}`
      }
      break
    case 'YEARLY':
      description += config.interval === 1 ? 'anualmente' : `a cada ${config.interval} anos`
      break
  }

  if (config.endType === 'date' && config.endDate) {
    description += ` até ${config.endDate.toLocaleDateString('pt-BR')}`
  } else if (config.endType === 'count' && config.count) {
    description += `, ${config.count} vezes`
  }

  return description
}

/**
 * Converte configuração de recorrência para dados do Prisma
 */
export function recurrenceConfigToDatabase(config: RecurrenceConfig) {
  if (!config.enabled) return null

  return {
    frequency: config.frequency,
    interval: config.interval,
    byWeekday: config.byWeekday?.join(',') || null,
    byMonthDay: config.byMonthDay || null,
    bySetPos: config.bySetPos || null,
    endDate: config.endDate || null,
    count: config.count || null,
    exceptionDates: null
  }
}

/**
 * Converte dados do banco para configuração de recorrência
 */
export function recurrenceConfigFromDatabase(data: any): RecurrenceConfig {
  if (!data) {
    return {
      enabled: false,
      frequency: 'WEEKLY',
      interval: 1,
      endType: 'never'
    }
  }

  return {
    enabled: true,
    frequency: data.frequency,
    interval: data.interval,
    byWeekday: data.byWeekday ? data.byWeekday.split(',').map(Number) : undefined,
    byMonthDay: data.byMonthDay || undefined,
    bySetPos: data.bySetPos || undefined,
    endType: data.endDate ? 'date' : data.count ? 'count' : 'never',
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    count: data.count || undefined
  }
}

