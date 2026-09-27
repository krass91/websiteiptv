// Defensive safeguard for environment where window.fetch getter/setter might be intercepted
try {
  if (typeof window !== 'undefined') {
    const origFetch = window.fetch ? window.fetch.bind(window) : undefined;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'fetch');
    if (!desc || desc.writable === false || !desc.set) {
      try {
        Object.defineProperty(window, 'fetch', {
          value: origFetch,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch {
        // ignore if already sealed
      }
    }
  }
} catch {
  // no-op
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
