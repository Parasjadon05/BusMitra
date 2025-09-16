import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MapPin, 
  Shield, 
  Smartphone, 
  Bell, 
  Navigation,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function LandingPage() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false) // Auth state
  const [loading, setLoading] = useState(true) // Loading state

  // Sync auth state with Firebase and localStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
      } else {
        const storedUser = localStorage.getItem('currentUser')
        setIsAuthenticated(!!storedUser) // Fallback to localStorage
      }
      setLoading(false)
    })

    // Cleanup subscription on unmount
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
      icon: MapPin,
      title: 'Real-time Tracking',
      description: 'Track your bus location in real-time and get accurate arrival times',
      color: 'blue'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Get alerts for bus arrivals, delays, and route changes',
      color: 'green'
    },
    {
      icon: Navigation,
      title: 'Route Planning',
      description: 'Find the best routes and connections for your destination',
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Your data is protected with enterprise-grade security',
      color: 'orange'
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Optimized for mobile devices with offline capabilities',
      color: 'pink'
    },
    {
      icon: TrendingUp,
      title: 'Live Analytics',
      description: 'Real-time bus occupancy and traffic insights',
      color: 'indigo'
    }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      location: 'Delhi',
      rating: 5,
      text: 'BusMitra has made my daily commute so much easier. I never miss my bus anymore!'
    },
    {
      name: 'Rajesh Kumar',
      location: 'Mumbai',
      rating: 5,
      text: 'The real-time tracking is incredibly accurate. Highly recommended!'
    },
    {
      name: 'Anita Singh',
      location: 'Bangalore',
      rating: 5,
      text: 'Love the notifications feature. It saves me so much waiting time.'
    }
  ]

  const benefits = [
    'Save up to 30 minutes daily',
    'Reduce waiting time by 60%',
    'Get real-time bus locations',
    'Plan your journey in advance',
    'Receive smart notifications',
    'Access offline route maps'
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
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Never Miss Your
            <span className="text-[#87281B] block">Bus Again</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Track buses in real-time, get smart notifications, and plan your perfect journey. 
            Your intelligent companion for stress-free public transportation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-[#87281B] hover:bg-[#601c13] text-white px-8 py-3 text-lg"
            >
              Start Tracking Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
              Watch Demo
            </Button>
          </div>
        </div>

        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Smart Commuting
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make your daily commute effortless and efficient
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`mx-auto w-16 h-16 bg-${feature.color}-100 rounded-full flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
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

        <div className="py-16 bg-white rounded-2xl shadow-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#87281B] mb-4">
              Why Choose BusMitra?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of smart commuters who save time and reduce stress daily
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