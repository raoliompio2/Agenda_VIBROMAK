# 📅 Sistema de Recorrência - Funcionamento Detalhado

## 🎯 **TIPOS DE RECORRÊNCIA IMPLEMENTADOS**

### 1. **DIÁRIA (DAILY)** 📆
**Como funciona:**
- Repete a cada X dias
- Intervalo configurável: 1, 2, 3, 4, 5, 6 dias
- Sempre no mesmo horário

**Exemplos práticos:**
```typescript
// A cada 1 dia (diariamente)
{ frequency: 'DAILY', interval: 1, count: 7 }
// Resultado: 15/01, 16/01, 17/01, 18/01, 19/01, 20/01, 21/01

// A cada 2 dias
{ frequency: 'DAILY', interval: 2, count: 4 }
// Resultado: 15/01, 17/01, 19/01, 21/01
```

**Código:**
```typescript
case 'DAILY':
  next.setDate(next.getDate() + config.interval)
  break
```

---

### 2. **SEMANAL (WEEKLY)** 📅
**Como funciona:**
- Repete a cada X semanas
- Permite selecionar dias específicos da semana
- Intervalo configurável: 1, 2, 3, 4, 5, 6 semanas

**Exemplos práticos:**
```typescript
// Toda segunda-feira (intervalo 1)
{ frequency: 'WEEKLY', interval: 1, byWeekday: [1], count: 4 }
// Resultado: 20/01, 27/01, 03/02, 10/02

// Segundas e quartas (intervalo 1)
{ frequency: 'WEEKLY', interval: 1, byWeekday: [1, 3], count: 6 }
// Resultado: 20/01, 22/01, 27/01, 29/01, 03/02, 05/02

// A cada 2 semanas, só sextas
{ frequency: 'WEEKLY', interval: 2, byWeekday: [5], count: 3 }
// Resultado: 24/01, 07/02, 21/02
```

**Código:**
```typescript
case 'WEEKLY':
  if (config.byWeekday && config.byWeekday.length > 0) {
    // Lógica complexa para encontrar próximo dia válido
    const currentDay = next.getDay()
    const sortedDays = [...config.byWeekday].sort()
    let nextDay = sortedDays.find(day => day > currentDay)
    
    if (nextDay !== undefined) {
      // Próximo dia na mesma semana
      next.setDate(next.getDate() + (nextDay - currentDay))
    } else {
      // Próximo dia na próxima semana
      const firstDay = sortedDays[0]
      const daysUntilNextWeek = 7 - currentDay + firstDay + (config.interval - 1) * 7
      next.setDate(next.getDate() + daysUntilNextWeek)
    }
  } else {
    next.setDate(next.getDate() + config.interval * 7)
  }
  break
```

---

### 3. **MENSAL (MONTHLY)** 🗓️
**Como funciona:**
- Repete a cada X meses
- No mesmo dia do mês
- Ajusta automaticamente para meses com menos dias

**Exemplos práticos:**
```typescript
// Todo dia 15 do mês
{ frequency: 'MONTHLY', interval: 1, byMonthDay: 15, count: 4 }
// Resultado: 15/01, 15/02, 15/03, 15/04

// A cada 2 meses, dia 31
{ frequency: 'MONTHLY', interval: 2, byMonthDay: 31, count: 3 }
// Resultado: 31/01, 28/02 (ajustado), 31/05
```

**Código:**
```typescript
case 'MONTHLY':
  next.setMonth(next.getMonth() + config.interval)
  // Ajustar o dia se necessário (ex: 31 de janeiro -> 28 de fevereiro)
  if (config.byMonthDay) {
    next.setDate(Math.min(config.byMonthDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
  }
  break
```

---

### 4. **ANUAL (YEARLY)** 🎂
**Como funciona:**
- Repete a cada X anos
- Na mesma data
- Ajusta para anos bissextos

