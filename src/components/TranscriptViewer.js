// src/components/TranscriptViewer.js
import React, { useState } from 'react';
import '../styles/TranscriptViewer.css';

function TranscriptViewer({ originalText, translatedText }) {
  const [activeTab, setActiveTab] = useState('original');
  
  // Copy text to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Show a temporary success message
        const copyBtn = document.getElementById('copy-btn');
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className="transcript-container">
      <div className="transcript-header">
        <div className="transcript-tabs">
          <button 
            className={activeTab === 'original' ? 'active' : ''} 
            onClick={() => setActiveTab('original')}
          >
            English Transcript
          </button>
          <button 
            className={activeTab === 'translated' ? 'active' : ''} 
            onClick={() => setActiveTab('translated')}
          >
            Twi Translation
          </button>
        </div>
        <button 
          id="copy-btn"
          className="copy-button"
          onClick={() => copyToClipboard(activeTab === 'original' ? originalText : translatedText)}
        >
          Copy Text
        </button>
      </div>
      
      <div className="transcript-content">
        {activeTab === 'original' ? (
          <div className="transcript-text">{originalText}</div>
        ) : (
          <div className="transcript-text">{translatedText}</div>
        )}
      </div>
      
      <div className="transcript-footer">
        <div className="character-count">
          {activeTab === 'original' 
            ? `English: ${originalText.length} characters` 
            : `Twi: ${translatedText.length} characters`}
        </div>
        <div className="language-indicator">
          {activeTab === 'original' ? 'English' : 'Twi'}
        </div>
      </div>
    </div>
  );
}

export default TranscriptViewer;