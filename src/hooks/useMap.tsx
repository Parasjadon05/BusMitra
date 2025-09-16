import { useState, useEffect, useCallback } from 'react'
import { mapService, UserLocation, BusStand } from '@/services/mapService'

export interface UseMapReturn {
  userLocation: UserLocation | null
  userAddress: string | null
  nearbyBusStands: BusStand[]
  isLoading: boolean
  error: string | null
  getCurrentLocation: () => Promise<void>
  findNearbyBusStands: () => Promise<void>
  clearError: () => void
}

export function useMap(): UseMapReturn {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [nearbyBusStands, setNearbyBusStands] = useState<BusStand[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const location = await mapService.getCurrentLocation()
      setUserLocation(location)
      
      // Get address from coordinates
      const address = await mapService.getAddressFromCoordinates(location.latitude, location.longitude)
      setUserAddress(address)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const findNearbyBusStands = useCallback(async () => {
    if (!userLocation) {
      setError('User location is required to find nearby bus stands')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const busStands = await mapService.findNearbyBusStands(userLocation)
      setNearbyBusStands(busStands)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find bus stands'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [userLocation])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch location on mount
  useEffect(() => {
    if (!userLocation && !isLoading && !error) {
      getCurrentLocation()
    }
  }, [userLocation, isLoading, error, getCurrentLocation])

  // Retry location fetch if there was an error (user might have denied permission initially)
  useEffect(() => {
    if (error && error.includes('denied') && !isLoading) {
      // Wait a bit before retrying to avoid spam
      const timer = setTimeout(() => {
        getCurrentLocation()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, isLoading, getCurrentLocation])

  // Auto-find bus stands when user location is available
  useEffect(() => {
    if (userLocation && nearbyBusStands.length === 0) {
      findNearbyBusStands()
    }
  }, [userLocation, findNearbyBusStands, nearbyBusStands.length])

  return {
    userLocation,
    userAddress,
    nearbyBusStands,
    isLoading,
    error,
    getCurrentLocation,
    findNearbyBusStands,
    clearError
  }
}
