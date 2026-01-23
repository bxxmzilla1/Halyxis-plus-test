
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Temporarily disable StrictMode to avoid double-rendering issues that can cause initialization errors
// The "Cannot access 'O' before initialization" error is likely caused by StrictMode's double-rendering
// TODO: Re-enable StrictMode once initialization issues are resolved
try {
  root.render(<App />);
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #020408; color: #fff; padding: 2rem; text-align: center;">
      <div>
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Something went wrong</h1>
        <p style="color: #9ca3af; margin-bottom: 1rem;">${error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background-color: #14b8a6; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
