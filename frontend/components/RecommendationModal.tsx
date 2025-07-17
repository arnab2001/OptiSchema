import { useState } from 'react'

interface RecommendationModalProps {
  suggestion: any
  onClose: () => void
  onApply: () => Promise<void>
}

export default function RecommendationModal({ suggestion, onClose, onApply }: RecommendationModalProps) {
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await onApply()
    } catch (error) {
      console.error('Failed to apply suggestion:', error)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Optimization Recommendation</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Recommendation Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Type</span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
              {suggestion.type}
            </span>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Confidence</span>
            <span className={`px-2 py-1 rounded-md text-sm ${
              suggestion.confidence > 0.8 ? 'bg-green-100 text-green-800' :
              suggestion.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </div>

          {/* Estimated Savings */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Estimated Savings</span>
            <span className="text-sm font-medium text-green-600">
              {suggestion.estimated_savings}
            </span>
          </div>

          {/* Description */}
          <div>
            <span className="text-sm font-medium text-muted-foreground block mb-2">Description</span>
            <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
              {suggestion.description}
            </p>
          </div>

          {/* AI Explanation */}
          {suggestion.ai_explanation && (
            <div>
              <span className="text-sm font-medium text-muted-foreground block mb-2">AI Analysis</span>
              <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
                {suggestion.ai_explanation}
              </p>
            </div>
          )}

          {/* SQL Changes */}
          {suggestion.sql_changes && (
            <div>
              <span className="text-sm font-medium text-muted-foreground block mb-2">SQL Changes</span>
              <pre className="text-sm text-foreground bg-muted/50 p-3 rounded-md overflow-x-auto">
                <code>{suggestion.sql_changes}</code>
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isApplying}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isApplying ? 'Applying...' : 'Apply Recommendation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 