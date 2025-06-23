import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/VideoPlayer.css';

function VideoPlayer({ videoUrl, audioUrl, showOriginalAudio = false }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [bufferingProgress, setBufferingProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef(null);
  const videoContainerRef = useRef(null);

  // Define callback functions using useCallback to avoid dependency issues
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(err => console.error("Video play error:", err));
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audio) {
      audio.muted = newMutedState;
    }
    
    video.muted = !showOriginalAudio || newMutedState;
  }, [isMuted, showOriginalAudio]);

  const toggleFullScreen = useCallback(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!isFullScreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, [isFullScreen]);

  // Skip forward 10 seconds
  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.min(video.currentTime + 10, video.duration);
  }, []);

  // Skip backward 10 seconds
  const skipBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.max(video.currentTime - 10, 0);
  }, []);

  // Initial setup and sync video and audio playback
  useEffect(() => {
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;

    if (!videoElement) return;

    const handlePlay = () => {
      if (audioElement && audioUrl) {
        audioElement.currentTime = videoElement.currentTime;
        audioElement.play().catch(err => console.error("Audio play error:", err));
      }
      setIsPlaying(true);
    };

    const handlePause = () => {
      if (audioElement) {
        audioElement.pause();
      }
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      
      // Keep audio in sync with video
      if (audioElement && audioUrl) {
        const diff = Math.abs(videoElement.currentTime - audioElement.currentTime);
        if (diff > 0.3) {
          audioElement.currentTime = videoElement.currentTime;
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      // Set initial volume
      if (audioElement) {
        audioElement.volume = volume / 100;
      }
    };

    const handleProgress = () => {
      if (videoElement && videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const duration = videoElement.duration;
        if (duration > 0) {
          setBufferingProgress((bufferedEnd / duration) * 100);
        }
      }
    };

    const handleVolumeChange = () => {
      setIsMuted(videoElement.muted);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioElement) {
        audioElement.currentTime = 0;
      }
    };

    // Add event listeners
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    videoElement.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl, audioUrl, volume]);

  // Handle auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimerRef.current);
      
      controlsTimerRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = videoContainerRef.current;
    
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('click', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('click', handleMouseMove);
      }
      clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle events if video player is in focus
      if (!videoContainerRef.current || !videoContainerRef.current.contains(document.activeElement)) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullScreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, skipForward, skipBackward, toggleMute, toggleFullScreen]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(
        document.fullscreenElement || 
        document.mozFullScreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      audioRef.current.muted = newVolume === 0;
    }
    
    // If using original audio
    if (showOriginalAudio && videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      videoRef.current.muted = newVolume === 0;
    }
  };

  // Handle seeking
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Format time display (MM:SS)
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get volume icon based on volume level
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 40) return '🔈';
    if (volume < 70) return '🔉';
    return '🔊';
  };

  return (
    <div 
      ref={videoContainerRef}
      className={`video-player-container ${isFullScreen ? 'fullscreen' : ''}`}
      onDoubleClick={toggleFullScreen}
    >
      <video 
        ref={videoRef}
        src={videoUrl}
        className="video-element"
        muted={!showOriginalAudio || isMuted} // Mute original audio unless showOriginalAudio is true
        playsInline // Better for mobile
        onClick={togglePlay} // Click to play/pause
      />
      
      {/* Only render audio element if we have a dubbed audio URL */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} muted={isMuted} />}
      
      {/* Play/Pause overlay icon */}
      {!isPlaying && (
        <div className="video-overlay">
          <button className="overlay-play-btn" onClick={togglePlay}>
            <span>▶</span>
          </button>
        </div>
      )}
      
      {/* Custom video controls */}
      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        {/* Buffer progress */}
        <div className="buffer-bar">
          <div className="buffer-progress" style={{ width: `${bufferingProgress}%` }}></div>
        </div>

        {/* Timeline/scrubber */}
        <div className="timeline-container">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            className="timeline-slider"
          />
          <div className="timeline-preview">
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
        
        {/* Control buttons */}
        <div className="controls-buttons">
          <div className="left-controls">
            {/* Play/Pause button */}
            <button 
              className="control-btn play-pause-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause (k)" : "Play (k)"}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            
            {/* Skip buttons */}
            <button 
              className="control-btn skip-btn"
              onClick={skipBackward}
              aria-label="Skip back 10 seconds"
              title="Rewind 10s (←)"
            >
              -10s
            </button>
            
            <button 
              className="control-btn skip-btn"
              onClick={skipForward}
              aria-label="Skip forward 10 seconds"
              title="Forward 10s (→)"
            >
              +10s
            </button>
            
            {/* Volume control */}
            <div className="volume-container">
              <button 
                className="control-btn volume-btn"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute (m)" : "Mute (m)"}
              >
                {getVolumeIcon()}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                aria-label="Volume"
              />
            </div>
            
            {/* Current time / Duration */}
            <div className="time-display mobile-hidden">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="right-controls">
            {/* Audio toggle if we support both original and dubbed audio */}
            {audioUrl && showOriginalAudio && (
              <button 
                className="control-btn audio-toggle-btn"
                onClick={() => {
                  const video = videoRef.current;
                  const audio = audioRef.current;
                  if (video && audio) {
                    // Toggle between original and dubbed audio
                    video.muted = !video.muted;
                    audio.muted = !audio.muted;
                  }
                }}
                title="Toggle between original and dubbed audio"
              >
                {videoRef.current?.muted ? "Dubbed" : "Original"}
              </button>
            )}
            
            {/* Fullscreen toggle */}
            <button 
              className="control-btn fullscreen-btn"
              onClick={toggleFullScreen}
              aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullScreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
            >
              {isFullScreen ? '⤓' : '⤢'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;