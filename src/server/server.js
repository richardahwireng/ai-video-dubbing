// src/server/server.js
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const util = require('util');
const { exec } = require('child_process');
const cron = require('node-cron');

const execPromise = util.promisify(exec);

const { transcribeAudio } = require('./transcription');
const { batchTranslateTexts } = require('./translation');
const { synthesizeAudio } = require('./tts');

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fsSync.existsSync(uploadsDir)) { fsSync.mkdirSync(uploadsDir, { recursive: true }); }
if (!fsSync.existsSync(outputDir)) { fsSync.mkdirSync(outputDir, { recursive: true }); }

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueName = `video_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) { cb(null, true); } else { cb(new Error('Only video files are allowed!'), false); }
}});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/output', express.static(outputDir));

/**
 * Groups transcribed words into sentences for more accurate translation.
 * A new sentence is formed when:
 * 1. A word ends with a sentence-terminating punctuation mark ('.', '?', '!').
 * 2. The speaker tag changes between words.
 * @param {Array<object>} words - An array of word objects from the transcription service.
 * @returns {Array<object>} - An array of sentence objects, each with start/end times and text.
 */
const groupWordsIntoSentences = (words) => {
    if (!words || !words.length) return [];
    
    const sentences = [];
    let currentSentenceWords = [];

    words.forEach((word, index) => {
        currentSentenceWords.push(word);

        const isEndOfSentence = word.text.endsWith('.') || word.text.endsWith('?') || word.text.endsWith('!');
        const nextWord = words[index + 1];
        const speakerChanges = nextWord && word.speakerTag !== nextWord.speakerTag;

        if (isEndOfSentence || speakerChanges) {
            if (currentSentenceWords.length > 0) {
                sentences.push(currentSentenceWords);
                currentSentenceWords = [];
            }
        }
    });

    if (currentSentenceWords.length > 0) sentences.push(currentSentenceWords);
    
    return sentences.map(sentenceWords => ({
        speakerTag: sentenceWords[0].speakerTag,
        start: sentenceWords[0].start,
        end: sentenceWords[sentenceWords.length - 1].end,
        text: sentenceWords.map(w => w.text).join(' '),
    }));
};

app.post('/api/dub-video', upload.single('video'), async (req, res) => {
    const startTime = Date.now();
    try {
        if (!req.file) return res.status(400).json({ error: 'No video file provided' });
        
        const videoPath = req.file.path;
        const sourceLanguage = req.body.sourceLanguage || 'en-US';
        const targetLanguage = req.body.targetLanguage || 'ak';
        // Check for a hint from the client to enable multi-speaker detection.
        const hasMultipleSpeakers = req.body.hasMultipleSpeakers === 'true';
        
        console.log('\n🎬 Step 1: Transcribing video...');
        const step1Time = Date.now();
        // Pass option to enable/disable diarization based on whether multiple speakers are expected.
        const transcriptionOptions = { enableDiarization: hasMultipleSpeakers };
        const transcriptionResult = await transcribeAudio(videoPath, sourceLanguage, transcriptionOptions);
        if (!transcriptionResult || !transcriptionResult.words || !transcriptionResult.words.length === 0) {
            throw new Error('Transcription failed');
        }
        console.log(`   ✅ Transcription complete in ${((Date.now() - step1Time) / 1000).toFixed(2)}s. Found ${transcriptionResult.words.length} words.`);
        
        console.log('\n🧩 Step 2: Grouping transcript into sentences...');
        const step2Time = Date.now();
        const speakerChunks = groupWordsIntoSentences(transcriptionResult.words);
        console.log(`   ✅ Grouped into ${speakerChunks.length} phrases in ${((Date.now() - step2Time) / 1000).toFixed(2)}s.`);

        const linesForTranslation = speakerChunks.map(chunk => ({
            ...chunk,
            original_en: chunk.text,
        }));

        // --- Smart Fallback for Failed Diarization ---
        // Check if the user requested diarization but the API only returned one speaker tag.
        const uniqueSpeakerTagsDetected = [...new Set(linesForTranslation.map(line => line.speakerTag))];
        if (hasMultipleSpeakers && uniqueSpeakerTagsDetected.length === 1) {
            console.log('   - ⚠️ Diarization failed to detect multiple speakers. Applying manual speaker alternation per sentence.');
            linesForTranslation.forEach((line, index) => {
                // Alternate speaker tag for each line/chunk (e.g., 1, 2, 1, 2, ...)
                line.speakerTag = (index % 2) + 1; 
            });
        }

        console.log(`\n🌍 Step 3: Translating phrases to ${targetLanguage}...`);
        const step3Time = Date.now();
        // Use batch translation for efficiency
        const translatedLines = await batchTranslateTexts(linesForTranslation, targetLanguage, { returnObjects: true });
        console.log(`   ✅ Translation complete in ${((Date.now() - step3Time) / 1000).toFixed(2)}s.`);

        console.log('\n🔊 Step 4: Synthesizing speech...');
        const step4Time = Date.now();
        // Use 'PT' and 'AN' voices, alternating between them for multiple speakers.
        const availableVoices = ['PT', 'AN'];
        const speakerVoiceMap = {};
        let voiceIndex = 0;
        // Get unique speakers from the translated lines to ensure data integrity.
        const uniqueSpeakerTags = [...new Set(translatedLines.map(line => line.speakerTag))].sort((a, b) => a - b);
        
        console.log(`   - Found ${uniqueSpeakerTags.length} unique speaker(s): [${uniqueSpeakerTags.join(', ')}]`);
        
        uniqueSpeakerTags.forEach(tag => {
            speakerVoiceMap[tag] = availableVoices[voiceIndex % availableVoices.length];
            voiceIndex++;
        });
        console.log('   - Voice assignments:', JSON.stringify(speakerVoiceMap));

        // Create an array of synthesis promises to run in parallel, which is much faster
        // than synthesizing them one by one.
        const synthesisPromises = translatedLines.map((line, i) => {
            const speakerTag = line.speakerTag;
            const translatedText = line.translated_text;
            const speakerVoice = speakerVoiceMap[speakerTag];
            const clipPath = path.join(outputDir, `clip_${startTime}_${i}.mp3`);
            // Return the promise from synthesizeAudio, resolving to the clip's path on success.
            return synthesizeAudio(translatedText, clipPath, speakerVoice).then(() => clipPath);
        });

        // Wait for all synthesis tasks to complete.
        const audioClips = await Promise.all(synthesisPromises);
        console.log(`   ✅ Synthesized ${audioClips.length} audio clips in ${((Date.now() - step4Time) / 1000).toFixed(2)}s.`);

        const audioFileName = `tts_final_${startTime}.mp3`;
        const finalAudioPath = path.join(outputDir, audioFileName);

        console.log('\n📎 Step 5: Merging audio clips...');
        const step5Time = Date.now();
        if (audioClips.length > 1) {
            const fileListPath = path.join(outputDir, `files_${startTime}.txt`);
            const fileListData = audioClips.map(clip => `file '${path.resolve(clip)}'`).join('\n');
            await fs.writeFile(fileListPath, fileListData);
            const ffmpegConcatCommand = `ffmpeg -y -f concat -safe 0 -i "${fileListPath}" "${finalAudioPath}"`;
           await execPromise(ffmpegConcatCommand).catch(err => console.error("FFmpeg concat error:", err));
            for (const clip of audioClips) { await fs.unlink(clip); }
            await fs.unlink(fileListPath);
        } else if (audioClips.length === 1) {
            await fs.rename(audioClips[0], finalAudioPath);
        }
        console.log(`   ✅ Audio merged in ${((Date.now() - step5Time) / 1000).toFixed(2)}s.`);

        const subtitles = translatedLines.map(line => ({
            start: line.start,
            end: line.end,
            speakerTag: line.speakerTag,
            original_en: line.original_en,
            twi: line.translated_text
        }));
        
        res.json({
            success: true,
            processingTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
            subtitles: subtitles,
            audioUrl: `/output/${audioFileName}`,
            originalVideoUrl: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        console.error('Error in /api/dub-video:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/download-dubbed-video', async (req, res) => {
    const { videoUrl, audioUrl } = req.query;
    if (!videoUrl || !audioUrl) return res.status(400).json({ error: 'Missing video or audio URL' });
    
    const videoPath = path.join(__dirname, videoUrl);
    const audioPath = path.join(__dirname, audioUrl);
    const outputFileName = `dubbed_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    try {
        await fs.access(videoPath);
        await fs.access(audioPath);
        const command = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${outputPath}"`;
       await execPromise(command).catch(err => console.error("FFmpeg merge error:", err));
        res.download(outputPath, outputFileName, (err) => {
            if (err) console.error('Error sending file:', err);
            fs.unlink(outputPath).catch(cleanupErr => console.error('Error cleaning up merged file:', cleanupErr));
        });
    } catch (error) {
        console.error('Error during merge/download:', error);
        res.status(500).json({ error: 'Failed to create dubbed video.' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', version: '1.0.0' });
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large', details: 'Maximum file size is 100MB' });
    }
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

const cleanupFiles = async () => {
    console.log('\n🧹 Running scheduled cleanup job...');
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    const cleanupDir = async (dir) => {
        try {
            const files = await fs.readdir(dir);
            for (const file of files) {
                if (file.startsWith('.')) continue;
                const filePath = path.join(dir, file);
                const stat = await fs.stat(filePath);
                if (now - stat.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    console.log(`   - Deleted old file: ${path.basename(filePath)}`);
                }
            }
        } catch (err) {
            console.error(`   - Error cleaning up directory ${dir}:`, err.message);
        }
    };

    await cleanupDir(uploadsDir);
    await cleanupDir(outputDir);
    console.log('   ✅ Cleanup job finished.');
};

cron.schedule('0 0 * * *', cleanupFiles, { timezone: "Africa/Accra" });

console.log('🗓️ Daily file cleanup job scheduled for midnight (Accra time).');

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
server.setTimeout(600000);
