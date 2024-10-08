import os
import gradio as gr
import ollama
import numpy as np
from mss import mss
from ultralytics import YOLO
from PIL import Image
import json
import time
import logging
import multiprocessing
import pytesseract

class Vision:
    def __init__(self, model):
        self.model = model
        
    def start_vision(self):
        logging.getLogger('ultralytics').setLevel(logging.WARNING)
        model = YOLO(self.model)
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
                    with open(f"model_view_output/{key}.json", "w") as f:
                        json.dump(label_dict[key], f, indent=4)

                with open("model_view_output/labels.json", "w") as f:
                    json.dump(label_count, f, indent=2)
        
            time.sleep(0.1)

class Api:
    def __init__(self):
        pass

    def get_screen_labels(self):
        try:
            with open("model_view_output/labels.json", "r") as f:
                labels = json.load(f)
            return labels
        except FileNotFoundError:
            print("labels.json not found. Make sure the YOLO model is running and detecting objects.")
            return {}
    
    def get_positions_from_label(self, label):
        try: 
            with open(f"model_view_output/{label}.json", "r") as f:
                coords_list = json.load(f)
            return coords_list
        except FileNotFoundError:
            print(f"Error: {label}.json not found.")
            print("This could be because the label wasn't detected yet or you spelled the label incorrectly.")
            return []
    
    def read_image(self, coords=None, image=None):
        pytesseract.pytesseract.tesseract_cmd = r'C:/Program Files (x86)/Tesseract-OCR/tesseract.exe'
        sct = mss()
        monitor = sct.monitors[1]

        if coords:
            screen = np.array(sct.grab(monitor))
            x1, y1, x2, y2 = coords
            x1, y1, x2, y2 = max(0, x1), max(0, y1), min(screen.shape[1], x2), min(screen.shape[0], y2)
            image = screen[y1:y2, x1:x2]
            image = Image.fromarray(image)
            text = pytesseract.image_to_string(image)
            return text
        
        if image:
            text = pytesseract.image_to_string(image)
            return text
        
    def get_text_from_boundingbox(self, coords):
        with open("model_view_output/text.json", "r") as f:
            text_coords = json.load(f)

        x1, y1, x2, y2 = coords
        x1 -= 10
        y1 -= 10
        x2 += 10
        y2 += 10

        for coord_list in text_coords:
            textx1, texty1, textx2, texty2 = coord_list
            if textx1 > x1 and texty1 > y1 and textx2 < x2 and texty2 < y2:
                print("text found")
                return coord_list
        return 0

    def start_vision_process(model):
        vision_instance = Vision(model)
        vision_instance.start_vision()

    def generate_response(user_input):
        response = ollama.chat(model='llama3.1:8b', messages=[
            {
                'role': 'user',
                'content': user_input,
            },
        ])
        return response['message']['content']

    def launch_gradio():
        api = Api()

        def process_image(coords):
            try:
                coords = [int(coord) for coord in coords.split()]
                if len(coords) != 4:
                    return "Please provide 4 coordinates (x1 y1 x2 y2)."
                text = api.read_image(coords=coords)
                return text if text else "No text found in the given coordinates."
            except ValueError:
                return "Invalid coordinates. Please provide 4 integer values separated by spaces."

        with gr.Blocks() as demo:
            gr.Markdown("# Combined YOLO and Chat App")

            with gr.Tab("Image Processing"):
                coords_input = gr.Textbox(label="Enter coordinates (x1 y1 x2 y2)")
                process_btn = gr.Button("Process Image")
                image_output = gr.Textbox(label="Extracted Text")

            process_btn.click(process_image, inputs=coords_input, outputs=image_output)

        demo.launch()

if __name__ == "__main__":
    vision_model = "Computer_Vision_1.2.0.onnx"
    vision_process = multiprocessing.Process(target=start_vision_process, args=(vision_model,))
    vision_process.start()

    launch_gradio()