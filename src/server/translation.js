// server/translation.js
const axios = require('axios');
require('dotenv').config();

// Translation cache to reduce API calls
const translationCache = new Map();

/**
 * Retry utility with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.log(`Translation retry ${i + 1}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

/**
 * Enhanced translation with better error handling and caching
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 * @param {object} options - Translation options
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, targetLanguage = 'ak', options = {}) {
    const {
        useCache = true,
        preserveFormatting = true
    } = options;
    
    // Check cache first
    const cacheKey = `${text}_${targetLanguage}`;
    if (useCache && translationCache.has(cacheKey)) {
        console.log('Using cached translation');
        return translationCache.get(cacheKey);
    }
    
    try {
        const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
        if (!apiKey) {
            throw new Error('Google Translate API key not found. Please set GOOGLE_TRANSLATE_API_KEY in .env file.');
        }
        
        // Map language codes properly
        const googleLangCode = mapLanguageCode(targetLanguage);
        
        console.log(`Translating to ${googleLangCode} (${targetLanguage})...`);
        
        // Prepare text - preserve certain patterns
        let processedText = text;
        const patterns = [];
        
        if (preserveFormatting) {
            // Preserve numbers with units
            processedText = processedText.replace(/(\d+)\s*(km|m|kg|g|GH₵|$|£|€)/g, (match, num, unit) => {
                patterns.push({ placeholder: `__PATTERN${patterns.length}__`, original: match });
                return `__PATTERN${patterns.length - 1}__`;
            });
            
            // Preserve proper nouns (capitalized words not at sentence start)
            processedText = processedText.replace(/(?<![.!?]\s)([A-Z][a-z]+)/g, (match) => {
                patterns.push({ placeholder: `__PATTERN${patterns.length}__`, original: match });
                return `__PATTERN${patterns.length - 1}__`;
            });
        }
        
        // Call Google Translate API with retry
        const response = await retryWithBackoff(async () => {
            return await axios.post(
                `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
                {
                    q: processedText,
                    source: 'en',
                    target: googleLangCode,
                    format: 'text'
                },
                {
                    timeout: 10000, // 10 second timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }, 3, 2000);
        
        // Validate response
        if (!response.data?.data?.translations?.[0]?.translatedText) {
            throw new Error('Invalid response from Google Translate API');
        }
        
        let translatedText = response.data.data.translations[0].translatedText;
        
        // Restore preserved patterns
        patterns.forEach(pattern => {
            translatedText = translatedText.replace(pattern.placeholder, pattern.original);
        });
        
        // Post-process translation for better Twi/Akan
        translatedText = postProcessTwiTranslation(translatedText);
        
        // Cache the result
        if (useCache) {
            translationCache.set(cacheKey, translatedText);
        }
        
        return translatedText;
        
    } catch (error) {
        console.error('Error in translateText:', error.message);
        
        // Detailed error handling
        if (error.response?.status === 403) {
            throw new Error('Google Translate API key is invalid or quota exceeded');
        } else if (error.response?.status === 400) {
            throw new Error('Invalid translation request - check language codes');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Translation request timed out');
        }
        
        // Development fallback
        if (process.env.NODE_ENV === 'development') {
            console.log('Using fallback translation for development');
            return generateFallbackTranslation(text, targetLanguage);
        }
        
        throw new Error(`Translation failed: ${error.message}`);
    }
}

/**
 * Batch translate multiple texts efficiently
 * @param {Array} texts - Array of texts or text objects to translate
 * @param {string} targetLanguage - Target language code
 * @param {object} options - Translation options
 * @returns {Promise<Array>} - Array of translated texts
 */
