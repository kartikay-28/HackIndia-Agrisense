import Navbar from './Navbar'

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
