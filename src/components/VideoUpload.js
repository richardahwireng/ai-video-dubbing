import React, { useRef, useState } from 'react';
import '../styles/components.css';

function VideoUpload({ onFileUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };
  
  // Validate file type and size
  const validateAndProcessFile = (file) => {
    setError('');
    
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
    
    // File is valid, set info and process
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    onFileUpload(file);
  };
  
  // Format file size to human readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle click on upload area
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle drag events
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
  
  // Icons (using emoji for simplicity, could use SVG or FontAwesome)
  const uploadIcon = "📁";
  const videoIcon = "🎬";
  
  return (
    <div 
      className={`upload-area ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleUploadClick}
    >
      <span className="upload-icon">{uploadIcon}</span>
      <h3>Upload Your Video</h3>
      <p>Drag and drop your video file here, or click to browse</p>
      
      <div className="file-types">
        <p>Supported formats: MP4, WebM, MOV, AVI</p>
        <p>Maximum file size: 100MB</p>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="file-input"
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <button className="upload-btn">
        {videoIcon} Select Video
      </button>
      
      {error && (
        <div className="upload-error">
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