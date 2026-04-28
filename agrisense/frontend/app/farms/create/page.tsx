'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { MapPin, Loader2 } from 'lucide-react'
import { farmsAPI } from '@/lib/api'

const FarmMap = dynamic(() => import('@/components/map/FarmMap'), { ssr: false })

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Jammu and Kashmir',
]

type FormData = { name: string; state: string; area_acres: string }

export default function CreateFarmPage() {
  const router = useRouter()
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const handleGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS not supported'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition([pos.coords.latitude, pos.coords.longitude]); setGpsLoading(false) },
      () => { toast.error('Could not get GPS location'); setGpsLoading(false) }
    )
  }

  const onSubmit = async (data: FormData) => {
    if (!position) { toast.error('Please select a location on the map'); return }
    setSubmitting(true)
    try {
      await farmsAPI.create({
        name: data.name,
        latitude: position[0],
        longitude: position[1],
        state: data.state,
        area_acres: data.area_acres ? parseFloat(data.area_acres) : undefined,
      })
      toast.success('Farm created! Soil type auto-detected.')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create farm')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Farm</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Farm Name */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
            <input {...register('name', { required: 'Farm name is required' })}
              placeholder="e.g. North Field, Khet No. 1"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* State */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select {...register('state', { required: 'State is required' })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select state...</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
          </div>

          {/* Area */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">Area (Acres) — Optional</label>
            <input {...register('area_acres')} type="number" step="0.1" min="0.1" placeholder="e.g. 2.5"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Farm Location</label>
              <button type="button" onClick={handleGPS} disabled={gpsLoading}
                className="flex items-center gap-2 text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition disabled:opacity-50">
                {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                Use My GPS
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Click on the map to drop a pin, or use GPS</p>
            <FarmMap position={position} onPositionChange={(lat, lon) => setPosition([lat, lon])} />
            {!position && <p className="text-amber-600 text-xs mt-2">⚠️ Please select a location</p>}
          </div>

          <button type="submit" disabled={submitting || !position}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-xl transition disabled:opacity-50 text-lg">
            {submitting ? 'Creating Farm...' : 'Create Farm & Detect Soil Type'}
          </button>
        </form>
      </div>
    </div>
  )
}
