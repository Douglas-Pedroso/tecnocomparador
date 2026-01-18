# Guia de Implementação - Row Level Security (RLS)

## ⚠️ Problema Identificado

O Supabase está alertando sobre **4 problemas críticos de segurança**:
- RLS desabilitado nas tabelas: `usuarios`, `produtos`, `favoritos`, `historico_pesquisas`
- Isso significa que qualquer pessoa pode acessar/modificar dados diretamente no banco

## ✅ Solução Implementada

### 1. Políticas de Segurança RLS

Criamos o arquivo `backend/config/rls-policies.sql` com políticas que:

#### **Tabela `usuarios`**
- ✅ Usuários podem ver/editar apenas seus próprios dados
- ✅ Permitir registro de novos usuários

#### **Tabela `produtos`** (cache público)
- ✅ Todos podem ler produtos
- ✅ Apenas backend autenticado pode inserir/atualizar

#### **Tabela `favoritos`**
- ✅ Usuários veem apenas seus próprios favoritos
- ✅ Podem adicionar/deletar apenas seus favoritos

#### **Tabela `historico_pesquisas`**
- ✅ Usuários veem apenas seu próprio histórico
- ✅ Podem adicionar/deletar apenas seu histórico

### 2. Atualização do Backend

- ✅ Middleware de autenticação atualizado para definir contexto do usuário
- ✅ Cada requisição autenticada define o `user_id` no contexto do banco

## 📋 Passos para Aplicar

### Passo 1: Aplicar Políticas RLS no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie e cole o conteúdo de `backend/config/rls-policies.sql`
5. Clique em **Run** para executar

### Passo 2: Deploy do Backend Atualizado

```bash
# Fazer commit das alterações
git add backend/middleware/auth.js backend/config/rls-policies.sql
git commit -m "Security: Adiciona políticas RLS e atualiza middleware de auth"
git push

# O Render fará o deploy automático
```

### Passo 3: Verificar Segurança

Após aplicar as políticas, volte ao **Supabase → Database Settings → Security Advisor** e verifique que os alertas críticos foram resolvidos.

## 🔒 Como Funciona

### Antes (SEM RLS)
```
Cliente → API → Banco de Dados
                 ↓
           Acesso total! ❌
```

### Depois (COM RLS)
```
Cliente → API (verifica JWT) → Define user_id no contexto
                                       ↓
                            Banco aplica políticas RLS
                                       ↓
                            Retorna apenas dados permitidos ✅
```

## ⚡ Outros Problemas Identificados

### Índices Não Utilizados
- **Status**: Não crítico
- **Ação**: Pode ignorar por enquanto. Se o banco crescer muito, considere remover índices desnecessários

### Foreign Keys Sem Índice
- **Status**: Impacto em performance
- **Ação**: Já temos índices nas colunas `usuario_id` das tabelas `favoritos` e `historico_pesquisas`

### Function Search Path Mutable
- **Status**: Aviso de segurança menor
- **Ação**: A função `atualizar_timestamp()` é segura neste contexto

## 🧪 Testar Após Implementação

1. Faça login no site
2. Adicione um favorito
3. Tente acessar o histórico
4. Verifique que funciona normalmente

Se houver erros, verifique os logs do Render para identificar problemas.

## 📝 Notas Importantes

- As políticas RLS são aplicadas **no nível do banco de dados**
- Mesmo se alguém tentar acessar diretamente o Supabase, as políticas bloqueiam
- O backend continua funcionando normalmente, apenas com segurança adicional
- Para operações de scraping/atualização de produtos, use a conexão direta (não afetada por RLS)
