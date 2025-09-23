import React, { useRef, useState } from 'react'; 
import '../styles/components.css';

function VideoUpload({ onFileUpload, hasMultipleSpeakers, onMultipleSpeakersChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };
  
  const validateAndProcessFile = (file) => {
    setError('');
    setFileName('');
    setFileSize('');
    
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      setError('Please upload a valid video file.');
      return;
    }
    
    // Check file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      setError(`File size too large. Maximum size is 100MB.`);
      return;
    }

    // Check video duration (must be <= 60 seconds)
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src); // Clean up memory
      const duration = video.duration;
      if (duration > 60) {
        setError('Video must be 1 minute or less.');
        return;
      }

      // Passed all checks
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      onFileUpload(file);
    };
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  const uploadIcon = "📁";
  const videoIcon = "🎬";
  
  return (
    <div 
      className={`upload-area ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <span className="upload-icon" role="img" aria-label="Folder with arrow">
        {uploadIcon}
      </span>
      <h3>Upload Your Video</h3>
      <p>Drag and drop your video file here, or click to browse</p>
      
      <div className="file-types">
        <p>Supported formats: MP4, WebM, MOV, AVI</p>
        <p>Maximum file size: 100MB</p>
        <p>Maximum duration: 1 minute</p>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="file-input"
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <button className="upload-btn" onClick={handleButtonClick}>
        <span role="img" aria-label="Movie camera">
          {videoIcon}
        </span> Select Video
      </button>
      
      <div className="upload-options">
        <label>
          <input 
            type="checkbox" 
            checked={hasMultipleSpeakers} 
            onChange={onMultipleSpeakersChange} 
          />
          Video has multiple speakers
        </label>
      </div>
      
      {error && (
        <div className="upload-error" role="alert">
          {error}
        </div>
      )}
      
      {fileName && (
        <div className="file-info">
          <span className="file-name">{fileName}</span>
          <span className="file-size">{fileSize}</span>
        </div>
      )}
    </div>
  );
}

export default VideoUpload;
