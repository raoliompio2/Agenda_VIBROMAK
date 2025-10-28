# Modal de Alerta Customizado

## Problema Resolvido

Substituímos o `alert()` nativo do navegador (Chrome/Firefox/etc) por um **modal customizado profissional** que segue o design system da aplicação.

### ANTES (Alert do Chrome)
```javascript
alert("ATENÇÃO: O horário selecionado conflita...")
```

![Aparência genérica, sem controle visual, sem formatação]

### DEPOIS (Modal Customizado)
```javascript
showAlert(
  'Conflito de Horários',
  <div>Conteúdo rico com badges, listas, etc</div>,
  'warning'
)
```

![Modal bonito, com cores, ícones, animações]

## Componente Criado

### `src/components/ui/alert-modal.tsx`

Um modal profissional com:
- 4 tipos de alerta (warning, error, info, success)
- Cores temáticas para cada tipo
- Ícones e badges
- Suporte a conteúdo rich (JSX/React)
- Overlay com blur
- Animações suaves
- Responsivo
- Botão de fechar
- Hook customizado para facilitar uso

## Tipos de Alerta

### 1. Warning (Aviso) - Amarelo
```typescript
showAlert(
  'Título do Aviso',
  'Mensagem aqui',
  'warning'
)
```
- Cor: Amarelo
- Ícone: AlertTriangle
- Uso: Avisos, alertas não críticos

### 2. Error (Erro) - Vermelho
```typescript
showAlert(
  'Erro Crítico',
  'Algo deu errado',
  'error'
)
```
- Cor: Vermelho
- Ícone: AlertTriangle
- Uso: Erros, falhas críticas

### 3. Info (Informação) - Azul
```typescript
showAlert(
  'Informação',
  'Apenas uma informação',
  'info'
)
```
- Cor: Azul
- Ícone: AlertTriangle
- Uso: Informações, dicas

### 4. Success (Sucesso) - Verde
```typescript
showAlert(
  'Sucesso!',
  'Operação concluída',
  'success'
)
```
- Cor: Verde
- Ícone: CheckCircle
- Uso: Confirmações, sucessos

## Como Usar

### 1. Importar o Hook

```typescript
import { useAlertModal } from '@/components/ui/alert-modal'

export default function MinhaPagina() {
  const { showAlert, AlertModal } = useAlertModal()
  
  // ... resto do código
  
  return (
    <div>
      {/* Seu conteúdo */}
      
      {/* Modal de Alerta */}
      <AlertModal />
    </div>
  )
}
```

### 2. Mostrar Alerta Simples

```typescript
showAlert(
  'Título',
  'Mensagem simples de texto',
  'warning'
)
```

### 3. Mostrar Alerta com Conteúdo Rico (JSX)

```typescript
const conflictMessage = (
  <div className="space-y-3">
    <p className="text-gray-700">
      O horário selecionado <strong>conflita</strong> nas seguintes datas:
    </p>
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex flex-wrap gap-2">
        {conflictingDates.map((date, index) => (
          <Badge key={index} variant="outline" className="bg-red-50">
            {date.toLocaleDateString('pt-BR')}
          </Badge>
        ))}
      </div>
    </div>
    <p className="text-sm text-gray-600">
      <strong>Sugestões:</strong>
    </p>
    <ul className="list-disc list-inside">
      <li>Escolha outro horário</li>
      <li>Ou remova as datas com conflito</li>
    </ul>
  </div>
)

showAlert(
  '⚠️ Conflito de Horários',
  conflictMessage,
  'warning'
)
```

## Exemplo Real: Validação de Conflitos

### src/app/page.tsx

