#!/bin/bash

echo "🛡️  Iniciando Discord Anti-Raid Bot..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale Node.js 16+"
    exit 1
fi

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Por favor, copie .env.example para .env e configure seus tokens"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

echo ""
echo "✅ Tudo pronto!"
echo ""
echo "Para iniciar o bot:"
echo "  npm start       - Iniciar apenas o bot"
echo "  npm run dashboard - Iniciar apenas o painel"
echo "  npm run all     - Iniciar bot + painel"
echo ""
