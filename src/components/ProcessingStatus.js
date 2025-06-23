// src/components/ProcessingStatus.js
import React from 'react';
import '../styles/components.css';

function ProcessingStatus({ status, isProcessing, error, currentStep = 0, totalSteps = 5, steps }) {
  // Default steps if none provided
  const defaultSteps = [
    "Upload Video",
    "Extract & Transcribe",
    "Translate to Twi", 
    "Generate Speech",
    "Complete"
  ];
  
  // Use provided steps or default ones
  const progressSteps = steps || defaultSteps;
  
  // If we're using the basic version, just return the simple status
  if (arguments.length === 1) {
    return (
      <div className="processing-status">
        <p>{status}</p>
      </div>
    );
  }
  
  return (
    <div className="processing-status-container">
      {/* Status message */}
      <p className={`status-message ${isProcessing ? 'processing' : ''} ${error ? 'error' : ''}`}>
        {status}
      </p>
      
      {/* Progress steps indicator */}
      {currentStep > 0 && (
        <div className="progress-steps">
          {progressSteps.map((step, index) => (
            <div 
              key={index} 
              className={`step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
            >
              <div className="step-circle">
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="step-label">{step}</div>
              {index < progressSteps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      )}
      
      {/* Spinner for processing state */}
      {isProcessing && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default ProcessingStatus;