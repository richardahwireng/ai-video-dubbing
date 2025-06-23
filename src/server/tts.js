const fs = require('fs');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
require('dotenv').config();

const execPromise = util.promisify(exec);

async function generateSpeech(text, outputPath) {
  try {
    console.log(`Generating speech for: "${text.slice(0, 60)}..."`);

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('Missing HUGGINGFACE_API_KEY in .env');

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/mms-tts',
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Use-Voice': 'aka', 
        },
        responseType: 'arraybuffer',
      }
    );

    fs.writeFileSync(outputPath, response.data);
    console.log(`✅ Audio saved to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating speech:', error.message);

    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Creating silent audio as fallback...');
      await execPromise(`ffmpeg -f lavfi -i anullsrc=r=24000:cl=mono -t 10 -q:a 9 -acodec libmp3lame "${outputPath}"`);
      return;
    }

    throw error;
  }
}

module.exports = { generateSpeech };
