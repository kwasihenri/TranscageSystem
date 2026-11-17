import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo-badge">TC</span>
          <span className="brand-title">Transcage</span>
        </div>
      </header>

      <main className="app-main">
        <div className="card welcome-card">
          <h1 className="welcome-title">Transcage Workspace</h1>
          <p className="welcome-subtitle">
            Frontend template initialized and ready for development.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
