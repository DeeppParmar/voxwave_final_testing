@echo off
echo Starting VoxWave Development Servers...
echo.
echo Backend will run on http://localhost:8000
echo Frontend will run on http://localhost:8080
echo.
start cmd /k "python main.py"
timeout /t 2
start cmd /k "cd main_frontend && npm run dev"
echo.
echo Both servers are starting...
pause
