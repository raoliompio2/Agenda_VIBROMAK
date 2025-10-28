# 🔥 Guia de Implementação - Multi-Seleção e Recorrência

## ⚠️ IMPORTANTE: O QUE FOI FEITO

Foram criados **NOVOS COMPONENTES** mas eles **NÃO ESTÃO INTEGRADOS** nos formulários atuais ainda.
Você precisa seguir os passos abaixo para ver as mudanças.

---

## 📋 PASSO 1: Atualizar o Banco de Dados

Primeiro, você precisa rodar a migração do Prisma para adicionar as novas tabelas:

```bash
# 1. Gerar a migração
npx prisma migrate dev --name add_recurrence_support

# 2. Gerar o cliente Prisma atualizado
npx prisma generate
```

---

## 🎨 PASSO 2: Onde Estão os Novos Componentes

### Componentes Criados:

1. **`src/components/calendar/MultiSelectCalendar.tsx`**
   - Permite selecionar múltiplos horários em diferentes datas
   - Mostra feedback visual com shadow/highlight
   - Lista todos os slots selecionados

2. **`src/components/calendar/RecurrenceSelector.tsx`**
   - Configurar recorrência (diário, semanal, mensal, anual)
   - Escolher dias da semana, intervalo, data fim
   - Preview da regra de recorrência

3. **`src/components/admin/RecurrenceManager.tsx`**
   - Gerenciar séries recorrentes
   - Cancelar: apenas um, todos futuros, ou toda série
   - Ver próximos agendamentos

4. **`src/lib/recurrence.ts`**
   - Lógica para gerar instâncias recorrentes
   - Validação de regras de recorrência

---

## 🔧 PASSO 3: Como Integrar a Multi-Seleção

### Exemplo de Integração no Formulário:

Crie um novo arquivo de exemplo ou substitua o formulário existente:

```typescript
// src/components/forms/AppointmentFormWithMultiSelect.tsx
'use client'

import { useState } from 'react'
import { MultiSelectCalendar } from '@/components/calendar/MultiSelectCalendar'
import { RecurrenceSelector, RecurrenceConfig } from '@/components/calendar/RecurrenceSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SelectedSlot {
  date: Date
  startTime: string
  endTime: string
  dateTime: Date
}

export function AppointmentFormWithMultiSelect() {
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    enabled: false,
    frequency: 'WEEKLY',
    interval: 1,
    endType: 'never'
  })

  const handleSubmit = async () => {
    console.log('Slots selecionados:', selectedSlots)
    console.log('Recorrência:', recurrence)
    
    // Aqui você enviaria para a API
    // Se multi-seleção: criar múltiplos agendamentos
    // Se recorrência: enviar configuração de recorrência
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Seleção de Horários</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiSelectCalendar
            onSlotsSelect={setSelectedSlots}
            workingDays={[1, 2, 3, 4, 5]}
            workingHoursStart="09:00"
            workingHoursEnd="18:00"
            slotDuration={60}
          />
        </CardContent>
      </Card>

      <RecurrenceSelector
        value={recurrence}
        onChange={setRecurrence}
      />

      <Button 
        onClick={handleSubmit} 
        disabled={selectedSlots.length === 0 && !recurrence.enabled}
        className="w-full"
      >
        Criar Agendamento(s)
      </Button>
    </div>
  )
}
```

---

## 📱 PASSO 4: Testar o Sistema

### Para Ver a Multi-Seleção:

1. Crie uma página de teste:

```typescript
// src/app/test-multiselect/page.tsx
import { AppointmentFormWithMultiSelect } from '@/components/forms/AppointmentFormWithMultiSelect'

export default function TestMultiSelectPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Teste de Multi-Seleção</h1>
      <AppointmentFormWithMultiSelect />
    </div>
  )
}
```

2. Acesse: `http://localhost:3000/test-multiselect`

---

## 🎯 Como Funciona a Multi-Seleção

### Fluxo Visual:

1. **Selecione uma data** no calendário
   - Datas com slots selecionados ficam com **borda azul** e um **ponto indicador**

2. **Clique nos horários** disponíveis
   - Horários selecionados ficam com **fundo azul** e **shadow aumentado**
   - Ao passar o mouse, vê um **preview com hover**

3. **Veja o resumo** na parte inferior
   - Lista todos os slots selecionados
   - Pode remover individualmente ou limpar tudo

4. **Configure recorrência** (opcional)
   - Escolha frequência (diário, semanal, mensal)
   - Defina quando termina
   - Veja um **preview em tempo real** da regra

---

## 🗑️ Sobre os Emojis

### Foram Removidos de:
- ✅ `AppointmentDetailsModal.tsx`
- ✅ `SimpleAppointmentForm.tsx`
- ✅ `AppointmentForm.tsx`
- ✅ `ExistingAppointments.tsx`
- ✅ `TimeSlotPicker.tsx`
- ✅ `ParticipantsManager.tsx`
- ✅ `FlexibleTimeSlots.tsx`
- ✅ `AvailableTimeSlots.tsx`
- ✅ `VisualCalendar.tsx`

### Substituídos por Ícones Lucide:
- 🤝 → `<Handshake />`
- 📞 → `<Video />`
- 📊 → `<Presentation />`
- 🔒 → `<Lock />`
- ✈️ → `<Plane />`
- 📝 → `<FileText />`
- ✅ → `<CheckCircle />`
- 💡 → `<Lightbulb />`
- ℹ️ → `<Info />`
- ⏰ → `<Clock />`
- 📅 → `<Calendar />`

### Se ainda vê emojis:
1. **Limpe o cache do navegador**: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. **Reinicie o servidor dev**: `npm run dev`
3. **Verifique se está na branch certa** do git

---

## 🔄 Como Cancelar Recorrências

Use o `RecurrenceManager` no painel admin:

```typescript
import { RecurrenceManager } from '@/components/admin/RecurrenceManager'

// No componente de detalhes do agendamento
<RecurrenceManager
  appointment={appointment}
  allInSeries={seriesAppointments}
  onCancelSingle={async (id) => {
    await fetch(`/api/appointments/recurrence`, {
      method: 'DELETE',
      body: JSON.stringify({
        recurringGroupId: appointment.recurringGroupId,
        cancelType: 'single',
        appointmentId: id
      })
    })
  }}
  onCancelFuture={async (groupId, fromDate) => {
    await fetch(`/api/appointments/recurrence`, {
      method: 'DELETE',
      body: JSON.stringify({
        recurringGroupId: groupId,
        cancelType: 'future',
        fromDate: fromDate.toISOString()
      })
    })
  }}
  onCancelSeries={async (groupId) => {
    await fetch(`/api/appointments/recurrence`, {
      method: 'DELETE',
      body: JSON.stringify({
        recurringGroupId: groupId,
        cancelType: 'all'
      })
    })
  }}
/>
```

---

## 🎨 Melhorias de UI/UX Aplicadas

1. **Ícones Lucide** em vez de emojis (mais profissional)
2. **Feedback visual** consistente (cores, shadows, hovers)
3. **Componentes modulares** e reutilizáveis
4. **Acessibilidade** melhorada (ícones com labels)
5. **Design system** padronizado

---

## 🚀 Próximos Passos Recomendados

1. **Rode a migração do Prisma** (PASSO 1)
2. **Crie a página de teste** (PASSO 4)
3. **Teste a multi-seleção** visualmente
4. **Integre no formulário principal** quando aprovado
5. **Teste o sistema de recorrência**
6. **Documente para a equipe**

---

## ❓ Perguntas Frequentes

**P: Por que não vejo as mudanças?**
R: Os novos componentes não foram integrados automaticamente. Siga o PASSO 3 e 4.

**P: Preciso migrar dados existentes?**
R: Não, as novas colunas são opcionais. Agendamentos antigos continuam funcionando.

**P: Posso usar sem recorrência?**
R: Sim! A recorrência é opcional. Você pode usar apenas a multi-seleção.

**P: Como desabilitar a recorrência?**
R: Simplesmente não renderize o componente `RecurrenceSelector`.

---

## 📞 Suporte

Se tiver dúvidas ou problemas na implementação, verifique:
1. Console do navegador (F12) para erros
2. Terminal do servidor para logs
3. Se o Prisma foi atualizado corretamente
4. Se os imports estão corretos