```typescript
const { showAlert, AlertModal } = useAlertModal()

const handleTimeSelect = (startTime: Date, endTime: Date) => {
  const conflictingDates = validateConflicts(...)
  
  if (conflictingDates.length > 0) {
    // Criar conteúdo visual com badges
    const conflictMessage = (
      <div className="space-y-3">
        <p className="text-gray-700">
          O horário selecionado <strong>conflita com agendamentos existentes</strong> nas seguintes datas:
        </p>
        <div className="bg-white rounded-lg p-4 border border-yellow-300">
          <div className="flex flex-wrap gap-2">
            {conflictingDates.map((date, index) => (
              <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-300">
                {date.toLocaleDateString('pt-BR', { 
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit'
                })}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          <strong>Sugestões:</strong>
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>Escolha outro horário disponível</li>
          <li>Ou volte e remova as datas com conflito da seleção</li>
        </ul>
      </div>
    )
    
    showAlert(
      '⚠️ Conflito de Horários',
      conflictMessage,
      'warning'
    )
    return
  }
  
  // Continua se não houver conflitos...
}

return (
  <div>
    {/* Conteúdo da página */}
    
    {/* Modal de Alerta */}
    <AlertModal />
  </div>
)
```

## Personalização

### Esquema de Cores

```typescript
const colors = {
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    title: 'text-yellow-900',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    iconBg: 'bg-red-100',
    title: 'text-red-900',
    button: 'bg-red-600 hover:bg-red-700 text-white'
  },
  // ... info e success
}
```

### Animações

```typescript
// Fade in + Zoom in suave
className="animate-in fade-in zoom-in duration-200"
```

### Overlay com Blur

```typescript
// Fundo escuro com blur
className="fixed inset-0 bg-black/50 backdrop-blur-sm"
```

## Funcionalidades

### 1. Fechar Modal

- ✅ Clicando no `X` no canto superior direito
- ✅ Clicando no botão de confirmação
- ✅ Clicando no overlay (fundo escuro)

### 2. Texto Customizado do Botão

```typescript
<AlertModal
  confirmText="OK, Entendi!"
  // ...
/>
```

### 3. Múltiplas Linhas

Strings com `\n` são automaticamente quebradas em parágrafos:

```typescript
showAlert(
  'Título',
  'Linha 1\n\nLinha 2\n\nLinha 3',
  'info'
)
```

## Arquivos Modificados

### Criados:
- ✅ `src/components/ui/alert-modal.tsx` - Componente do modal

### Modificados:
- ✅ `src/app/page.tsx` - Usa modal ao invés de alert()
- ✅ `src/components/calendar/DateRangePicker.tsx` - Usa modal

## Vantagens

### vs Alert do Navegador

| Recurso | alert() | Modal Customizado |
|---------|---------|-------------------|
| Visual | ❌ Genérico do navegador | ✅ Profissional e consistente |
| Cores | ❌ Sem cores | ✅ 4 esquemas de cores |
| Ícones | ❌ Sem ícones | ✅ Ícones temáticos |
| Conteúdo | ❌ Só texto | ✅ JSX/HTML rico |
| Animações | ❌ Sem animações | ✅ Fade in + Zoom |
| Responsivo | ❌ Não | ✅ Sim |
| Customizável | ❌ Não | ✅ Totalmente |
| Acessibilidade | ⚠️ Básica | ✅ Melhor |

## Teste Agora!

1. Acesse: `http://localhost:3000/`
2. Ative modo multi-seleção
3. Selecione datas com conflito
4. Clique em horário ocupado
5. **Veja o modal bonito aparecer!** 🎉

## Exemplo Visual

### Modal de Conflito

```
┌─────────────────────────────────────────────────┐
│  [⚠️]  ⚠️ Conflito de Horários          [X]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  O horário selecionado conflita com             │
│  agendamentos existentes nas seguintes datas:   │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │  [seg 27/10]  [qua 29/10]  [sex 31/10] │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  Sugestões:                                     │
│  • Escolha outro horário disponível             │
│  • Ou volte e remova as datas com conflito      │
│                                                 │
│                         [    Entendi    ]       │
└─────────────────────────────────────────────────┘
```

---

**Data**: 24/10/2024  
**Status**: Implementado e funcionando  
**Tipo**: Modal customizado profissional

