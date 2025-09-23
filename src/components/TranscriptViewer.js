// src/components/TranscriptViewer.js
import React, { useState, useEffect, useRef } from 'react';
import '../styles/TranscriptViewer.css';

function TranscriptViewer({ subtitles, currentTime, onSeek }) {
  const [activeTab, setActiveTab] = useState('original');
  // State to manage whether the transcript should auto-scroll.
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Refs for the highlighted line and its scrollable container
  const activeLineRef = useRef(null);
  const containerRef = useRef(null);
  
  const handleLineClick = (lineStart) => {
    if (onSeek) {
      onSeek(lineStart);
    }
    // Re-enable auto-scrolling when a user clicks a line.
    setAutoScrollEnabled(true);
  };

  const copyToClipboard = () => {
    if (!subtitles) return;
    const textToCopy = activeTab === 'original' 
      ? subtitles.map(line => line.original_en).join('\n')
      : subtitles.map(line => line.twi).join('\n');
      
    navigator.clipboard.writeText(textToCopy)
      .then(() => alert('Transcript copied to clipboard!'))
      .catch(err => console.error('Failed to copy text: ', err));
  };

  // FIX: Replace scrollIntoView with manual scrollTop calculation for precise control.
  useEffect(() => {
    // Only scroll if auto-scrolling is enabled and the necessary elements exist.
    if (activeLineRef.current && containerRef.current && autoScrollEnabled) {
      const container = containerRef.current;
      const activeLine = activeLineRef.current;

      // Calculate the desired scroll position to center the active line within the container.
      const scrollOffset = 
        activeLine.offsetTop - 
        (container.clientHeight / 2) + 
        (activeLine.clientHeight / 2);

      // Apply the smooth scroll to the container only.
      container.scrollTo({
        top: scrollOffset,
        behavior: 'smooth',
      });
    }
  }, [currentTime, autoScrollEnabled]);

  return (
    <div 
      className="transcript-container"
      onWheel={() => setAutoScrollEnabled(false)} // Disable auto-scroll on manual scroll.
    >
      <div className="transcript-header">
        <div className="transcript-tabs">
          <button 
            className={activeTab === 'original' ? 'active' : ''} 
            onClick={() => setActiveTab('original')}
          >
            English Transcript
          </button>
          <button 
            className={activeTab === 'twi' ? 'active' : ''} 
            onClick={() => setActiveTab('twi')}
          >
            Twi Translation
          </button>
        </div>
        <button className="copy-button" onClick={copyToClipboard}>
          Copy Text
        </button>
      </div>
      
      {/* Attach the new ref to the scrollable content container */}
      <div className="transcript-content" ref={containerRef}>
        {subtitles && subtitles.length > 0 ? (
          subtitles.map((line, index) => {
            const isActive = Number(currentTime) >= Number(line.start) && Number(currentTime) <= Number(line.end);
            return (
              <p 
                key={index}
                ref={isActive ? activeLineRef : null}
                className={`transcript-line ${isActive ? 'highlighted-line' : ''}`}
                onClick={() => handleLineClick(line.start)}
              >
                {activeTab === 'original' ? line.original_en : line.twi}
              </p>
            );
          })
        ) : (
          <p>No transcript available.</p>
        )}
      </div>
    </div>
  );
}

export default TranscriptViewer;