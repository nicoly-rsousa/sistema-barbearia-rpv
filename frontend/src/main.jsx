import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes.jsx'
import { EmpresaProvider } from './context/EmpresaContext.jsx'
import { ToastProvider } from './components/ToastProvider.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <EmpresaProvider>
          <AppRoutes />
        </EmpresaProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
