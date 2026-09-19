import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'
import './ui/ui.css'

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado')

/**
 * Sem StrictMode de propósito: o modo de desenvolvimento monta e desmonta
 * cada componente duas vezes, o que faria o palco WebGL ser criado e
 * destruído a cada render e engoliria o contexto gráfico.
 */
createRoot(container).render(<App />)
