# 🚀 Guia Rápido de Instalação

Sistema de Agenda Executiva - Configuração para Windows

## ✅ Pré-requisitos

Você precisará instalar estes programas primeiro:

1. **Node.js** - [Baixar aqui](https://nodejs.org/pt-br/) (versão LTS)
2. **PostgreSQL** - [Baixar aqui](https://www.postgresql.org/download/windows/)
3. **Git** - [Baixar aqui](https://git-scm.com/download/win)

## 📦 Instalação Automática

1. **Abra o PowerShell** como administrador
2. **Clone o projeto:**
   ```powershell
   git clone [URL_DO_REPOSITORIO]
   cd painel-agenda-diretor
   ```

3. **Execute o instalador automático:**
   ```powershell
   npm run setup
   ```

4. **Preencha as informações quando solicitado:**
   - Nome da empresa
   - Nome do diretor
   - Email do diretor
   - Email da secretária
   - Configurações do email corporativo (SMTP)
   - URL do banco PostgreSQL

## 🔧 Configuração Manual (se necessário)

Se o instalador automático não funcionar:

### 1. Instalar dependências:
```powershell
npm install
```

### 2. Criar arquivo `.env.local`:
Copie o arquivo `env.example` para `.env.local` e preencha:

```bash
# Configurações básicas
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=chave-secreta-segura

# Banco de dados PostgreSQL (Neon)
DATABASE_URL="postgresql://neondb_owner:npg_kWm1XyKES4GZ@ep-mute-wildflower-adxxbk3a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Email corporativo (Zoho Mail)
SMTP_HOST=smtppro.zoho.com
SMTP_PORT=587
SMTP_USER=app@opendreams.com.br
SMTP_PASS=Rafael@20213413
SMTP_FROM="Agenda Executiva <app@opendreams.com.br>"

# Informações da empresa (OpenDreams/Vibromak)
COMPANY_NAME="OpenDreams"
DIRECTOR_NAME="Rogério"
DIRECTOR_EMAIL=rogerio@vibromak.com.br
SECRETARY_EMAIL=recepcao@vibromak.com.br
```

### 3. Configurar banco:
```powershell
npx prisma generate
npx prisma db push
```

### 4. Compilar projeto:
```powershell
npm run build
```

## 🎯 Iniciar o Sistema

1. **Iniciar servidor:**
   ```powershell
   npm run dev
   ```

2. **Configurar dados iniciais:**
   - Abra: http://localhost:3000/api/setup
   - Isso criará o usuário administrador

3. **Acessar o sistema:**
   - **Agenda pública:** http://localhost:3000
   - **Painel administrativo:** http://localhost:3000/admin

## 🔐 Primeiro Acesso (Secretária)

**URL:** http://localhost:3000/admin/login

**Credenciais padrão:**
- **Email:** recepcao@vibromak.com.br
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere essas credenciais após o primeiro acesso!

## ⚙️ Configurações Importantes

### Email Corporativo
Para que os emails funcionem, você precisa:

1. **Configurar SMTP** da sua empresa
2. **Liberar acesso** para aplicações menos seguras (se necessário)
3. **Testar envio** no painel administrativo

### Horários de Funcionamento
Configure no painel admin:
- Horário de início/fim
- Dias úteis
- Duração das reuniões
- Tempo entre reuniões

## 📱 Como Usar

### Para Clientes (Público)
1. Acessam a agenda pública
2. Veem horários disponíveis
3. Preenchem formulário de solicitação
4. Recebem confirmação por email

### Para Secretária
1. Faz login no painel admin
2. Vê solicitações pendentes
3. Confirma ou rejeita agendamentos
4. Gerencia a agenda do diretor

## 🆘 Problemas Comuns

### "Erro de conexão com banco"
- Verifique se PostgreSQL está rodando
- Confirme a URL do banco no `.env.local`

### "Emails não são enviados"
- Verifique configurações SMTP
- Teste com outro provedor de email

### "Página não carrega"
- Verifique se o servidor está rodando (`npm run dev`)
- Confirme a porta 3000 está livre

## 📞 Suporte Técnico

Para problemas técnicos:
1. Verifique os logs no PowerShell
2. Consulte a documentação completa no `README.md`
3. Entre em contato com o suporte

## 🔄 Backup e Manutenção

### Backup do Banco:
```powershell
pg_dump agenda > backup.sql
```

### Atualizar Sistema:
```powershell
git pull
npm install
npm run build
```

---

**✨ Parabéns! Seu sistema de agenda executiva está pronto!**
