import { useState, useEffect } from 'react'

export default function SystemStatus() {
  const [status, setStatus] = useState<'healthy' | 'warning' | 'error'>('healthy')
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        setStatus('healthy')
      } else {
        setStatus('warning')
      }
    } catch (error) {
      setStatus('error')
    }
    setLastCheck(new Date())
  }

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'healthy':
        return 'System Healthy'
      case 'warning':
        return 'System Warning'
      case 'error':
        return 'System Error'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        Last check: {lastCheck.toLocaleTimeString()}
      </span>
    </div>
  )
} 