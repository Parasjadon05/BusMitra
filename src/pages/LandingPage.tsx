import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {

  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useTranslation } from 'react-i18next'

export default function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Sync auth state with Firebase and localStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
      } else {
        const storedUser = localStorage.getItem('currentUser')
        setIsAuthenticated(!!storedUser)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleGetStarted = () => {
    if (loading) return
    if (isAuthenticated) {
      navigate('/discover')
    } else {
      navigate('/signin')
    }
  }

  const features = [
    {
      icon: '/icons/realtimetracking.png',
      title: 'Real-time Tracking',
      description: 'Track your bus location in real-time and get accurate arrival times',

    },
    {
      icon: '/icons/smartnotifications.png',
      title: 'Smart Notifications',
      description: 'Get alerts for bus arrivals, delays, and route changes',

    },
    {
      icon: '/icons/routeplanning.png',
      title: 'Route Planning',
      description: 'Find the best routes and connections for your destination',

    },
    {
      icon: '/icons/safeand secure.png',
      title: 'Safe & Secure',
      description: 'Your data is protected with enterprise-grade security',

    },
    {
      icon: '/icons/mobilefirst.png',
      title: 'Mobile First',
      description: 'Optimized for mobile devices with offline capabilities',

    },
    {
      icon: '/icons/liveanalysis.png',
      title: 'Live Analytics',
      description: 'Real-time bus occupancy and traffic insights',

    },
  ]

  const benefits = [
    'Save up to 30 minutes daily',
    'Reduce waiting time by 60%',
    'Get real-time bus locations',
    'Plan your journey in advance',
    'Receive smart notifications',
    'Access offline route maps',
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="h-16 w-64 bg-gray-200 animate-pulse rounded" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
        {/* Hero Section */}
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('hero.heading.line1')}
            <span className="text-[#87281B] block">{t('hero.heading.line2')}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('hero.sub')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-[#87281B] hover:bg-[#601c13] text-white px-8 py-3 text-lg"
            >
              {t('cta.start')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => window.open('https://youtu.be/9RI1z0WiGng', '_blank')}
            >
              {t('cta.demo')}
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make your daily commute effortless
              and efficient
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div
                    className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4`}
                  >
                    <img
                      src={feature.icon}
                      alt={feature.title}
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-16 bg-white rounded-2xl shadow-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#87281B] mb-4">
              {t('benefits.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of smart commuters who save time and reduce stress
              daily
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              {benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {benefits.slice(3).map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
