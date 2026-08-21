@echo off
title HE THONG QUAN LY HO SO CAN BO (OFFLINE)
color 0A
echo ============================================================
echo   DANG KHOI DONG HE THONG QUAN LY HO SO CAN BO (OFFLINE)...
echo ============================================================

timeout /t 2 >nul
start "" http://localhost

node app_server.js

pause
