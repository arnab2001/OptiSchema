import { Database } from 'lucide-react'

export default function DatabaseStatus({ 
  dbName = 'optischema', 
  status = 'connected',
  onConnect
}: { 
  dbName?: string, 
  status?: 'connected' | 'disconnected',
  onConnect?: () => void
}) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <Database className="w-4 h-4 text-primary" />
      <span className="font-medium">Connected to:</span>
      <span className="text-primary font-semibold">{dbName}</span>
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {status === 'connected' ? 'Connected' : 'Disconnected'}
      </span>
      {status === 'disconnected' && onConnect && (
        <button
          onClick={onConnect}
          className="ml-2 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors"
        >
          Connect
        </button>
      )}
    </div>
  )
} 