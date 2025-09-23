// UploadPage.js
import React, { useState, useEffect, useRef } from 'react';
import VideoUpload from './VideoUpload';
import VideoPlayer from './VideoPlayer';
import ThemeToggle from './ThemeToggle';
import TranscriptViewer from './TranscriptViewer';
import ProcessingStatus from './ProcessingStatus';
import '../styles/App.css';

const API_BASE_URL = 'http://localhost:5000';

function UploadPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState('Upload your video to get started.');
  const [dubbedAudioUrl, setDubbedAudioUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState(null);
  const [downloadUrls, setDownloadUrls] = useState(null);
  const [hasMultipleSpeakers, setHasMultipleSpeakers] = useState(false);

  // Add state for the sticky player and a ref for its container.
  const [isPlayerSticky, setIsPlayerSticky] = useState(false);
  const playerWrapperRef = useRef(null);

  const steps = [
    "Upload Video",
    "Extract & Transcribe Audio",
    "Translate & Timestamps",
    "Generate Twi Speech",
    "Video Ready"
  ];

  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      if (dubbedAudioUrl && dubbedAudioUrl.startsWith('blob:')) URL.revokeObjectURL(dubbedAudioUrl);
    };
  }, [dubbedAudioUrl]);

  // Add a new useEffect to handle the scroll logic for the sticky player.
  useEffect(() => {
    const playerWrapper = playerWrapperRef.current;
    // Only set up the listener if the player wrapper element exists.
    if (!playerWrapper) return;

    // Get the initial vertical position of the player relative to the page.
    const playerTopOffset = playerWrapper.offsetTop;

    const handleScroll = () => {
      // If the user's scroll position is past the top of the player, make it sticky.
      if (window.scrollY > playerTopOffset) {
        setIsPlayerSticky(true);
      } else {
        setIsPlayerSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when the component is no longer needed.
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
    // This effect should re-run only when the player is first displayed.
  }, [videoUrl]);

  const handleFileUpload = async (file) => {
    try {
      setError('');
      setDownloadUrls(null);
      setIsProcessing(true);
      setCurrentStep(1);
      setStatus('Uploading video...');
      
      const videoObjectUrl = URL.createObjectURL(file);
      setVideoUrl(videoObjectUrl);
      
      const formData = new FormData();
      formData.append('video', file);
      formData.append('sourceLanguage', 'en'); 
      formData.append('hasMultipleSpeakers', hasMultipleSpeakers);
      
      const response = await fetch(`${API_BASE_URL}/api/dub-video`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Video processing failed');
      }
      
      setStatus('Processing video...');
      const data = await response.json();
      
      if (data.subtitles) {
        data.subtitles.forEach(line => {
          line.start = parseFloat(line.start);
          line.end = parseFloat(line.end);
        });
      }
      
      setDubbedAudioUrl(`${API_BASE_URL}${data.audioUrl}`);
      setSubtitles(data.subtitles || []);
      if (data.originalVideoUrl && data.audioUrl) {
        setDownloadUrls({ video: data.originalVideoUrl, audio: data.audioUrl });
      }
      
      setStatus('Video is ready with Twi dubbing!');
      setCurrentStep(5);
      
    } catch (err) {
      console.error('Error processing video:', err);
      setError(err.message);
      setStatus(`Error occurred. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setCurrentStep(0);
    setStatus('Upload your video to get started.');
    setDubbedAudioUrl('');
    setSubtitles(null);
    setDownloadUrls(null);
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleSeek = (time) => {
    const videoElement = document.querySelector('.artplayer-video');
    if (videoElement) {
      videoElement.currentTime = time;
    }
  };

  return (
    <div className="app-container">
      <ThemeToggle />
      <div className="app-header">
        <h1>AI Video Dubbing - English to Twi</h1>
        <p>Upload your videos and watch them with Twi language dubbing.</p>
      </div>
      
      {!videoUrl && (
         <VideoUpload 
           onFileUpload={handleFileUpload} 
           hasMultipleSpeakers={hasMultipleSpeakers}
           onMultipleSpeakersChange={(e) => setHasMultipleSpeakers(e.target.checked)}
         />
      )}
      
      {(isProcessing || error) && (
        <ProcessingStatus 
          status={status} 
          isProcessing={isProcessing} 
          error={error}
          currentStep={currentStep}
          totalSteps={steps.length}
          steps={steps}
        />
      )}

      {videoUrl && (
        <>
          {/* Add a wrapper div around the player with a ref and conditional class. */}
          <div 
            ref={playerWrapperRef}
            className={`player-wrapper ${isPlayerSticky ? 'sticky' : ''}`}
          >
            <VideoPlayer 
              videoUrl={videoUrl} 
              audioUrl={dubbedAudioUrl}
              subtitles={subtitles}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>

          {downloadUrls && !isProcessing && (
            <div className="download-section">
              <a
                href={`${API_BASE_URL}/api/download-dubbed-video?videoUrl=${encodeURIComponent(downloadUrls.video)}&audioUrl=${encodeURIComponent(downloadUrls.audio)}`}
                className="download-button"
                download
              >
                📥 Download Dubbed Video
              </a>
            </div>
          )}

          <TranscriptViewer 
            subtitles={subtitles}
            currentTime={currentTime}
            onSeek={handleSeek}
          />
        </>
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