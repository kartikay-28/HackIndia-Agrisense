'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PricePoint { date: string; modal_price: number; min_price: number; max_price: number }

interface Props { data: PricePoint[]; cropName: string }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PriceChart({ data, cropName }: Props) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }))

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4">{cropName} — Price Trend (₹/quintal)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2D6A4F" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
          <Tooltip
            formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Modal Price']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Area type="monotone" dataKey="modal_price" stroke="#2D6A4F" strokeWidth={2}
            fill="url(#priceGrad)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
