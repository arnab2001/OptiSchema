import { useState, useEffect } from 'react'

export default function WelcomeBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('optischema_welcome_dismissed')
    setVisible(!dismissed)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('optischema_welcome_dismissed', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-primary/10 border border-primary rounded-lg p-4 mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-primary mb-1">Welcome to OptiSchema!</h2>
        <p className="text-sm text-muted-foreground">
          Monitor your PostgreSQL workload, spot costly queries, and get AI-powered optimization suggestions in real time.<br/>
          <span className="font-medium">Tip:</span> Click on any query or suggestion to see details and actionable fixes.
        </p>
      </div>
      <button
        className="ml-4 px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition-colors text-sm"
        onClick={handleDismiss}
        aria-label="Dismiss welcome banner"
      >
        Dismiss
      </button>
    </div>
  )
} 