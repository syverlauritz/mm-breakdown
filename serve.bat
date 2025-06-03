@echo off
echo Starting Memory Maker Shot Breakdown server...
echo.
echo The server will be available at:
echo   http://localhost:8000
echo   http://127.0.0.1:8000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Try Python 3 first
python -m http.server 8000 2>nul
if %errorlevel% equ 0 goto :end

REM If Python 3 fails, try Python 2
echo Python 3 not found, trying Python 2...
python -m SimpleHTTPServer 8000 2>nul
if %errorlevel% equ 0 goto :end

REM If both fail, show error
echo.
echo Error: Python not found or not in PATH
echo Please install Python 3 and make sure it's in your PATH
echo You can download Python from: https://www.python.org/downloads/
echo.
pause

:end 