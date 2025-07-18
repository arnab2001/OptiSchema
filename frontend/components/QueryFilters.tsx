import { useState, useEffect } from 'react'
import { Filter, Settings, RefreshCw } from 'lucide-react'

interface QueryFiltersProps {
  onFiltersChange: (filters: {
    minCalls: number
    minTime: number
    limit: number
    sortBy: string
    order: 'asc' | 'desc'
  }) => void
  currentFilters: {
    minCalls: number
    minTime: number
    limit: number
    sortBy: string
    order: 'asc' | 'desc'
  }
}

export default function QueryFilters({ onFiltersChange, currentFilters }: QueryFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(currentFilters)

  // Sync pending filters when current filters change
  useEffect(() => {
    setPendingFilters(currentFilters)
  }, [currentFilters])

  const handleFilterChange = (key: string, value: any) => {
    setPendingFilters({
      ...pendingFilters,
      [key]: value
    })
  }

  const handleApply = () => {
    onFiltersChange(pendingFilters)
  }

  const handlePresetClick = (presetFilters: any) => {
    setPendingFilters(presetFilters)
    onFiltersChange(presetFilters)
  }

  const presetFilters = [
    {
      name: 'Show All',
      filters: { minCalls: 1, minTime: 0, limit: 50, sortBy: 'total_time', order: 'desc' as const }
    },
    {
      name: 'Most Expensive',
      filters: { minCalls: 2, minTime: 1, limit: 20, sortBy: 'total_time', order: 'desc' as const }
    },
    {
      name: 'Most Frequent',
      filters: { minCalls: 5, minTime: 0, limit: 20, sortBy: 'calls', order: 'desc' as const }
    },
    {
      name: 'Slowest Queries',
      filters: { minCalls: 2, minTime: 5, limit: 20, sortBy: 'mean_time', order: 'desc' as const }
    }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">Query Filters</h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <Settings className="w-4 h-4" />
          <span>{isOpen ? 'Hide' : 'Show'} Filters</span>
        </button>
      </div>

      {/* Preset Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {presetFilters.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.filters)}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Current Filter Summary */}
      <div className="text-xs text-gray-600 mb-3">
        <span>Min Calls: {currentFilters.minCalls}</span>
        <span className="mx-2">•</span>
        <span>Min Time: {currentFilters.minTime}ms</span>
        <span className="mx-2">•</span>
        <span>Limit: {currentFilters.limit}</span>
        <span className="mx-2">•</span>
        <span>Sort: {currentFilters.sortBy} ({currentFilters.order})</span>
      </div>

      {/* Advanced Filters */}
      {isOpen && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Calls
              </label>
              <input
                type="number"
                min="1"
                value={pendingFilters.minCalls}
                onChange={(e) => handleFilterChange('minCalls', parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Time (ms)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={pendingFilters.minTime}
                onChange={(e) => handleFilterChange('minTime', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Limit
              </label>
                          <input
              type="number"
              min="1"
              max="5000"
              value={pendingFilters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value) || 20)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={pendingFilters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="total_time">Total Time</option>
                <option value="mean_time">Mean Time</option>
                <option value="calls">Calls</option>
                <option value="rows">Rows</option>
                <option value="time_percentage">Time %</option>
                <option value="performance_score">Performance</option>
              </select>
            </div>
          </div>
          
          {/* Apply Button */}
          <div className="flex justify-end">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 