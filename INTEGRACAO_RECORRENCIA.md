# Integração de Recorrência - Sistema Completo

Data: 23/10/2025

## Status da Implementação

### Backend - 100% Pronto
- Schema do banco com tabelas RecurrenceRule e campos de recorrência
- `src/lib/recurrence.ts` - Lógica de geração de instâncias
- `src/app/api/appointments/route.ts` - Aceita dados de recorrência
- `src/app/api/appointments/recurrence/route.ts` - API dedicada

### Frontend - Integrado

#### Componentes Disponíveis
1. `RecurrenceSelector.tsx` - Seletor de padrão de recorrência
2. `RecurrenceManager.tsx` - Gerenciador de séries existentes
3. `DateRangePicker.tsx` - Seleção de múltiplas datas
4. `MultiSelectCalendar.tsx` - Calendário com multi-seleção

#### Integrado em:
- `AppointmentForm.tsx` - Formulário completo com recorrência
  - Visível apenas para ADMIN e SECRETARY
  - Configuração completa de padrões
  - Envia dados no formato correto para API

### Como Funciona

#### Criando Agendamento Recorrente:

1. Usuário preenche dados do agendamento
2. Usuário ativa recorrência (switch)
3. Configura padrão:
   - Frequência (Diária, Semanal, Mensal, Anual)
   - Intervalo (a cada X dias/semanas/meses)
   - Dias da semana (para semanal)
   - Dia do mês (para mensal)
   - Fim (nunca, até data X, ou N vezes)
4. Sistema gera automaticamente todas as instâncias
5. Todas são criadas com mesmo recurringGroupId

#### Gerenciando Séries:

- Editar única instância: muda só aquela
- Editar série toda: atualiza todas futuras
- Cancelar única: marca exception
- Cancelar série: cancela todas futuras

### Validações

- Verifica conflitos para cada instância
- Não cria instâncias em dias não úteis (se configurado)
- Limita número máximo de instâncias (365)
- Valida data final (não pode ser antes do início)

### Próximos Passos (Opcional)

1. Adicionar RecurrenceManager no painel admin
   - Listar todas as séries recorrentes
   - Gerenciar exceções
   - Editar/cancelar séries completas

2. Exibir indicador de recorrência nos cards
   - Ícone mostrando que faz parte de série
   - Link para ver/editar série completa

3. Filtros no admin
   - Filtrar apenas agendamentos recorrentes
   - Agrupar por série

### Teste

Para testar a recorrência:

1. Faça login como ADMIN
2. Crie novo agendamento
3. Ative "Repetir agendamento"
4. Configure padrão (ex: Semanal, toda segunda-feira, 4 vezes)
5. Submeta
6. Verifique que 4 agendamentos foram criados

### Banco de Dados

Estrutura já criada no schema:
```prisma
model RecurrenceRule {
  id              String
  frequency       RecurrenceFrequency
  interval        Int
  byWeekday       String?
  byMonthDay      Int?
  endDate         DateTime?
  count           Int?
  appointments    Appointment[]
}

model Appointment {
  isRecurring         Boolean
  recurrenceRuleId    String?
  recurringGroupId    String?
  isRecurrenceException Boolean
  originalStartTime   DateTime?
}
```

**IMPORTANTE:** Banco ainda não foi sincronizado com migrations.
Execute: `npx prisma db push` ou `npx prisma migrate dev`

### Componentes Não Integrados (Ainda)

- SimpleAppointmentForm.tsx - Formulário público não tem recorrência
- Página /agendar - Público não cria recorrentes
- RecurrenceManager - Criado mas não adicionado no admin ainda

**Justificativa:** Recorrência é funcionalidade administrativa.
Usuários públicos não deveriam criar agendamentos recorrentes.

---

Status: Implementação Backend e Frontend (Admin) Completa
Falta: Migration do banco de dados

