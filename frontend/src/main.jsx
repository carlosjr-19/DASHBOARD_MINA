import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: error.message, stack: error.stack, componentStack: errorInfo.componentStack })
      });
    } catch (_) {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#450a0a', color: '#fef2f2', padding: '32px', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Se produjo un error al renderizar la aplicación</h1>
          <p style={{ fontSize: '14px', marginBottom: '12px' }}>{this.state.error?.message || String(this.state.error)}</p>
          <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '8px', fontSize: '12px', overflow: 'auto' }}>
            {this.state.error?.stack || ''}
          </pre>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Limpiar datos locales y reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
