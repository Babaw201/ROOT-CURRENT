import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'
import { runStorageMigrationsIfNeeded } from './utils/storage'

// Doit s'exécuter avant tout accès au localStorage versionné (MockDataProvider inclus).
runStorageMigrationsIfNeeded()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
