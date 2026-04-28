import axios from 'axios'
import { getToken, removeToken } from './auth'

// Use relative /api/* which Next.js proxies to the backend
// This completely avoids CORS issues
const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      removeToken()
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export { apiClient }

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', data),
  googleLogin: () => {
    // Google OAuth must go directly to backend (redirect flow)
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/google`
  },
  getMe: () => apiClient.get('/api/auth/me'),
}

// Farms
export const farmsAPI = {
  getAll: () => apiClient.get('/api/farms'),
  getOne: (id: number) => apiClient.get(`/api/farms/${id}`),
  create: (data: { name: string; latitude: number; longitude: number; state: string; area_acres?: number }) =>
    apiClient.post('/api/farms', data),
  update: (id: number, data: object) => apiClient.put(`/api/farms/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/farms/${id}`),
}

// Predictions
export const predictAPI = {
  getCropPredictions: (farmId: number) => apiClient.get(`/api/predict/crop/${farmId}`),
  getHistory: (farmId: number, page = 1) =>
    apiClient.get(`/api/predict/history/${farmId}?page=${page}`),
}

// Market
export const marketAPI = {
  getPrice: (commodity: string, state: string) =>
    apiClient.get(`/api/market/prices/${commodity}?state=${state}`),
  getHistory: (commodity: string, state: string, days = 30) =>
    apiClient.get(`/api/market/history/${commodity}?state=${state}&days=${days}`),
}

// Voice
export const voiceAPI = {
  query: (audioBlob: Blob, farmId?: number) => {
    const form = new FormData()
    form.append('audio', audioBlob, 'query.wav')
    if (farmId) form.append('farm_id', String(farmId))
    return apiClient.post('/api/voice/query', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
