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
import re

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
            coords = [int(x) for x in coords]
            x1, y1, x2, y2 = coords
            try:
               x1 -= 5
               y1 -= 5
               x2 += 5
               y2 += 5
            except:
                pass
            image = screen[y1:y2, x1:x2]
            image = Image.fromarray(image)
            text = pytesseract.image_to_string(image)
            return text
        
        if image:
            text = pytesseract.image_to_string(image)
            return text           
        
    def remove_non_ascii(self, text):
   
        return re.sub(r'[^\x00-\x7F]+', '', text)

    def updating_text(self, model):

        model = YOLO(model)

        labels = model.names
        labels = list(labels.values())

        while True:
            with open("model_view_output/text.json", "r") as f:
                coords_list = json.load(f)
        
            names = []
            for coords in coords_list:
                names.append(self.read_image(coords=coords))
        
            names = [name.replace('\n', '') for name in names]
            names = [self.remove_non_ascii(name) for name in names]

            position_names = {text: [] for text in names}

            i = 0
            for key in names:
                position_names[key] = coords_list[i]
                i += 1
        

            with open("model_view_output/sumirize.json", "w") as f:
                json.dump(position_names, f, indent=3)
            time.sleep(1)


def start_vision_process(model):
    vision_instance = Vision(model)
    vision_instance.start_vision()

def start_updating(model):
    api = Api()
    api.updating_text(model=model)

if __name__ == "__main__":
    vision_model = "Computer_Vision_1.3.0.onnx"
    vision_process = multiprocessing.Process(target=start_vision_process, args=(vision_model,))
    updating_process = multiprocessing.Process(target=start_updating, args=(vision_model,))
    vision_process.start()
    updating_process.start()

    

