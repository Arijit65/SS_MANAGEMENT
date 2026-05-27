import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search } from 'lucide-react'
import logo from '../assets/rlogo.png'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    // Auto redirect after 10 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Go back to previous page or home
          if (window.history.length > 2) {
            navigate(-1)
          } else {
            navigate('/dashboard-cms')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/dashboard-cms')
    }
  }

  const handleGoHome = () => {
    navigate('/dashboard-cms')
  }

  const backgroundPattern =
    "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("${backgroundPattern}")` }} />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-slate-500/10 rounded-full blur-xl animate-pulse delay-75" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1DA1F2]/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16  rounded-lg flex items-center justify-center">
            <img src={logo} alt="Logo" className="w-12 h-12" />
          </div>
        </div>

        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-white mb-4 animate-bounce">404</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Search className="w-6 h-6 text-slate-300" />
            <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
          </div>
          <p className="text-xl text-slate-300 mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-slate-400">
            It might have been moved or deleted, or you may have mistyped the URL.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <p className="text-slate-200 text-sm mb-2">
            Automatically redirecting to previous page in
          </p>
          <div className="text-4xl font-bold text-white">
            {countdown}
            <span className="text-lg text-slate-300 ml-2">seconds</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleGoBack}
            className="bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 text-lg"
            size="lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="border-white text-white hover:bg-white/10 px-6 py-3 text-lg"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-slate-400 text-sm">
          <p>Need help? Contact your administrator or check the documentation.</p>
        </div>
      </div>
    </div>
  )
}
