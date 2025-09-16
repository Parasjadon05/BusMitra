import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendSignInLinkToEmail, signInWithPopup, getAuth } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Loader2, LogIn } from 'lucide-react'

// Custom Alert Component (unchanged)
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

// Custom AlertDescription Component (unchanged)
interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className }) => (
  <div className={`text-sm mt-1 ${className || ''}`}>
    {children}
  </div>
)

const Signin: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Function to store user in localStorage
  const storeUserInLocalStorage = (user: any) => {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      // accessToken removed; use getIdToken() if needed
    }
    localStorage.setItem('currentUser', JSON.stringify(userData))
    console.log('User stored in localStorage:', userData)
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/finish-signin`,
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      window.localStorage.setItem('emailForSignIn', email)
      setSuccess('A sign-in link has been sent to your email. Please check your inbox.')
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'Failed to send sign-in link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Starting Google sign-in...')
      const result = await signInWithPopup(auth, googleProvider)
      console.log('Google sign-in result:', result.user?.email)
      
      // Store user in localStorage after successful sign-in
      if (result.user) {
        storeUserInLocalStorage(result.user)
        setSuccess('Sign-in successful! Redirecting...')
        setTimeout(() => navigate('/discover'), 1500)
      }
    } catch (err: any) {
      console.error('Full Google sign-in error:', err)
      setError(err.message || 'Failed to sign in with Google. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[90vh] bg-white">
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Sign In to BusMitra
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleEmailSignIn}
                  disabled={isLoading || !email}
                  className="w-full bg-[#87281B] hover:bg-[#601c13] text-white"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Sign in with Email Link
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <> 
                    <img className='h-7 px-2 ' src="/googlelogo.png"  alt="" />
                    Sign in with Google
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default Signin