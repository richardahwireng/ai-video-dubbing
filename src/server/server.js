// src/api/server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { transcribeAudio } = require('./transcription');
const { translateText } = require('./translation');
const { generateSpeech } = require('./tts');

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/output', express.static(outputDir));

app.post('/api/transcribe', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoPath = req.file.path;
    console.log(`Processing video: ${videoPath}`);
    const text = await transcribeAudio(videoPath);

    return res.json({ text });
  } catch (error) {
    console.error('Error in transcription:', error);
    return res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    if (targetLanguage !== 'twi') {
      return res.status(400).json({ error: 'Only Twi language is supported' });
    }

    const translatedText = await translateText(text, targetLanguage);
    return res.json({ translatedText });
  } catch (error) {
    console.error('Error in translation:', error);
    return res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const outputFileName = `tts_${Date.now()}.mp3`;
    const outputPath = path.join(outputDir, outputFileName);

    const audioUrl = await generateSpeech(text, outputPath); // UPDATED LINE

    console.log(`Returning audio URL: ${audioUrl}`);
    return res.json({ audioUrl });
  } catch (error) {
    console.error('Error in speech synthesis:', error);
    return res.status(500).json({ error: error.message || 'Speech synthesis failed' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
