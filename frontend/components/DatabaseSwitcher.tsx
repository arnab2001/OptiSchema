import { useState, useEffect } from 'react'
import { Database, Settings, History, LogOut, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react'

interface ConnectionConfig {
  host: string
  port: string
  database: string
  username?: string
  user?: string
  password: string
  ssl?: boolean
}

interface ConnectionHistory {
  config: ConnectionConfig
  connected_at: string
  status: string
}

interface ConnectionStatus {
  connected: boolean
  current_config: ConnectionConfig | null
  connection_history: ConnectionHistory[]
}

export default function DatabaseSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [newConnection, setNewConnection] = useState<ConnectionConfig>({
    host: 'localhost',
    port: '5432',
    database: 'postgres',
    username: 'postgres',
    password: '',
    ssl: false
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  // Fetch current connection status
  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/connection/status')
      if (response.ok) {
        const status = await response.json()
        setConnectionStatus(status)
      }
    } catch (error) {
      console.error('Failed to fetch connection status:', error)
    }
  }

  useEffect(() => {
    fetchConnectionStatus()
  }, [])

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/connection/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConnection),
      })
      
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection'
      })
    } finally {
      setTesting(false)
    }
  }

  const switchConnection = async () => {
    setLoading(true)
    
    try {
      console.log('Switching to connection:', newConnection)
      
      const response = await fetch('/api/connection/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConnection),
      })
      
      const result = await response.json()
      console.log('Switch response:', result)
      
      if (result.success) {
        // Refresh connection status
        await fetchConnectionStatus()
        setIsOpen(false)
        setTestResult(null)
        
        // Show success message before reload
        alert('Successfully connected to new database! Reloading dashboard...')
        
        // Reload the page to refresh all data
        window.location.reload()
      } else {
        setTestResult(result)
      }
    } catch (error) {
      console.error('Switch connection error:', error)
      setTestResult({
        success: false,
        message: 'Failed to switch connection'
      })
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/connection/disconnect', {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchConnectionStatus()
        // Reload the page
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (historyItem: ConnectionHistory) => {
    setNewConnection(historyItem.config)
    setTestResult(null)
  }

  if (!connectionStatus) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading connection status...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Connection Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
      >
        <Database className="w-4 h-4" />
        <span className="font-medium">
          {connectionStatus.connected 
            ? `${connectionStatus.current_config?.host}:${connectionStatus.current_config?.port}/${connectionStatus.current_config?.database}`
            : 'Not Connected'
          }
        </span>
        {connectionStatus.connected && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-600 text-xs">Connected</span>
          </div>
        )}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Database Connection</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Current Connection Status */}
            {connectionStatus.connected && connectionStatus.current_config && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Currently Connected</span>
                </div>
                <div className="text-sm text-green-700">
                  <div><strong>Host:</strong> {connectionStatus.current_config.host}:{connectionStatus.current_config.port}</div>
                  <div><strong>Database:</strong> {connectionStatus.current_config.database}</div>
                  <div><strong>User:</strong> {connectionStatus.current_config.user || connectionStatus.current_config.username}</div>
                </div>
                <button
                  onClick={disconnect}
                  disabled={loading}
                  className="mt-2 flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}

            {/* Connection History */}
            {connectionStatus.connection_history.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <History className="w-4 h-4" />
                  <span>Connection History</span>
                  {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                
                {showHistory && (
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {connectionStatus.connection_history.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border"
                      >
                        <div className="font-medium">
                          {item.config.host}:{item.config.port}/{item.config.database}
                        </div>
                        <div className="text-gray-500">
                          {new Date(item.connected_at).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New Connection Form */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Connect to New Database</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Host</label>
                  <input
                    type="text"
                    value={newConnection.host}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, host: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Port</label>
                  <input
                    type="text"
                    value={newConnection.port}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, port: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="5432"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Database</label>
                <input
                  type="text"
                  value={newConnection.database}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, database: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="postgres"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={newConnection.username}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="postgres"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newConnection.password}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="password"
                  />
                </div>
              </div>

              {/* SSL Option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ssl-toggle"
                  checked={newConnection.ssl || false}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, ssl: e.target.checked }))}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="ssl-toggle" className="text-xs font-medium text-gray-700">
                  Enable SSL connection
                </label>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`p-2 rounded text-sm ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.details && (
                    <div className="mt-1 text-xs opacity-75">
                      {testResult.details.version && <div>Version: {testResult.details.version}</div>}
                      {testResult.details.pg_stat_statements_enabled !== undefined && (
                        <div>pg_stat_statements: {testResult.details.pg_stat_statements_enabled ? 'Enabled' : 'Disabled'}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={testConnection}
                  disabled={testing}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  {testing ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>
                
                <button
                  onClick={switchConnection}
                  disabled={loading || !testResult?.success}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Connecting...' : 'Connect'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 