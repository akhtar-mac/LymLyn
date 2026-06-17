import sys
import json
import base64
from gradio_client import Client, handle_file

def generate_tryon(person_image_path, garment_image_path, garment_description):
    try:
        client = Client("yisol/IDM-VTON")
        
        result = client.predict(
            dict={"background": handle_file(person_image_path), "layers": [], "composite": None},
            garm_img=handle_file(garment_image_path),
            garment_des=garment_description,
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )
        
        # result is a list where the first element is the path to the generated image
        output_image_path = result[0]
        
        # Read the image and output as base64 to stdout
        with open(output_image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            
        print(json.dumps({"success": True, "image": f"data:image/webp;base64,{encoded_string}"}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Missing arguments"}))
        sys.exit(1)
        
    person_img = sys.argv[1]
    garm_img = sys.argv[2]
    desc = sys.argv[3]
    
    generate_tryon(person_img, garm_img, desc)
