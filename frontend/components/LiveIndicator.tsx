import { useState, useEffect } from 'react'
import { Wifi } from 'lucide-react'

export default function LiveIndicator({ isLive = true, lastUpdate }: { isLive?: boolean, lastUpdate?: Date }) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setPulse(prev => !prev)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isLive])

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <Wifi className={`w-3 h-3 ${isLive ? 'text-green-500' : 'text-gray-400'}`} />
        <span className={`text-xs font-medium ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
          LIVE
        </span>
        {isLive && (
          <div className={`w-2 h-2 bg-green-500 rounded-full ${pulse ? 'animate-pulse' : ''}`} />
        )}
      </div>
      {lastUpdate && (
        <span className="text-xs text-gray-500">
          Updated {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
} 