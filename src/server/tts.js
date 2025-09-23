// server/tts.js
const axios = require('axios');
const fs = require('fs').promises;

/**
 * Synthesize text to speech using your friend's TTS API
 * @param {string} text - Text to synthesize
 * @param {string} outputFilePath - Path to save the audio file
 * @param {string} [speakerVoice='IM'] - The speaker voice to use (e.g., 'IM', 'PT').
 * @returns {Promise<void>} - Resolves when audio is saved
 */
async function synthesizeAudio(text, outputFilePath, speakerVoice = 'IM') {
  try {
    if (!text || !outputFilePath) {
      throw new Error('Text and output file path are required.');
    }

    // API endpoint
    const url = 'https://hcidcsug--ugtts-vits-twi-akan-api.modal.run';

    // Payload
    const payload = {
      text: text,
      // FIX: The API model list specifies 'model_id'. Using 'model_id' is more specific
      // and less ambiguous than 'model_type', which could be causing the API to default to one speaker.
      model_id: 'ms-3', // Use the specific multi-speaker model ID
      speaker: speakerVoice,
    };

    // Headers
    const headers = { 'Content-Type': 'application/json' };

    // Send request
    const response = await axios.post(url, payload, { headers, responseType: 'arraybuffer' });

    // Check response
    if (response.status === 200 && response.headers['content-type'].includes('audio')) {
      await fs.writeFile(outputFilePath, Buffer.from(response.data));
      console.log(`   - Audio clip saved successfully for speaker ${speakerVoice}`);
    } else {
      console.error('Unexpected response from TTS API');
      console.error('Status:', response.status);
      console.error('Content-Type:', response.headers['content-type']);
      console.error('Response data (as string):', Buffer.from(response.data).toString());
      throw new Error('TTS API response was not audio.');
    }

  } catch (error) {
    console.error(`Error in synthesizeAudio for speaker ${speakerVoice}:`, error.message);
    if (error.response) {
      console.error('TTS API status:', error.response.status);
      console.error('TTS API data:', Buffer.from(error.response.data).toString());
    }
    throw error;
  }
}

module.exports = { synthesizeAudio };