@echo off
echo 🛡️  Iniciando Discord Anti-Raid Bot...
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não está instalado. Por favor, instale Node.js 16+
    pause
    exit /b 1
)

REM Verificar se .env existe
if not exist ".env" (
    echo ❌ Arquivo .env não encontrado!
    echo 📝 Por favor, copie .env.example para .env e configure seus tokens
    pause
    exit /b 1
)

REM Instalar dependências
echo 📦 Instalando dependências...
call npm install

echo.
echo ✅ Tudo pronto!
echo.
echo Para iniciar o bot:
echo   npm start       - Iniciar apenas o bot
echo   npm run dashboard - Iniciar apenas o painel
echo   npm run all     - Iniciar bot + painel
echo.
pause
