'use client'
import { useEffect, useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import { farmsAPI, predictAPI } from '@/lib/api'
import { Farm } from '@/lib/types'

const RISK_COLORS: Record<string, string> = {
  Low:    'bg-[#e8f0e8] text-[#2D6A4F] border-[#c8dfc8]',
  Medium: 'bg-[#fdf3e3] text-[#8B6914] border-[#f0d8a0]',
  High:   'bg-[#fde8e8] text-[#c0392b] border-[#f0b8b8]',
}

export default function ClimatePage() {
  const [farms,   setFarms]   = useState<Farm[]>([])
  const [selFarm, setSelFarm] = useState<Farm | null>(null)
  const [weather, setWeather] = useState<any>(null)
  const [recs,    setRecs]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    farmsAPI.getAll()
      .then(r => {
        setFarms(r.data)
        if (r.data.length > 0) setSelFarm(r.data[0])
        else setLoading(false)
      })
      .catch(() => { setError('Could not load farms.'); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!selFarm) return
    setLoading(true)
    setError('')
    setWeather(null)
    setRecs([])
    predictAPI.getCropPredictions(selFarm.id)
      .then(r => {
        if (r.data?.weather_summary) {
          setWeather(r.data.weather_summary)
        } else {
          setError('Weather data not available. Make sure your OpenWeatherMap API key is set in backend .env')
        }
        setRecs(r.data?.recommendations ?? [])
      })
      .catch(e => {
        const msg = e?.response?.data?.detail ?? e?.message ?? 'Unknown error'
        setError(`Could not load weather data: ${msg}`)
      })
      .finally(() => setLoading(false))
  }, [selFarm])

  const overallRisk = recs[0]?.risk_level ?? 'Low'
  const forecast    = weather?.forecast_7day ?? []
  const allReasons  = recs.flatMap((r: any) => r.reasons ?? []).slice(0, 6)

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <PageShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-light text-[#1a1a1a]">Weather & Crop Risk</h1>
            <p className="text-sm text-[#888] mt-1">See what the weather means for your crops this week.</p>
          </div>
          {!loading && !error && (
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${RISK_COLORS[overallRisk]}`}>
              {overallRisk.toUpperCase()} RISK
            </span>
          )}
        </div>

        {/* Farm selector */}
        {farms.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {farms.map(f => (
              <button key={f.id} onClick={() => setSelFarm(f)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  selFarm?.id === f.id ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-[#555] border-[#ddd]'
                }`}>{f.name}</button>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
            ⚠ {error}
            {error.includes('OpenWeatherMap') && (
              <p className="mt-1 text-xs">
                Add your free API key at <a href="https://openweathermap.org/api" target="_blank" className="underline">openweathermap.org</a> to <code className="bg-yellow-100 px-1 rounded">backend/.env</code> as <code className="bg-yellow-100 px-1 rounded">OPENWEATHER_API_KEY</code>
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl p-10 border border-[#e0d8cc] text-center text-sm text-[#888]">
            Loading weather data for your farm...
          </div>
        ) : farms.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-[#e0d8cc] text-center">
            <p className="text-4xl mb-3">🌤️</p>
            <p className="text-sm text-[#888]">Add a farm first to see weather data for your location.</p>
          </div>
        ) : weather ? (
          <>
            {/* Current weather */}
            <div className="bg-gradient-to-r from-[#2D6A4F] to-[#52B788] rounded-2xl p-5 text-white">
              <p className="text-xs uppercase tracking-widest opacity-70 mb-3">
                Right now at {selFarm?.name}
              </p>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-3xl font-light">{weather.current_temp?.toFixed(0)}°C</p>
                  <p className="text-xs opacity-70 mt-1">Temperature</p>
                </div>
                <div>
                  <p className="text-3xl font-light">{weather.current_humidity}%</p>
                  <p className="text-xs opacity-70 mt-1">Humidity in air</p>
                </div>
                <div>
                  <p className="text-3xl font-light">{weather.weekly_rainfall_forecast_mm?.toFixed(0)}mm</p>
                  <p className="text-xs opacity-70 mt-1">Rain expected this week</p>
                </div>
                <div>
                  <p className="text-sm font-medium capitalize mt-1">{weather.weather_description}</p>
                  <p className="text-xs opacity-70 mt-1">Sky condition</p>
                </div>
              </div>
            </div>

            {/* 7-day forecast */}
            {forecast.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#e0d8cc] overflow-hidden">
                <p className="text-sm font-medium text-[#333] px-5 pt-4 pb-2">Next 7 days</p>
                <div className="grid grid-cols-7">
                  {forecast.map((day: any, i: number) => {
                    const date     = new Date(day.date * 1000)
                    const dayName  = DAYS[date.getDay()]
                    const rain     = day.rain ?? 0
                    const riskLevel = rain > 20 ? 'High' : rain > 5 ? 'Medium' : 'Low'
                    return (
                      <div key={i} className="p-4 border-r border-[#f0ece4] last:border-r-0 text-center">
                        <p className="text-xs font-semibold text-[#888] mb-2">{dayName}</p>
                        <p className="text-sm font-medium text-[#1a1a1a] mb-1">{day.temp_day?.toFixed(0)}°C</p>
                        <p className="text-xs text-[#aaa] mb-2">{rain > 0 ? `${rain.toFixed(0)}mm` : 'Dry'}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${RISK_COLORS[riskLevel]}`}>
                          {riskLevel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Risk analysis */}
            {allReasons.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-[#e0d8cc]">
                <p className="text-sm font-medium text-[#333] mb-3">What this weather means for your crops</p>
                <ul className="space-y-2">
                  {allReasons.map((reason: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-[#555]">
                      <span className="text-[#2D6A4F] mt-0.5 flex-shrink-0">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Watering tip */}
            <div className="bg-[#eef5ee] border border-[#c8dfc8] rounded-2xl p-5">
              <p className="text-sm font-semibold text-[#2D6A4F] mb-2">💧 Watering tip</p>
              <p className="text-sm text-[#555] leading-relaxed">
                {(weather.weekly_rainfall_forecast_mm ?? 0) < 20
                  ? `Very little rain expected this week (${weather.weekly_rainfall_forecast_mm?.toFixed(0)}mm). Water your crops 2–3 times, especially in the morning.`
                  : (weather.weekly_rainfall_forecast_mm ?? 0) > 100
                  ? `Heavy rain expected (${weather.weekly_rainfall_forecast_mm?.toFixed(0)}mm). Make sure your fields drain well to avoid waterlogging.`
                  : `Moderate rain expected (${weather.weekly_rainfall_forecast_mm?.toFixed(0)}mm). You may only need to water once or twice this week.`
                }
              </p>
            </div>
          </>
        ) : null}
      </div>
    </PageShell>
  )
}
