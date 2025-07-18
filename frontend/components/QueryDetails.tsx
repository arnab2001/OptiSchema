import { useState } from 'react'
import { X } from 'lucide-react'
import ExecutionPlanModal from './ExecutionPlanModal'

interface QueryDetailsProps {
  query: any
  onClose?: () => void
}

// Performance score calculation function (uses backend score when available)
function getPerformanceScore(metric: any): number {
  // Use backend-calculated performance score if available, otherwise fallback to frontend calculation
  if (metric.performance_score !== undefined && metric.performance_score !== null) {
    return metric.performance_score;
  }
  
  // Fallback calculation (legacy support)
  let score = 100;
  
  // Penalize slow queries (mean_time > 10ms)
  if (metric.mean_time > 10) {
    score -= Math.min(40, (metric.mean_time - 10) / 2);
  }
  
  // Penalize low cache hit rate
  const cacheHit = metric.shared_blks_hit + metric.shared_blks_read > 0 
    ? (metric.shared_blks_hit / (metric.shared_blks_hit + metric.shared_blks_read)) * 100 
    : 100;
  if (cacheHit < 95) {
    score -= (95 - cacheHit) * 0.5;
  }
  
  // Penalize high time percentage (queries consuming too much DB time)
  if (metric.time_percentage > 10) {
    score -= Math.min(20, (metric.time_percentage - 10) * 0.5);
  }
  
  // Bonus for efficient row processing
  const rowEfficiency = metric.rows > 0 && metric.shared_blks_read > 0 
    ? Math.min(100, (metric.rows / (metric.shared_blks_read * 8192 / 100)) * 100) 
    : 100;
  if (rowEfficiency > 80) {
    score += Math.min(10, (rowEfficiency - 80) * 0.2);
  }
  
  return Math.max(0, Math.min(100, score));
}

export default function QueryDetails({ query, onClose }: QueryDetailsProps) {
  const [showExecutionPlan, setShowExecutionPlan] = useState(false)

  if (!query) return null

  const formatTime = (time: number) => `${time.toFixed(2)}ms`
  const formatPercentage = (value: number, total: number) => `${((value / total) * 100).toFixed(1)}%`

  // Calculate cache hit percentage
  const cacheHitPercentage = query.shared_blks_hit + query.shared_blks_read > 0 
    ? (query.shared_blks_hit / (query.shared_blks_hit + query.shared_blks_read)) * 100 
    : 100

  // Calculate efficiency score using the same function as QueryTable
  const efficiencyScore = getPerformanceScore(query)

  // Calculate time percentage (if available)
  const timePercentage = query.time_percentage || 0

  // Ensure we have valid data before rendering
  if (!query.query_text || query.calls === undefined) {
    return (
      <div className="max-h-[90vh] overflow-y-auto bg-white">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Query Details</h3>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No query data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-h-[90vh] overflow-y-auto bg-white">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold text-gray-900">Query Details</h3>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Query Text */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Query Text</h4>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono leading-relaxed">
                <code>{query.query_text || 'No query text available'}</code>
              </pre>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Time:</span>
                  <span className="text-sm font-medium text-gray-900">{formatTime(query.total_time)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mean Time:</span>
                  <span className="text-sm font-medium text-gray-900">{formatTime(query.mean_time)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Calls:</span>
                  <span className="text-sm font-medium text-gray-900">{query.calls.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Min Time:</span>
                  <span className="text-sm font-medium text-gray-900">{formatTime(query.min_time)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Max Time:</span>
                  <span className="text-sm font-medium text-gray-900">{formatTime(query.max_time)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">I/O Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rows:</span>
                  <span className="text-sm font-medium text-gray-900">{query.rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shared Hits:</span>
                  <span className="text-sm font-medium text-gray-900">{query.shared_blks_hit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shared Reads:</span>
                  <span className="text-sm font-medium text-gray-900">{query.shared_blks_read.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shared Writes:</span>
                  <span className="text-sm font-medium text-gray-900">{query.shared_blks_written.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Block Read Time:</span>
                  <span className="text-sm font-medium text-gray-900">{formatTime(query.blk_read_time)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Indicators with Grid Layout and Progress Bars */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Performance Indicators</h4>
            {cacheHitPercentage === 100 ? (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                💡 <strong>Cache Performance:</strong> 100% cache hits indicate excellent memory utilization. This is normal for well-optimized databases where frequently accessed data stays in memory.
              </div>
            ) : cacheHitPercentage >= 95 ? (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                💡 <strong>Cache Performance:</strong> {cacheHitPercentage.toFixed(1)}% cache hits is very good. Most data is served from memory with minimal disk I/O.
              </div>
            ) : cacheHitPercentage >= 80 ? (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                ⚠️ <strong>Cache Performance:</strong> {cacheHitPercentage.toFixed(1)}% cache hits. Consider optimizing indexes or increasing shared_buffers for better performance.
              </div>
            ) : (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                🚨 <strong>Cache Performance:</strong> {cacheHitPercentage.toFixed(1)}% cache hits indicates significant disk I/O. This query may benefit from index optimization or query rewriting.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Database Time Usage */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {timePercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mb-2">of total DB time</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, timePercentage)}%` }}
                  />
                </div>
              </div>

              {/* Cache Hit Rate */}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {cacheHitPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mb-2">cache hit rate</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cacheHitPercentage}%` }}
                  />
                </div>
                {cacheHitPercentage === 100 ? (
                  <div className="text-xs text-green-600 mt-1">
                    Excellent! All data from memory
                  </div>
                ) : cacheHitPercentage >= 95 ? (
                  <div className="text-xs text-blue-600 mt-1">
                    Very good cache performance
                  </div>
                ) : cacheHitPercentage >= 80 ? (
                  <div className="text-xs text-yellow-600 mt-1">
                    Moderate cache performance
                  </div>
                ) : (
                  <div className="text-xs text-red-600 mt-1">
                    Low cache performance
                  </div>
                )}
              </div>

              {/* Efficiency Score */}
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {efficiencyScore.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600 mb-2">efficiency score</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${efficiencyScore}%` }}
                  />
                </div>
              </div>

              {/* Average Time per Call */}
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {query.calls > 0 ? (query.total_time / query.calls).toFixed(2) : 'N/A'}ms
                </div>
                <div className="text-xs text-gray-600 mb-2">avg per call</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, query.calls > 0 ? (query.total_time / query.calls) / 10 : 0)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200">
            <button 
              onClick={() => setShowExecutionPlan(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Analyze Query Performance
            </button>
          </div>
        </div>
      </div>

      {/* Execution Plan Modal */}
      <ExecutionPlanModal
        query={query.query_text}
        isOpen={showExecutionPlan}
        onClose={() => setShowExecutionPlan(false)}
      />
    </>
  )
} 