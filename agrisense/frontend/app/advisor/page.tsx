'use client'
import { useState, useRef, useEffect } from 'react'
import PageShell from '@/components/layout/PageShell'
import { farmsAPI, predictAPI } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { Farm, PredictionResponse } from '@/lib/types'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Should I sell my stored wheat this week?',
  'What crop is best for Rabi season in Punjab?',
  'How does dry weather affect my soil?',
  'What is the MSP for rice this year?',
  'When should I add fertilizer for wheat?',
]

async function callGroq(messages: Message[], farmContext: string, userName: string): Promise<string> {
  const key = process.env.NEXT_PUBLIC_GROQ_API_KEY
  if (!key) return 'Groq API key not set. Add NEXT_PUBLIC_GROQ_API_KEY to frontend .env.local'

  const systemPrompt = `You are AgriSense AI Advisor, a friendly and helpful assistant for Indian farmers.
You are talking to ${userName || 'a farmer'}.

IMPORTANT RULES:
- Always respond in English only
- Use simple, everyday words — like talking to a friend, not a scientist
- Address the farmer by their first name (${userName?.split(' ')[0] || 'friend'}) occasionally to make it personal
- Keep answers short and practical — 3 to 5 sentences max
- Always end with one clear action the farmer can take today
- Use ₹ for prices, not "rupees"

${farmContext ? `The farmer's farm details:\n${farmContext}\n` : ''}

You know about:
- Indian crops: Rice, Wheat, Cotton, Sugarcane, Maize, Soybean, Groundnut, Mustard, Turmeric, Chilli
- Seasons: Kharif (June–Nov), Rabi (Nov–Apr), Zaid (Apr–Jun)
- Mandi prices from AGMARKNET
- Government schemes: MSP, PM-KISAN, crop insurance (PMFBY)
- Watering, fertilizer, pest control, soil health`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Error ${res.status}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? 'No reply received.'
}

export default function AdvisorPage() {
  const user = getUser()
  const firstName = user?.name?.split(' ')[0] ?? 'Farmer'

  const [messages,  setMessages]  = useState<Message[]>([
    { role: 'assistant', content: `Hello ${firstName}! I'm your AgriSense AI Advisor. I can help you with crop advice, prices, weather, and more. What would you like to know today?` }
  ])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [recording, setRecording] = useState(false)
  const [speaking,  setSpeaking]  = useState(false)
  const [farms,     setFarms]     = useState<Farm[]>([])
  const [selFarm,   setSelFarm]   = useState<Farm | null>(null)
  const [pred,      setPred]      = useState<PredictionResponse | null>(null)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const recogRef   = useRef<any>(null)

  useEffect(() => {
    farmsAPI.getAll().then(r => {
      setFarms(r.data)
      if (r.data.length > 0) setSelFarm(r.data[0])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selFarm) return
    predictAPI.getCropPredictions(selFarm.id).then(r => setPred(r.data)).catch(() => {})
  }, [selFarm])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const farmContext = selFarm ? [
    `Farm: ${selFarm.name}`,
    `State: ${selFarm.state}`,
    `Soil: ${selFarm.soil_type ?? 'Unknown'}`,
    selFarm.area_acres ? `Area: ${selFarm.area_acres} acres` : '',
    pred ? `Season: ${pred.current_season}` : '',
    pred?.weather_summary ? `Temp: ${pred.weather_summary.current_temp.toFixed(0)}°C, Humidity: ${pred.weather_summary.current_humidity}%` : '',
    pred?.recommendations?.length ? `Top crops: ${pred.recommendations.slice(0, 3).map(r => r.crop).join(', ')}` : '',
  ].filter(Boolean).join('\n') : ''

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const reply = await callGroq(updated, farmContext, user?.name ?? '')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      speakText(reply)
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, something went wrong: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-IN'
    utt.rate = 0.9
    utt.onstart = () => setSpeaking(true)
    utt.onend   = () => setSpeaking(false)
    window.speechSynthesis.speak(utt)
  }

  // Mic: transcribe into text box, user clicks send manually
  const startRecording = () => {
    const SpeechAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechAPI) {
      alert('Voice input is not supported in this browser. Please use Chrome.')
      return
    }
    const recognition = new SpeechAPI()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => setRecording(true)
    recognition.onend   = () => setRecording(false)

    recognition.onresult = (e: any) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      // Put transcribed text into the input box — user reviews and clicks send
      setInput(transcript)
    }

    recognition.onerror = (e: any) => {
      setRecording(false)
      if (e.error !== 'no-speech') alert(`Mic error: ${e.error}. Please try again.`)
    }

    recogRef.current = recognition
    recognition.start()
  }

  const stopRecording = () => {
    recogRef.current?.stop()
    setRecording(false)
  }

  return (
    <PageShell>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <h1 className="text-xl font-light text-[#1a1a1a]">Ask the AI Advisor</h1>
          </div>
          <p className="text-sm text-[#888] mt-1">
            Ask anything about your crops, prices, or weather. Simple answers in English.
          </p>
        </div>

        {/* Farm selector */}
        {farms.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#888]">Answering for:</span>
            {farms.map(f => (
              <button key={f.id} onClick={() => setSelFarm(f)}
                className={`px-3 py-1 rounded-full text-xs border transition ${
                  selFarm?.id === f.id ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-[#555] border-[#ddd]'
                }`}>🌾 {f.name}</button>
            ))}
          </div>
        )}

        {/* Chat window */}
        <div className="bg-white rounded-2xl border border-[#e0d8cc] flex flex-col" style={{ height: '60vh' }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">🌾</span>
                  </div>
                )}
                <div className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#2D6A4F] text-white rounded-br-sm'
                    : 'bg-[#f5f0e8] text-[#333] rounded-bl-sm border border-[#e0d8cc]'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">🌾</span>
                </div>
                <div className="bg-[#f5f0e8] rounded-2xl rounded-bl-sm px-4 py-3 border border-[#e0d8cc]">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 bg-[#2D6A4F] rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Suggestions */}
          <div className="px-5 pb-3 flex flex-wrap gap-2 border-t border-[#f0ece4] pt-3">
            {SUGGESTIONS.slice(0, 3).map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-xs border border-[#ddd] rounded-full px-3 py-1.5 text-[#555] hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition bg-white">
                {s}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className="border-t border-[#e0d8cc] px-4 py-3 flex items-center gap-3">
            {/* Mic button — fills text box */}
            <button
              onClick={recording ? stopRecording : startRecording}
              title={recording ? 'Stop recording' : 'Speak your question (fills text box)'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                recording
                  ? 'bg-red-500 text-white animate-pulse'
                  : speaking
                  ? 'bg-blue-400 text-white'
                  : 'bg-[#e8e0d0] text-[#555] hover:bg-[#ddd]'
              }`}>
              <span className="text-base">{recording ? '⏹' : speaking ? '🔊' : '🎙'}</span>
            </button>

            {recording && (
              <span className="text-xs text-red-500 animate-pulse flex-shrink-0">Listening...</span>
            )}

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder={recording ? 'Listening... speak now' : 'Type or speak your question...'}
              className="flex-1 text-sm bg-transparent outline-none text-[#333] placeholder-[#bbb]"
            />

            {/* Send button */}
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              title="Send message"
              className="w-9 h-9 rounded-full bg-[#2D6A4F] flex items-center justify-center disabled:opacity-40 hover:bg-[#245a42] transition flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>

          <p className="text-center text-[10px] text-[#bbb] pb-2">
            AI answers may not always be 100% correct. Use your own judgment too.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
