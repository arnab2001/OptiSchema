import { Tooltip } from 'react-tooltip'

interface KPIBannerProps {
  businessCount: number
  systemCount: number
  totalCount: number
  totalTime: number
  topQueryPercent: number
}

export default function KPIBanner({ businessCount, systemCount, totalCount, totalTime, topQueryPercent }: KPIBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg mb-4">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary" data-tooltip-id="business-tooltip">{businessCount}</div>
          <div className="text-xs text-muted-foreground">Business ⚙️</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600" data-tooltip-id="system-tooltip">{systemCount}</div>
          <div className="text-xs text-muted-foreground">System 🔧</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalCount}</div>
          <div className="text-xs text-muted-foreground">Total 📊</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalTime.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-muted-foreground">Total DB Time (ms) ⏱️</div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="text-sm font-medium text-primary">Top Query: {topQueryPercent.toFixed(1)}%</div>
        <div className="text-xs text-muted-foreground">of total execution time</div>
      </div>
      <Tooltip id="business-tooltip" place="top" content="Business Queries: statements originating from app code (we ignore pg/stat admin calls)." />
      <Tooltip id="system-tooltip" place="top" content="System Queries: framework, migration, or admin statements." />
    </div>
  )
} 