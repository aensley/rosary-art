import React from 'react'
import { createRoot } from 'react-dom/client'
import 'bootswatch/dist/materia/bootstrap.min.css'
import './style.scss'
import App from './App'

createRoot(document.getElementById('app')).render(<App />)
