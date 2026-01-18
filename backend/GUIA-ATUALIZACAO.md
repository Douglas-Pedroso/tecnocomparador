# 🎯 Scripts de Atualização - Guia de Escolha

## 📊 Comparação dos Scripts

| Script | Categorias | Tempo | Produtos | Uso |
|--------|-----------|-------|----------|-----|
| `scrape-and-save.js` | 1 específica | ~3min | ~200-500 | Atualizar 1 categoria |
| `atualizar-top20.js` | 20 populares | ~1h | ~4.000-6.000 | **Recomendado para início** |
| `atualizar-todas-categorias.js` | 135 completas | ~6-7h | ~20.000+ | Catálogo completo |

## 🚀 Qual usar?

### ✅ **Primeira vez (AGORA):**
```bash
node atualizar-top20.js
```
**Por quê?** Cobre as categorias mais buscadas em ~1 hora.

### 🔄 **Manutenção semanal:**
```bash
node atualizar-top20.js
```
**Por quê?** Mantém produtos atualizados nas categorias principais.

### 📦 **Catálogo completo (fim de semana):**
```bash
node atualizar-todas-categorias.js
```
**Por quê?** Cobre absolutamente tudo, mas demora bastante.

### 🎯 **Categoria específica:**
```bash
node scrape-and-save.js "placa gráfica"
```
**Por quê?** Rápido quando precisa atualizar algo específico.

## 📋 TOP 20 Categorias (atualizar-top20.js)

1. Portáteis
2. Telemóveis
3. Televisões
4. Tablets
5. Smartwatches
6. Headphones
7. Teclados
8. Ratos
9. Monitores
10. Impressoras
11. Frigoríficos
12. Máquinas Lavar Roupa
13. Aspiradores
14. Ar Condicionado
15. Câmaras
16. Consolas
17. Routers
18. SSDs
19. Powerbanks
20. Colunas Bluetooth

## 📚 TODAS as 135 Categorias (atualizar-todas-categorias.js)

### 💻 Computadores (5)
- notebook, portátil, computador, desktop, all-in-one

### 🔧 Componentes PC (10)
- processador, placa gráfica, RAM, motherboard, SSD, disco rígido, fonte alimentação, caixa PC, cooler, ventoinha

### 📱 Telemóveis (6)
- telemóvel, smartphone, tablet, ipad, iphone, samsung galaxy

### 📺 Ecrãs (6)
- televisão, TV, smart TV, monitor, monitor gaming, projetor

### ⌨️ Periféricos (15)
- teclado, rato, webcam, microfone, headset, headphones, auriculares, colunas, coluna bluetooth, soundbar, pen drive, hub USB, adaptador

### 🖨️ Impressoras (5)
- impressora, multifunções, scanner, tinta impressora, toner

### 📷 Fotografia (8)
- câmara, máquina fotográfica, câmara vídeo, gopro, drone, gimbal, tripé, cartão memória

### 🎮 Gaming (8)
- consola, playstation, PS5, xbox, nintendo switch, comando, joystick, volante gaming, cadeira gaming

### 🌐 Networking (5)
- router, switch, repetidor wifi, access point, powerline

### ⌚ Wearables (4)
- smartwatch, smartband, relógio inteligente, pulseira atividade

### 🔌 Acessórios Mobile (6)
- powerbank, carregador, cabo USB, capa telemóvel, película, suporte carro

### 💾 Armazenamento (4)
- disco externo, NAS, pen USB, cartão SD

### 🎵 Áudio (6)
- earbuds, airpods, coluna portátil, amplificador, leitor CD

### 🏠 Eletrodomésticos Grandes (9)
- frigorífico, máquina lavar roupa, máquina lavar loiça, fogão, forno, micro-ondas, exaustor, arca congeladora

### ❄️ Climatização (4)
- ar condicionado, aquecedor, desumidificador, purificador ar

### 🍳 Pequenos Eletrodomésticos (11)
- aspirador, robot aspirador, ferro engomar, torradeira, batedeira, liquidificador, cafeteira, chaleira, fritadeira ar, processador alimentos

### 🏡 Casa Inteligente (10)
- coluna inteligente, alexa, google home, lâmpada inteligente, tomada inteligente, termostato, fechadura inteligente, campainha vídeo, câmara vigilância

### 🖥️ Escritório (6)
- cadeira escritório, secretária, mesa digitalizadora, calculadora, destruidor papel, plastificadora

## ⚡ Dicas de Performance

### Se tiver pressa:
```bash
# Só as 10 mais importantes (~30min)
node scrape-and-save.js "portátil"
node scrape-and-save.js "telemóvel"
node scrape-and-save.js "televisão"
node scrape-and-save.js "tablet"
node scrape-and-save.js "smartwatch"
node scrape-and-save.js "headphones"
node scrape-and-save.js "frigorífico"
node scrape-and-save.js "aspirador"
node scrape-and-save.js "câmara"
node scrape-and-save.js "consola"
```

### Para deixar rodando de noite:
```bash
node atualizar-todas-categorias.js
```
Deixe o computador ligado, vai popular tudo!

## 📊 Estimativa de Produtos no Banco

- **TOP 20:** ~4.000-6.000 produtos
- **TODAS (135):** ~20.000-30.000 produtos
- **Limite Supabase Free:** 500MB (~50.000+ produtos)

## 🎯 Recomendação

1. **Agora:** `node atualizar-top20.js` (1 hora)
2. **Teste o site:** Veja se tem variedade suficiente
3. **Se precisar mais:** `node atualizar-todas-categorias.js` (fim de semana)
4. **Manutenção:** TOP 20 semanal
