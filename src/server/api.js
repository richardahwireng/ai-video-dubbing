// src/api/api.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
require('dotenv').config();

// Promisify exec
const execPromise = util.promisify(exec);

/**
 * Extract audio from video and transcribe it
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(videoPath) {
  try {
    // 1. Extract audio from video using ffmpeg
    const audioFileName = `audio_${path.basename(videoPath, path.extname(videoPath))}.wav`;
    const audioPath = path.join(path.dirname(videoPath), audioFileName);
    
    console.log(`Extracting audio to: ${audioPath}`);
    
    await execPromise(`ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`);
    
    // 2. Transcribe the audio
    console.log('Transcribing audio...');
    
    // Option 1: Using AssemblyAI (recommended for a school project)
    const transcription = await transcribeWithAssemblyAI(audioPath);
    
    // Clean up the audio file
    fs.unlinkSync(audioPath);
    
    return transcription;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

/**
 * Transcribe audio using AssemblyAI API
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeWithAssemblyAI(audioPath) {
  try {
    // Check if API key is available
    const apiKey = process.env.ASSEMBLY_AI_API_KEY;
    if (!apiKey) {
      throw new Error('AssemblyAI API key not found. Please set ASSEMBLY_AI_API_KEY in your .env file.');
    }
    
    // Read the audio file
    const audioFile = fs.readFileSync(audioPath);
    
    // 1. Upload the audio file
    console.log('Uploading audio to AssemblyAI...');
    const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', audioFile, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Authorization': apiKey
      }
    });
    
    const audioUrl = uploadResponse.data.upload_url;
    
    // 2. Create transcription job
    console.log('Creating transcription job...');
    const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
      audio_url: audioUrl,
      language_code: 'en'
    }, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    const transcriptId = transcriptResponse.data.id;
    
    // 3. Poll for transcription completion
    console.log(`Polling for transcription results (ID: ${transcriptId})...`);
    let transcriptResult;
    let complete = false;
    
    while (!complete) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between polls
      
      const pollingResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': apiKey
        }
      });
      
      transcriptResult = pollingResponse.data;
      
      if (transcriptResult.status === 'completed' || transcriptResult.status === 'error') {
        complete = true;
      } else {
        console.log(`Transcription status: ${transcriptResult.status}`);
      }
    }
    
    if (transcriptResult.status === 'error') {
      throw new Error(`AssemblyAI error: ${transcriptResult.error}`);
    }
    
    return transcriptResult.text;
    
  } catch (error) {
    console.error('Error in transcribeWithAssemblyAI:', error);
    throw new Error(`AssemblyAI transcription failed: ${error.message}`);
  }
}

/**
 * Translate text from English to the target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'twi')
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, targetLanguage) {
  try {
    console.log(`Translating text to ${targetLanguage}...`);
    
    // Check if API key is available
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error('Google Translate API key not found. Please set GOOGLE_TRANSLATE_API_KEY in your .env file.');
    }
    
    // Option 1: Using Google Translate API
    const response = await axios.post(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      q: text,
      source: 'en',
      target: targetLanguage === 'twi' ? 'ak' : targetLanguage, // Google uses 'ak' for Akan/Twi
      format: 'text'
    });
    
    if (!response.data || !response.data.data || !response.data.data.translations || !response.data.data.translations[0]) {
      throw new Error('Invalid response from Google Translate API');
    }
    
    return response.data.data.translations[0].translatedText;
    
    /* 
    // Option 2: Using LibreTranslate (free open-source alternative)
    // Note: This requires setting up a LibreTranslate server or using a public instance
    const response = await axios.post('https://libretranslate.com/translate', {
      q: text,
      source: 'en',
      target: targetLanguage,
      format: 'text'
    });
    
    if (!response.data || !response.data.translatedText) {
      throw new Error('Invalid response from LibreTranslate API');
    }
    
    return response.data.translatedText;
    */
    
  } catch (error) {
    console.error('Error in translateText:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Generate speech from text in Twi language
 * @param {string} text - Text to convert to speech
 * @param {string} outputPath - Path to save the generated audio file
 * @returns {Promise<void>}
 */
async function generateSpeech(text, outputPath) {
  try {
    console.log(`Generating speech for text: "${text.substring(0, 50)}..."`);
    
    // Option 1: Using Hugging Face Inference API for Twi TTS
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('Hugging Face API key not found. Please set HUGGINGFACE_API_KEY in your .env file.');
    }
    
    // Using a multilingual TTS model that supports Twi/Akan
    // Note: You might need to find a specific model that works well for Twi
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/mms-tts-anc',
      {
        inputs: text,
        parameters: {
          language: "twi"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    // Save the audio file
    fs.writeFileSync(outputPath, response.data);
    console.log(`Speech generated and saved to ${outputPath}`);
    
    /*
    // Option 2: Using Google Cloud Text-to-Speech (requires billing setup)
    const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
    const client = new TextToSpeechClient();
    
    const request = {
      input: { text },
      voice: { languageCode: 'ak-GH', name: 'ak-GH-Standard-A' },
      audioConfig: { audioEncoding: 'MP3' }
    };
    
    const [response] = await client.synthesizeSpeech(request);
    fs.writeFileSync(outputPath, response.audioContent, 'binary');
    console.log(`Speech generated and saved to ${outputPath}`);
    */
    
  } catch (error) {
    console.error('Error in generateSpeech:', error);
    
    // For demonstration purposes in a school project, generate a silent audio file
    // This allows the app to work even without API keys
    if (process.env.NODE_ENV !== 'production') {
      console.log('Generating a silent audio file for demonstration purposes...');
      await execPromise(`ffmpeg -f lavfi -i anullsrc=r=24000:cl=mono -t 10 -q:a 9 -acodec libmp3lame "${outputPath}"`);
      return;
    }
    
    throw new Error(`Speech synthesis failed: ${error.message}`);
  }
}

module.exports = {
  transcribeAudio,
  translateText,
  generateSpeech
};