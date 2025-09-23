# 🛡️ Práticas Seguras - Base de Dados

## ⚠️ NUNCA FAZER

### 1. **Reset Forçado do Banco**
```bash
# ❌ NUNCA USAR - Apaga TODOS os dados
npx prisma db push --force-reset
```

### 2. **Comandos Destrutivos Sem Backup**
- `DROP TABLE`
- `TRUNCATE`
- `DELETE FROM` sem WHERE específico

## ✅ SEMPRE FAZER

### 1. **Backup Antes de Mudanças**
```bash
# Fazer backup antes de qualquer alteração
pg_dump DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. **Migrações Seguras**
```bash
# Usar migrações normais
npx prisma migrate dev
npx prisma db push  # SEM --force-reset
```

### 3. **Testar em Desenvolvimento Primeiro**
- Sempre testar mudanças em ambiente local
- Verificar se dados importantes não serão perdidos
- Fazer backup do ambiente de produção

## 🔧 Comandos Seguros

### Sincronizar Schema (SEM apagar dados)
```bash
npx prisma db push
```

### Gerar Cliente
```bash
npx prisma generate
```

### Ver Status
```bash
npx prisma migrate status
```

## 📋 Checklist de Segurança

Antes de qualquer comando que afete o banco:

- [ ] Backup criado? 
- [ ] Testado em desenvolvimento?
- [ ] Comando não contém `--force-reset`?
- [ ] Dados importantes identificados?
- [ ] Plano de rollback preparado?

## 🆘 Recuperação de Emergência

Se dados foram perdidos:

1. Verificar backups automáticos do Neon/Vercel
2. Contactar suporte da plataforma
3. Restaurar de backup manual se disponível
4. Recriar dados críticos manualmente
