@echo off
REM ======================================================
REM   SMS Monitor - One-Click Deploy Script
REM ======================================================
REM   Builds the debug APK and installs it on the
REM   connected Android device via ADB.
REM
REM   Usage:
REM     deploy.bat              Build + install (default)
REM     deploy.bat build        Build only
REM     deploy.bat install      Install only (no rebuild)
REM     deploy.bat logs         Show Logcat for the app
REM     deploy.bat uninstall    Uninstall the app
REM     deploy.bat clean        Clean build artifacts
REM ======================================================

setlocal

set "PROJECT_DIR=%~dp0"
set "ANDROID_SDK=C:\Users\jokos\AppData\Local\Android\Sdk"
set "ADB=%ANDROID_SDK%\platform-tools\adb.exe"
set "APK=%PROJECT_DIR%app\build\outputs\apk\debug\app-debug.apk"
set "PACKAGE=com.smsmonitor"
set "ACTION=%~1"

if "%ACTION%"=="" set "ACTION=build-install"

echo.
echo ======================================================
echo   SMS Monitor Deploy
echo   Action: %ACTION%
echo ======================================================
echo.

REM ----------------------------------------
REM Pre-flight checks
REM ----------------------------------------
echo [1/4] Checking prerequisites...

where gradlew.bat >nul 2>&1
if errorlevel 1 (
    echo [ERROR] gradlew.bat not found in %PROJECT_DIR%
    exit /b 1
)

if not exist "%ADB%" (
    echo [ERROR] ADB not found at %ADB%
    echo Please verify your Android SDK installation.
    exit /b 1
)

echo       OK - gradlew.bat found
echo       OK - adb found at %ADB%

REM ----------------------------------------
REM Set environment
REM ----------------------------------------
set "ANDROID_HOME=%ANDROID_SDK%"
set "PATH=%ANDROID_SDK%\platform-tools;%PATH%"

REM ----------------------------------------
REM CLEAN
REM ----------------------------------------
if "%ACTION%"=="clean" goto :do_clean
if "%ACTION%"=="uninstall" goto :do_uninstall
if "%ACTION%"=="logs" goto :do_logs
if "%ACTION%"=="install" goto :do_install
if "%ACTION%"=="build" goto :do_build
if "%ACTION%"=="build-install" goto :do_build_install

echo [ERROR] Unknown action: %ACTION%
echo Valid actions: build, install, build-install, clean, uninstall, logs
exit /b 1

REM ----------------------------------------
REM BUILD
REM ----------------------------------------
:do_build
echo.
echo [2/4] Building debug APK...
cd /d "%PROJECT_DIR%"
call gradlew.bat assembleDebug --no-daemon
if errorlevel 1 (
    echo [ERROR] Build failed!
    exit /b 1
)
echo.
echo [OK] Build complete: %APK%
goto :show_apk_info

:do_build_install
echo.
echo [2/4] Building debug APK...
cd /d "%PROJECT_DIR%"
call gradlew.bat assembleDebug --no-daemon
if errorlevel 1 (
    echo [ERROR] Build failed!
    exit /b 1
)
echo.
echo [OK] Build complete: %APK%
echo.
goto :do_install

REM ----------------------------------------
REM INSTALL
REM ----------------------------------------
:do_install
echo [3/4] Checking connected devices...
"%ADB%" devices | findstr /R "device$" >nul
if errorlevel 1 (
    echo [ERROR] No device connected. Connect a device via USB or run 'adb connect' for wireless.
    echo.
    echo Current device list:
    "%ADB%" devices
    exit /b 1
)

if not exist "%APK%" (
    echo [ERROR] APK not found at %APK%
    echo Run 'deploy.bat build' first.
    exit /b 1
)

echo       Devices connected:
"%ADB%" devices
echo.
echo [4/4] Installing APK on device...
"%ADB%" install -r "%APK%"
if errorlevel 1 (
    echo [ERROR] Installation failed!
    exit /b 1
)

echo.
echo ======================================================
echo   [SUCCESS] App installed!
echo   Launch: %ADB% shell am start -n %PACKAGE%/.app.MainActivity
echo   Logs:   deploy.bat logs
echo ======================================================
goto :eof

REM ----------------------------------------
REM LOGS
REM ----------------------------------------
:do_logs
echo [3/3] Streaming Logcat for SmsMonitor...
echo Press Ctrl+C to stop.
echo.
"%ADB%" logcat -s SmsMonitor:D SmsMonitorApp:D SmsBroadcastReceiver:D KeywordService:D SmsForwardWorker:D
goto :eof

REM ----------------------------------------
REM UNINSTALL
REM ----------------------------------------
:do_uninstall
echo [3/3] Uninstalling %PACKAGE%...
"%ADB%" uninstall %PACKAGE%
if errorlevel 1 (
    echo [ERROR] Uninstall failed!
    exit /b 1
)
echo [OK] App uninstalled.
goto :eof

REM ----------------------------------------
REM CLEAN
REM ----------------------------------------
:do_clean
echo [3/3] Cleaning build artifacts...
cd /d "%PROJECT_DIR%"
call gradlew.bat clean --no-daemon
if errorlevel 1 (
    echo [ERROR] Clean failed!
    exit /b 1
)
echo [OK] Clean complete.
goto :eof

REM ----------------------------------------
REM SHOW APK INFO
REM ----------------------------------------
:show_apk_info
echo.
echo APK details:
dir "%APK%" | findstr "app-debug"
echo.
echo Install with: deploy.bat install
echo Or:           adb install -r "%APK%"
goto :eof

endlocal