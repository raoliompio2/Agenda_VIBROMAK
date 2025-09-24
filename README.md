# 📅 Sistema de Recepção Vibromak

Sistema completo de agendamento online para reuniões executivas, desenvolvido com Next.js 14, TypeScript, Prisma e PostgreSQL.

## ✨ Funcionalidades

### 📱 Painel Público
- Visualização da agenda pública do diretor
- Calendário interativo com disponibilidade
- Formulário de solicitação de agendamento
- Design responsivo e moderno

### 🔐 Painel Administrativo
- Autenticação segura para secretária
- Gerenciamento de agendamentos (confirmar/cancelar/reagendar)
- Dashboard com estatísticas
- Configurações do sistema

### 📧 Notificações por Email
- SMTP customizado para domínio próprio
- Emails automáticos de confirmação
- Notificações para diretor e secretária

### ⚙️ Configurações
- Horários de funcionamento
- Duração das reuniões
- Dias úteis personalizáveis
- Informações da empresa

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL
- Conta de email SMTP (domínio próprio)

### 1. Clone o projeto
```bash
git clone <url-do-repositorio>
cd painel-agenda-diretor
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` baseado no `.env.example`:

```bash
# Base URL
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-muito-segura

# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/painel_agenda"

# SMTP Configuration (Domínio Próprio)
SMTP_HOST=mail.seudominio.com.br
SMTP_PORT=587
SMTP_USER=agenda@seudominio.com.br
SMTP_PASS=sua-senha-smtp
SMTP_FROM="Recepção Vibromak <agenda@seudominio.com.br>"

# Director Information
DIRECTOR_NAME="Nome do Diretor"
DIRECTOR_EMAIL=diretor@seudominio.com.br
SECRETARY_EMAIL=secretaria@seudominio.com.br

# Company Info
COMPANY_NAME="Nome da Empresa"
```

### 4. Configure o banco de dados
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma db push

# (Opcional) Visualizar banco
npx prisma studio
```

### 5. Configure dados iniciais
Execute a API de setup para criar usuário administrativo e configurações:

```bash
# Inicie o servidor
npm run dev

# Em outro terminal, execute:
curl -X POST http://localhost:3000/api/setup
```

### 6. Acesse o sistema
- **Painel Público**: http://localhost:3000
- **Painel Admin**: http://localhost:3000/admin

**Credenciais iniciais:**
- Email: `secretaria@seudominio.com.br`
- Senha: `admin123`

## 📋 Como Usar

### Para o Público
1. Acesse a página principal
2. Visualize a agenda pública do diretor
3. Clique em "Solicitar Reunião"
4. Preencha o formulário com seus dados
5. Selecione data e horário disponível
6. Aguarde confirmação por email

### Para a Secretária
1. Acesse `/admin/login`
2. Faça login com as credenciais
3. Visualize solicitações pendentes
4. Confirme ou cancele agendamentos
5. Configure o sistema em "Configurações"

## 🔧 Configuração de Email

Para usar seu domínio próprio:

1. Configure as variáveis SMTP no `.env.local`
2. Teste o envio de emails
3. Ajuste as configurações conforme necessário

### Exemplo de configuração:
```bash
SMTP_HOST=mail.minhaempresa.com.br
SMTP_PORT=587
SMTP_USER=agenda@minhaempresa.com.br
SMTP_PASS=minhasenha123
SMTP_FROM="Recepção Vibromak <agenda@minhaempresa.com.br>"
```

## 🏗️ Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── admin/             # Páginas administrativas
│   ├── api/               # API Routes
│   └── agendar/           # Página de agendamento
├── components/            # Componentes reutilizáveis
│   ├── ui/                # Componentes de interface
│   ├── calendar/          # Componentes de calendário
│   ├── appointments/      # Componentes de agendamento
│   └── forms/             # Formulários
├── lib/                   # Utilitários e configurações
└── prisma/               # Schema do banco de dados
```

## 📦 Tecnologias Utilizadas

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco**: PostgreSQL
- **Autenticação**: NextAuth.js
- **Email**: Nodemailer
- **UI**: Radix UI, Lucide Icons

## 🔒 Segurança

- Autenticação JWT com NextAuth.js
- Middleware de proteção de rotas
- Validação de dados com Zod
- Sanitização de entradas
- Rate limiting (recomendado para produção)

## 🚀 Deploy em Produção

### Vercel (Recomendado)
1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Configure banco PostgreSQL (Supabase/Neon)
4. Deploy automático

### Docker
```bash
# Build
docker build -t agenda-executiva .

# Run
docker run -p 3000:3000 agenda-executiva
```

## 📝 Próximas Funcionalidades

- [ ] Integração com Google Calendar
- [ ] Lembretes via WhatsApp
- [ ] Relatórios de agendamentos
- [ ] Multi-idiomas
- [ ] API pública
- [ ] Aplicativo móvel

## 🐛 Solução de Problemas

### Erro de conexão com banco
Verifique a `DATABASE_URL` no `.env.local`

### Emails não são enviados
Verifique as configurações SMTP e credenciais

### Erro de autenticação
Regenere o `NEXTAUTH_SECRET`

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs do console
3. Abra uma issue no repositório

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para otimizar o gerenciamento de agendas executivas**

