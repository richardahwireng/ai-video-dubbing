import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/VideoPlayer.css';

function ArtPlayerRecreation({
  videoUrl,
  audioUrl,
  subtitles: subtitlesProp = [],
  onTimeUpdate,
  poster = '',
  title = '',
  userPrefersDubbed = true,
  theme = '#00a1d6',
  autoplay = false,
  loop = false,
  muted = false,
  volume = 0.5,
  playbackRate = 1,
  screenshot = true,
  pip = true,
  fullscreen = true,
  aspectRatio = true,
  flip = true,
  subtitle = true,
  hotkey = true,
  miniProgressBar = true
}) {
  const videoRef = useRef(null);
  const dubbedAudioRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerVolume, setPlayerVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(playbackRate);
  const [currentAspectRatio, setCurrentAspectRatio] = useState('default');
  const [videoFlipped, setVideoFlipped] = useState({ horizontal: false, vertical: false });
  const [pipMode, setPipMode] = useState(false);
  const [useDubbedAudio, setUseDubbedAudio] = useState(userPrefersDubbed);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showMiniProgress, setShowMiniProgress] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [showSubtitles, setShowSubtitles] = useState(true);

  const [subtitles, setSubtitles] = useState([]);
  const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(true);

  const controlsTimer = useRef(null);
  const miniProgressTimer = useRef(null);
  const videoLoaded = useRef(false);
  const audioLoaded = useRef(audioUrl ? false : true);

  useEffect(() => {
    if (subtitlesProp && subtitlesProp.length > 0) {
      setSubtitles(subtitlesProp);
    } else {
      setSubtitles([]);
    }
    setIsLoadingSubtitles(false);
  }, [subtitlesProp]);

  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(console.error);
    } else {
      document.exitFullscreen?.().catch(console.error);
    }
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPipMode(false);
      } else {
        await video.requestPictureInPicture();
        setPipMode(true);
      }
    } catch (error) {
      console.error('PiP failed:', error);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    const audio = dubbedAudioRef.current;
    if (!video) return;

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (useDubbedAudio && audio) {
              audio.play().catch(err => console.error("Dubbed audio play failed:", err));
            }
          })
          .catch(err => {
            console.error("Video play failed:", err);
            if (useDubbedAudio && audio) {
              audio.pause();
            }
          });
      }
    } else {
      video.pause();
      if (useDubbedAudio && audio) {
        audio.pause();
      }
    }
  }, [useDubbedAudio]);
  
  const toggleSubtitles = () => {
    setShowSubtitles(prev => !prev);
  };

  const seek = useCallback((time) => {
    const video = videoRef.current;
    const audio = dubbedAudioRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(time, duration));
    video.currentTime = newTime;
    if (useDubbedAudio && audio) {
        audio.currentTime = newTime;
    }
  }, [duration, useDubbedAudio]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    const video = videoRef.current;
    const audio = dubbedAudioRef.current;

    if (useDubbedAudio && audio) {
      audio.muted = newMuted;
      if (video) video.muted = true;
    } else if (video) {
      video.muted = newMuted;
      if (audio) audio.muted = true;
    }
  }, [isMuted, useDubbedAudio]);

  const handleVolumeChange = useCallback((newVolume) => {
    setPlayerVolume(newVolume);
    const video = videoRef.current;
    const audio = dubbedAudioRef.current;

    if (useDubbedAudio && audio) {
      audio.volume = newVolume;
    } else if (video) {
      video.volume = newVolume;
    }

    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  }, [useDubbedAudio, isMuted]);

  const switchAudioTrack = () => {
    const video = videoRef.current;
    const audio = dubbedAudioRef.current;
    if (!video) return;

    const newUseDubbed = !useDubbedAudio;
    setUseDubbedAudio(newUseDubbed);
    
    if (isPlaying) {
      video.pause();
      if (audio) audio.pause();
    }

    if (newUseDubbed) {
      if (audio) {
        audio.currentTime = video.currentTime;
        audio.muted = false;
        audio.volume = playerVolume;
      }
      video.muted = true;
    } else {
      if (audio) {
        audio.muted = true;
      }
      video.muted = isMuted;
      video.volume = playerVolume;
    }

    if (isPlaying) {
      video.play().catch(console.error);
      if (newUseDubbed && audio) {
        audio.play().catch(console.error);
      }
    }
  };

  const takeScreenshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const changePlaybackRate = (rate) => {
    const video = videoRef.current;
    const audio = dubbedAudioRef.current;
    if (!video) return;
    setCurrentPlaybackRate(rate);
    video.playbackRate = rate;
    if (audio) audio.playbackRate = rate;
    setShowSettings(false);
  };

  const changeAspectRatio = (ratio) => {
    setCurrentAspectRatio(ratio);
    setShowSettings(false);
  };

  const toggleFlip = (direction) => {
    setVideoFlipped(prev => ({
      ...prev,
      [direction]: !prev[direction]
    }));
    setShowSettings(false);
  };

  const handleProgressClick = (e) => {
    const progress = progressRef.current;
    if (!progress) return;
    const rect = progress.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    seek(newTime);
  };

  const handleProgressDrag = (e) => {
    setIsDragging(true);
    const handleMouseMove = (e) => {
      const progress = progressRef.current;
      if (!progress) return;
      const rect = progress.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = Math.max(0, Math.min((clickX / rect.width) * duration, duration));
      setCurrentTime(newTime);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      seek(currentTime);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleVideoError = useCallback((e) => {
    console.error('Video error:', e);
    setIsLoading(false);
  }, []);

  const handleAudioError = useCallback((e) => {
    console.error('Audio error:', e);
    audioLoaded.current = true;
    setUseDubbedAudio(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const audio = dubbedAudioRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      videoLoaded.current = true;
      setDuration(video.duration);
      if (!audioUrl || audioLoaded.current) {
        setIsLoading(false);
        if (autoplay) video.play().catch(console.error);
      }
    };

    const handleAudioLoaded = () => {
        audioLoaded.current = true;
        if (videoLoaded.current) {
            setIsLoading(false);
            if (autoplay) video.play().catch(console.error);
        }
    };
    
    // FIX: Consolidated all time update logic into this single handler.
    const handleTimeUpdate = () => {
      if (isDragging) return;

      const currentVideoTime = video.currentTime;
      
       setCurrentTime(currentVideoTime);

       if (onTimeUpdate) {
         onTimeUpdate(currentVideoTime);
       }
      
       if (subtitles && subtitles.length > 0) {
        // FIX: Defensively cast all values to Number during comparison.
         const subtitleLine = subtitles.find(
          (sub) => Number(currentVideoTime) >= Number(sub.start) && Number(currentVideoTime) <= Number(sub.end)
        );
        if (subtitleLine) {
          setCurrentSubtitle(useDubbedAudio ? subtitleLine.twi : subtitleLine.original_en);
        } else {
          setCurrentSubtitle("");
        }
      }

      if (audio && useDubbedAudio && Math.abs(currentVideoTime - audio.currentTime) > 0.1) {
         audio.currentTime = currentVideoTime;
      }

      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (audio && useDubbedAudio) {
        audio.play().catch(console.error);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (audio && useDubbedAudio) {
        audio.pause();
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (loop) {
        video.currentTime = 0;
        if (audio) audio.currentTime = 0;
        video.play().catch(console.error);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleVideoError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    if (audio) {
      audio.addEventListener('loadedmetadata', handleAudioLoaded);
      audio.addEventListener('error', handleAudioError);
    }
    
    video.muted = useDubbedAudio ? true : isMuted;
    if (audio) {
      audio.muted = !useDubbedAudio ? true : isMuted;
    }
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleVideoError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
        
      if (audio) {
        audio.removeEventListener('loadedmetadata', handleAudioLoaded);
        audio.removeEventListener('error', handleAudioError);
      }
    };
  // FIX: Updated dependency array for the consolidated logic.
  }, [autoplay, loop, useDubbedAudio, isDragging, isMuted, audioUrl, subtitles, onTimeUpdate, handleVideoError, handleAudioError]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(controlsTimer.current);
      if (isPlaying) {
        controlsTimer.current = setTimeout(() => {
          setShowControls(false);
          setShowSettings(false);
          setShowVolumeSlider(false);
        }, 3000);
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', resetTimer);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setTimeout(() => setShowControls(false), 500);
      });
    }
    resetTimer();
    return () => {
      if (container) {
        container.removeEventListener('mousemove', resetTimer);
        container.removeEventListener('mouseleave', resetTimer);
      }
      clearTimeout(controlsTimer.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!hotkey) return;
    const handleKeydown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); seek(currentTime - 10); break;
        case 'ArrowRight': e.preventDefault(); seek(currentTime + 10); break;
        case 'ArrowUp': e.preventDefault(); handleVolumeChange(Math.min(1, playerVolume + 0.1)); break;
        case 'ArrowDown': e.preventDefault(); handleVolumeChange(Math.max(0, playerVolume - 0.1)); break;
        case 'KeyM': e.preventDefault(); toggleMute(); break;
        case 'KeyF': e.preventDefault(); if (fullscreen) toggleFullscreen(); break;
        case 'KeyP': e.preventDefault(); if (pip) togglePip(); break;
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [hotkey, currentTime, playerVolume, fullscreen, pip, togglePlay, toggleMute, seek, handleVolumeChange, toggleFullscreen, togglePip]);

  useEffect(() => {
    if (!miniProgressBar) return;
    const container = containerRef.current;
    if (container) {
      const handleMouseEnter = () => {
        setShowMiniProgress(true);
        clearTimeout(miniProgressTimer.current);
      };
      const handleMouseLeave = () => {
        miniProgressTimer.current = setTimeout(() => setShowMiniProgress(false), 1000);
      };
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
        clearTimeout(miniProgressTimer.current);
      };
    }
  }, [miniProgressBar]);

  const getVideoStyle = () => {
    const style = {};
    if (currentAspectRatio !== 'default') {
      style.aspectRatio = currentAspectRatio;
      style.objectFit = 'fill';
    }
    if (videoFlipped.horizontal || videoFlipped.vertical) {
      const scaleX = videoFlipped.horizontal ? -1 : 1;
      const scaleY = videoFlipped.vertical ? -1 : 1;
      style.transform = `scale(${scaleX}, ${scaleY})`;
    }
    return style;
  };

  return (
    <div
      ref={containerRef}
      className={`artplayer-container ${isFullscreen ? 'fullscreen' : ''}`}
      style={{ '--art-theme': theme }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="artplayer-video"
        style={getVideoStyle()}
        onClick={togglePlay}
        playsInline
        preload="auto"
      />
      {audioUrl && (
        <audio
          ref={dubbedAudioRef}
          src={audioUrl}
          preload="auto"
        />
      )}
      {(isLoading || isLoadingSubtitles) && (
        <div className="artplayer-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      {title && (
        <div className="artplayer-title">{title}</div>
      )}
      {miniProgressBar && showMiniProgress && !showControls && (
        <div className="artplayer-mini-progress">
          <div className="mini-progress-bar" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
        </div>
      )}
      {(showControls || !isPlaying) && (
        <div className="artplayer-controls">
          {!isPlaying && !isLoading && (
            <div className="artplayer-play-button" onClick={togglePlay}>
              <svg width="80" height="80" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            </div>
          )}
          <div className="artplayer-bottom">
            <div className="artplayer-progress-area">
              <div ref={progressRef} className="artplayer-progress" onClick={handleProgressClick} onMouseDown={handleProgressDrag}>
                <div className="progress-buffer" style={{ width: `${buffered}%` }}></div>
                <div className="progress-played" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                <div className="progress-thumb" style={{ left: `${(currentTime / duration) * 100}%` }}></div>
              </div>
            </div>
            <div className="artplayer-controls-bar">
              <div className="controls-left">
                <button className="art-btn play-btn" onClick={togglePlay}>
                  {isPlaying ? <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>}
                </button>
                <div className="volume-container">
                  <button className="art-btn volume-btn" onClick={toggleMute} onMouseEnter={() => setShowVolumeSlider(true)}>
                    {isMuted || playerVolume === 0 ? <svg width="20" height="20" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor" /></svg>}
                  </button>
                  {showVolumeSlider && <div className="volume-slider-panel" onMouseLeave={() => setShowVolumeSlider(false)}><input type="range" className="volume-slider" min="0" max="1" step="0.01" value={playerVolume} onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} /></div>}
                </div>
                <div className="time-display"><span className="current-time">{formatTime(currentTime)}</span><span className="separator"> / </span><span className="total-time">{formatTime(duration)}</span></div>
              </div>
              <div className="controls-right">
                {subtitle && <button className={`art-btn subtitle-btn ${showSubtitles ? 'active' : ''}`} onClick={toggleSubtitles} title="Toggle Subtitles"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z" /></svg></button>}
                {audioUrl && <button className={`art-btn audio-track-btn ${useDubbedAudio ? 'active' : ''}`} onClick={switchAudioTrack}>{useDubbedAudio ? 'TWI' : 'EN'}</button>}
                {screenshot && <button className="art-btn" onClick={takeScreenshot} title="Screenshot"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 15.2l3.2-3.2-1.4-1.4-1.8 1.8-1.8-1.8-1.4 1.4L12 15.2zM19 7v2.99s-1.99.01-2 0V7H7v2.99s-1.99.01-2 0V7H3v12h18V7h-2zm0 10H5V9h14v8z" fill="currentColor" /></svg></button>}
                {pip && <button className="art-btn" onClick={togglePip} title="Picture in Picture"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" fill="currentColor" /></svg></button>}
                <div className="settings-container">
                  <button className="art-btn settings-btn" onClick={() => setShowSettings(!showSettings)} title="Settings"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38-1.03,0.7-1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="currentColor" /></svg></button>
                  {showSettings && <div className="settings-panel"><div className="settings-item"><span>Speed</span><select value={currentPlaybackRate} onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}><option value={0.5}>0.5x</option><option value={0.75}>0.75x</option><option value={1}>Normal</option><option value={1.25}>1.25x</option><option value={1.5}>1.5x</option><option value={2}>2.0x</option></select></div>{aspectRatio && <div className="settings-item"><span>Aspect Ratio</span><select value={currentAspectRatio} onChange={(e) => changeAspectRatio(e.target.value)}><option value="default">Default</option><option value="16/9">16:9</option><option value="4/3">4:3</option><option value="1/1">1:1</option></select></div>}{flip && <><div className="settings-item clickable" onClick={() => toggleFlip('horizontal')}><span>Flip Horizontal</span><span>{videoFlipped.horizontal ? '✓' : ''}</span></div><div className="settings-item clickable" onClick={() => toggleFlip('vertical')}><span>Flip Vertical</span><span>{videoFlipped.vertical ? '✓' : ''}</span></div></> }</div>}
                </div>
                <button className="art-btn" onClick={toggleFullscreen} title="Full Screen"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor" /></svg></button>
              </div>
            </div>
          </div>
        </div>
      )}
      {subtitle && showSubtitles && (
        <div className={`subtitle-container ${useDubbedAudio ? 'twi-subtitle' : 'en-subtitle'}`}>
          <div className="subtitle-text">{currentSubtitle}</div>
        </div>
      )}
    </div>
  );
}
  
export default ArtPlayerRecreation;