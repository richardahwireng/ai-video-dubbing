// src/components/ProcessingStatus.js
import React from 'react';
import '../styles/components.css';

/**
 * A component to display the current status of a multi-step process.
 * @param {object} props
 * @param {string} props.status - A message describing the current status.
 * @param {boolean} [props.isProcessing=true] - Indicates if a process is ongoing.
 * @param {string} [props.error=null] - An error message if the process failed.
 * @param {number} [props.currentStep=0] - The index of the current step (0-indexed).
 * @param {number} [props.totalSteps=5] - The total number of steps.
 * @param {string[]} [props.steps] - An array of step labels. Defaults to a standard set if not provided.
 */
function ProcessingStatus({ 
  status, 
  isProcessing = true, 
  error = null, 
  currentStep = 0, 
  totalSteps = 5, 
  steps 
}) {
  const progressSteps = steps || [
    "Upload Video",
    "Extract & Transcribe",
    "Translate to Twi", 
    "Generate Speech",
    "Complete"
  ];
  
  const isSimpleStatus = !isProcessing && !error && currentStep === 0 && !steps;

  if (isSimpleStatus) {
    return (
      <div className="processing-status">
        <p>{status}</p>
      </div>
    );
  }
  
  return (
    <div className="processing-status-container" role="status" aria-live="polite">
      {/* Status message */}
      <p className={`status-message ${isProcessing ? 'processing' : ''} ${error ? 'error' : ''}`}>
        {status}
      </p>
      
      {/* Progress steps indicator */}
      {!error && progressSteps.length > 0 && (
        <div className="progress-steps" aria-label="Processing steps">
          {progressSteps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            
            return (
              <React.Fragment key={index}>
                <div 
                  className={`step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? "step" : false}
                >
                  <div className="step-circle" aria-hidden="true">
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="step-label">{step}</div>
                </div>
                {index < progressSteps.length - 1 && (
                  <div className="step-connector" aria-hidden="true"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
      
      {/* Spinner for processing state */}
      {isProcessing && !error && (
        <div className="spinner-container" role="progressbar" aria-label="Processing video">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default ProcessingStatus;