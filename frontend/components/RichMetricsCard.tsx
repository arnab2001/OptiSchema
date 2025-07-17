import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface RichMetricsCardProps {
  metric: any
}

export default function RichMetricsCard({ metric }: RichMetricsCardProps) {
  // Calculate cache hit percentage
  const cacheHitPercentage = metric.shared_blks_hit + metric.shared_blks_read > 0
    ? ((metric.shared_blks_hit / (metric.shared_blks_hit + metric.shared_blks_read)) * 100)
    : 0;

  // Calculate rows efficiency (rows returned vs rows read)
  const rowsEfficiency = metric.rows > 0 && metric.shared_blks_read > 0
    ? Math.min(100, (metric.rows / (metric.shared_blks_read * 8192 / 100)) * 100) // Rough estimate
    : 0;

  // Performance indicators
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 80) return <TrendingUp className="w-3 h-3" />;
    if (percentage >= 60) return <Activity className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  return (
    <div className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="font-medium text-foreground truncate">
            {metric.query_text?.substring(0, 100)}...
          </div>
          <div className="text-sm text-muted-foreground">
            Calls: {metric.calls} | Avg Time: {metric.mean_time?.toFixed(2)}ms
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-foreground">
            {metric.total_time?.toFixed(2)}ms
          </div>
          <div className="text-sm text-muted-foreground">
            {metric.time_percentage?.toFixed(1)}% of total
          </div>
        </div>
      </div>

      {/* Performance Badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        {/* Cache Hit Badge */}
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(cacheHitPercentage)}`}>
          {getPerformanceIcon(cacheHitPercentage)}
          <span>Cache: {cacheHitPercentage.toFixed(0)}%</span>
        </div>

        {/* Rows Efficiency Badge */}
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(rowsEfficiency)}`}>
          {getPerformanceIcon(rowsEfficiency)}
          <span>Efficiency: {rowsEfficiency.toFixed(0)}%</span>
        </div>

        {/* I/O Badge */}
        <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
          <Activity className="w-3 h-3" />
          <span>I/O: {metric.shared_blks_read + metric.shared_blks_written}</span>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
        <div>
          <span className="font-medium">Rows:</span> {metric.rows || 0}
        </div>
        <div>
          <span className="font-medium">Min:</span> {metric.min_time?.toFixed(2)}ms
        </div>
        <div>
          <span className="font-medium">Max:</span> {metric.max_time?.toFixed(2)}ms
        </div>
      </div>
    </div>
  )
} 