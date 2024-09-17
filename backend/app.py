from flask import Flask, jsonify, request, Response
from flask_socketio import SocketIO
from flask_cors import CORS
import json
import numpy as np
from mss import mss
from PIL import Image
import pytesseract
import cv2
import base64
import threading
import time
import ollama
from ultralytics import YOLO
import re
import multiprocessing
import logging
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

def ensure_dir(file_path):
    directory = os.path.dirname(file_path)
    if not os.path.exists(directory):
        os.makedirs(directory)
        
class Vision:
    def __init__(self, model):
        self.model = model
        ensure_dir("model_view_output/")
        
    def start_vision(self):
        logging.getLogger('ultralytics').setLevel(logging.WARNING)
        model = YOLO(self.model, task='detect')
        sct = mss()
        monitor = sct.monitors[1]
        labels = list(model.names.values())
    
        while True:
            label_count = {label: 0 for label in labels}
            label_dict = {label: [] for label in labels}
            screen = np.array(sct.grab(monitor))
            screen = screen[:, :, :3]
            results = model(screen)

            for result in results:
                for box in result.boxes:
                    label = model.names[int(box.cls)]  
                    coords = box.xyxy[0].tolist()
                    label_count[label] += 1
                    label_dict[label].append(coords)

                for key in label_dict:
                    file_path = f"model_view_output/{key}.json"
                    ensure_dir(file_path)
                    with open(file_path, "w") as f:
                        json.dump(label_dict[key], f, indent=4)

                file_path = "model_view_output/labels.json"
                ensure_dir(file_path)
                with open(file_path, "w") as f:
                    json.dump(label_count, f, indent=2)
            
                time.sleep(0.1)

class Api:
    def __init__(self):
        self.sct = mss()
        self.monitor = self.sct.monitors[1]
        pytesseract.pytesseract.tesseract_cmd = r'C:/Program Files (x86)/Tesseract-OCR/tesseract.exe'
        ensure_dir("model_view_output/")
        
    def get_screen_labels(self):
        try:
            with open("model_view_output/labels.json", "r") as f:
                labels = json.load(f)
            return labels
        except FileNotFoundError:
            return {}

    def get_positions_from_label(self, label):
        try: 
            with open(f"model_view_output/{label}.json", "r") as f:
                coords_list = json.load(f)
            return coords_list
        except FileNotFoundError:
            return []

    def read_image(self, coords=None, image=None):
        if coords:
            screen = np.array(self.sct.grab(self.monitor))
            coords = [int(x) for x in coords]
            x1, y1, x2, y2 = coords
            try:
               x1 = max(0, x1 - 5)
               y1 = max(0, y1 - 5)
               x2 = min(screen.shape[1], x2 + 5)
               y2 = min(screen.shape[0], y2 + 5)
            except:
                pass
            image = screen[y1:y2, x1:x2]
            image = Image.fromarray(image)
        
        if image is not None:
            text = pytesseract.image_to_string(image)
            return text
        return ""

    def get_screen_with_boxes(self):
        screen = np.array(self.sct.grab(self.monitor))
        screen = cv2.cvtColor(screen, cv2.COLOR_RGBA2RGB)
        
        labels = self.get_screen_labels()
        for label, count in labels.items():
            positions = self.get_positions_from_label(label)
            for pos in positions:
                x1, y1, x2, y2 = map(int, pos)
                cv2.rectangle(screen, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(screen, f"{label}: {count}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        return screen

    def remove_non_ascii(self, text):
        return re.sub(r'[^\x00-\x7F]+', '', text)

    def updating_text(self, model):
        model = YOLO(model, task='detect')  # Explicitly specify the task
        labels = list(model.names.values())

        while True:
            file_path = "model_view_output/text.json"
            ensure_dir(file_path)
            if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
                with open(file_path, "w") as f:
                    json.dump([], f)
            
            with open(file_path, "r") as f:
                try:
                    coords_list = json.load(f)
                except json.JSONDecodeError:
                    coords_list = []
        
            names = []
            for coords in coords_list:
                names.append(self.read_image(coords=coords))
        
            names = [name.replace('\n', '') for name in names]
            names = [self.remove_non_ascii(name) for name in names]

            position_names = {text: [] for text in names}

            for i, key in enumerate(names):
                position_names[key] = coords_list[i]

            with open("model_view_output/sumirize.json", "w") as f:
                json.dump(position_names, f, indent=3)
            time.sleep(1)

api = Api()

@app.route('/labels', methods=['GET'])
def get_labels():
    labels = api.get_screen_labels()
    return jsonify(labels)

@app.route('/positions/<label>', methods=['GET'])
def get_positions(label):
    positions = api.get_positions_from_label(label)
    return jsonify(positions)

@app.route('/read_image', methods=['POST'])
def read_image():
    coords = request.json['coords']
    text = api.read_image(coords=coords)
    return jsonify({'text': text})

def generate_frames():
    while True:
        frame = api.get_screen_with_boxes()
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def stream_video():
    print("Starting video stream...")
    while True:
        try:
            print("Getting screen with boxes...")
            frame = api.get_screen_with_boxes()
            print("Encoding frame...")
            _, buffer = cv2.imencode('.jpg', frame)
            print("Encoding to base64...")
            base64_image = base64.b64encode(buffer).decode('utf-8')
            print(f"Emitting video frame... (length: {len(base64_image)})")
            socketio.emit('video_frame', {'image': base64_image})
            print("Frame emitted successfully")
        except Exception as e:
            print(f"Error in stream_video: {str(e)}")
        time.sleep(0.1)  # Adjust this value to control the frame rate

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    socketio.start_background_task(stream_video)

@app.route('/chat', methods=['POST'])
def chat():
    message = request.json['message']
    response = ollama.chat(model='llama3.1:8b', messages=[
        {
            'role': 'user',
            'content': message,
        },
    ])
    return jsonify({'response': response['message']['content']})

def start_vision_process(model):
    vision_instance = Vision(model)
    vision_instance.start_vision()

def start_updating(model):
    api = Api()
    api.updating_text(model=model)

if __name__ == '__main__':
    vision_model = "Computer_Vision_1.3.0.onnx"  # Make sure this file exists
    vision_process = multiprocessing.Process(target=start_vision_process, args=(vision_model,))
    updating_process = multiprocessing.Process(target=start_updating, args=(vision_model,))
    vision_process.start()
    updating_process.start()
    socketio.run(app, debug=True, port=5000)