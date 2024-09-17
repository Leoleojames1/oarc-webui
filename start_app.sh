#!/bin/bash

# Activate Conda environment
source $(conda info --base)/etc/profile.d/conda.sh
conda activate oarc_vision_gradio

if [ $? -ne 0 ]; then
    echo "Failed to activate Conda environment oarc_vision_gradio"
    exit 1
fi

# Start Flask backend
echo "Starting Flask backend..."
cd backend
python app.py &

# Start React frontend
echo "Starting React frontend..."
cd ../frontend
npm start &

echo "Both servers should now be starting. Check the terminal output for details."

# Wait for user input before closing
read -p "Press any key to exit..."

# Kill background processes when script exits
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT