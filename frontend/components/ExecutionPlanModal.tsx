'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle, CheckCircle, Clock, Database, TrendingUp, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ExecutionPlanModalProps {
  query: string
  isOpen: boolean
  onClose: () => void
}

interface AnalysisResult {
  query: string
  execution_plan?: any
  analysis?: any
  optimization?: string
  recommendations?: any
}

export default function ExecutionPlanModal({ query, isOpen, onClose }: ExecutionPlanModalProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && query) {
      analyzeQuery()
    }
  }, [isOpen, query])

  const analyzeQuery = async () => {
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch('/api/analysis/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          explain: true,
          optimize: true
        })
      })

      const data = await response.json()

      if (response.ok) {
        setAnalysis(data)
      } else {
        setError(data.error || 'Analysis failed')
      }
    } catch (error) {
      setError('Failed to analyze query')
      console.error('Analysis error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Query Performance Analysis</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Analyzing query performance...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Query Text */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Query</h3>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono">
                  <code>{analysis.query}</code>
                </pre>
              </div>
            </div>

            {/* Execution Plan */}
            {analysis.execution_plan && !analysis.execution_plan.error && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Execution Plan</h3>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono max-h-64 overflow-y-auto">
                    <code>{JSON.stringify(analysis.execution_plan, null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysis.analysis && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-900">Performance Score</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {analysis.analysis.performance_score || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">out of 100</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-gray-900">Bottleneck Type</span>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      {analysis.analysis.bottleneck_type || 'None detected'}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-gray-900">Status</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">Analysis Complete</span>
                    </div>
                  </div>
                </div>
                
                {/* Data Source Indicator */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-800">Analysis Data Source</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {analysis.recommendations?.actual_metrics ? 
                      "✅ Using actual query metrics from pg_stat_statements" : 
                      "📊 Using calculated performance score based on query patterns"
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Optimization Suggestions */}
            {analysis.optimization && analysis.optimization !== 'Optimization failed' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Optimized Query</h3>
                <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                  <pre className="text-sm text-green-800 whitespace-pre-wrap break-words font-mono">
                    <code>
                      {analysis.optimization
                        .replace(/^```sql\s*/, '')  // Remove opening ```sql
                        .replace(/```\s*$/, '')    // Remove closing ```
                        .trim()}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && !analysis.recommendations.error && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Recommendations</h3>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                  <div className="text-sm text-blue-800 prose prose-sm max-w-none">
                    {typeof analysis.recommendations === 'string' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {analysis.recommendations}
                      </ReactMarkdown>
                    ) : analysis.recommendations.title ? (
                      <div className="space-y-4">
                        {/* Title */}
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-2">
                            {analysis.recommendations.title
                              .replace(/^\d+\.\s*\*\*?([^*]+)\*\*?/, '$1')
                              .replace(/^\d+\.\s*/, '')
                              .trim()}
                          </h4>
                        </div>
                        
                        {/* Description */}
                        {analysis.recommendations.description && (
                          <div>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {analysis.recommendations.description
                                .replace(/^\d+\.\s*\*\*?([^*]+)\*\*?:\s*/, '')
                                .replace(/^\*\*([^*]+)\*\*:\s*/, '')
                                .replace(/^\*\*([^*]+)\*\*\s*/, '')
                                .trim()}
                            </ReactMarkdown>
                          </div>
                        )}
                        
                        {/* SQL Fix */}
                        {analysis.recommendations.sql_fix && (
                          <div>
                            <h5 className="font-medium text-blue-900 mb-2">SQL Fix:</h5>
                            <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto">
                              <code>{analysis.recommendations.sql_fix}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(analysis.recommendations, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error in Execution Plan */}
            {analysis.execution_plan?.error && (
              <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <span className="font-medium text-yellow-800">Execution Plan Error</span>
                  <p className="text-sm text-yellow-700">{analysis.execution_plan.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          {analysis && (
            <button
              onClick={analyzeQuery}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Re-analyze
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 