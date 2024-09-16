# Navigate to the backend directory
   cd backend

   # Create a virtual environment
   python -m venv venv

   # Activate the virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS and Linux:
   source venv/bin/activate

   # Install required packages
   pip install flask flask-cors flask-socketio mss numpy pillow pytesseract opencv-python

   # Create a requirements.txt file
   pip freeze > requirements.txt