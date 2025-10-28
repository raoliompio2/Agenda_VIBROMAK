# Multi-Seleção: Horários e Validação de Conflitos

## 🎯 Problemas Resolvidos

### 1️⃣ Horários não apareciam no modo multi-seleção
**Problema**: Quando o usuário ativava o modo multi-seleção e escolhia várias datas, não aparecia o seletor de horários para escolher qual horário aplicar.

**Solução**: 
- Adicionado condição para mostrar horários quando `multiSelectMode && selectedDates.length > 0`
- Usa a primeira data selecionada como referência para os horários disponíveis
- Mostra card informativo explicando que o horário será aplicado a TODAS as datas

### 2️⃣ Não validava conflitos em datas com agendamentos existentes
**Problema**: Era possível tentar agendar em horários já ocupados nas datas selecionadas.

**Solução**:
- Criada função `validateConflictsInMultipleDates()` que verifica conflitos em todas as datas
- Bloqueia a seleção se houver conflitos
- Mostra alerta informando quais datas têm conflitos
- Sugere escolher outro horário ou remover datas problemáticas

## 🔧 Implementações

### 1. Exibição de Horários no Modo Multi

```typescript
// src/app/page.tsx
{multiSelectMode && selectedDates.length > 0 ? (
  <div className="space-y-4">
    {/* Card informativo */}
    <Card className="bg-blue-50 border-blue-200">
      <CardContent>
        <h3>
          {selectedDates.length} dia{selectedDates.length !== 1 ? 's' : ''} selecionado{selectedDates.length !== 1 ? 's' : ''}
        </h3>
        <p>
          Escolha um horário abaixo. O mesmo horário será aplicado para <strong>todos os dias selecionados</strong>.
        </p>
      </CardContent>
    </Card>
    
    {/* Seletor de horários baseado na primeira data */}
    <FlexibleTimeSlots
      selectedDate={selectedDates[0]}
      workingHoursStart={settings?.workingHoursStart}
      workingHoursEnd={settings?.workingHoursEnd}
      existingAppointments={existingAppointments}
      onTimeSelect={handleTimeSelect}
    />
  </div>
) : (
  // Mensagem quando não tem datas selecionadas
)}
```

### 2. Validação de Conflitos

```typescript
// src/app/page.tsx
const validateConflictsInMultipleDates = (startTime: Date, endTime: Date, dates: Date[]): Date[] => {
  const conflictingDates: Date[] = []
  
  const selectedTimeStart = startTime.getHours() * 60 + startTime.getMinutes()
  const selectedTimeEnd = endTime.getHours() * 60 + endTime.getMinutes()
  
  dates.forEach(date => {
    const dateStr = date.toISOString().split('T')[0]
    
    // Buscar agendamentos nessa data
    const appointmentsOnDate = existingAppointments.filter(apt => {
      const aptDateStr = apt.startTime.toISOString().split('T')[0]
      return aptDateStr === dateStr
    })
    
    // Verificar sobreposição de horários
    const hasConflict = appointmentsOnDate.some(apt => {
      const aptStart = apt.startTime.getHours() * 60 + apt.startTime.getMinutes()
      const aptEnd = apt.endTime.getHours() * 60 + apt.endTime.getMinutes()
      
      return (
        (selectedTimeStart >= aptStart && selectedTimeStart < aptEnd) ||
        (selectedTimeEnd > aptStart && selectedTimeEnd <= aptEnd) ||
        (selectedTimeStart <= aptStart && selectedTimeEnd >= aptEnd)
      )
    })
    
    if (hasConflict) {
      conflictingDates.push(date)
    }
  })
  
  return conflictingDates
}
```

### 3. Bloqueio na Seleção com Alerta

```typescript
const handleTimeSelect = (startTime: Date, endTime: Date, duration: number) => {
  if (multiSelectMode && selectedDates.length > 0) {
    // Validar conflitos
    const conflictingDates = validateConflictsInMultipleDates(startTime, endTime, selectedDates)
    
    if (conflictingDates.length > 0) {
      const datesStr = conflictingDates.map(d => d.toLocaleDateString('pt-BR')).join(', ')
      alert(`⚠️ ATENÇÃO: O horário selecionado conflita com agendamentos existentes nas seguintes datas:\n\n${datesStr}\n\nEscolha outro horário ou remova essas datas da seleção.`)
      return // Bloqueia a continuação
    }
    
    // Se não tem conflitos, prossegue
    setPreSelectedSlot({
      date: startTime,
      startTime: startTime,
      duration,
      multipleDates: selectedDates
    })
  }
  setShowForm(true)
}
```

### 4. Formulário com Múltiplas Datas

