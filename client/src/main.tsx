import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { installSafeArea } from './utils/safeArea.js';
import './index.css';

installSafeArea();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

