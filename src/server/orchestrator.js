// server/orchestrator.js
const path = require('path');
const fs = require('fs');
const { transcribeAudio } = require('./transcription');
const { translateText } = require('./translation'); 
const { synthesizeAudio } = require('./tts');
require('dotenv').config();

/**
 * Full pipeline:
 * 1. Transcribe video/audio with timestamps
 * 2. Translate English transcription to Twi (Akan)
 * 3. Synthesize Twi speech
 * @param {string} videoPath - Path to input video
 * @param {string} outputAudioPath - Path to save final audio
 */
async function processVideo(videoPath, outputAudioPath) {
  try {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    console.log('Step 1: Transcribing video...');
    const transcription = await transcribeAudio(videoPath, "en"); 
    console.log('Transcription completed.');
    console.log('Sample word with timestamps:', transcription.words?.[0]);

    console.log('Step 2: Translating transcription to Twi...');
    const twiText = await translateText(transcription.text, 'ak'); 
    console.log('Translation completed:', twiText);

    console.log('Step 3: Synthesizing Twi speech...');
    await synthesizeAudio(twiText, outputAudioPath);
    console.log('TTS completed, audio saved at:', outputAudioPath);

    console.log('Workflow finished successfully!');
  } catch (error) {
    console.error('Error in processVideo pipeline:', error.message);
  }
}

// Example usage:
const inputVideo = path.join(__dirname, '../media/input_video.mp4'); // change path as needed
const finalAudio = path.join(__dirname, '../media/final_audio.wav');  // output path

processVideo(inputVideo, finalAudio);