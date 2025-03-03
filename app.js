import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot instead of react-dom

import { MultiAgentWorkflow } from './components/MultiAgentWorkflow'; // Import your main App component

// Get the root element where you want to render your application
const rootElement = document.getElementById('root');

// Create a root using createRoot
const root = createRoot(rootElement);

// Render your App component into the root
root.render(
  <React.StrictMode>
    <MultiAgentWorkflow />
  </React.StrictMode>
);