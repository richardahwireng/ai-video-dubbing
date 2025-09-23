# AI Video Dubbing

A full-stack application featuring a Node.js backend that provides an automated pipeline for dubbing videos from English to Twi. It handles video processing, speech-to-text with speaker detection, language translation, and text-to-speech synthesis.

## 🚀 Features

-   **Automated Dubbing Pipeline**: A single API call to upload a video and receive a fully dubbed audio track and subtitles.
-   **Speaker Diarization**: Intelligently switches between fast single-speaker transcription and multi-speaker detection using Google Cloud Speech-to-Text.
-   **Accurate Translation**: Translates transcribed text from English to Twi, maintaining sentence structure.
-   **Dual-Voice Synthesis**: For multi-speaker videos, it generates distinct voices for different speakers using a custom VITS Text-to-Speech model.
-   **Smart Fallback**: If automatic speaker detection fails, it applies a manual alternation of voices to ensure a good user experience.
-   **File Management**: Includes temporary file storage for processing and a scheduled cleanup job to manage disk space.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or newer)
- **npm** (v8.0.0 or newer)
- **FFmpeg** (for audio/video processing)

## 🛠️ Installation

### 1. Install FFmpeg

Choose your operating system:

**Windows:**
```bash
# Using Chocolatey (recommended)
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html and add to your system's PATH
```

**macOS:**
```bash
# Using Homebrew
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

### 2. Install Dependencies

```bash
# Clone the repository (if applicable)
git clone <repository-url>
cd ai-video-dubbing-backend

# Install Node.js dependencies
npm install
```

### 3. Environment Configuration

Create your environment configuration file:

```bash
# Copy the example environment file
cp .env.example .env
```

Add your API keys to the `.env` file:

```env
# AssemblyAI API Key (for speech-to-text)
ASSEMBLY_AI_KEY=your_assemblyai_key_here

# Google Cloud Translation API Key
GOOGLE_TRANSLATE_KEY=your_google_translate_key_here

# Hugging Face API Key (for text-to-speech)
HUGGINGFACE_API_KEY=your_huggingface_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. API Key Setup

**AssemblyAI:**
1. Visit [AssemblyAI](https://www.assemblyai.com/) and sign up for an account.
2. Navigate to your dashboard and copy your API key.
3. For more details, refer to the [AssemblyAI API documentation](https://www.assemblyai.com/docs).

**Google Cloud Translation:**
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the [Cloud Translation API](https://console.cloud.google.com/apis/library/translate.googleapis.com).
4. Create credentials and copy your API key.
5. For more details, see the [official documentation](https://cloud.google.com/translate/docs).

**Hugging Face:**
1. Sign up at [Hugging Face](https://huggingface.co/).
2. Go to **Settings → Access Tokens**.
3. Create a new token with `read` permissions.
4. For more details, see the Inference API documentation.

## 🚀 Running the Server

### Development Mode
```bash
# Start with auto-restart on file changes
npm run dev
```

### Production Mode
```bash
# Start the server
npm start
```

The server will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. Transcribe Video Audio

Extracts audio from uploaded video and converts speech to text.

**Endpoint:** `POST /api/transcribe`

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| video | File | Yes | Video file (MP4, AVI, MOV, etc.) |

**Response:**
```json
{
  "success": true,
  "text": "Hello, this is the transcribed text from the video audio."
}
```

**Example cURL:**
```bash
curl -X POST \
  http://localhost:5000/api/transcribe \
  -H 'Content-Type: multipart/form-data' \
  -F 'video=@/path/to/your/video.mp4'
```

#### 2. Translate Text

Translates English text to Twi language.

**Endpoint:** `POST /api/translate`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "text": "Hello, how are you today?",
  "targetLanguage": "twi"
}
```

**Response:**
```json
{
  "success": true,
  "translatedText": "Wo ho te sɛn ɛnnɛ?",
  "sourceLanguage": "en",
  "targetLanguage": "twi"
}
```

**Example cURL:**
```bash
curl -X POST \
  http://localhost:5000/api/translate \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello, how are you?","targetLanguage":"twi"}'
```

#### 3. Generate Speech

Converts Twi text to speech audio file.

**Endpoint:** `POST /api/text-to-speech`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "text": "Wo ho te sɛn ɛnnɛ?"
}
```

**Response:**
```json
{
  "success": true,
  "audioUrl": "/audio/tts_1640995200000.mp3",
  "duration": 2.5
}
```

**Example cURL:**
```bash
curl -X POST \
  http://localhost:5000/api/text-to-speech \
  -H 'Content-Type: application/json' \
  -d '{"text":"Wo ho te sɛn ɛnnɛ?"}'
```

### Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid API key)
- `500` - Internal Server Error
- `503` - Service Unavailable (external API issues)

## 📁 Project Structure

```
ai-video-dubbing-backend/
├── src/
│   ├── api/
│   │   ├── transcribe.js      # Speech-to-text logic
│   │   ├── translate.js       # Translation logic
│   │   └── textToSpeech.js    # Text-to-speech logic
│   ├── middleware/
│   │   ├── auth.js            # Authentication middleware
│   │   └── upload.js          # File upload handling
│   └── utils/
│       ├── audioProcessor.js  # Audio processing utilities
│       └── validator.js       # Input validation
├── uploads/                   # Temporary video storage
├── public/
│   └── audio/                 # Generated audio files
├── tests/                     # Unit and integration tests
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
├── server.js                 # Main server file
└── README.md
```

## 🎓 Educational Use & Development Notes

This project is designed for educational purposes and includes several development-friendly features:

### Fallback Modes
- **Missing API Keys**: The server provides informative error messages when API keys are not configured
- **Development Mode**: Generates placeholder responses when external services are unavailable
- **Testing Support**: Includes mock endpoints for UI development without API dependencies

### Rate Limiting Considerations
- **AssemblyAI**: The free tier includes 5 hours of transcription per month. See pricing details.
- **Google Translate**: The free tier includes 500,000 characters per month. See pricing details.
- **Hugging Face**: Rate limits apply based on model usage and subscription tier. See the rate limit documentation.

## 🐛 Troubleshooting

### Common Issues and Solutions

**File Upload Errors:**
```bash
# Check directory permissions
chmod 755 uploads/
chmod 755 public/audio/
```

**FFmpeg Not Found:**
```bash
# Verify FFmpeg installation
ffmpeg -version

# Add to PATH if necessary (Windows)
setx PATH "%PATH%;C:\path\to\ffmpeg\bin"
```

**Transcription API Errors:**
- Ensure your `GOOGLE_APPLICATION_CREDENTIALS` path in the `.env` file is correct and points to a valid service account key.

**Memory Issues with Large Files:**
```javascript
// Increase Node.js memory limit
node --max-old-space-size=4096 server.js
```

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment variable
DEBUG=app:* npm start
```

## 10. Testing

The project includes a suite of tests to ensure code quality and correctness.
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📄 License

This project is developed for educational purposes. Please ensure you comply with the terms of service of all external APIs used.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For questions and support:

- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation

---

**Note:** This is an educational project. For production use, additional security measures, error handling, and monitoring should be implemented.
