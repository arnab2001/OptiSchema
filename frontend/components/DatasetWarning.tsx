import { AlertTriangle, TrendingDown, Database, Filter } from 'lucide-react'

interface DatasetWarningProps {
  totalQueries: number
  memoryUsageMB: number
  recommendation: string
  onApplyFilter?: () => void
  onEnableSampling?: () => void
}

export default function DatasetWarning({ 
  totalQueries, 
  memoryUsageMB, 
  recommendation, 
  onApplyFilter,
  onEnableSampling 
}: DatasetWarningProps) {
  const isVeryLarge = totalQueries > 100000
  const isLarge = totalQueries > 50000
  const highMemory = memoryUsageMB > 100

  if (!isLarge && !highMemory) return null

  return (
    <div className={`rounded-lg border p-4 mb-6 ${
      isVeryLarge ? 'bg-red-50 border-red-200' : 
      isLarge ? 'bg-amber-50 border-amber-200' : 
      'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
          isVeryLarge ? 'text-red-600' : 
          isLarge ? 'text-amber-600' : 
          'text-blue-600'
        }`} />
        
        <div className="flex-1">
          <h3 className={`font-medium ${
            isVeryLarge ? 'text-red-800' : 
            isLarge ? 'text-amber-800' : 
            'text-blue-800'
          }`}>
            {isVeryLarge ? 'Very Large Dataset Detected' : 
             isLarge ? 'Large Dataset Detected' : 
             'High Memory Usage'}
          </h3>
          
          <div className={`mt-1 text-sm ${
            isVeryLarge ? 'text-red-700' : 
            isLarge ? 'text-amber-700' : 
            'text-blue-700'
          }`}>
            <div className="flex items-center space-x-4 mb-2">
              <div className="flex items-center space-x-1">
                <Database className="w-4 h-4" />
                <span>{totalQueries.toLocaleString()} queries</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingDown className="w-4 h-4" />
                <span>{memoryUsageMB.toFixed(1)} MB memory</span>
              </div>
            </div>
            
            <p className="mb-3">{recommendation}</p>
            
            {/* Action buttons */}
            <div className="flex space-x-2">
              {onApplyFilter && (
                <button
                  onClick={onApplyFilter}
                  className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-md ${
                    isVeryLarge ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                    isLarge ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                    'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>Apply Recommended Filters</span>
                </button>
              )}
              
              {isVeryLarge && onEnableSampling && (
                <button
                  onClick={onEnableSampling}
                  className="flex items-center space-x-1 px-3 py-1 text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 rounded-md"
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>Enable Smart Sampling</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 