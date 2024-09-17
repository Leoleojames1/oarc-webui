@echo off

REM Activate Conda environment
call conda activate oarc_vision_gradio
if %ERRORLEVEL% neq 0 (
    echo Failed to activate Conda environment oarc_vision_gradio
    pause
    exit /b %ERRORLEVEL%
)

REM Start Flask backend
echo Starting Flask backend...
cd backend
start cmd /k python app.py

REM Start React frontend
echo Starting React frontend...
cd ..\frontend
start cmd /k npm start

echo Both servers should now be starting. Check the opened command windows for details.
pause