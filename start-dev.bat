@echo off
cd /d "%~dp0"
set NODE_ENV=development
echo Starting on %date% %time% > dev-server.log
call npx tsx watch server/_core/index.ts >> dev-server.log 2>&1
