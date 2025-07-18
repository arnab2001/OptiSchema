'use client'

import { useState, useEffect } from 'react'
import MetricsCard from '@/components/MetricsCard'
import PerformanceChart from '@/components/PerformanceChart'
import SystemStatus from '@/components/SystemStatus'
import RecommendationModal from '@/components/RecommendationModal'
import QueryDetails from '@/components/QueryDetails'
import WelcomeBanner from '@/components/WelcomeBanner'
import DatabaseStatus from '@/components/DatabaseStatus'
import LiveIndicator from '@/components/LiveIndicator'
import SkeletonLoader from '@/components/SkeletonLoader'
import ConnectionWizard from '@/components/ConnectionWizard'
import RichMetricsCard from '@/components/RichMetricsCard'
import ProgressIndicator from '@/components/ProgressIndicator'
import KPIBanner from '@/components/KPIBanner'
import QueryTable from '@/components/QueryTable'
import DarkModeToggle from '@/components/DarkModeToggle'
import DatabaseSwitcher from '@/components/DatabaseSwitcher'
import QueryFilters from '@/components/QueryFilters'
import { useKeyboardNav } from '@/hooks/useKeyboardNav'

// Helper function to filter business queries
function isBusinessQuery(query: string) {
  if (!query) return false;
  const q = query.trim().toUpperCase();
  
  // Skip system queries and setup queries
  if (q.includes('PG_STAT_') || 
      q.includes('INFORMATION_SCHEMA') ||
      q.includes('CREATE EXTENSION') ||
      q.includes('GRANT ') ||
      q.includes('CREATE VIEW') ||
      q.includes('UNLISTEN') ||
      q.startsWith('--') ||
      q.startsWith('/*')) {
    return false;
  }
  
  // Include more types of business queries
  return (
    q.startsWith('SELECT') ||
    q.startsWith('INSERT') ||
    q.startsWith('UPDATE') ||
    q.startsWith('DELETE') ||
    q.startsWith('MOVE') ||
    q.startsWith('FETCH') ||
    q.startsWith('SET ') ||
    q.startsWith('BEGIN') ||
    q.startsWith('COMMIT') ||
    q.startsWith('ROLLBACK') ||
    q.startsWith('SAVEPOINT') ||
    q.startsWith('RELEASE') ||
    q.startsWith('PREPARE') ||
    q.startsWith('EXECUTE') ||
    q.startsWith('DEALLOCATE')
  );
}

// Helper function to fingerprint queries (strip literals for deduplication)
function fingerprintQuery(query: string): string {
  if (!query) return '';
  
  // Remove string literals
  let fingerprint = query.replace(/'[^']*'/g, '?');
  
  // Remove numeric literals
  fingerprint = fingerprint.replace(/\b\d+\.?\d*\b/g, '?');
  
  // Remove extra whitespace
  fingerprint = fingerprint.replace(/\s+/g, ' ').trim();
  
  return fingerprint;
}

