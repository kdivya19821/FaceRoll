import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'
// Force unregister of corrupt PWA cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

window.onerror = function(msg, url, line, col, error) {
  document.body.innerHTML = '<div style="padding: 20px; background: #AA0000; color: white; font-family: sans-serif; font-size: 14px;"><h3>CRITICAL APP CRASH</h3><p>'+msg+'</p><p>Line: '+line+'</p></div>';
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