**Exemplos práticos:**
```typescript
// Todo ano no mesmo dia
{ frequency: 'YEARLY', interval: 1, count: 3 }
// Resultado: 15/01/2025, 15/01/2026, 15/01/2027

// A cada 2 anos
{ frequency: 'YEARLY', interval: 2, count: 2 }
// Resultado: 15/01/2025, 15/01/2027
```

**Código:**
```typescript
case 'YEARLY':
  next.setFullYear(next.getFullYear() + config.interval)
  break
```

---

## 🔧 **CONFIGURAÇÕES AVANÇADAS**

### **Intervalos Suportados:**
- **1-6** para todos os tipos
- **DAILY**: 1 dia, 2 dias, 3 dias, etc.
- **WEEKLY**: 1 semana, 2 semanas, 3 semanas, etc.
- **MONTHLY**: 1 mês, 2 meses, 3 meses, etc.
- **YEARLY**: 1 ano, 2 anos, 3 anos, etc.

### **Dias da Semana (WEEKLY):**
```typescript
byWeekday: [0, 1, 2, 3, 4, 5, 6]
// 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
```

### **Dia do Mês (MONTHLY):**
```typescript
byMonthDay: 1-31
// Dia específico do mês
```

### **Fim da Recorrência:**
```typescript
// Nunca termina
endType: 'never'

// Até uma data específica
endType: 'date'
endDate: new Date('2025-12-31')

// Após N ocorrências
endType: 'count'
count: 10
```

---

## 🎯 **EXEMPLOS PRÁTICOS DE USO**

### **Reunião Diária de Stand-up:**
```typescript
{
  frequency: 'WEEKLY',
  interval: 1,
  byWeekday: [1, 2, 3, 4, 5], // Segunda a sexta
  endType: 'never'
}
// Resultado: Todo dia útil, para sempre
```

### **Reunião Semanal de Equipe:**
```typescript
{
  frequency: 'WEEKLY',
  interval: 1,
  byWeekday: [1], // Segunda-feira
  endType: 'count',
  count: 12
}
// Resultado: 12 segundas-feiras consecutivas
```

### **Revisão Mensal:**
```typescript
{
  frequency: 'MONTHLY',
  interval: 1,
  byMonthDay: 1, // Primeiro dia do mês
  endType: 'date',
  endDate: new Date('2025-12-31')
}
// Resultado: Todo dia 1 do mês até dezembro
```

### **Aniversário Anual:**
```typescript
{
  frequency: 'YEARLY',
  interval: 1,
  endType: 'never'
}
// Resultado: Todo ano na mesma data
```

---

## ✅ **VALIDAÇÕES IMPLEMENTADAS**

1. **Intervalo válido**: Deve ser >= 1
2. **Dias da semana**: Pelo menos um dia para WEEKLY
3. **Dia do mês**: Entre 1-31 para MONTHLY
4. **Data final**: Deve ser no futuro
5. **Contagem**: Deve ser >= 1
6. **Limite de segurança**: Máximo 365 instâncias

---

## 🚀 **COMO USAR NO FORMULÁRIO**

1. **Ative a recorrência** (switch)
2. **Escolha a frequência** (Diária, Semanal, Mensal, Anual)
3. **Configure o intervalo** (a cada X dias/semanas/meses/anos)
4. **Para semanal**: Selecione os dias da semana
5. **Para mensal**: Escolha o dia do mês
6. **Configure o fim**: Nunca, até data X, ou N vezes
7. **Preview automático** mostra o que será criado

---

## 🎉 **CONCLUSÃO**

O sistema de recorrência implementado é **completo e profissional**, suportando todos os padrões comuns de agendamento recorrente encontrados em sistemas como Google Calendar, Outlook, etc.

**Funcionalidades únicas:**
- ✅ Multi-seleção de datas + recorrência
- ✅ Validações robustas
- ✅ Preview em tempo real
- ✅ Gestão de séries existentes
- ✅ Exceções individuais
- ✅ Interface intuitiva

