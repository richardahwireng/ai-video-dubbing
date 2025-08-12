import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/VideoPlayer.css';

function VideoPlayer({ videoUrl, audioUrl, showOriginalAudio = false, userPrefersDubbed = true }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useDubbedAudio, setUseDubbedAudio] = useState(userPrefersDubbed);
  const [bufferingProgress, setBufferingProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef(null);
  const videoContainerRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) {
      setUseDubbedAudio(false);
    } else {
      setUseDubbedAudio(userPrefersDubbed);
    }
  }, [audioUrl, userPrefersDubbed]);

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
    setIsMuted(prev => {
      const newMuted = !prev;
      if (videoRef.current) videoRef.current.muted = useDubbedAudio || newMuted;
      if (audioRef.current) audioRef.current.muted = !useDubbedAudio || newMuted;
      return newMuted;
    });
  }, [useDubbedAudio]);

  const toggleFullScreen = useCallback(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!isFullScreen) {
      container.requestFullscreen?.() ||
      container.mozRequestFullScreen?.() ||
      container.webkitRequestFullscreen?.() ||
      container.msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ||
      document.mozCancelFullScreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.();
    }
  }, [isFullScreen]);

  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 10, video.duration);
  }, []);

  const skipBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(video.currentTime - 10, 0);
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;

    if (!videoElement) return;

    const handlePlay = () => {
      if (audioElement && audioUrl && useDubbedAudio) {
        audioElement.currentTime = videoElement.currentTime;
        audioElement.play().catch(err => console.error("Audio play error:", err));
      }
      setIsPlaying(true);
    };

    const handlePause = () => {
      if (audioElement && useDubbedAudio) {
        audioElement.pause();
      }
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      if (audioElement && audioUrl && useDubbedAudio) {
        const diff = Math.abs(videoElement.currentTime - audioElement.currentTime);
        if (diff > 0.3) {
          audioElement.currentTime = videoElement.currentTime;
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      if (audioElement) {
        audioElement.volume = volume / 100;
      }
    };

    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
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
      if (audioElement) audioElement.currentTime = 0;
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl, audioUrl, volume, useDubbedAudio]);

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
    container?.addEventListener('mousemove', handleMouseMove);
    container?.addEventListener('click', handleMouseMove);

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('click', handleMouseMove);
      clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoContainerRef.current?.contains(document.activeElement)) return;
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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skipForward, skipBackward, toggleMute, toggleFullScreen]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      ));
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

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      audioRef.current.muted = !useDubbedAudio || newVolume === 0;
    }

    if (videoRef.current && showOriginalAudio) {
      videoRef.current.volume = newVolume / 100;
      videoRef.current.muted = useDubbedAudio || newVolume === 0;
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) videoRef.current.currentTime = newTime;
    if (audioRef.current && audioUrl && useDubbedAudio) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 40) return '🔈';
    if (volume < 70) return '🔉';
    return '🔊';
  };

  return (
    <div ref={videoContainerRef} className={`video-player-container ${isFullScreen ? 'fullscreen' : ''}`} onDoubleClick={toggleFullScreen}>
      <video
        ref={videoRef}
        src={videoUrl}
        className="video-element"
        muted={useDubbedAudio || isMuted}
        playsInline
        onClick={togglePlay}
      />
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} muted={!useDubbedAudio || isMuted} />
      )}

      {!isPlaying && (
        <div className="video-overlay">
          <button className="overlay-play-btn" onClick={togglePlay}>
            <span>▶</span>
          </button>
        </div>
      )}

      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        <div className="buffer-bar">
          <div className="buffer-progress" style={{ width: `${bufferingProgress}%` }}></div>
        </div>

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
            <div className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </div>
        </div>

        <div className="controls-buttons">
          <div className="left-controls">
            <button className="control-btn play-pause-btn" onClick={togglePlay}>
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button className="control-btn skip-btn" onClick={skipBackward}>-10s</button>
            <button className="control-btn skip-btn" onClick={skipForward}>+10s</button>

            <div className="volume-container">
              <button className="control-btn volume-btn" onClick={toggleMute}>
                {getVolumeIcon()}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
            <div className="time-display mobile-hidden">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </div>

          <div className="right-controls">
            {audioUrl && showOriginalAudio && (
              <button className="control-btn audio-toggle-btn" onClick={() => setUseDubbedAudio(prev => !prev)}>
                {useDubbedAudio ? "Dubbed" : "Original"}
              </button>
            )}
            <button className="control-btn fullscreen-btn" onClick={toggleFullScreen}>
              {isFullScreen ? '⤓' : '⤢'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
