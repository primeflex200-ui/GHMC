@echo off
echo Starting IALA Civic Services Server...
echo.
echo Server will be available at:
echo   http://localhost:8000/start.html
echo   http://localhost:8000/auth-system.html
echo   http://localhost:8000/index.html?access=guest
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
pause