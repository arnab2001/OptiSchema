import { useState, useEffect } from 'react'
import MetricsCard from '../../components/MetricsCard'
import PerformanceChart from '../../components/PerformanceChart'
import SystemStatus from '../../components/SystemStatus'
import RecommendationModal from '../../components/RecommendationModal'
import QueryDetails from '../../components/QueryDetails'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)
  const [selectedQuery, setSelectedQuery] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'suggestions'>('overview')

  useEffect(() => {
    fetchMetrics()
    fetchSuggestions()
    
    // Set up polling
    const interval = setInterval(() => {
      fetchMetrics()
      fetchSuggestions()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/raw')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/suggestions/latest')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const getTopQueries = () => {
    if (!metrics) return []
    return metrics
      .sort((a: any, b: any) => b.total_time - a.total_time)
      .slice(0, 10)
  }

  const getSlowestQueries = () => {
    if (!metrics) return []
    return metrics
      .filter((q: any) => q.calls > 1) // Only queries called multiple times
      .sort((a: any, b: any) => b.mean_time - a.mean_time)
      .slice(0, 5)
  }

  const getMostFrequentQueries = () => {
    if (!metrics) return []
    return metrics
      .sort((a: any, b: any) => b.calls - a.calls)
      .slice(0, 5)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading OptiSchema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">OptiSchema</h1>
              <p className="text-muted-foreground">AI-Powered PostgreSQL Optimization</p>
            </div>
            <SystemStatus />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'queries', label: 'Query Analysis', icon: '🔍' },
              { id: 'suggestions', label: 'Optimizations', icon: '⚡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricsCard
                title="Total Queries"
                value={metrics?.length || 0}
                description="Queries monitored"
                trend="up"
              />
              <MetricsCard
                title="Avg Response Time"
                value={`${(metrics?.reduce((acc: number, q: any) => acc + q.mean_time, 0) / (metrics?.length || 1) || 0).toFixed(2)}ms`}
                description="Average query time"
                trend="down"
              />
              <MetricsCard
                title="Total Execution Time"
                value={`${(metrics?.reduce((acc: number, q: any) => acc + q.total_time, 0) || 0).toFixed(0)}ms`}
                description="Cumulative time"
                trend="neutral"
              />
              <MetricsCard
                title="Active Suggestions"
                value={suggestions?.length || 0}
                description="Optimization opportunities"
                trend="neutral"
              />
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Top Queries by Total Time</h2>
                <PerformanceChart metrics={getTopQueries()} onQuerySelect={setSelectedQuery} />
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Slowest Queries (Avg Time)</h2>
                <div className="space-y-3">
                  {getSlowestQueries().map((query: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedQuery(query)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Query {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {query.calls} calls • {query.mean_time.toFixed(2)}ms avg
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-red-600">
                          {query.total_time}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Query Analysis</h2>
              <button
                onClick={fetchMetrics}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh Data
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Most Frequent Queries */}
              <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Most Frequent Queries</h3>
                <div className="space-y-3">
                  {getMostFrequentQueries().map((query: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedQuery(query)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Query {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {query.query?.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-sm font-medium text-blue-600">
                          {query.calls} calls
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {query.mean_time.toFixed(2)}ms avg
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Query Details Panel */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Query Details</h3>
                {selectedQuery ? (
                  <QueryDetails query={selectedQuery} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a query to view details
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Optimization Suggestions</h2>
              <button
                onClick={fetchSuggestions}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh Suggestions
              </button>
            </div>
            
            {suggestions.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">No Suggestions Available</h3>
                <p className="text-muted-foreground mb-4">
                  The system is analyzing your queries for optimization opportunities...
                </p>
                <button
                  onClick={() => setActiveTab('queries')}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                >
                  View Query Analysis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm">{suggestion.type}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        suggestion.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                        suggestion.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {suggestion.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Potential savings: {suggestion.estimated_savings}
                      </span>
                      <button className="text-xs text-primary hover:underline">
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Recommendation Modal */}
      {selectedSuggestion && (
        <RecommendationModal
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onApply={async () => {
            // Handle apply logic
            console.log('Applying suggestion:', selectedSuggestion)
            setSelectedSuggestion(null)
          }}
        />
      )}
    </div>
  )
} 