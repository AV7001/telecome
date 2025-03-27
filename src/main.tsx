import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// console.log(navigator)
// // Register Firebase service worker
// if ("serviceWorker" in navigator) {
//   navigator.serviceWorker
//     .register("/firebase-messaging-sw.js")
//     .then((registration) => {
//       console.log("Service Worker registered successfully:", registration);
//     })
//     .catch((error) => {
//       console.error("Service Worker registration failed:", error);
//     });
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