async function batchTranslateTexts(texts, targetLanguage = 'ak', options = {}) {
    const {
        batchSize = 10, // Google Translate allows up to 128 texts per request
        delayBetweenBatches = 500,
        returnObjects = false // If true, return objects with original and translated text
    } = options;
    
    const results = [];
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!apiKey) {
        throw new Error('Google Translate API key not found');
    }
    
    const googleLangCode = mapLanguageCode(targetLanguage);
    
    // Process in batches
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchTexts = batch.map(item => 
            typeof item === 'string' ? item : item.text || item.original_en || item.simplified_text || item.original_text
        );
        
        console.log(`Translating batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
        
        try {
            // Google Translate supports batch translation
            const response = await retryWithBackoff(async () => {
                return await axios.post(
                    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
                    {
                        q: batchTexts, // Array of texts
                        source: 'en',
                        target: googleLangCode,
                        format: 'text'
                    },
                    {
                        timeout: 20000, // Longer timeout for batch
                    }
                );
            }, 3, 2000);
            
            const translations = response.data.data.translations;
            
            // Map translations back to original structure
            translations.forEach((translation, index) => {
                const translatedText = postProcessTwiTranslation(translation.translatedText);
                
                if (returnObjects) {
                    const originalItem = batch[index];
                    results.push({
                        ...originalItem,
                        translated_text: translatedText
                    });
                } else {
                    results.push(translatedText);
                }
            });
            
        } catch (error) {
            console.error(`Batch translation failed at batch ${Math.floor(i/batchSize) + 1}:`, error.message);
            
            // Fallback to individual translations
            console.log('Falling back to individual translations...');
            for (const item of batch) {
                try {
                    const text = typeof item === 'string' ? item : item.text;
                    const translatedText = await translateText(text, targetLanguage);
                    
                    if (returnObjects) {
                        results.push({
                            ...item,
                            translated_text: translatedText
                        });
                    } else {
                        results.push(translatedText);
                    }
                } catch (individualError) {
                    // Use original as fallback
                    const text = typeof item === 'string' ? item : item.text;
                    if (returnObjects) {
                        results.push({
                            ...item,
                            translated_text: text // Fallback to original text
                        });
                    } else {
                        results.push(text);
                    }
                }
            }
        }
        
        // Delay between batches
        if (i + batchSize < texts.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
    }
    
    return results;
}

/**
 * Map language codes to Google Translate codes
 * @param {string} code - Input language code
 * @returns {string} - Google Translate language code
 */
function mapLanguageCode(code) {
    const mappings = {
        'twi': 'ak', // Twi maps to Akan
        'akan': 'ak',
        'ak': 'ak',
        'ewe': 'ee',
        'ga': 'gaa',
        'dagbani': 'dag',
        'hausa': 'ha',
        'yoruba': 'yo',
        'igbo': 'ig'
    };
    
    return mappings[code.toLowerCase()] || code;
}

/**
 * Post-process Twi/Akan translations for better quality
 * @param {string} text - Translated text
 * @returns {string} - Improved translation
 */
function postProcessTwiTranslation(text) {
    // Common fixes for Twi translations
    let processed = text;
    
    // Fix common mistranslations
    const corrections = {
        'Wo ho te sɛn': 'Wo ho te sɛn?', // Add question mark to greetings
        'Me ho yɛ': 'Me ho yɛ', // Keep as is
        'Meda ase': 'Medaase', // Fix thank you
        'Me pa wo kyɛw': 'Mepa wo kyɛw', // Fix please
    };
    
    Object.entries(corrections).forEach(([wrong, correct]) => {
        processed = processed.replace(new RegExp(wrong, 'gi'), correct);
    });
    
    // Fix spacing issues around punctuation
    processed = processed.replace(/\s+([.,!?])/g, '$1');
    processed = processed.replace(/([.,!?])([A-Za-z])/g, '$1 $2');
    
    // Ensure proper capitalization
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    processed = processed.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    return processed;
}

/**
 * Generate fallback translation for development/testing
 * @param {string} text - Original text
 * @param {string} targetLanguage - Target language
 * @returns {string} - Fallback translation
 */
function generateFallbackTranslation(text, targetLanguage) {
    // Simple fallback translations for testing
    const fallbacks = {
        'ak': {
            'Hello': 'Akwaaba',
            'How are you': 'Wo ho te sɛn',
            'Thank you': 'Medaase',
            'Good morning': 'Maakye',
            'Good afternoon': 'Maaha',
            'Good evening': 'Maadwo',
            'Please': 'Mepa wo kyɛw',
            'Yes': 'Aane',
            'No': 'Daabi',
            'Welcome': 'Akwaaba'
        }
    };
    
    const langFallbacks = fallbacks[targetLanguage] || {};
    
    // Check for exact matches
    if (langFallbacks[text]) {
        return langFallbacks[text];
    }
    
    // Check for partial matches
    for (const [eng, trans] of Object.entries(langFallbacks)) {
        if (text.toLowerCase().includes(eng.toLowerCase())) {
            return text.toLowerCase().replace(eng.toLowerCase(), trans);
        }
    }
    
    // Generic fallback
    return `[Twi] ${text}`;
}

/**
 * Clear translation cache
 */
function clearCache() {
    translationCache.clear();
    console.log('Translation cache cleared');
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    return {
        size: translationCache.size,
        keys: Array.from(translationCache.keys())
    };
}

module.exports = {
    translateText,
    batchTranslateTexts,
    mapLanguageCode,
    postProcessTwiTranslation,
    clearCache,
    getCacheStats
};