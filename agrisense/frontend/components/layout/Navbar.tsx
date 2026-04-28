'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { getUser, removeToken } from '@/lib/auth'
import { User } from '@/lib/types'
import { useLang } from '@/lib/LanguageContext'
import { LANGUAGES, t } from '@/lib/i18n'

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const { lang, setLang } = useLang()

  useEffect(() => { setUser(getUser()) }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const logout = () => { removeToken(); router.push('/') }

  const NAV_LINKS = [
    { href: '/dashboard', key: 'nav_dashboard' as const },
    { href: '/market',    key: 'nav_market'    as const },
    { href: '/mandi',     key: 'nav_mandi'     as const },
    { href: '/climate',   key: 'nav_climate'   as const },
    { href: '/yield',     key: 'nav_yield'     as const },
    { href: '/advisor',   key: 'nav_advisor'   as const },
  ]

  const currentLang = LANGUAGES.find(l => l.code === lang)

  return (
    <nav className="sticky top-0 z-50 bg-[#f5f0e8] border-b border-[#e0d8cc]">
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
        <Link href="/dashboard" className="text-[#2D6A4F] font-bold text-lg tracking-tight">
          AgriSense
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, key }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`px-3 py-1 text-sm rounded transition ${
                  active ? 'text-[#2D6A4F] font-semibold border-b-2 border-[#2D6A4F]' : 'text-[#555] hover:text-[#2D6A4F]'
                }`}>
                {t(lang, key)}
              </Link>
            )
          })}

          <div className="w-px h-4 bg-[#ccc] mx-2" />

          {/* Language selector */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 text-xs border border-[#ddd] rounded-lg px-2.5 py-1.5 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition bg-white text-[#555]"
            >
              <span>🌐</span>
              <span>{currentLang?.native ?? 'EN'}</span>
              <span className="text-[10px] opacity-50">▼</span>
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e0d8cc] rounded-xl shadow-lg py-1 z-50 min-w-[140px]">
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-[#f5f0e8] transition ${
                      lang === l.code ? 'text-[#2D6A4F] font-semibold' : 'text-[#555]'
                    }`}>
                    <span>{l.native}</span>
                    {lang === l.code && <span className="text-[#2D6A4F] text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-[#ccc] mx-2" />

          {user && <span className="text-xs text-[#888] mr-2">{user.name}</span>}
          <button onClick={logout} className="text-sm text-[#555] hover:text-red-600 transition">
            {t(lang, 'nav_logout')}
          </button>
        </div>
      </div>
    </nav>
  )
}
