import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installGlobalMock } from './demo/mockAdapter'

// Demo build: raw axios calls are answered by the in-memory fake backend too.
installGlobalMock()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
