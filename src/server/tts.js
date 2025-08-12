const axios = require('axios');
require('dotenv').config();

// Base URL for the TTS API
const TTS_API_URL = process.env.TTS_API_URL ;
const MODEL_LOAD_URL = process.env.MODEL_LOAD_URL;

// Function to load the model
async function loadModel() {
  try {
    console.log("🚀 Loading model...");
    const response = await axios.post(MODEL_LOAD_URL, {}, { headers: { 'accept': 'application/json' } });
    
    if (response.status === 200) {
      console.log("✅ Model loaded successfully!");
    } else {
      console.error("❌ Failed to load model:", response.data);
      throw new Error('Failed to load model');
    }
  } catch (error) {
    console.error("❌ Error loading model:", error.message);
    throw error;
  }
}

// Function to generate speech using the API
async function generateSpeech(text) {
  try {
    console.log(`🔊 Generating speech for: "${text.slice(0, 60)}..."`);

    // Ensure the model is loaded first
    await loadModel();

    const modelName = 'AI-VIDEO-DUBBING';  // Correct model name
    const speaker = 'male';  // Choose male/female speaker
    const lengthScale = 1.0;  // Speed of speech
    const autocorrect = false;  // Whether autocorrection should be applied

    const requestBody = {
      text,
      model_name: modelName,
      speaker,
      length_scale: lengthScale,
      autocorrect,
    };

    console.log("🚀 Sending request to TTS API:", TTS_API_URL);

    const response = await axios.post(TTS_API_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
    });

    if (response.data.success) {
      const audioPath = response.data.audio_path;
      console.log(`✅ MP3 audio saved to: ${audioPath}`);
      return audioPath;
    } else {
      console.error("❌ Error generating speech:", response.data.error);
      throw new Error('TTS API synthesis failed.');
    }
  } catch (error) {
    console.error('❌ Error generating speech:', error.message);
    throw error;
  }
}

module.exports = { generateSpeech };
