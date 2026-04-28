import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from '@/lib/LanguageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgriSense — AI Crop Intelligence',
  description: 'AI-powered crop recommendations for Indian farmers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <Toaster position="top-right" />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