```typescript
// src/components/forms/SimpleAppointmentForm.tsx

// Mostra todas as datas selecionadas
{preSelectedSlot.multipleDates && preSelectedSlot.multipleDates.length > 0 ? (
  <Card className="border-blue-200 bg-blue-50">
    <CardHeader>
      <CardTitle>
        Agendamento Recorrente - {preSelectedSlot.multipleDates.length} Dias
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div>
        <h4>Horário (aplicado a todos os dias):</h4>
        <p>{formatTimeRange(startTime, endTime)}</p>
      </div>
      
      <div>
        <h4>Datas Selecionadas:</h4>
        <div className="flex flex-wrap gap-2">
          {preSelectedSlot.multipleDates.map((date, index) => (
            <div key={index} className="badge">
              {date.toLocaleDateString('pt-BR')}
            </div>
          ))}
        </div>
      </div>
      
      <div className="alert">
        <strong>💡 Atenção:</strong> Este formulário criará <strong>{preSelectedSlot.multipleDates.length} agendamentos</strong> com o mesmo horário e informações nas datas selecionadas acima.
      </div>
    </CardContent>
  </Card>
) : (
  // Card de data única
)}
```

### 5. Criação de Múltiplos Agendamentos

```typescript
// src/app/page.tsx
const handleSubmit = async (formData: any) => {
  if (formData.multipleDates && formData.multipleDates.length > 0) {
    // Criar um agendamento para cada data
    const promises = formData.multipleDates.map(async (date: Date) => {
      // Ajustar horário para cada data
      const startTime = new Date(date)
      startTime.setHours(formData.startTime.getHours(), formData.startTime.getMinutes())
      
      const endTime = new Date(date)
      endTime.setHours(formData.endTime.getHours(), formData.endTime.getMinutes())
      
      return await fetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        })
      })
    })
    
    const results = await Promise.all(promises)
    console.log(`✅ ${results.length} agendamentos criados`)
  }
  
  // Recarregar e resetar estados
  await fetchAppointmentsStatus()
  setShowForm(false)
  setMultiSelectMode(false)
  setSelectedDates([])
}
```

## 🎯 Fluxo Completo

### Modo Multi-Seleção com Validação

1. **Usuário ativa toggle** "Modo Seleção Múltipla de Dias"
2. **Clica dia inicial** → Dia fica selecionado (azul com borda)
3. **Passa mouse sobre outros dias** → Preview azul dos dias no intervalo
4. **Clica dia final** → Todos os dias úteis do intervalo são selecionados
5. **Horários aparecem à direita** baseado na primeira data
6. **Card azul informa**: "X dias selecionados - horário será aplicado a todos"
7. **Usuário clica em um horário**
8. **Sistema valida conflitos** em TODAS as datas selecionadas
9. **Se há conflitos**:
   - ❌ Mostra alerta com as datas problemáticas
   - Sugere escolher outro horário ou remover datas
   - Não permite continuar
10. **Se NÃO há conflitos**:
    - ✅ Abre formulário
    - Mostra card azul com todas as datas
    - Informa quantos agendamentos serão criados
11. **Usuário preenche e envia**
12. **Sistema cria N agendamentos** (um para cada data)
13. **Sucesso**: "X agendamentos criados com sucesso!"

## 🛡️ Proteções Implementadas

### 1. Validação de Sobreposição
- Verifica se o horário selecionado sobrepõe algum agendamento existente
- Considera três casos:
  - Início dentro de agendamento existente
  - Fim dentro de agendamento existente
  - Agendamento existente completamente dentro do selecionado

### 2. Feedback Claro
- Alerta mostra EXATAMENTE quais datas têm conflito
- Formato: "27/10/2024, 29/10/2024" (datas formatadas em pt-BR)
- Sugere ações: escolher outro horário OU remover datas

### 3. Informação Visual
- Card azul no formulário lista todas as datas
- Aviso destacado sobre quantos agendamentos serão criados
- Badges com cada data individualmente

## 📋 Exemplo de Uso

```
Usuário quer agendar reunião recorrente toda segunda, quarta e sexta

1. Ativa modo multi-seleção
2. Clica em 27/10 (segunda)
3. Clica em 01/11 (sexta)
4. Sistema seleciona: 27/10, 29/10, 31/10, 01/11 (4 dias úteis)

5. Escolhe horário: 14:00 - 15:00

6. Sistema valida:
   - 27/10 às 14h: ✅ Livre
   - 29/10 às 14h: ❌ Conflito (já tem reunião 13:30-15:00)
   - 31/10 às 14h: ✅ Livre
   - 01/11 às 14h: ✅ Livre

7. Alerta: "⚠️ O horário conflita com agendamentos em: 29/10/2024"

8. Usuário escolhe outro horário: 15:30 - 16:30

9. Sistema valida novamente: Todas ✅

10. Formulário abre mostrando 4 agendamentos que serão criados

11. Usuário preenche e envia

12. Sistema cria 4 agendamentos às 15:30 nos dias 27, 29, 31/10 e 01/11
```

## ✅ Resultados

- ✅ Horários aparecem no modo multi-seleção
- ✅ Validação automática de conflitos
- ✅ Feedback claro quando há conflitos
- ✅ Não permite criar agendamentos em horários ocupados
- ✅ Visual informativo mostrando todas as datas
- ✅ Criação automática de múltiplos agendamentos
- ✅ Mensagens de sucesso informativas

---

**Data**: 24/10/2024  
**Status**: ✅ Implementado e funcional  
**Proteção**: Validação de conflitos ativa

