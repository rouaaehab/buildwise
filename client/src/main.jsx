import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode disabled to avoid Supabase auth lock errors (double-mount in dev)
createRoot(document.getElementById('root')).render(<App />)
