@echo off
setlocal enabledelayedexpansion

:: Use the environment variables you have set
:: OARC_API points to the ollama_agent_roll_cage folder
:: OARC_WEBUI_API points to the oarc-webui folder

:: Start the WebUI server
start cmd.exe /c "%OARC_API%\ollama_mod_cage\oarc_api_START.cmd"

:: Wait for a few seconds to ensure the WebUI server starts up
ping localhost -n 3 >nul

:: Start the API server

start cmd.exe /c "%OARC_WEBUI_API%\oarc-next\oarc-webui-start-script.cmd"
endlocal
