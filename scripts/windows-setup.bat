@echo off
echo Setting up Honeypot Cybersecurity System on Windows...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found. Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Setup complete! You can now run:
echo   npm run dev     - Start development server
echo   npm run build   - Build for production
echo   npm run preview - Preview production build
echo.
pause