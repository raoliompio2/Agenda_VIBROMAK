'use client'

import { useState } from 'react'
import { DateRangePicker } from '@/components/calendar/DateRangePicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TesteDiasPage() {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Teste de Seleção Múltipla de Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Esta página é para testar a seleção múltipla de dias igual ao seletor de horários.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Como usar:</h3>
            <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
              <li>Clique no primeiro dia desejado</li>
              <li>Passe o mouse sobre outros dias para ver o preview</li>
              <li>Clique no último dia para selecionar TUDO entre eles</li>
              <li>Clique novamente para resetar e começar nova seleção</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <DateRangePicker
        selectedDates={selectedDates}
        onDatesSelect={setSelectedDates}
        workingDays={[1, 2, 3, 4, 5]} // Seg a Sex
        disabled={false}
        showLegend={true}
      />

      {/* Debug Info */}
      <Card className="mt-6 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Debug - Estado Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <p><strong>Total de dias selecionados:</strong> {selectedDates.length}</p>
            <p><strong>Datas selecionadas:</strong></p>
            <ul className="list-disc list-inside ml-4">
              {selectedDates.length === 0 ? (
                <li className="text-gray-500">Nenhuma data selecionada ainda</li>
              ) : (
                selectedDates.map((date, index) => (
                  <li key={index}>
                    {date.toLocaleDateString('pt-BR', { 
                      weekday: 'long',
                      day: '2-digit', 
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </li>
                ))
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

