import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

window.onerror = function (message, source, lineno, colno, error) {
  console.error('Erro global capturado:', { message, source, lineno, colno, error });
};

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento root não encontrado')
}

const root = createRoot(rootElement)

console.log('[main.tsx] Montando aplicação React');

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
