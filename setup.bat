@echo off
echo ARC Task Tracker - Local Setup
echo ================================
echo.

REM Try to find node from the portable installation or system
SET NODE_PATH=C:\node
IF EXIST "%NODE_PATH%\node.exe" (
    SET PATH=%NODE_PATH%;%PATH%
    echo Found portable Node.js at C:\node
) ELSE (
    where node >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo ERROR: Node.js not found.
        echo Please install Node.js from https://nodejs.org
        pause
        exit /b 1
    )
)

echo Node version:
node --version
echo npm version:
npm --version
echo.

echo Installing dependencies...
npm install
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo.
echo Starting development server...
echo Open http://localhost:5173 in your browser.
echo Press Ctrl+C to stop.
echo.
npm run dev
pause
