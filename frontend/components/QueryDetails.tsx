interface QueryDetailsProps {
  query: any
}

export default function QueryDetails({ query }: QueryDetailsProps) {
  if (!query) return null

  const formatTime = (time: number) => `${time.toFixed(2)}ms`
  const formatPercentage = (value: number, total: number) => `${((value / total) * 100).toFixed(1)}%`

  return (
    <div className="space-y-4">
      {/* Query Text */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Query Text</h4>
        <div className="bg-muted/50 p-3 rounded-md">
          <pre className="text-xs text-foreground whitespace-pre-wrap break-words">
            <code>{query.query || 'No query text available'}</code>
          </pre>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Execution Stats</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Total Calls:</span>
              <span className="text-xs font-medium">{query.calls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Total Time:</span>
              <span className="text-xs font-medium">{formatTime(query.total_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Mean Time:</span>
              <span className="text-xs font-medium">{formatTime(query.mean_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Min Time:</span>
              <span className="text-xs font-medium">{formatTime(query.min_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Max Time:</span>
              <span className="text-xs font-medium">{formatTime(query.max_time)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">I/O Stats</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Rows:</span>
              <span className="text-xs font-medium">{query.rows}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Shared Hits:</span>
              <span className="text-xs font-medium">{query.shared_blks_hit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Shared Reads:</span>
              <span className="text-xs font-medium">{query.shared_blks_read}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Shared Writes:</span>
              <span className="text-xs font-medium">{query.shared_blks_written}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Block Read Time:</span>
              <span className="text-xs font-medium">{formatTime(query.blk_read_time)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Performance Indicators</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Efficiency Score:</span>
            <div className="flex items-center">
              <div className="w-16 bg-muted rounded-full h-2 mr-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ 
                    width: `${Math.min(100, Math.max(0, 100 - (query.mean_time / 10)))}%` 
                  }}
                />
              </div>
              <span className="text-xs font-medium">
                {Math.min(100, Math.max(0, 100 - (query.mean_time / 10))).toFixed(0)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Cache Hit Rate:</span>
            <div className="flex items-center">
              <div className="w-16 bg-muted rounded-full h-2 mr-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ 
                    width: `${query.shared_blks_hit + query.shared_blks_read > 0 
                      ? (query.shared_blks_hit / (query.shared_blks_hit + query.shared_blks_read)) * 100 
                      : 0}%` 
                  }}
                />
              </div>
              <span className="text-xs font-medium">
                {query.shared_blks_hit + query.shared_blks_read > 0 
                  ? ((query.shared_blks_hit / (query.shared_blks_hit + query.shared_blks_read)) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-border">
        <button className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
          Analyze Query Performance
        </button>
      </div>
    </div>
  )
} 