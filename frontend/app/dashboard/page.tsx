'use client'

import { useState, useEffect } from 'react'
import MetricsCard from '@/components/MetricsCard'
import PerformanceChart from '@/components/PerformanceChart'
import SystemStatus from '@/components/SystemStatus'
import RecommendationModal from '@/components/RecommendationModal'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)

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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Metrics */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
              <PerformanceChart metrics={metrics} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <MetricsCard
              title="Total Queries"
              value={metrics?.length || 0}
              description="Queries monitored"
              trend="up"
            />
            <MetricsCard
              title="Avg Response Time"
              value={`${metrics?.reduce((acc: number, q: any) => acc + q.mean_time, 0) / (metrics?.length || 1) || 0}ms`}
              description="Average query time"
              trend="down"
            />
            <MetricsCard
              title="Active Suggestions"
              value={suggestions?.length || 0}
              description="Optimization opportunities"
              trend="neutral"
            />
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Optimization Suggestions</h2>
            <button
              onClick={fetchSuggestions}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Refresh
            </button>
          </div>
          
          {suggestions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No optimization suggestions available. The system is analyzing your queries...
            </p>
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {suggestion.description}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Potential savings: {suggestion.estimated_savings}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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