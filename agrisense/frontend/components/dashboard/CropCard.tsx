'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import RiskBadge from './RiskBadge'
import { CropRecommendation } from '@/lib/types'

const CROP_EMOJI: Record<string, string> = {
  Rice: '🍚', Wheat: '🌾', Cotton: '🌿', Sugarcane: '🎋',
  Maize: '🌽', Soybean: '🫘', Groundnut: '🥜', Mustard: '🌻',
  Turmeric: '🟡', Chilli: '🌶️',
}

const RANK_STYLE: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-amber-600 text-white',
}

interface Props extends CropRecommendation { rank: number }

function CircleProgress({ score }: { score: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? '#2D6A4F' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="72" height="72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="36" y="40" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}>
        {score}%
      </text>
    </svg>
  )
}

export default function CropCard({ crop, match_score, expected_price, risk_level, reasons, season, rank }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${RANK_STYLE[rank] || 'bg-gray-100 text-gray-600'}`}>
            {rank}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{CROP_EMOJI[crop] || '🌱'}</span>
              <h3 className="text-lg font-bold text-gray-800">{crop}</h3>
            </div>
            <span className="text-xs text-gray-400">{season} Season</span>
          </div>
        </div>
        <CircleProgress score={Math.round(match_score)} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500">Expected Price</p>
          <p className="text-xl font-bold text-primary-700">
            ₹{expected_price.toLocaleString('en-IN')}
            <span className="text-xs font-normal text-gray-400">/quintal</span>
          </p>
        </div>
        <RiskBadge level={risk_level} />
      </div>

      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm text-primary-600 font-medium py-2 border-t border-gray-100 mt-2">
        Why this crop?
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <ul className="mt-2 space-y-1">
          {reasons.map((r, i) => (
            <li key={i} className="text-xs text-gray-600 flex gap-2">
              <span className="text-primary-500 mt-0.5">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
