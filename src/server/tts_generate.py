import sys
import os
import requests
import json

# Enable UTF-8 output for Windows terminals
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

# Base URL for the TTS API
TTS_API_URL = "https://game-enormously-monkey.ngrok-free.app/tts/synthesize"

def generate_tts(text, output_path):
    if not text.strip():
        raise ValueError("❌ Input text is empty. Please provide valid input.")

    print("🔈 Sending request to TTS API...")

    # Prepare the request payload
    request_payload = {
        "text": text,
        "model_name": "AI-VIDEO-DUBBING",  # Replace with the actual model name
        "speaker": "female",  # You can change the speaker here
        "length_scale": 1.0,  # Adjust speech speed here
        "autocorrect": False,  # Set autocorrect as needed
    }

    try:
        # Make the POST request to the TTS API
        response = requests.post(TTS_API_URL, json=request_payload, headers={"accept": "application/json"})

        # Check if the response is successful
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                audio_path = data["audio_path"]  # Get the audio file path (or URL)
                print(f"✅ Speech generated successfully: {audio_path}")
                
                # If needed, you can download the audio from the audio_path URL
                # This step is optional depending on how you want to use the generated audio
                return audio_path
            else:
                print(f"❌ API error: {data.get('error')}")
                return
        else:
            print(f"❌ Failed to synthesize speech, received status code: {response.status_code}")
            return

    except requests.RequestException as e:
        print(f"❌ Error during API request: {e}")
        return

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python tts_generate.py \"<text>\" \"<output_path>.mp3\"")
        sys.exit(1)

    input_text = sys.argv[1]
    output_file_path = sys.argv[2]

    generate_tts(input_text, output_file_path)
