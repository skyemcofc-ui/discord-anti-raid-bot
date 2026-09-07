# Documentação do Discord Anti-Raid Bot

## 🛡️ Visão Geral

Bot profissional para proteção contra raids no Discord com painel online integrado.

## 🚀 Começando

### Requisitos
- Node.js 16+
- npm ou yarn
- Uma aplicação Discord Bot

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/skyemcofc-ui/discord-anti-raid-bot.git
   cd discord-anti-raid-bot
   ```

2. **Configure o .env**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` e adicione:
   - `DISCORD_TOKEN` - Token do seu bot Discord
   - `CLIENT_ID` - ID da sua aplicação
   - `CLIENT_SECRET` - Secret da sua aplicação
   - `SESSION_SECRET` - Qualquer string aleatória

3. **Instale dependências**
   ```bash
   npm install
   ```

4. **Inicie o bot**
   ```bash
   npm start
   ```

   Ou iniciar tudo (bot + painel):
   ```bash
   npm run all
   ```

## 📊 Painel Online

O painel fica disponível em `http://localhost:3000`

### Recursos do Painel
- 📈 Dashboard com estatísticas em tempo real
- ⚙️ Configuração de proteção anti-raid
- 📋 Histórico de ações executadas
- 👥 Gerenciamento de lista branca
- 🔐 Autenticação via Discord

## 🎮 Comandos do Bot

### `/antiraid status`
Ver o status atual da proteção.

### `/antiraid config`
Configurar a proteção:
- `threshold` - Número de entradas para ativar (padrão: 5)
- `timewindow` - Segundos para contar entradas (padrão: 10)
- `action` - Ação a tomar (ban, kick, role)

### `/whitelist add <user> [reason]`
Adicionar usuário à lista branca.

### `/whitelist remove <user>`
Remover usuário da lista branca.

### `/whitelist list`
Listar todos os usuários whitelistados.

### `/stats`
Ver estatísticas do bot e servidor.

## 💾 Otimizações de RAM

O bot foi otimizado para consumir no máximo 75-80MB de RAM:

- ✅ Intents minimalistas
- ✅ Cache inteligente
- ✅ Limpeza automática de memória
- ✅ Banco de dados SQLite leve
- ✅ Sem dependências pesadas

## 🔧 Estrutura

```
├── bot/
│   ├── index.js           # Arquivo principal
│   ├── commands/          # Comandos slash
│   ├── events/            # Eventos do bot
│   └── database/          # Camada de banco de dados
├── dashboard/
│   ├── server.js          # Servidor Express
│   └── public/            # Frontend (HTML, CSS, JS)
├── database/              # Arquivos do banco de dados
├── package.json
└── README.md
```

## 📝 Como Funciona

### Detecção de Raids

1. Bot monitora todas as entradas de membros
2. Se X membros entrarem em Y segundos, ativa proteção
3. Novos membros são banidos/expulsos automaticamente
4. Ações são registradas no banco de dados
5. Logs são enviados para um canal específico

### Lista Branca

Membros na lista branca são isentos da proteção anti-raid.

## 🔐 Segurança

- Autenticação OAuth2 do Discord
- Verificação de permissões de administrador
- Senhas de sessão
- Validação de entrada

## 📊 Monitoramento

O bot rastreia:
- Raids detectados
- Membros banidos
- Membros expulsos
- Ações executadas
- Histórico completo

## 🐛 Troubleshooting

### Erro: "Token inválido"
- Verifique se o `DISCORD_TOKEN` está correto no .env

### Painel não carrega
- Verifique se a porta 3000 está disponível
- Verifique `DASHBOARD_URL` no .env

### Alto consumo de RAM
- Reinicie o bot
- Reduza o `time_window`
- Aumente o `raid_threshold`

## 📞 Suporte

Para reportar bugs ou sugerir features, abra uma issue no repositório.

## 📄 Licença

MIT License - veja LICENSE para detalhes.

---

Desenvolvido com ❤️ para proteção de servidores Discord
