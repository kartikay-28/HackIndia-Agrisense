'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveToken, saveUser } from '@/lib/auth'
import { authAPI } from '@/lib/api'

export default function AuthCallbackPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      router.push('/login?error=oauth_failed')
      return
    }

    // Save token then fetch user profile
    saveToken(token)
    authAPI.getMe()
      .then(r => {
        saveUser(r.data)
        router.push('/dashboard')
      })
      .catch(() => {
        router.push('/login?error=profile_failed')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#555] text-sm">Signing you in...</p>
      </div>
    </div>
  )
}
