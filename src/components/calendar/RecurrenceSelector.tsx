'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Repeat, Calendar, X, Info } from 'lucide-react'

export interface RecurrenceConfig {
  enabled: boolean
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  byWeekday?: number[] // 0=domingo, 6=sábado
  byMonthDay?: number // 1-31
  bySetPos?: number // 1=primeira, 2=segunda, -1=última
  endType: 'never' | 'date' | 'count'
  endDate?: Date
  count?: number
}

interface RecurrenceSelectorProps {
  value: RecurrenceConfig
  onChange: (config: RecurrenceConfig) => void
  disabled?: boolean
  baseDate?: Date
}

export function RecurrenceSelector({
  value,
  onChange,
  disabled = false,
  baseDate = new Date()
}: RecurrenceSelectorProps) {
  const weekDays = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
  ]

  const updateConfig = (updates: Partial<RecurrenceConfig>) => {
    onChange({ ...value, ...updates })
  }

  const toggleWeekday = (day: number) => {
    const current = value.byWeekday || []
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort()
    updateConfig({ byWeekday: updated })
  }

  const getRecurrenceDescription = () => {
    if (!value.enabled) return 'Não se repete'

    let description = 'Repete '

    switch (value.frequency) {
      case 'DAILY':
        description += value.interval === 1 
          ? 'diariamente' 
          : `a cada ${value.interval} dias`
        break
      case 'WEEKLY':
        description += value.interval === 1
          ? 'semanalmente'
          : `a cada ${value.interval} semanas`
        if (value.byWeekday && value.byWeekday.length > 0) {
          const days = value.byWeekday.map(d => weekDays[d].label).join(', ')
          description += ` (${days})`
        }
        break
      case 'MONTHLY':
        description += value.interval === 1
          ? 'mensalmente'
          : `a cada ${value.interval} meses`
        if (value.byMonthDay) {
          description += ` no dia ${value.byMonthDay}`
        }
        break
      case 'YEARLY':
        description += value.interval === 1
          ? 'anualmente'
          : `a cada ${value.interval} anos`
        break
    }

    if (value.endType === 'date' && value.endDate) {
      description += ` até ${value.endDate.toLocaleDateString('pt-BR')}`
    } else if (value.endType === 'count' && value.count) {
      description += `, ${value.count} vezes`
    }

    return description
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recorrência
          </CardTitle>
          {value.enabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => updateConfig({ enabled: false })}
              disabled={disabled}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Recorrência */}
        {!value.enabled && (
          <Button
            type="button"
            variant="outline"
            onClick={() => updateConfig({ enabled: true })}
            disabled={disabled}
            className="w-full"
          >
            <Repeat className="h-4 w-4 mr-2" />
            Adicionar Recorrência
          </Button>
        )}

        {value.enabled && (
          <>
            {/* Frequência */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Repetir</Label>
                <Select
                  value={value.frequency}
                  onValueChange={(v: any) => updateConfig({ frequency: v })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Diariamente</SelectItem>
                    <SelectItem value="WEEKLY">Semanalmente</SelectItem>
                    <SelectItem value="MONTHLY">Mensalmente</SelectItem>
                    <SelectItem value="YEARLY">Anualmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>A cada</Label>
                <Select
                  value={value.interval.toString()}
                  onValueChange={(v) => updateConfig({ interval: parseInt(v) })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {
                          value.frequency === 'DAILY' ? (n === 1 ? 'dia' : 'dias') :
                          value.frequency === 'WEEKLY' ? (n === 1 ? 'semana' : 'semanas') :
                          value.frequency === 'MONTHLY' ? (n === 1 ? 'mês' : 'meses') :
                          (n === 1 ? 'ano' : 'anos')
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dias da Semana (para WEEKLY) */}
            {value.frequency === 'WEEKLY' && (
              <div>
                <Label>Dias da semana</Label>
                <div className="flex gap-2 mt-2">
                  {weekDays.map(day => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={value.byWeekday?.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWeekday(day.value)}
                      disabled={disabled}
                      className="flex-1"
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Dia do Mês (para MONTHLY) */}
            {value.frequency === 'MONTHLY' && (
              <div>
                <Label>Dia do mês</Label>
                <Select
                  value={value.byMonthDay?.toString() || '1'}
                  onValueChange={(v) => updateConfig({ byMonthDay: parseInt(v) })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Término da Recorrência */}
            <div>
              <Label>Termina</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="end-never"
                    checked={value.endType === 'never'}
                    onChange={() => updateConfig({ endType: 'never' })}
                    disabled={disabled}
                    className="w-4 h-4"
                  />
                  <label htmlFor="end-never" className="text-sm cursor-pointer">
                    Nunca
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="end-date"
                    checked={value.endType === 'date'}
                    onChange={() => updateConfig({ endType: 'date' })}
                    disabled={disabled}
                    className="w-4 h-4"
                  />
                  <label htmlFor="end-date" className="text-sm cursor-pointer flex-1">
                    Em
                  </label>
                  {value.endType === 'date' && (
                    <Input
                      type="date"
                      value={value.endDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => updateConfig({ endDate: new Date(e.target.value) })}
                      disabled={disabled}
                      className="flex-1"
                      min={baseDate.toISOString().split('T')[0]}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="end-count"
                    checked={value.endType === 'count'}
                    onChange={() => updateConfig({ endType: 'count' })}
                    disabled={disabled}
                    className="w-4 h-4"
                  />
                  <label htmlFor="end-count" className="text-sm cursor-pointer">
                    Após
                  </label>
                  {value.endType === 'count' && (
                    <>
                      <Input
                        type="number"
                        value={value.count || 1}
                        onChange={(e) => updateConfig({ count: parseInt(e.target.value) || 1 })}
                        disabled={disabled}
                        min={1}
                        max={365}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">ocorrências</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <strong>Resumo:</strong> {getRecurrenceDescription()}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

