import { useState, useEffect, useCallback, useRef } from 'react'
import { liveTrackingService, LiveBusData, DriverData, RouteData } from '@/services/liveTrackingService'
import { googleMapsMatrixService, ETAResult } from '@/services/googleMapsMatrixService'

interface UseLiveTrackingReturn {
  liveBusData: LiveBusData | null
  driverData: DriverData | null
  routeData: RouteData | null
  isLoading: boolean
  error: string | null
  isConnected: boolean
  eta: string
  speed: string
  distance: string
  etaWithTraffic: string
  trafficDelay: number
  trafficCondition: 'light' | 'moderate' | 'heavy' | 'unknown'
  isCalculatingETA: boolean
  refreshData: () => void
  cleanup: () => void
}

export function useLiveTracking(busId: string, userStopCoords?: { lat: number; lng: number }): UseLiveTrackingReturn {
  const [liveBusData, setLiveBusData] = useState<LiveBusData | null>(null)
  const [driverData, setDriverData] = useState<DriverData | null>(null)
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [eta, setEta] = useState<string>('--')
  const [speed, setSpeed] = useState<string>('--')
  const [distance, setDistance] = useState<string>('--')
  const [etaWithTraffic, setEtaWithTraffic] = useState<string>('--')
  const [trafficDelay, setTrafficDelay] = useState<number>(0)
  const [trafficCondition, setTrafficCondition] = useState<'light' | 'moderate' | 'heavy' | 'unknown'>('unknown')
  const [isCalculatingETA, setIsCalculatingETA] = useState<boolean>(false)
  
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Calculate ETA, speed, and distance when live data updates
  useEffect(() => {
    if (!liveBusData) {
      setEta('--')
      setSpeed('--')
      setDistance('--')
      setEtaWithTraffic('--')
      setTrafficDelay(0)
      setTrafficCondition('unknown')
      return
    }

    // Update speed
    const speedKmh = liveTrackingService.calculateSpeedInKmh(liveBusData.speed)
    setSpeed(`${speedKmh} km/h`)

    // Calculate distance and ETA if user stop coordinates are provided
    if (userStopCoords) {
      // Use Google Maps Distance Matrix API for accurate ETA with traffic
      calculateETAWithGoogleMaps(liveBusData, userStopCoords)
    }
  }, [liveBusData, userStopCoords])

  // Calculate ETA using Google Maps Distance Matrix API
  const calculateETAWithGoogleMaps = useCallback(async (
    busData: LiveBusData, 
    userCoords: { lat: number; lng: number }
  ) => {
    setIsCalculatingETA(true)
    
    try {
      const origin = { lat: busData.latitude, lng: busData.longitude }
      const destination = userCoords
      
      console.log('🚗 Calculating ETA with Google Maps:', {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        busSpeed: busData.speed
      })

      const result = await googleMapsMatrixService.calculateETAWithTraffic(
        origin,
        destination,
        new Date() // Current time for traffic calculation
      )

      if (result) {
        setDistance(result.distance.text)
        setEta(result.eta)
        setEtaWithTraffic(result.etaWithTraffic)
        
        // Calculate traffic delay
        const delay = result.durationWithTrafficMinutes - result.durationMinutes
        setTrafficDelay(delay)
        
        // Determine traffic condition
        let condition: 'light' | 'moderate' | 'heavy' | 'unknown' = 'unknown'
        if (delay <= 5) {
          condition = 'light'
        } else if (delay <= 15) {
          condition = 'moderate'
        } else {
          condition = 'heavy'
        }
        setTrafficCondition(condition)

        console.log('✅ Google Maps ETA calculated:', {
          distance: result.distance.text,
          eta: result.eta,
          etaWithTraffic: result.etaWithTraffic,
          trafficDelay: delay,
          trafficCondition: condition
        })
      } else {
        // Fallback to simple calculation
        const distanceToStop = liveTrackingService.calculateDistance(
          busData.latitude,
          busData.longitude,
          userCoords.lat,
          userCoords.lng
        )
        
        setDistance(liveTrackingService.formatDistance(distanceToStop))
        
        if (busData.speed > 0) {
          const etaMinutes = liveTrackingService.calculateETA(distanceToStop, busData.speed)
          const etaText = liveTrackingService.formatTime(etaMinutes)
          setEta(etaText)
          setEtaWithTraffic(etaText)
        } else {
          setEta('--')
          setEtaWithTraffic('--')
        }
        
        setTrafficDelay(0)
        setTrafficCondition('unknown')
      }
    } catch (error) {
      console.error('Error calculating ETA with Google Maps:', error)
      
      // Fallback to simple calculation
      const distanceToStop = liveTrackingService.calculateDistance(
        busData.latitude,
        busData.longitude,
        userCoords.lat,
        userCoords.lng
      )
      
      setDistance(liveTrackingService.formatDistance(distanceToStop))
      
      if (busData.speed > 0) {
        const etaMinutes = liveTrackingService.calculateETA(distanceToStop, busData.speed)
        const etaText = liveTrackingService.formatTime(etaMinutes)
        setEta(etaText)
        setEtaWithTraffic(etaText)
      } else {
        setEta('--')
        setEtaWithTraffic('--')
      }
      
      setTrafficDelay(0)
      setTrafficCondition('unknown')
    } finally {
      setIsCalculatingETA(false)
    }
  }, [])

  // Fetch driver data when live bus data is available
  useEffect(() => {
    if (!liveBusData?.driverId) return

    const fetchDriverData = async () => {
      try {
        const driver = await liveTrackingService.getDriverData(liveBusData.driverId)
        setDriverData(driver)
      } catch (err) {
        console.error('Error fetching driver data:', err)
      }
    }

    fetchDriverData()
  }, [liveBusData?.driverId])

  // Fetch route data when live bus data is available
  useEffect(() => {
    if (!liveBusData?.routeId) return

    const fetchRouteData = async () => {
      try {
        const route = await liveTrackingService.getRouteData(liveBusData.routeId)
        setRouteData(route)
      } catch (err) {
        console.error('Error fetching route data:', err)
      }
    }

    fetchRouteData()
  }, [liveBusData?.routeId])

  // Subscribe to live bus data
  useEffect(() => {
    if (!busId) return

    setIsLoading(true)
    setError(null)

    // Clean up existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    try {
      // Subscribe to live data
      unsubscribeRef.current = liveTrackingService.subscribeToBusData(
        busId,
        (data) => {
          try {
            setLiveBusData(data)
            setIsConnected(data !== null)
            setIsLoading(false)
            
            if (data) {
              // Check if data is recent
              const isRecent = liveTrackingService.isDataRecent(data.timestamp)
              if (!isRecent) {
                setError('Bus data is outdated. Driver may be offline.')
              } else {
                setError(null)
              }
            } else {
              setError('No live data available for this bus.')
            }
          } catch (err) {
            console.error('Error processing live data:', err)
            setError('Error processing live data')
            setIsLoading(false)
          }
        }
      )
    } catch (err) {
      console.error('Error setting up live tracking:', err)
      setError('Failed to connect to live tracking')
      setIsLoading(false)
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [busId])

  // Refresh data manually
  const refreshData = useCallback(async () => {
    if (!busId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await liveTrackingService.getCurrentBusData(busId)
      setLiveBusData(data)
      setIsConnected(data !== null)
      
      if (data) {
        const isRecent = liveTrackingService.isDataRecent(data.timestamp)
        if (!isRecent) {
          setError('Bus data is outdated. Driver may be offline.')
        } else {
          setError(null)
        }
      } else {
        setError('No live data available for this bus.')
      }
    } catch (err) {
      setError('Failed to refresh bus data.')
      console.error('Error refreshing data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [busId])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    liveTrackingService.cleanup()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    liveBusData,
    driverData,
    routeData,
    isLoading,
    error,
    isConnected,
    eta,
    speed,
    distance,
    etaWithTraffic,
    trafficDelay,
    trafficCondition,
    isCalculatingETA,
    refreshData,
    cleanup
  }
}
