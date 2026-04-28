'use client'
import { useState, useEffect } from 'react'
import PageShell from '@/components/layout/PageShell'
import { marketAPI } from '@/lib/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const CROPS = ['Wheat','Rice','Maize','Cotton','Mustard','Soybean','Sugarcane']
const STATES = ['Punjab','Maharashtra','Uttar Pradesh','Rajasthan','Madhya Pradesh','Gujarat']

export default function MarketPage() {
  const [crop,    setCrop]    = useState('Wheat')
  const [state,   setState]   = useState('Punjab')
  const [history, setHistory] = useState<any[]>([])
  const [latest,  setLatest]  = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      marketAPI.getHistory(crop, state, 30),
      marketAPI.getPrice(crop, state),
    ])
      .then(([histRes, priceRes]) => {
        setHistory(histRes.data.records ?? [])
        setLatest(priceRes.data)
      })
      .catch(() => setError('Could not load price data. Try a different crop or state.'))
      .finally(() => setLoading(false))
  }, [crop, state])

  const chartData = history.map(r => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    price: r.modal_price,
  }))

  const volatility = history.length > 1
    ? (() => {
        const prices = history.map(r => r.modal_price)
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length
        const std = Math.sqrt(prices.reduce((a, b) => a + (b - avg) ** 2, 0) / prices.length)
        const cv  = (std / avg) * 100
        return cv > 20 ? 'High' : cv > 10 ? 'Medium' : 'Stable'
      })()
    : 'Unknown'

  const velocity = history.length >= 8
    ? (() => {
        const last  = history[history.length - 1]?.modal_price ?? 0
        const prev7 = history[history.length - 8]?.modal_price ?? last
        return prev7 > 0 ? (((last - prev7) / prev7) * 100).toFixed(1) : '0.0'
      })()
    : null

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-light text-[#1a1a1a]">Crop Price Tracker</h1>
          <p className="text-sm text-[#888] mt-1">
            See how prices have changed over the last 30 days. Pick the right time to sell.
          </p>
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs text-[#888] block mb-1">Crop</label>
            <div className="flex flex-wrap gap-2">
              {CROPS.map(c => (
                <button key={c} onClick={() => setCrop(c)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    crop === c ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-[#555] border-[#ddd] hover:border-[#2D6A4F]'
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#888] block mb-1">State</label>
            <select value={state} onChange={e => setState(e.target.value)}
              className="border border-[#ddd] rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#2D6A4F]">
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl p-10 border border-[#e0d8cc] text-center text-sm text-[#888]">
            Loading price data...
          </div>
        ) : (
        <div className="space-y-4">
          {/* Chart — full width */}
          <div className="bg-white rounded-2xl p-5 border border-[#e0d8cc]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#333]">
                {crop} prices in {state} — last 30 days
              </p>
              {latest && (
                <span className="text-xs bg-[#f0f0e8] px-2 py-1 rounded text-[#555]">
                  Today: ₹{latest.modal_price?.toLocaleString('en-IN')} / quintal
                </span>
              )}
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2D6A4F" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                    interval={Math.floor(chartData.length / 6)}/>
                  <YAxis domain={['auto','auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${v}`} width={70}/>
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Price']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e0d8cc', fontSize: 12 }}/>
                  <Area type="monotone" dataKey="price" stroke="#2D6A4F" strokeWidth={2}
                    fill="url(#pg)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-[#aaa] text-center">
                No price data available for this crop and state yet.<br/>
                Import AGMARKNET CSV data to see real prices.
              </div>
            )}
          </div>

          {/* Stats row below chart */}
          <div className="grid grid-cols-3 gap-4">
            {latest && (
              <div className="bg-white rounded-2xl p-5 border border-[#e0d8cc] space-y-3">
                <p className="text-xs text-[#aaa] uppercase tracking-wide">Today's Price</p>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-[#aaa]">Lowest</p>
                    <p className="text-lg font-light">₹{latest.min_price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#2D6A4F]">Most Common</p>
                    <p className="text-xl font-medium text-[#2D6A4F]">₹{latest.modal_price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#aaa]">Highest</p>
                    <p className="text-lg font-light">₹{latest.max_price?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <p className="text-xs text-[#aaa]">Market: {latest.market}</p>
              </div>
            )}

            {velocity && (
              <div className="bg-white rounded-2xl p-5 border border-[#e0d8cc]">
                <p className="text-xs text-[#aaa] uppercase tracking-wide mb-2">Change this week</p>
                <p className={`text-3xl font-light ${parseFloat(velocity) >= 0 ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                  {parseFloat(velocity) >= 0 ? '+' : ''}{velocity}%
                </p>
                <p className="text-xs text-[#aaa] mt-1">compared to 7 days ago</p>
              </div>
            )}

            <div className="bg-[#1a1a1a] rounded-2xl p-5 text-white">
              <p className="text-xs text-[#888] uppercase tracking-wide mb-2">Price Stability</p>
              <p className="text-xl font-light">{volatility}</p>
              <p className="text-xs text-[#888] mt-2 leading-relaxed">
                {volatility === 'Stable'  && 'Prices are steady. Good time to plan your sale.'}
                {volatility === 'Medium'  && 'Some ups and downs. Keep an eye on prices this week.'}
                {volatility === 'High'    && 'Prices are changing a lot. Be careful when selling.'}
                {volatility === 'Unknown' && 'Not enough data to judge stability yet.'}
              </p>
            </div>
          </div>
        </div>
        )}
      </div>
    </PageShell>
  )
}
