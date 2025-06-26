import React from 'react';
import ReactDOM from 'react-dom/client'; // Correct import for React 18+
import App from './App';
import './styles/App.css';
import './styles/components.css';

// Create a root element and render the app inside it
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
