from ultralytics import YOLO
import numpy as np
from mss import mss
from ultralytics import YOLO
from PIL import Image, ImageOps
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

        labels = model.names
        labels = list(labels.values())
    
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
        
                del label_dict
                del label_count
            time.sleep(0.1)


class Api:

    def __init__(self) -> None:
        pass

    def get_screen_labels(self):

        with open("model_view_output/labels.json", "r") as f:
            labels = json.load(f)
    
        return labels
    
    def get_positions_from_label(self, label):

        try: 
            with open(f"model_view_output/{label}.json", "r") as f:
                coords_list = json.load(f)

        except:
            print("error: label wasnt found")
            print("this could be because you spelled the label false or the label wasnt observed yet.")
        
        return coords_list
    
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

            if textx1 > x1:
                if texty1 > y1:
                    if textx2 < x2:
                        if texty2 < y2:
                            print("text found")
                            return coord_list
        
        return 0
    
    def read_image(self, coords=None, image=None):

        pytesseract.pytesseract.tesseract_cmd = r'C:/Program Files/Tesseract-OCR/tesseract.exe' #you need to put the path in to the tesseract install

        sct = mss()
        monitor = sct.monitors[1]

        if coords:
            screen = np.array(sct.grab(monitor))
            x1, y1, x2, y2 = coords
            x1 -= 5
            y1 -= 5
            x2 += 5
            y2 += 5
            image = screen[y1:y2, x1:x2]
            image = Image.fromarray(image)
            text = pytesseract.image_to_string(image)
            return text
        
        if image:
            text = pytesseract.image_to_string(image)
            return text

 
def start_vision_process(model):
    vision_instance = Vision(model)
    vision_instance.start_vision()

if __name__ == "__main__":
    vision_model = "Computer_Vision_1.3.0.onnx"
    vision_process = multiprocessing.Process(target=start_vision_process, args=(vision_model,))
    vision_process.start()

    while True:
        
        user_input = input()

        if user_input:
            api = Api()
            coords = user_input.split(" ")
            coords = [int(coord) for coord in coords]
            coords = api.get_text_from_boundingbox(coords)
            coords = [int(x) for x in coords]
            text = api.read_image(coords=coords)
            print(text)
