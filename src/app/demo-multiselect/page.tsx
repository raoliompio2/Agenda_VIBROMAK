'use client'

import { useState } from 'react'
import { MultiSelectCalendar } from '@/components/calendar/MultiSelectCalendar'
import { RecurrenceSelector, RecurrenceConfig } from '@/components/calendar/RecurrenceSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Repeat, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface SelectedSlot {
  date: Date
  startTime: string
  endTime: string
  dateTime: Date
}

export default function DemoMultiSelectPage() {
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    enabled: false,
    frequency: 'WEEKLY',
    interval: 1,
    endType: 'never'
  })
  const [title, setTitle] = useState('Reunião de Exemplo')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = () => {
    console.log('=== DEMONSTRAÇÃO ===')
    console.log('📅 Slots selecionados:', selectedSlots.length)
    selectedSlots.forEach((slot, i) => {
      console.log(`  ${i + 1}. ${slot.date.toLocaleDateString('pt-BR')} às ${slot.startTime}`)
    })
    
    if (recurrence.enabled) {
      console.log('🔄 Recorrência configurada:', recurrence)
    }
    
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const totalSlots = selectedSlots.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Demonstração: Multi-Seleção de Horários
          </h1>
          <p className="text-gray-600">
            Selecione múltiplos horários em diferentes datas e configure recorrência
          </p>
        </div>

        {/* Alert de Sucesso */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-bold text-green-900">
                  {totalSlots} horário(s) selecionado(s)!
                </h3>
                <p className="text-sm text-green-700">
                  Verifique o console do navegador (F12) para ver os detalhes
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Multi-Seleção */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Calendar className="h-5 w-5" />
                  Multi-Seleção de Horários
                </CardTitle>
                <p className="text-sm text-blue-700 mt-2">
                  1. Clique em uma data no calendário<br/>
                  2. Selecione os horários disponíveis<br/>
                  3. Repita para outras datas se necessário
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <MultiSelectCalendar
                  onSlotsSelect={setSelectedSlots}
                  workingDays={[1, 2, 3, 4, 5]}
                  workingHoursStart="09:00"
                  workingHoursEnd="18:00"
                  slotDuration={60}
                />
              </CardContent>
            </Card>

            {/* Recorrência (Opcional) */}
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Repeat className="h-5 w-5" />
                  Recorrência (Opcional)
                </CardTitle>
                <p className="text-sm text-purple-700 mt-2">
                  Configure para criar agendamentos que se repetem automaticamente
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <RecurrenceSelector
                  value={recurrence}
                  onChange={setRecurrence}
                />
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral - Resumo e Ação */}
          <div className="space-y-6">
            {/* Resumo */}
            <Card className="sticky top-4 border-2 border-gray-200">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-gray-900">Resumo da Seleção</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Título do Agendamento</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Reunião Semanal"
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Horários selecionados:</span>
                    <span className="font-bold text-blue-900">{totalSlots}</span>
                  </div>
                  {recurrence.enabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Recorrência:</span>
                      <span className="font-bold text-purple-900">Sim</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={totalSlots === 0}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {totalSlots === 0 
                    ? 'Selecione horários' 
                    : `Criar ${totalSlots} Agendamento${totalSlots > 1 ? 's' : ''}`
                  }
                </Button>

                {totalSlots > 0 && (
                  <p className="text-xs text-center text-gray-500">
                    Esta é uma demonstração. Verifique o console (F12) para ver os dados.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-900 text-base">
                  Como Funciona?
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">1.</span>
                    <span>Clique em uma <strong>data</strong> no calendário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">2.</span>
                    <span>Selecione um ou mais <strong>horários</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">3.</span>
                    <span>Datas com seleção ficam <strong>destacadas</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">4.</span>
                    <span>Veja o <strong>resumo</strong> abaixo do calendário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">5.</span>
                    <span>(Opcional) Configure <strong>recorrência</strong></span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Informação Técnica */}
        <Card className="mt-8 border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-2xl">💡</div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-2">Informação Técnica</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  Esta é uma página de demonstração. Os componentes foram criados mas ainda não integrados 
                  ao sistema principal. Para integrar:
                </p>
                <ol className="text-sm text-yellow-800 space-y-1 ml-4">
                  <li>1. Execute: <code className="bg-yellow-100 px-2 py-1 rounded">npx prisma migrate dev</code></li>
                  <li>2. Integre os componentes no formulário principal</li>
                  <li>3. Conecte com a API de recorrência já criada</li>
                </ol>
                <p className="text-xs text-yellow-700 mt-3">
                  Arquivos criados: MultiSelectCalendar.tsx, RecurrenceSelector.tsx, RecurrenceManager.tsx, 
                  /api/appointments/recurrence/route.ts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

