interface RiskBadgeProps {
  level: 'Low' | 'Medium' | 'High'
  showTooltip?: boolean
}

const config = {
  Low:    { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  icon: '✅', tip: 'Low risk — good conditions for this crop.' },
  Medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', icon: '⚠️', tip: 'Moderate risk — monitor conditions closely.' },
  High:   { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    icon: '⛔', tip: 'High risk — consider alternatives or mitigation.' },
}

export default function RiskBadge({ level, showTooltip = true }: RiskBadgeProps) {
  const c = config[level]
  return (
    <div className="relative group inline-block">
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
        {c.icon} {level} Risk
      </span>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-48 bg-gray-800 text-white text-xs rounded-lg p-2 text-center shadow-lg">
          {c.tip}
        </div>
      )}
    </div>
  )
}
