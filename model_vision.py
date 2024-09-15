from ultralytics import YOLO
import numpy as np
from mss import mss
from ultralytics import YOLO
from PIL import Image, ImageOps
import json
import time
import logging
import multiprocessing

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
    
def start_vision_process(model):
    vision_instance = Vision(model)
    vision_instance.start_vision()

if __name__ == "__main__":
    vision_model = "Computer_Vision_1.3.0.onnx"
    vision_process = multiprocessing.Process(target=start_vision_process, args=(vision_model,))
    vision_process.start()

    while True:
        if input() == "f":
            api = Api()
            seen = api.get_screen_labels()
            print(seen)
