'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { farmsAPI, predictAPI, marketAPI } from '@/lib/api'
import { Farm, PredictionResponse } from '@/lib/types'
import PageShell from '@/components/layout/PageShell'
import { useLang } from '@/lib/LanguageContext'
import { t } from '@/lib/i18n'

export default function DashboardPage() {
  const router = useRouter()
  const user   = getUser()

  const [farms,    setFarms]    = useState<Farm[]>([])
  const [selFarm,  setSelFarm]  = useState<Farm | null>(null)
  const [pred,     setPred]     = useState<PredictionResponse | null>(null)
  const [price,    setPrice]    = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [predLoad, setPredLoad] = useState(false)
  const [error,    setError]    = useState('')

  // Load farms on mount
  useEffect(() => {
    if (!user) { router.push('/login'); return }
    farmsAPI.getAll()
      .then(r => {
        setFarms(r.data)
        if (r.data.length > 0) setSelFarm(r.data[0])
      })
      .catch(() => setError('Could not load your farms. Please check your connection.'))
      .finally(() => setLoading(false))
  }, [])

  // Load predictions when farm changes
  useEffect(() => {
    if (!selFarm) return
    setPredLoad(true)
    setPred(null)
    setPrice(null)

    predictAPI.getCropPredictions(selFarm.id)
      .then(async r => {
        setPred(r.data)
        const topCrop = r.data.recommendations?.[0]?.crop
        if (topCrop && selFarm) {
          try {
            const priceRes = await marketAPI.getPrice(topCrop, selFarm.state)
            setPrice(priceRes.data)
          } catch {
            // Price not critical — ignore error
          }
        }
      })
      .catch(() => {})
      .finally(() => setPredLoad(false))
  }, [selFarm])

  const topCrop = pred?.recommendations?.[0]
  const season  = pred?.current_season ?? 'Rabi'
  const weather = pred?.weather_summary
  const { lang } = useLang()

  function greeting() {
    const h = new Date().getHours()
    if (h < 12) return t(lang, 'dash_greeting_morning')
    if (h < 17) return t(lang, 'dash_greeting_afternoon')
    return t(lang, 'dash_greeting_evening')
  }

  return (
    <PageShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <h1 className="text-3xl font-light text-[#1a1a1a]">
              {greeting()}, {user?.name ?? 'Farmer'}.
            </h1>
            <p className="text-sm text-[#888] mt-1">
              {season} {t(lang, 'dash_season')}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()}
              className="text-sm border border-[#ccc] rounded-lg px-3 py-1.5 hover:bg-white transition text-[#555]">
              ↻ Refresh
            </button>
            <Link href="/farms/create"
              className="text-sm bg-[#2D6A4F] text-white rounded-lg px-3 py-1.5 hover:bg-[#245a42] transition">
              + Add Farm
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            ⚠ {error}
          </div>
        )}

        {/* Farm selector */}
        {farms.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-[#e0d8cc]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[#333]">{t(lang, 'dash_your_farms')}</p>
              <Link href="/farms/create" className="text-xs text-[#2D6A4F] hover:underline">
                {t(lang, 'dash_add_another')}
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {farms.map(f => (
                <button key={f.id} onClick={() => setSelFarm(f)}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${
                    selFarm?.id === f.id
                      ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                      : 'bg-white text-[#555] border-[#ddd] hover:border-[#2D6A4F]'
                  }`}>
                  🌾 {f.name}
                  <span className="ml-1 text-xs opacity-70">({f.state})</span>
                </button>
              ))}
            </div>

            {/* Selected farm details */}
            {selFarm && (
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-[#f0ece4]">
                <div>
                  <p className="text-xs text-[#aaa] uppercase tracking-wide">{t(lang, 'dash_soil')}</p>
                  <p className="text-sm font-medium text-[#333] mt-0.5">{selFarm.soil_type ?? 'Detecting...'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#aaa] uppercase tracking-wide">State</p>
                  <p className="text-sm font-medium text-[#333] mt-0.5">{selFarm.state}</p>
                </div>
                <div>
                  <p className="text-xs text-[#aaa] uppercase tracking-wide">Area</p>
                  <p className="text-sm font-medium text-[#333] mt-0.5">
                    {selFarm.area_acres ? `${selFarm.area_acres} acres` : 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No farms */}
        {!loading && farms.length === 0 && (
          <div className="bg-white rounded-2xl p-10 border border-[#e0d8cc] text-center">
            <p className="text-4xl mb-3">🌱</p>
            <h2 className="text-lg font-medium text-[#333] mb-2">{t(lang, 'dash_no_farm_title')}</h2>
            <p className="text-sm text-[#888] mb-5">{t(lang, 'dash_no_farm_sub')}</p>
            <Link href="/farms/create"
              className="bg-[#2D6A4F] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#245a42] transition">
              {t(lang, 'dash_no_farm_btn')}
            </Link>
          </div>
        )}

        {/* Weather widget */}
        {weather && (
          <div className="bg-gradient-to-r from-[#2D6A4F] to-[#52B788] rounded-2xl p-5 text-white">
            <p className="text-xs uppercase tracking-widest opacity-70 mb-3">{t(lang, 'dash_weather_title')}</p>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-light">{weather.current_temp.toFixed(0)}°C</p>
                <p className="text-xs opacity-70 mt-1">{t(lang, 'dash_temp')}</p>
              </div>
              <div>
                <p className="text-2xl font-light">{weather.current_humidity}%</p>
                <p className="text-xs opacity-70 mt-1">{t(lang, 'dash_humidity')}</p>
              </div>
              <div>
                <p className="text-2xl font-light">{weather.weekly_rainfall_forecast_mm.toFixed(0)}mm</p>
                <p className="text-xs opacity-70 mt-1">{t(lang, 'dash_rain')}</p>
              </div>
              <div>
                <p className="text-sm font-medium capitalize">{weather.weather_description}</p>
                <p className="text-xs opacity-70 mt-1">{t(lang, 'dash_condition')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top crop recommendations */}
        {predLoad && (
          <div className="bg-white rounded-2xl p-6 border border-[#e0d8cc] text-center text-sm text-[#888]">
            {t(lang, 'dash_loading_crops')}
          </div>
        )}

        {pred && pred.recommendations.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-[#e0d8cc]">
            <p className="text-sm font-medium text-[#333] mb-4">
              {t(lang, 'dash_crops_title')} {season}
            </p>
            <div className="space-y-3">
              {pred.recommendations.slice(0, 5).map((rec, i) => (
                <div key={rec.crop}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f8f5f0] border border-[#ede8e0]">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}>{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{rec.crop}</p>
                      <p className="text-xs text-[#888]">{rec.season} crop</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        ₹{rec.expected_price.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-[#888]">{t(lang, 'dash_per_quintal')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      rec.risk_level === 'Low'    ? 'bg-green-100 text-green-700' :
                      rec.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                    }`}>
                      {rec.risk_level === 'Low'    ? t(lang, 'dash_low_risk') :
                       rec.risk_level === 'Medium' ? t(lang, 'dash_medium_risk') :
                                                     t(lang, 'dash_high_risk')}
                    </span>
                    <div className="w-12 text-right">
                      <p className="text-sm font-bold text-[#2D6A4F]">{rec.match_score.toFixed(0)}%</p>
                      <p className="text-xs text-[#aaa]">{t(lang, 'dash_match')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market price for top crop */}
        {price && topCrop && (
          <div className="bg-white rounded-2xl p-5 border border-[#e0d8cc]">
            <p className="text-sm font-medium text-[#333] mb-3">
              {t(lang, 'dash_price_title')} {topCrop.crop} in {selFarm?.state}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#f8f5f0] rounded-xl p-4 text-center">
                <p className="text-xs text-[#aaa] mb-1">{t(lang, 'dash_lowest')}</p>
                <p className="text-xl font-light text-[#1a1a1a]">₹{price.min_price?.toLocaleString('en-IN') ?? '—'}</p>
              </div>
              <div className="bg-[#eef5ee] rounded-xl p-4 text-center border border-[#c8dfc8]">
                <p className="text-xs text-[#2D6A4F] mb-1">{t(lang, 'dash_common')}</p>
                <p className="text-xl font-light text-[#2D6A4F]">₹{price.modal_price?.toLocaleString('en-IN') ?? '—'}</p>
              </div>
              <div className="bg-[#f8f5f0] rounded-xl p-4 text-center">
                <p className="text-xs text-[#aaa] mb-1">{t(lang, 'dash_highest')}</p>
                <p className="text-xl font-light text-[#1a1a1a]">₹{price.max_price?.toLocaleString('en-IN') ?? '—'}</p>
              </div>
            </div>
            <p className="text-xs text-[#aaa] mt-2">Source: AGMARKNET · {price.market ?? selFarm?.state}</p>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { href: '/market',  icon: '📈', title: 'Price Trends',     desc: 'See how prices are moving' },
            { href: '/mandi',   icon: '🏪', title: 'Best Market',      desc: 'Where to sell today' },
            { href: '/climate', icon: '🌤️', title: 'Weather & Risk',   desc: 'Rain and heat forecast' },
            { href: '/yield',   icon: '🌾', title: 'Yield Calculator', desc: 'Estimate your harvest' },
          ].map(n => (
            <Link key={n.href} href={n.href}
              className="bg-white rounded-xl p-4 border border-[#e0d8cc] hover:border-[#2D6A4F] hover:shadow-sm transition">
              <div className="text-2xl mb-2">{n.icon}</div>
              <p className="text-sm font-medium text-[#333]">{n.title}</p>
              <p className="text-xs text-[#888] mt-0.5">{n.desc}</p>
            </Link>
          ))}
        </div>

        {/* Ask AI */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="font-medium mb-1">{t(lang, 'dash_ai_title')}</p>
            <p className="text-sm text-[#888]">{t(lang, 'dash_ai_sub')}</p>
          </div>
          <Link href="/advisor"
            className="bg-[#2D6A4F] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#245a42] transition whitespace-nowrap">
            {t(lang, 'dash_ai_btn')}
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
