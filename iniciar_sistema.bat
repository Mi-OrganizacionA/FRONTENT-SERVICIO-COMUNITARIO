@echo off
color 0A
echo ========================================================
echo        INICIANDO SISTEMA SICAG (BACKEND + FRONTEND)
echo ========================================================
echo.
echo 1. Iniciando el servidor backend en puerto 3000...
cd backend
start "Servidor Backend SICAG" cmd /k "npm install && npm run dev"
cd ..

echo.
echo 2. Esperando 5 segundos para que el backend despierte...
timeout /t 5 /nobreak > NUL

echo.
echo 3. Abriendo la aplicacion web en tu navegador...
start login.html

echo.
echo ========================================================
echo LISTO! Ya puedes ingresar con:
echo Correo: admin@sicag.com
echo Clave: alvaro.09
echo ========================================================
pause
