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
echo 3. Iniciando servidor HTTP para el frontend en puerto 5500...
echo    (IMPORTANTE: No abrir login.html directamente, usar el servidor HTTP)
start "Servidor Frontend SICAG" cmd /k "npx -y http-server . -p 5500 -c-1 --cors"

echo.
echo 4. Esperando 3 segundos para que el frontend arranque...
timeout /t 3 /nobreak > NUL

echo.
echo 5. Abriendo la aplicacion en el navegador...
start http://localhost:5500/login.html

echo.
echo ========================================================
echo LISTO! Ya puedes ingresar con:
echo Correo: admin@sicag.com
echo Clave: alvaro.09
echo.
echo Frontend: http://localhost:5500/login.html
echo Backend:  http://localhost:3000/api
echo ========================================================
pause
