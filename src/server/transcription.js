// server/transcription.js
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
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
    
    const transcription = await transcribeWithAssemblyAI(audioPath);
    
    // Clean up the audio file
    fs.unlinkSync(audioPath);
    
    return transcription;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    
    // For a school project, you might want to return a hardcoded transcript
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback transcription for demo purposes');
      return "This is a sample transcript. In a real implementation, this would be the actual transcription from your video.";
    }
    
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

module.exports = { transcribeAudio };