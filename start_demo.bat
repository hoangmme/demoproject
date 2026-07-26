@echo off
echo ===================================================
echo CHUONG TRINH KHOI DONG HE THONG QUAN LY CAN BO
echo ===================================================
echo.
echo Dang cai dat thu vien neu chua co (Vui long doi)...
call npm install
echo.
echo Dang khoi dong he thong va mo trinh duyet...
start http://localhost:3000
call npm run dev
pause
