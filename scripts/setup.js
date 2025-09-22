#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupProject() {
  console.log('\n🚀 Configurando Sistema de Agenda Executiva...\n');

  try {
    // 1. Verificar se o .env.local existe
    if (!fs.existsSync('.env.local')) {
      console.log('📝 Configurando variáveis de ambiente...');
      
      const companyName = await question('Nome da empresa: ');
      const directorName = await question('Nome do diretor: ');
      const directorEmail = await question('Email do diretor: ');
      const secretaryEmail = await question('Email da secretária: ');
      const smtpHost = await question('SMTP Host (ex: mail.seudominio.com.br): ');
      const smtpUser = await question('SMTP User (ex: agenda@seudominio.com.br): ');
      const smtpPass = await question('SMTP Password: ');
      const databaseUrl = await question('Database URL (PostgreSQL): ');

      const envContent = `# Base URL
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}

# Database
DATABASE_URL="${databaseUrl}"

# SMTP Configuration (Domínio Próprio)
SMTP_HOST=${smtpHost}
SMTP_PORT=587
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}
SMTP_FROM="Agenda Executiva <${smtpUser}>"

# Director Information
DIRECTOR_NAME="${directorName}"
DIRECTOR_EMAIL=${directorEmail}
SECRETARY_EMAIL=${secretaryEmail}

# Company Info
COMPANY_NAME="${companyName}"
`;

      fs.writeFileSync('.env.local', envContent);
      console.log('✅ Arquivo .env.local criado');
    }

    // 2. Instalar dependências
    console.log('\n📦 Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });

    // 3. Gerar cliente Prisma
    console.log('\n🔧 Configurando banco de dados...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma db push', { stdio: 'inherit' });

    // 4. Build do projeto
    console.log('\n🏗️ Compilando projeto...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('\n🎉 Setup concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. npm run dev - Iniciar servidor de desenvolvimento');
    console.log('2. Acesse http://localhost:3000/api/setup para configurar dados iniciais');
    console.log('3. Acesse http://localhost:3000/admin/login para o painel administrativo');
    console.log('   - Email: secretaria@seudominio.com.br');
    console.log('   - Senha: admin123');
    console.log('\n🔗 Links úteis:');
    console.log('- Painel público: http://localhost:3000');
    console.log('- Painel admin: http://localhost:3000/admin');
    console.log('- Prisma Studio: npx prisma studio');

  } catch (error) {
    console.error('\n❌ Erro no setup:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupProject();

