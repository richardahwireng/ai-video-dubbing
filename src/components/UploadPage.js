import React, { useState, useEffect } from 'react';
import VideoUpload from './VideoUpload';
import VideoPlayer from './VideoPlayer';
import ThemeToggle from './ThemeToggle';
import TranscriptViewer from './TranscriptViewer';
import ProcessingStatus from './ProcessingStatus';
import '../styles/App.css';

// Base URL for API calls - Change to your server address if different
const API_BASE_URL = 'http://localhost:5000';

function UploadPage() {
  const [videoUrl, setVideoUrl] = useState('');
  // Remove the originalVideo state since it's not being used
  const [status, setStatus] = useState('Upload your video to get started.');
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [dubbedAudioUrl, setDubbedAudioUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Define steps for visual progress indicator
  const steps = [
    "Upload Video",
    "Extract & Transcribe Audio",
    "Translate to Twi",
    "Generate Twi Speech",
    "Sync Audio with Video"
  ];

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
      if (dubbedAudioUrl && dubbedAudioUrl.startsWith('blob:')) URL.revokeObjectURL(dubbedAudioUrl);
    };
  }, [videoUrl, dubbedAudioUrl]);

  const handleFileUpload = async (file) => {
    try {
      // Reset states
      setError('');
      setIsProcessing(true);
      setCurrentStep(1);
      setStatus('Processing video...');
      
      // Create a temporary URL for the video preview
      const videoObjectUrl = URL.createObjectURL(file);
      setVideoUrl(videoObjectUrl);
      
      // Extract audio and send for transcription
      setStatus('Transcribing audio...');
      setCurrentStep(2);
      const formData = new FormData();
      formData.append('video', file);
      
      const transcriptionResponse = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData
      });
      
      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Transcription failed');
      }
      
      const { text } = await transcriptionResponse.json();
      setTranscript(text);
      
      // Translate the transcript
      setStatus('Translating to Twi...');
      setCurrentStep(3);
      const translationResponse = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: 'twi' })
      });
      
      if (!translationResponse.ok) {
        const errorData = await translationResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Translation failed');
      }
      
      const { translatedText } = await translationResponse.json();
      setTranslation(translatedText);
      
      // Generate Twi speech from translation
      setStatus('Generating Twi speech...');
      setCurrentStep(4);
      const ttsResponse = await fetch(`${API_BASE_URL}/api/text-to-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: translatedText })
      });
      
      if (!ttsResponse.ok) {
        const errorData = await ttsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Speech synthesis failed');
      }
      
      const { audioUrl } = await ttsResponse.json();
      const fullAudioUrl = `${API_BASE_URL}${audioUrl}`;
      setDubbedAudioUrl(fullAudioUrl);
      
      // Process complete
      setStatus('Video is ready with Twi dubbing!');
      setCurrentStep(5);
      
    } catch (error) {
      console.error('Error processing video:', error);
      setError(error.message);
      setStatus(`Error occurred. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler for retry button
  const handleRetry = () => {
    setError('');
    setCurrentStep(0);
    setStatus('Upload your video to get started.');
    // Clear previous results
    setTranscript('');
    setTranslation('');
    setDubbedAudioUrl('');
  };

  return (
    <div className="app-container">
      <ThemeToggle />
      <div className="app-header">
        <h1>AI Video Dubbing - English to Twi</h1>
        <p>Upload your videos and watch them with Twi language dubbing.</p>
      </div>
      
      {!isProcessing && currentStep === 0 && (
        <VideoUpload onFileUpload={handleFileUpload} />
      )}
      
      <ProcessingStatus 
        status={status} 
        isProcessing={isProcessing} 
        error={error}
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
      />
      
      {transcript && translation && (
        <TranscriptViewer 
          originalText={transcript} 
          translatedText={translation} 
        />
      )}
      
      {videoUrl && (
        <VideoPlayer 
          videoUrl={videoUrl} 
          audioUrl={dubbedAudioUrl} 
          showOriginalAudio={!dubbedAudioUrl}
        />
      )}
      
      {error && (
        <div className="error-message">
          {error}
          <button 
            onClick={handleRetry} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default UploadPage;