// Helper function to calculate total execution time percentage
function calculateTimePercentage(metrics: any[]): any[] {
  if (!Array.isArray(metrics) || metrics.length === 0) return [];
  
  const totalTime = metrics.reduce((sum, m) => sum + (m.total_time || 0), 0);
  
  return metrics.map(m => ({
    ...m,
    time_percentage: totalTime > 0 ? ((m.total_time || 0) / totalTime) * 100 : 0
  }));
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [completeMetrics, setCompleteMetrics] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)
  const [selectedQuery, setSelectedQuery] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'suggestions'>('overview')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [showConnectionWizard, setShowConnectionWizard] = useState(false)
  const [connectionConfig, setConnectionConfig] = useState<any>(null)
  const [connected, setConnected] = useState<boolean>(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 25

  // Filter state
  const [filters, setFilters] = useState({
    minCalls: 1,
    minTime: 0,
    limit: 25,
    sortBy: 'total_time',
    order: 'desc' as 'asc' | 'desc'
  })

  // Keyboard navigation
  useKeyboardNav({
    onEscape: () => {
      if (showConnectionWizard) setShowConnectionWizard(false)
      if (selectedSuggestion) setSelectedSuggestion(null)
      if (selectedQuery) setSelectedQuery(null)
    },
    onArrowLeft: () => {
      const tabs = ['overview', 'queries', 'suggestions']
      const currentIndex = tabs.indexOf(activeTab)
      const newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
      setActiveTab(tabs[newIndex] as any)
    },
    onArrowRight: () => {
      const tabs = ['overview', 'queries', 'suggestions']
      const currentIndex = tabs.indexOf(activeTab)
      const newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
      setActiveTab(tabs[newIndex] as any)
    }
  })

  // Load saved connection config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('optischema_connection')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setConnectionConfig(config)
      } catch (error) {
        console.error('Failed to load saved connection config:', error)
      }
    }
  }, [])

  // Check backend connection status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setCheckingStatus(true)
      try {
        console.log('Checking connection status...')
        const res = await fetch('/api/connection/status')
        const data = await res.json()
        console.log('Connection status response:', data)
        setConnected(!!data.connected)
      } catch (e) {
        console.error('Connection status check failed:', e)
        setConnected(false)
      } finally {
        setCheckingStatus(false)
      }
    }
    
    // For now, assume connected since we know the API is working
    setConnected(true)
    setCheckingStatus(false)
  }, [])

  const handleConnect = (config: any) => {
    setConnectionConfig(config)
    // In a real implementation, you would send this to the backend
    // to establish the connection
    console.log('Connecting to database:', config)
  }

  // Only fetch metrics/suggestions if connected
  useEffect(() => {
    if (!connected) {
      // If not connected, try to check connection status again after a short delay
      const timeout = setTimeout(async () => {
        try {
          const res = await fetch('/api/connection/status')
          const data = await res.json()
          if (data.connected) {
            setConnected(true)
          }
        } catch (e) {
          console.error('Failed to re-check connection status:', e)
        }
      }, 1000)
      
      return () => clearTimeout(timeout)
    }
    
    setLoading(true)
    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams({
          limit: filters.limit.toString(),
          min_calls: filters.minCalls.toString(),
          min_time: filters.minTime.toString(),
          sort_by: filters.sortBy,
          order: filters.order
        })
        
        const [metricsRes, suggestionsRes] = await Promise.all([
          fetch(`/api/metrics/raw?${queryParams}`),
          fetch('/api/suggestions/latest')
        ])
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json()
          // Handle new paginated API response
          if (metricsData.queries) {
            setMetrics(metricsData.queries)
            setHasMore(metricsData.pagination?.has_more || false)
          } else {
            // Fallback for old API format
            setMetrics(Array.isArray(metricsData) ? metricsData : [])
          }
          setLastUpdate(new Date())
        }
        if (suggestionsRes.ok) {
          const suggestionsData = await suggestionsRes.json()
          setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [connected])

  // Separate effect for filters with debounce
  useEffect(() => {
    if (!connected) return
    
    const timeoutId = setTimeout(() => {
      setLoading(true)
      const fetchData = async () => {
        try {
          const queryParams = new URLSearchParams({
            limit: filters.limit.toString(),
            min_calls: filters.minCalls.toString(),
            min_time: filters.minTime.toString(),
            sort_by: filters.sortBy,
            order: filters.order
          })
          
          const response = await fetch(`/api/metrics/raw?${queryParams}`)
          if (response.ok) {
            const metricsData = await response.json()
            // Handle new paginated API response
            if (metricsData.queries) {
              setMetrics(metricsData.queries)
              setHasMore(metricsData.pagination?.has_more || false)
            } else {
              // Fallback for old API format
              setMetrics(Array.isArray(metricsData) ? metricsData : [])
            }
            setLastUpdate(new Date())
          }
        } catch (error) {
          console.error('Error fetching data:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }, 500) // 500ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [filters, connected])

  // Fetch complete metrics for stats calculation
  useEffect(() => {
    if (!connected) return
    
    const fetchCompleteMetrics = async () => {
      try {
        const statsParams = new URLSearchParams({
          limit: '5000', // Get a large number for stats
          min_calls: '1',
          min_time: '0',
          sort_by: 'total_time',
          order: 'desc'
        })
        
        const response = await fetch(`/api/metrics/raw?${statsParams}`)
        if (response.ok) {
          const data = await response.json()
          setCompleteMetrics(data.queries || [])
        }
      } catch (error) {
        console.error('Error fetching complete metrics:', error)
      }
    }
    
    fetchCompleteMetrics()
  }, [connected])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/raw')
      if (response.ok) {
        const data = await response.json()
        setMetrics(Array.isArray(data) ? data : [])
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
        setSuggestions(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const loadMoreMetrics = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      const offset = currentPage * pageSize
      const response = await fetch(`/api/metrics/raw?offset=${offset}&limit=${pageSize}&min_calls=2`)
      if (response.ok) {
        const data = await response.json()
        if (data.queries && data.queries.length > 0) {
          // Append new metrics to existing ones
          setMetrics((prev: any) => Array.isArray(prev) ? [...prev, ...data.queries] : data.queries)
          setCurrentPage(prev => prev + 1)
          setHasMore(data.pagination.has_more)
        } else {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error('Failed to load more metrics:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const getTopQueries = () => {
    if (!Array.isArray(metrics)) return []
    return metrics
      .filter((m: any) => isBusinessQuery(m.query_text)) // Filter to business queries only
      .sort((a: any, b: any) => b.total_time - a.total_time)
      .slice(0, 10)
  }

  const getSlowestQueries = () => {
    if (!Array.isArray(metrics)) return []
    return metrics
      .filter((m: any) => isBusinessQuery(m.query_text)) // Filter to business queries only
      .filter((q: any) => q.calls > 1) // Only queries called multiple times
      .sort((a: any, b: any) => b.mean_time - a.mean_time)
      .slice(0, 5)
  }

  const getMostFrequentQueries = () => {
    if (!Array.isArray(metrics)) return []
    return metrics
      .filter((m: any) => isBusinessQuery(m.query_text)) // Filter to business queries only
      .sort((a: any, b: any) => b.calls - a.calls)
      .slice(0, 5)
  }

  // Calculate stats from complete dataset
  const completeBusinessMetrics = Array.isArray(completeMetrics)
    ? calculateTimePercentage(
        completeMetrics
          .filter((m: any) => isBusinessQuery(m.query_text))
          .map((m: any) => ({
            ...m,
            fingerprint: fingerprintQuery(m.query_text)
          }))
      )
    : [];

  const completeIgnoredMetrics = Array.isArray(completeMetrics)
    ? completeMetrics.filter((m: any) => !isBusinessQuery(m.query_text))
    : [];

  // Calculate total DB time and top query % from complete dataset
  const totalTime = completeBusinessMetrics.reduce((sum, m) => sum + (m.total_time || 0), 0)
  const topQueryPercent = completeBusinessMetrics.length > 0 ? completeBusinessMetrics[0].time_percentage : 0

  // Filter metrics to only show business queries with fingerprinting and time percentage for display
  const businessMetrics = Array.isArray(metrics)
    ? calculateTimePercentage(
        metrics
          .filter((m: any) => isBusinessQuery(m.query_text))
          .map((m: any) => ({
            ...m,
            fingerprint: fingerprintQuery(m.query_text)
          }))
      )
    : [];

  // Count ignored queries for display
  const ignoredMetrics = Array.isArray(metrics)
    ? metrics.filter((m: any) => !isBusinessQuery(m.query_text))
    : [];

  // Drill-down drawer state
  const [drawerQuery, setDrawerQuery] = useState<any>(null)

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading connection status...</p>
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Not connected to a database</h2>
          <p className="text-muted-foreground mb-4">Connect to your PostgreSQL instance to begin monitoring and optimization.</p>
          <button
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => setShowConnectionWizard(true)}
          >
            Connect to Database
          </button>
        </div>
        <ConnectionWizard
          isOpen={showConnectionWizard}
          onClose={() => setShowConnectionWizard(false)}
          onConnect={handleConnect}
          currentConfig={connectionConfig}
        />
      </div>
    )
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
            <div className="flex items-center space-x-4">
              <DatabaseSwitcher />
              <LiveIndicator isLive={true} lastUpdate={lastUpdate} />
              <SystemStatus />
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      <div className="container mx-auto px-4 py-4">
        <WelcomeBanner />
      </div>

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
      <main className="px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Banner */}
            <KPIBanner 
              businessCount={completeBusinessMetrics.length}
              systemCount={completeIgnoredMetrics.length}
              totalCount={completeBusinessMetrics.length + completeIgnoredMetrics.length}
              totalTime={totalTime}
              topQueryPercent={topQueryPercent}
            />
            {/* Query Filters */}
            <QueryFilters 
              onFiltersChange={setFilters}
              currentFilters={filters}
            />
            
            {/* Query Table */}
            <QueryTable 
              metrics={businessMetrics}
              onDrillDown={setDrawerQuery}
              onLoadMore={loadMoreMetrics}
              hasMore={hasMore}
              loading={loadingMore}
            />
            {/* Query Drill-down Drawer */}
            {drawerQuery && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setDrawerQuery(null)}>
                <div className="bg-white rounded-lg shadow-xl w-full md:max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                  <QueryDetails query={drawerQuery} onClose={() => setDrawerQuery(null)} />
                </div>
              </div>
            )}
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
                          {query.query_text?.substring(0, 100)}...
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
              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/suggestions/generate', { method: 'POST' })
                      if (response.ok) {
                        await fetchSuggestions()
                      }
                    } catch (error) {
                      console.error('Failed to generate suggestions:', error)
                    }
                  }}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                >
                  Generate Suggestions
                </button>
                <button
                  onClick={fetchSuggestions}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Refresh Suggestions
                </button>
              </div>
            </div>
            
            {Array.isArray(suggestions) && suggestions.length === 0 ? (
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
                {Array.isArray(suggestions) ? suggestions.map((suggestion, index) => {
                  // Map backend fields to frontend expectations
                  const type = suggestion.recommendation_type || suggestion.type
                  const confidence = suggestion.confidence_score || suggestion.confidence || 0
                  const estimatedSavings = suggestion.estimated_improvement_percent || suggestion.estimated_savings || 0
                  const title = suggestion.title || 'Optimization Recommendation'
                  
                  return (
                    <div
                      key={index}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedSuggestion(suggestion)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm">{title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          confidence > 80 ? 'bg-green-100 text-green-800' :
                          confidence > 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {confidence}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {suggestion.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Potential improvement: {estimatedSavings}%
                        </span>
                        <button className="text-xs text-primary hover:underline">
                          View Details →
                        </button>
                      </div>
                    </div>
                  )
                }) : null}
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
            try {
              const response = await fetch('/api/suggestions/apply', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  recommendation_id: selectedSuggestion.id || selectedSuggestion.query_hash 
                })
              })
              
              if (response.ok) {
                const result = await response.json()
                console.log('Suggestion applied successfully:', result)
                // Refresh suggestions after applying
                await fetchSuggestions()
              } else {
                console.error('Failed to apply suggestion')
              }
            } catch (error) {
              console.error('Error applying suggestion:', error)
            } finally {
              setSelectedSuggestion(null)
            }
          }}
        />
      )}

      {/* Connection Wizard */}
      <ConnectionWizard
        isOpen={showConnectionWizard}
        onClose={() => setShowConnectionWizard(false)}
        onConnect={handleConnect}
        currentConfig={connectionConfig}
      />
    </div>
  )
} 