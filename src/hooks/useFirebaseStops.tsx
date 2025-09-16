import { useState, useEffect, useCallback } from 'react'
import { firebaseStopsService, FirebaseStop, UserLocation } from '@/services/firebaseStopsService'

export function useFirebaseStops() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [nearbyStops, setNearbyStops] = useState<FirebaseStop[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const location = await firebaseStopsService.getCurrentLocation()
      setUserLocation(location)
      
      // Get address from coordinates
      const address = await firebaseStopsService.getAddressFromCoordinates(
        location.latitude,
        location.longitude
      )
      setUserAddress(address)
      
      // Find nearby stops
      const stops = await firebaseStopsService.findNearestStops(location, 5000) // 5km radius
      setNearbyStops(stops)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location'
      setError(errorMessage)
      console.error('Error getting location:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Skip auto-fetch location to avoid permission dialog
  // User can manually request location if needed
  // useEffect(() => {
  //   getCurrentLocation()
  // }, [getCurrentLocation])

  return {
    userLocation,
    userAddress,
    nearbyStops,
    isLoading,
    error,
    getCurrentLocation,
    clearError
  }
}

