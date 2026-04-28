'use client'
import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { voiceAPI } from '@/lib/api'

type State = 'idle' | 'recording' | 'processing' | 'playing'

export default function VoiceButton({ farmId }: { farmId?: number }) {
  const [state, setState] = useState<State>('idle')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        await processAudio(blob)
      }

      recorder.start()
      mediaRef.current = recorder
      setState('recording')

      // Auto-stop after 5 seconds
      timerRef.current = setTimeout(() => stopRecording(), 5000)
    } catch {
      toast.error('Microphone permission denied')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.stop()
    }
    setState('processing')
  }

  const processAudio = async (blob: Blob) => {
    try {
      const res = await voiceAPI.query(blob, farmId)
      const { response_text, audio_base64 } = res.data

      toast(response_text, { duration: 6000, icon: '🎙️' })

      // Play Hindi audio response
      if (audio_base64) {
        setState('playing')
        const audio = new Audio(`data:audio/mp3;base64,${audio_base64}`)
        audio.onended = () => setState('idle')
        audio.play().catch(() => setState('idle'))
      } else {
        setState('idle')
      }
    } catch {
      toast.error('Voice processing failed. Please try again.')
      setState('idle')
    }
  }

  const handleClick = () => {
    if (state === 'idle') startRecording()
    else if (state === 'recording') stopRecording()
  }

  const buttonStyle = {
    idle:       'bg-primary-600 hover:bg-primary-700 shadow-lg',
    recording:  'bg-red-500 hover:bg-red-600 pulse-ring',
    processing: 'bg-yellow-500 cursor-not-allowed',
    playing:    'bg-blue-500 cursor-not-allowed',
  }[state]

  return (
    <button onClick={handleClick} disabled={state === 'processing' || state === 'playing'}
      title={state === 'idle' ? 'Ask in Hindi' : state === 'recording' ? 'Stop recording' : state}
      className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white transition z-50 ${buttonStyle}`}>
      {state === 'processing' ? <Loader2 className="w-6 h-6 animate-spin" />
        : state === 'recording' ? <MicOff className="w-6 h-6" />
        : <Mic className="w-6 h-6" />}
    </button>
  )
}
