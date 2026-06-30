import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Prevent multi-touch pinch-to-zoom globally
document.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent double-tap to zoom globally
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Prevent long-press context menu (Safari "Open in new tab" popup)
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, false);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

