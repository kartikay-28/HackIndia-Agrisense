'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/LanguageContext'
import { LANGUAGES, t } from '@/lib/i18n'

/* ─── Count-up hook ─────────────────────────────────────────── */
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

/* ─── Intersection observer hook ───────────────────────────── */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─── Stat card ─────────────────────────────────────────────── */
function StatCard({ value, suffix, label, icon, start }: { value: number; suffix: string; label: string; icon: string; start: boolean }) {
  const count = useCountUp(value, 2000, start)
  return (
    <div className="relative group">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 blur-xl group-hover:blur-2xl transition-all duration-500" />
      <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center hover:border-green-400/40 transition-all duration-300 hover:-translate-y-1">
        <div className="text-3xl mb-3">{icon}</div>
        <div className="text-4xl font-bold text-white mb-1">
          {count.toLocaleString('en-IN')}{suffix}
        </div>
        <div className="text-green-300 text-sm font-medium">{label}</div>
      </div>
    </div>
  )
}

/* ─── Feature card ──────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, gradient }: { icon: string; title: string; desc: string; gradient: string }) {
  return (
    <div className="group relative">
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-green-500/10 to-emerald-600/5 blur-xl" />
      <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:border-green-400/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-900/30 transition-all duration-400">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 bg-gradient-to-br ${gradient} shadow-lg`}>
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-green-200/70 leading-relaxed text-sm">{desc}</p>
      </div>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function LandingPage() {
  const [heroVisible,  setHeroVisible]  = useState(false)
  const { ref: statsRef,    inView: statsVisible }    = useInView()
  const { ref: featuresRef, inView: featuresVisible } = useInView()
  const { ref: stepsRef,    inView: stepsVisible }    = useInView()
  const { lang, setLang } = useLang()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t2 = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(t2)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/google`
  }

  return (
    <div className="min-h-screen bg-[#0a1a0f] text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-sm">🌾</div>
            <span className="text-xl font-bold text-white tracking-tight">AgriSense</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-green-200/70">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#stats" className="hover:text-white transition">Impact</a>
          </div>
          <div className="flex items-center gap-3">
            {/* Language selector */}
            <div className="relative" ref={langRef}>
              <button onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-xs border border-white/20 rounded-lg px-2.5 py-1.5 hover:border-white/40 transition text-white/70 hover:text-white">
                <span>🌐</span>
                <span>{LANGUAGES.find(l => l.code === lang)?.native ?? 'EN'}</span>
                <span className="text-[10px] opacity-50">▼</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[#0d2010] border border-white/10 rounded-xl shadow-2xl py-1 z-50 min-w-[150px]">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-white/5 transition ${
                        lang === l.code ? 'text-green-400 font-semibold' : 'text-white/70'
                      }`}>
                      <span>{l.native}</span>
                      {lang === l.code && <span className="text-green-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/login" className="text-sm text-green-200/70 hover:text-white transition px-4 py-2">
              {t(lang, 'nav_signin')}
            </Link>
            <Link href="/signup" className="btn-primary text-sm font-semibold px-5 py-2.5 rounded-xl text-white">
              {t(lang, 'nav_getstarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO — VIDEO BACKGROUND
      ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Local video — full screen, no overlay */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Only a very subtle dark vignette at top/bottom so navbar and scroll indicator are readable */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a1a0f] to-transparent pointer-events-none" />

        {/* Glow orbs — subtle, behind text only */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-black/30 rounded-full blur-3xl pointer-events-none" />

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-20">
          {heroVisible && (
            <>
              {/* Badge */}
              <div className="anim-fade-up delay-100 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm text-green-300 mb-8 border border-green-400/30 bg-black/30 backdrop-blur-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {t(lang, 'hero_badge')}
              </div>

              {/* Headline */}
              <h1 className="anim-fade-up delay-200 text-6xl md:text-8xl font-black leading-none mb-6 tracking-tight">
                <span className="text-white block">{t(lang, 'hero_h1a')}</span>
                <span className="shimmer-text block">{t(lang, 'hero_h1b')}</span>
                <span className="text-white block">{t(lang, 'hero_h1c')}</span>
              </h1>

              {/* Subtext */}
              <p className="anim-fade-up delay-300 text-xl md:text-2xl text-green-200/70 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                {t(lang, 'hero_sub')}
              </p>

              {/* Tagline */}
              <p className="anim-fade-up delay-400 text-lg text-green-400/80 mb-10" style={{ fontFamily: 'serif' }}>
                {t(lang, 'hero_tagline')}
              </p>

              {/* CTA buttons */}
              <div className="anim-fade-up delay-500 flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/signup" className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white">
                  {t(lang, 'hero_cta1')}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </Link>
                <button onClick={handleGoogleLogin} className="btn-secondary inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg text-white">
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t(lang, 'hero_cta2')}
                </button>
              </div>

              {/* Scroll indicator */}
              <div className="anim-fade-in delay-600 flex flex-col items-center gap-2 text-green-400/50 text-xs">
                <span>Scroll to explore</span>
                <div className="w-px h-8 bg-gradient-to-b from-green-400/50 to-transparent" />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      <section id="stats" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a0f] via-[#0d2010] to-[#0a1a0f]" />
        <div ref={statsRef} className={`relative max-w-5xl mx-auto section-fade ${statsVisible ? 'visible' : ''}`}>
          <div className="text-center mb-14">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">{t(lang, 'stats_sub')}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">{t(lang, 'stats_title')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard value={3000}  suffix="+"  label={t(lang, 'stats_mandis')}  icon="🏪" start={statsVisible} />
            <StatCard value={10}    suffix=""   label={t(lang, 'stats_crops')}   icon="🌾" start={statsVisible} />
            <StatCard value={29}    suffix=""   label={t(lang, 'stats_states')}  icon="🗺️" start={statsVisible} />
            <StatCard value={100}   suffix="K+" label={t(lang, 'stats_farmers')} icon="👨‍🌾" start={statsVisible} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a0f] to-[#0d1f12]" />
        <div ref={featuresRef} className={`relative max-w-6xl mx-auto section-fade ${featuresVisible ? 'visible' : ''}`}>
          <div className="text-center mb-16">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t(lang, 'feat_title')}</h2>
            <p className="text-green-200/60 text-lg max-w-2xl mx-auto">{t(lang, 'feat_sub')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard icon="🤖" title={t(lang,'feat1_title')} desc={t(lang,'feat1_desc')} gradient="from-blue-500/30 to-cyan-600/20" />
            <FeatureCard icon="📊" title={t(lang,'feat2_title')} desc={t(lang,'feat2_desc')} gradient="from-green-500/30 to-emerald-600/20" />
            <FeatureCard icon="🌤️" title={t(lang,'feat3_title')} desc={t(lang,'feat3_desc')} gradient="from-orange-500/30 to-amber-600/20" />
            <FeatureCard icon="🎙️" title={t(lang,'feat4_title')} desc={t(lang,'feat4_desc')} gradient="from-purple-500/30 to-violet-600/20" />
            <FeatureCard icon="🌾" title={t(lang,'feat5_title')} desc={t(lang,'feat5_desc')} gradient="from-yellow-500/30 to-lime-600/20" />
            <FeatureCard icon="🏪" title={t(lang,'feat6_title')} desc={t(lang,'feat6_desc')} gradient="from-red-500/30 to-rose-600/20" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f12] to-[#0a1a0f]" />
        <div ref={stepsRef} className={`relative max-w-5xl mx-auto section-fade ${stepsVisible ? 'visible' : ''}`}>
          <div className="text-center mb-16">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t(lang, 'steps_title')}</h2>
            <p className="text-green-200/60 text-lg">{t(lang, 'steps_sub')}</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 step-connector opacity-40" />

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', icon: '📍', titleKey: 'step1_title' as const, descKey: 'step1_desc' as const },
                { step: '02', icon: '🧠', titleKey: 'step2_title' as const, descKey: 'step2_desc' as const },
                { step: '03', icon: '✅', titleKey: 'step3_title' as const, descKey: 'step3_desc' as const },
              ].map((s, i) => (
                <div key={i} className="relative text-center group">
                  <div className="relative inline-flex">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-900/60 to-emerald-900/40 border border-green-500/20 flex items-center justify-center text-5xl mx-auto mb-6 group-hover:border-green-400/50 group-hover:scale-105 transition-all duration-300 anim-float" style={{ animationDelay: `${i * 0.5}s` }}>
                      {s.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xs font-black text-white shadow-lg">
                      {s.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{t(lang, s.titleKey)}</h3>
                  <p className="text-green-200/60 text-sm leading-relaxed">{t(lang, s.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a0f] to-[#061009]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 md:p-16 border border-green-500/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-emerald-900/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent" />
            <div className="relative">
              <div className="text-5xl mb-6">🌱</div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                {t(lang, 'cta_title')}
              </h2>
              <p className="text-green-200/70 text-lg mb-10 max-w-2xl mx-auto">
                {t(lang, 'cta_sub')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="btn-primary inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg text-white">
                  {t(lang, 'cta_btn1')}
                </Link>
                <button onClick={handleGoogleLogin} className="btn-secondary inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t(lang, 'cta_btn2')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xs">🌾</div>
            <span className="font-bold text-white">AgriSense</span>
          </div>
          <p className="text-green-200/40 text-sm text-center">
            {t(lang, 'footer_copy')}
          </p>
          <div className="flex gap-6 text-sm text-green-200/40">
            <Link href="/login"  className="hover:text-white transition">{t(lang, 'nav_signin')}</Link>
            <Link href="/signup" className="hover:text-white transition">{t(lang, 'nav_getstarted')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
