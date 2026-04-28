'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { farmsAPI, predictAPI } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { Farm, RecommendationLog } from '@/lib/types'
import RiskBadge from '@/components/dashboard/RiskBadge'

export default function HistoryPage() {
  const router = useRouter()
  const user = getUser()
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null)
  const [logs, setLogs] = useState<RecommendationLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    farmsAPI.getAll().then(r => {
      setFarms(r.data)
      if (r.data.length > 0) setSelectedFarm(r.data[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedFarm) fetchHistory(selectedFarm, page)
  }, [selectedFarm, page])

  const fetchHistory = async (farmId: number, p: number) => {
    setLoading(true)
    try {
      const res = await predictAPI.getHistory(farmId, p)
      setLogs(res.data.data)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load history') }
    finally { setLoading(false) }
  }

  const exportCSV = () => {
    const rows = [['Date', 'Season', 'Top Crop', 'Match Score', 'Expected Price', 'Risk Level']]
    logs.forEach(log => {
      const top = log.crops_data[0]
      if (top) rows.push([
        new Date(log.created_at).toLocaleDateString('en-IN'),
        log.season, top.crop,
        String(top.match_score),
        String(top.expected_price),
        top.risk_level
      ])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'agrisense_history.csv'; a.click()
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Recommendation History</h1>
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Farm selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <label className="text-sm font-medium text-gray-700 mr-3">Farm:</label>
          <select value={selectedFarm || ''} onChange={e => { setSelectedFarm(Number(e.target.value)); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'Season', 'Top Crop', 'Match Score', 'Expected Price', 'Risk Level'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No history yet</td></tr>
              ) : logs.map(log => {
                const top = log.crops_data[0]
                const isHigh = top?.risk_level === 'High'
                return (
                  <tr key={log.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isHigh ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">{new Date(log.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">{log.season}</td>
                    <td className="px-4 py-3 font-medium">{top?.crop || '—'}</td>
                    <td className="px-4 py-3">{top ? `${top.match_score}%` : '—'}</td>
                    <td className="px-4 py-3">{top ? `₹${top.expected_price.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-4 py-3">{top ? <RiskBadge level={top.risk_level} /> : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
