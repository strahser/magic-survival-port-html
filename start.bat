@echo off
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel% neq 0 goto direct
echo.
echo   Magic Survival: http://localhost:8000  (logs -> Data\run-log.json)
echo   (close this window to stop the server)
echo.
timeout /t 1 /nobreak >nul
start "" http://localhost:8000
python serve.py
goto :eof
:direct
echo.
echo   Python not found - server is not required anyway.
echo   Opening index.html directly...
echo.
start "" "%~dp0index.html"