// server/transcription.js
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Gets audio metadata like channel count using ffprobe.
 * @param {string} filePath - Path to the media file.
 * @returns {Promise<{channelCount: number}>}
 */
async function getAudioMetadata(filePath) {
    try {
        const command = `ffprobe -v error -select_streams a:0 -show_entries stream=channels -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
        const { stdout } = await execPromise(command);
        const channelCount = parseInt(stdout.trim(), 10);
        return { channelCount: isNaN(channelCount) ? 1 : channelCount };
    } catch (error) {
        console.warn(`Could not get audi  channel count for ${path.basename(filePath)}, defaulting to 1. Error: ${error.message}`);
        return { channelCount: 1 };
    }
}

/**
 * Extracts audio from a video file using ffmpeg.
 * @param {string} videoPath - Path to the video file.
 * @param {object} [options={}] - Extraction options.
 * @param {number} [options.channelCount=1] - The number of audio channels to extract.
 * @returns {Promise<string>} - The path to the extracted audio file.
 */
async function extractAudio(videoPath, options = {}) {
    const { channelCount = 1 } = options;
    const audioFileName = `audio_${Date.now()}.wav`;
    const audioPath = path.join(path.dirname(videoPath), audioFileName);
    console.log(`Extracting audio to: ${audioPath}`);
    const channelArg = `-ac ${channelCount}`;
    await execPromise(`ffmpeg -y -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 ${channelArg} -af aresample=16000 "${audioPath}"`).catch(err => console.error("FFmpeg audio extraction error:", err));
    return audioPath;
}

/**
 * Transcribes audio from a video file using Google Cloud Speech-to-Text.
 * @param {string} videoPath - Path to the video file.
 * @param {string} sourceLanguage - The language of the audio (e.g., 'en-US').
 * @param {object} [options={}] - Transcription options.
 * @param {boolean} [options.enableDiarization=false] - Whether to enable speaker diarization.
 * @returns {Promise<object>} - An object with the full text and an array of word objects.
 */
async function transcribeAudio(videoPath, sourceLanguage = 'en-US', options = {}) {
    const { enableDiarization = false } = options;
    let audioPath = '';
    try {
        // Get audio metadata to determine channel count.
        const metadata = await getAudioMetadata(videoPath);
        
        // For diarization, preserve original channels. For single speaker, force to mono.
        const extractionChannelCount = enableDiarization ? metadata.channelCount : 1;

        // 1. Extract audio from the video file.
        audioPath = await extractAudio(videoPath, { channelCount: extractionChannelCount });

        // 2. Initialize the Google Speech client. It will automatically find your credentials.
        const speechClient = new SpeechClient();

        // 3. Read the audio file into memory.
        const file = await fs.readFile(audioPath);
        const audioBytes = file.toString('base64');

        // 4. Configure the request to Google.
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: sourceLanguage,
            enableWordTimeOffsets: true, // Crucial for getting word timestamps!
            enableAutomaticPunctuation: true,
            // Set the channel count based on the extracted audio.
            audioChannelCount: extractionChannelCount,
        };

        if (enableDiarization) {
            // If audio has multiple channels, this can improve recognition.
            if (extractionChannelCount > 1) {
                config.enableSeparateRecognitionPerChannel = true;
            }

            // Enable speaker diarization to distinguish between different speakers.
            config.diarizationConfig = {
                enableSpeakerDiarization: true,
                minSpeakerCount: 2, // Diarization is for 2 or more speakers.
                maxSpeakerCount: 6, // You can adjust this value if you expect more speakers
            };
        }

        const audio = {
            content: audioBytes,
        };

        const request = {
            config: config,
            audio: audio,
        };

        // 5. Since the app restricts uploads to < 1 min, we can choose the API method.
        // Use sync `recognize` if diarization is off (faster).
        // Use async `longRunningRecognize` if diarization is on (as it's required for that feature).
        let response;
        if (enableDiarization) {
            console.log('Sending audio to Google Speech-to-Text for long-running recognition (for speaker diarization)...');
            const [operation] = await speechClient.longRunningRecognize(request);

            // The promise resolves when the job is complete.
            console.log('Waiting for transcription to complete...');
            [response] = await operation.promise();
        } else {
            console.log('Sending audio to Google Speech-to-Text for synchronous recognition...');
            const [syncResponse] = await speechClient.recognize(request);
            response = syncResponse;
        }
        
        if (!response.results || response.results.length === 0) {
            throw new Error('Google Speech-to-Text returned no results.');
        }

        // 6. Format the response to match what your application expects.
        const fullText = response.results.map(result => result.alternatives[0].transcript).join('\n');
        
        let allWords;
        if (enableDiarization) {
            // For async recognition with diarization, the final result contains all words with speaker tags.
            const lastResult = response.results[response.results.length - 1];
            allWords = lastResult?.alternatives?.[0]?.words || [];
        } else {
            // For sync recognition, the API may return multiple results for pauses in speech.
            // We must concatenate the words from all results to get the full transcript.
            allWords = response.results.flatMap(result => result.alternatives?.[0]?.words || []);
        }

        if (allWords.length === 0) {
            throw new Error('Transcription completed, but no words with timestamps were found.');
        }

        const words = allWords.map(wordInfo => {
            const startSec = (wordInfo.startTime.seconds || 0) + (wordInfo.startTime.nanos || 0) / 1e9;
            const endSec = (wordInfo.endTime.seconds || 0) + (wordInfo.endTime.nanos || 0) / 1e9;

            return {
                text: wordInfo.word,
                start: startSec,
                end: endSec,
                // When diarization is enabled, `speakerTag` is used. Fallback to 1 if not present.
                // FIX: Use nullish coalescing (??) instead of OR (||).
                // This prevents a valid speakerTag of `0` from being incorrectly replaced with `1`.
                speakerTag: wordInfo.speakerTag ?? 1,
            };
        });

        console.log(`Transcription successful. Speaker diarization was ${enableDiarization ? 'enabled' : 'disabled'}.`);
        return { text: fullText, words: words };

    } catch (error) {
        console.error('Error in transcribeAudio with Google:', error);
        throw new Error(`Google transcription failed: ${error.message}`);
    } finally {
        // 7. Clean up the temporary audio file.
        if (audioPath) {
            await fs.unlink(audioPath).catch(err => console.error('Error deleting temp audio file:', err));
        }
    }
}

module.exports = {
    transcribeAudio
};