@echo off

REM Start Flask backend
echo Starting Flask backend...
cd backend
start cmd /k python app.py

REM Start React frontend
echo Starting React frontend...
cd ..\frontend
start cmd /k npm start

echo Both servers should now be starting. Check the opened command windows for details.