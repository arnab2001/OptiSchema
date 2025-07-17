import { Activity, Database } from 'lucide-react'

interface ProgressIndicatorProps {
  totalQueries: number
  businessQueries: number
  targetQueries?: number
}

export default function ProgressIndicator({ 
  totalQueries, 
  businessQueries, 
  targetQueries = 50 
}: ProgressIndicatorProps) {
  const progress = Math.min(100, (businessQueries / targetQueries) * 100);
  const isComplete = businessQueries >= targetQueries;

  return (
    <div className="text-center py-8">
      <div className="flex items-center justify-center mb-4">
        <Database className="w-8 h-8 text-primary mr-3" />
        <Activity className="w-6 h-6 text-muted-foreground animate-pulse" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {isComplete ? 'Query Analysis Complete!' : 'Collecting Query Data...'}
      </h3>
      
      <p className="text-muted-foreground mb-4">
        {isComplete 
          ? `Analyzed ${businessQueries} business queries from ${totalQueries} total queries`
          : `Waiting for first ${targetQueries} business queries... (${businessQueries}/${targetQueries})`
        }
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-4">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-primary">{businessQueries}</span>
          <span className="text-muted-foreground"> business queries</span>
        </div>
        <div>
          <span className="font-medium text-orange-600">{totalQueries - businessQueries}</span>
          <span className="text-muted-foreground"> system queries</span>
        </div>
      </div>

      {!isComplete && (
        <p className="text-xs text-muted-foreground mt-4">
          Run some SELECT, INSERT, UPDATE, or DELETE queries in your application to see them here.
        </p>
      )}
    </div>
  )
} 