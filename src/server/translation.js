// server/translation.js
const axios = require('axios');
require('dotenv').config();

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
    
    // Using Google Translate API
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
    
  } catch (error) {
    console.error('Error in translateText:', error);
    
    // For a school project, return a fake translation
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback translation for demo purposes');
      return "Èyi yɛ nwoma a yɛakyerɛw afa dwumadie no ho. Yɛde yɛn ani to so sɛ ɛho bɛba mfaso.";
    }
    
    throw new Error(`Translation failed: ${error.message}`);
  }
}

module.exports = { translateText };