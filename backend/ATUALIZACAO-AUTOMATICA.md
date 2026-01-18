# 🤖 Script de Atualização Automática

Este script permite atualizar a base de dados automaticamente sem fazer scraping em tempo real.

## 📋 Como usar

### 1️⃣ Executar manualmente

```bash
cd backend
node scrape-and-save.js
```

Você pode passar um termo de busca diferente:
```bash
node scrape-and-save.js "telemóvel"
node scrape-and-save.js "tablet"
```

### 2️⃣ Agendar execução automática (Windows)

#### Usando Agendador de Tarefas do Windows:

1. Abra o **Agendador de Tarefas** (Task Scheduler)
2. Clique em **"Criar Tarefa Básica"**
3. Nome: `Atualizar Tecnocomparador`
4. Gatilho: **Diariamente** às 6:00 da manhã
5. Ação: **Iniciar um programa**
6. Programa: `C:\Program Files\nodejs\node.exe`
7. Argumentos: `scrape-and-save.js`
8. Iniciar em: `C:\Users\tragi\Desktop\comparador\backend`

#### Usando script PowerShell:

Crie um arquivo `agendar-atualizacao.ps1`:

```powershell
$action = New-ScheduledTaskAction -Execute "node" -Argument "scrape-and-save.js" -WorkingDirectory "C:\Users\tragi\Desktop\comparador\backend"
$trigger = New-ScheduledTaskTrigger -Daily -At 6:00AM
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "Atualizar Tecnocomparador" -Description "Atualiza produtos do comparador diariamente"
```

Execute: `powershell -ExecutionPolicy Bypass -File agendar-atualizacao.ps1`

### 3️⃣ Múltiplos termos de busca

Crie um script `atualizar-tudo.js`:

```javascript
const { execSync } = require('child_process');

const termos = ['notebook', 'telemóvel', 'tablet', 'monitor', 'rato', 'teclado'];

for (const termo of termos) {
  console.log(`\n🔄 Atualizando: ${termo}`);
  execSync(`node scrape-and-save.js "${termo}"`, { stdio: 'inherit' });
}

console.log('\n✅ Todas as atualizações concluídas!');
```

Execute: `node atualizar-tudo.js`

## 📊 Como funciona

1. **Script roda localmente** → Seu computador tem RAM suficiente para Puppeteer
2. **Faz scraping das 6 lojas** → Coleta produtos reais
3. **Salva no Supabase** → Banco na nuvem (gratuito)
4. **Render busca do banco** → Servidor só consulta dados já salvos (rápido e leve)

## ✅ Vantagens

- ✅ 100% gratuito
- ✅ Dados reais das lojas
- ✅ Servidor em produção leve e rápido
- ✅ Pode rodar quantas vezes quiser
- ✅ Pode agendar para rodar automaticamente

## ⚠️ Considerações

- 📅 Dados têm até 24h de atraso (se rodar 1x por dia)
- 🔄 Produtos mais antigos que 7 dias são removidos automaticamente
- ⭐ Produtos favoritados nunca são removidos

## 📈 Logs

O script mostra informações detalhadas:
- Quantos produtos foram encontrados por loja
- Quantos novos foram salvos
- Quantos foram atualizados
- Quantos foram removidos (antigos)
