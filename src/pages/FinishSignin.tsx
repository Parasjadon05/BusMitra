import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// Custom Alert Component
interface AlertProps {
  children: React.ReactNode
  variant?: 'default' | 'destructive'
  className?: string
}

const Alert: React.FC<AlertProps> = ({ children, variant = 'default', className }) => {
  const baseClasses = 'relative w-full rounded-lg border p-4'
  const variantClasses = variant === 'destructive'
    ? 'border-red-500 text-red-700 bg-red-50'
    : 'border-green-500 text-green-700 bg-green-50'

  return (
    <div className={`${baseClasses} ${variantClasses} ${className || ''}`}>
      {children}
    </div>
  )
}

// Custom AlertDescription Component
interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className }) => (
  <div className={`text-sm mt-1 ${className || ''}`}>
    {children}
  </div>
)

const FinishSignin: React.FC = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const completeSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const email = window.localStorage.getItem('emailForSignIn')
        if (!email) {
          setStatus('error')
          setMessage('No email found. Please try signing in again.')
          return
        }

        try {
          await signInWithEmailLink(auth, email, window.location.href)
          window.localStorage.removeItem('emailForSignIn')
          setStatus('success')
          setMessage('Sign-in successful! Redirecting...')
          setTimeout(() => navigate('/discover'), 2000)
        } catch (err: any) {
          setStatus('error')
          setMessage(err.message || 'Failed to sign in. Please try again.')
        }
      } else {
        setStatus('error')
        setMessage('Invalid sign-in link. Please try again.')
      }
    }

    completeSignIn()
  }, [navigate])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md text-center">
          {status === 'loading' && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#87281B]" />
            </div>
          )}
          {status === 'success' && (
            <Alert className="border-green-500">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Button
              onClick={() => navigate('/signin')}
              className="mt-4 bg-[#87281B] hover:bg-[#601c13] text-white"
            >
              Return to Sign In
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default FinishSignin