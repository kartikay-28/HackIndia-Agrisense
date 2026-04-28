'use client'
import { useState, useEffect } from 'react'
import PageShell from '@/components/layout/PageShell'
import { farmsAPI, predictAPI } from '@/lib/api'
import { Farm } from '@/lib/types'

const CROPS   = ['Wheat','Rice','Cotton','Maize','Mustard','Soybean','Sugarcane']
const SEASONS = ['Kharif','Rabi','Zaid']

// How much a crop produces per acre in good conditions (quintals)
const BASE_YIELD: Record<string, number> = {
  Wheat: 18, Rice: 22, Cotton: 8, Maize: 20, Mustard: 7, Soybean: 10, Sugarcane: 350,
}
const UNIT: Record<string, string> = {
  Sugarcane: 'tonnes', default: 'quintals'
}

function calcYield(crop: string, rainfall: number, fertilizer: number, acres: number) {
  const base    = BASE_YIELD[crop] ?? 15
  const optRain = { Wheat: 400, Rice: 1200, Cotton: 700, Maize: 700, Mustard: 350, Soybean: 650, Sugarcane: 1200 }[crop] ?? 600
  const rainFactor = Math.max(0.3, 1 - Math.abs(rainfall - optRain) / optRain * 0.8)
  const fertFactor = 0.5 + (fertilizer / 100) * 0.7
  return Math.round(base * rainFactor * fertFactor * acres)
}

export default function YieldPage() {
  const [farms,      setFarms]      = useState<Farm[]>([])
  const [selFarm,    setSelFarm]    = useState<Farm | null>(null)
  const [crop,       setCrop]       = useState('Wheat')
  const [season,     setSeason]     = useState('Rabi')
  const [rainfall,   setRainfall]   = useState(400)
  const [fertilizer, setFertilizer] = useState(60)
  const [acres,      setAcres]      = useState(5)
  const [predicted,  setPredicted]  = useState(0)

  useEffect(() => {
    farmsAPI.getAll().then(r => {
      setFarms(r.data)
      if (r.data.length > 0) {
        setSelFarm(r.data[0])
        if (r.data[0].area_acres) setAcres(r.data[0].area_acres)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setPredicted(calcYield(crop, rainfall, fertilizer, acres))
  }, [crop, rainfall, fertilizer, acres])

  const histAvg    = Math.round(BASE_YIELD[crop] * 0.75 * acres)
  const vsHist     = histAvg > 0 ? Math.round(((predicted - histAvg) / histAvg) * 100) : 0
  const confidence = Math.min(95, Math.round(55 + fertilizer * 0.25 + (rainfall > 200 ? 10 : 0)))
  const unit       = crop === 'Sugarcane' ? 'tonnes' : 'quintals'

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-light text-[#1a1a1a]">How much will I harvest?</h1>
          <p className="text-sm text-[#888] mt-1">
            Change the sliders to see how rain, fertilizer, and field size affect your harvest.
          </p>
        </div>

        {/* Farm selector */}
        {farms.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-[#888] self-center">Your farm:</span>
            {farms.map(f => (
              <button key={f.id} onClick={() => { setSelFarm(f); if (f.area_acres) setAcres(f.area_acres) }}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  selFarm?.id === f.id
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                    : 'bg-white text-[#555] border-[#ddd]'
                }`}>{f.name} {f.area_acres ? `(${f.area_acres} acres)` : ''}</button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="bg-white rounded-2xl p-6 border border-[#e0d8cc] space-y-5">
            <p className="font-medium text-sm text-[#333]">⚙ Set your conditions</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#888] block mb-1">Which crop?</label>
                <select value={crop} onChange={e => setCrop(e.target.value)}
                  className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2D6A4F]">
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#888] block mb-1">Season</label>
                <select value={season} onChange={e => setSeason(e.target.value)}
                  className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2D6A4F]">
                  {SEASONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {[
              {
                label: '🌧 How much rain do you expect?',
                value: rainfall, set: setRainfall, min: 0, max: 2500,
                display: `${rainfall} mm`,
                hint: rainfall < 200 ? 'Very dry — crops may need extra watering' : rainfall > 1500 ? 'Very wet — watch for flooding' : 'Normal range'
              },
              {
                label: '🌿 How much fertilizer will you use?',
                value: fertilizer, set: setFertilizer, min: 0, max: 100,
                display: `${fertilizer}%`,
                hint: fertilizer < 30 ? 'Low — harvest will be smaller' : fertilizer > 80 ? 'High — good yield expected' : 'Medium amount'
              },
              {
                label: '📐 How big is your field?',
                value: acres, set: setAcres, min: 1, max: 100,
                display: `${acres} acres`,
                hint: `About ${(acres * 0.4).toFixed(1)} hectares`
              },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-[#555]">{s.label}</label>
                  <span className="text-xs font-medium text-[#333]">{s.display}</span>
                </div>
                <input type="range" min={s.min} max={s.max} value={s.value}
                  onChange={e => s.set(Number(e.target.value))}
                  className="w-full accent-[#2D6A4F] h-1.5 rounded-full cursor-pointer"/>
                <p className="text-xs text-[#aaa] mt-1">{s.hint}</p>
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl p-6 border border-[#e0d8cc] flex flex-col">
            <p className="text-xs text-[#aaa] uppercase tracking-wide text-center mb-4">
              Expected Harvest
            </p>

            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-6xl font-light text-[#1a1a1a]">{predicted.toLocaleString('en-IN')}</p>
              <p className="text-sm text-[#888] mt-2">{unit} from {acres} acres</p>
              <p className="text-xs text-[#aaa] mt-1">{crop} · {season} season</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-[#f8f5f0] rounded-xl p-4 text-center">
                <p className="text-xs text-[#aaa] mb-1">How sure are we?</p>
                <p className={`text-2xl font-light ${confidence > 75 ? 'text-[#2D6A4F]' : 'text-[#8B6914]'}`}>
                  {confidence}%
                </p>
                <p className="text-xs text-[#aaa] mt-1">confidence</p>
              </div>
              <div className="bg-[#f8f5f0] rounded-xl p-4 text-center">
                <p className="text-xs text-[#aaa] mb-1">vs average farmer</p>
                <p className={`text-2xl font-light ${vsHist >= 0 ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                  {vsHist >= 0 ? '+' : ''}{vsHist}%
                </p>
                <p className="text-xs text-[#aaa] mt-1">
                  {vsHist >= 0 ? 'above average' : 'below average'}
                </p>
              </div>
            </div>

            {/* Simple advice */}
            <div className="mt-4 bg-[#eef5ee] rounded-xl p-3">
              <p className="text-xs text-[#2D6A4F] leading-relaxed">
                {confidence >= 80
                  ? '✅ Good conditions! Your harvest should be above average.'
                  : confidence >= 60
                  ? '⚠️ Decent conditions. Consider increasing fertilizer for better results.'
                  : '❗ Tough conditions. Make sure to water regularly and use enough fertilizer.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
