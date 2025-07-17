interface PerformanceChartProps {
  metrics: any[] | null
  onQuerySelect?: (query: any) => void
}

export default function PerformanceChart({ metrics, onQuerySelect }: PerformanceChartProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No performance data available</p>
      </div>
    )
  }

  // Get top 10 queries by total time
  const topQueries = metrics
    .sort((a, b) => b.total_time - a.total_time)
    .slice(0, 10)

  const maxTime = Math.max(...topQueries.map(q => q.total_time))

  const getPerformanceColor = (time: number) => {
    const percentage = (time / maxTime) * 100
    if (percentage > 80) return 'bg-red-500'
    if (percentage > 60) return 'bg-yellow-500'
    if (percentage > 40) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getPerformanceLabel = (time: number) => {
    const percentage = (time / maxTime) * 100
    if (percentage > 80) return 'Critical'
    if (percentage > 60) return 'High'
    if (percentage > 40) return 'Medium'
    return 'Low'
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {topQueries.map((query, index) => {
          const percentage = (query.total_time / maxTime) * 100
          const performanceColor = getPerformanceColor(query.total_time)
          const performanceLabel = getPerformanceLabel(query.total_time)
          
          return (
            <div 
              key={index} 
              className="space-y-2 cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors"
              onClick={() => onQuerySelect?.(query)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-sm">
                    Query {index + 1}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    performanceColor === 'bg-red-500' ? 'bg-red-100 text-red-800' :
                    performanceColor === 'bg-yellow-500' ? 'bg-yellow-100 text-yellow-800' :
                    performanceColor === 'bg-orange-500' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {performanceLabel}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground">
                    {Math.round(query.total_time)}ms
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {query.calls} calls • {query.mean_time.toFixed(2)}ms avg
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`${performanceColor} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="text-xs text-muted-foreground truncate">
                {query.query_text?.substring(0, 120)}...
              </div>
              
              {/* Additional metrics */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Cache hits: {query.shared_blks_hit}</span>
                <span>Rows: {query.rows}</span>
                <span>Efficiency: {Math.min(100, Math.max(0, 100 - (query.mean_time / 10))).toFixed(0)}%</span>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        Showing top 10 queries by total execution time • Click any query for details
      </div>
    </div>
  )
} 