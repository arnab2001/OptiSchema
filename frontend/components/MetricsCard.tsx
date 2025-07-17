interface MetricsCardProps {
  title: string
  value: string | number
  description: string
  trend: 'up' | 'down' | 'neutral'
}

export default function MetricsCard({ title, value, description, trend }: MetricsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗️'
      case 'down':
        return '↘️'
      default:
        return '→'
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`text-2xl ${getTrendColor()}`}>
          {getTrendIcon()}
        </div>
      </div>
    </div>
  )
} 