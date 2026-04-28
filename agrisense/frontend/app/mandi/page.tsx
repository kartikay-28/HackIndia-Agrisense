'use client'
import { useState, useEffect } from 'react'
import PageShell from '@/components/layout/PageShell'
import { marketAPI } from '@/lib/api'

const CROPS  = ['All','Wheat','Rice','Cotton','Maize','Mustard','Soybean']
const STATES = ['Punjab','Maharashtra','Uttar Pradesh','Rajasthan','Madhya Pradesh','Gujarat']

interface MandiRecord {
  state: string
  market: string
  commodity: string
  min_price: number
  max_price: number
  modal_price: number
  date: string
}

export default function MandiPage() {
  const [filter,  setFilter]  = useState('All')
  const [records, setRecords] = useState<MandiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    const cropsToFetch = filter === 'All' ? ['Wheat','Rice','Cotton','Maize','Mustard'] : [filter]
    const stateToFetch = 'Punjab'

    Promise.all(
      cropsToFetch.map(c =>
        marketAPI.getPrice(c, stateToFetch)
          .then(r => ({ ...r.data, commodity: c }))
          .catch(() => null)
      )
    )
      .then(results => {
        setRecords(results.filter(Boolean) as MandiRecord[])
      })
      .catch(() => setError('Could not load mandi prices.'))
      .finally(() => setLoading(false))
  }, [filter])

  const best = records.length > 0
    ? records.reduce((a, b) => (a.modal_price > b.modal_price ? a : b))
    : null

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-light text-[#1a1a1a]">Where to sell today</h1>
          <p className="text-sm text-[#888] mt-1">
            Live prices from AGMARKNET. Find the market that pays the most for your crop.
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {CROPS.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                filter === c
                  ? 'bg-[#3d2b1f] text-white border-[#3d2b1f]'
                  : 'bg-white text-[#555] border-[#ddd] hover:border-[#3d2b1f]'
              }`}>{c}</button>
          ))}
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
            ⚠ {error}
          </div>
        )}

        {/* Best price banner */}
        {best && (
          <div className="bg-[#eef5ee] border border-[#c8dfc8] rounded-2xl px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#2D6A4F] uppercase tracking-wide mb-1">Best Price Right Now</p>
              <p className="text-lg font-semibold text-[#1a1a1a]">{best.market ?? 'Punjab Mandi'}</p>
              <p className="text-xs text-[#888]">{best.commodity} · {best.state}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-light text-[#1a1a1a]">
                ₹{best.modal_price?.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-[#888]">per quintal</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl p-10 border border-[#e0d8cc] text-center text-sm text-[#888]">
            Loading mandi prices...
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-[#e0d8cc] text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm text-[#888]">
              No price data found. Import AGMARKNET CSV data from the API docs to see real mandi prices.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {records.map((r, i) => (
              <div key={i}
                className={`bg-white rounded-2xl p-5 border transition hover:shadow-sm ${
                  r === best ? 'border-[#2D6A4F]' : 'border-[#e0d8cc]'
                }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm text-[#1a1a1a]">{r.market ?? `${r.state} Mandi`}</p>
                    <p className="text-xs text-[#aaa]">{r.state}</p>
                  </div>
                  {r === best && (
                    <span className="text-[10px] bg-[#2D6A4F] text-white px-2 py-0.5 rounded-full">BEST</span>
                  )}
                </div>

                <p className="text-[10px] uppercase tracking-widest text-[#aaa] mt-2">{r.commodity}</p>
                <p className="text-xl font-light text-[#1a1a1a] mt-1">
                  ₹{r.modal_price?.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-[#aaa]">per quintal</p>

                <div className="flex justify-between mt-3 pt-3 border-t border-[#f0ece4] text-xs text-[#888]">
                  <span>Low: ₹{r.min_price?.toLocaleString('en-IN')}</span>
                  <span>High: ₹{r.max_price?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[#aaa] text-center">
          Data from AGMARKNET (Government of India). Updated daily.
        </p>
      </div>
    </PageShell>
  )
}
