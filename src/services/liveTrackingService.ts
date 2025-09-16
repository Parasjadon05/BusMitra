import { database } from '@/lib/firebase'
import { ref, onValue, off, get, child } from 'firebase/database'

// Interface for live bus data from Firebase Realtime Database
export interface LiveBusData {
  accuracy: number
  busNumber: string
  connectionStatus: string
  driverId: string
  driverName: string
  heading: number
  heartbeat: number
  isOnDuty: boolean
  isOnline: boolean
  lastSeen: number
  latitude: number
  longitude: number
  routeId: string
  routeName: string
  speed: number
  timestamp: number
  updateCount: number
}

// Interface for driver data
export interface DriverData {
  id: string
  name: string
  phone: string
  licenseNumber: string
  isActive: boolean
  busId?: string
}

// Interface for route data
export interface RouteData {
  id: string
  routeNumber: string
  routeName: string
  from: string
  to: string
  stops: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    sequence: number
    distance?: number
  }>
  totalDistance: number
  estimatedTime: number
  fare: number
}

export class LiveTrackingService {
  private static instance: LiveTrackingService
  private listeners: Map<string, () => void> = new Map()

  static getInstance(): LiveTrackingService {
    if (!LiveTrackingService.instance) {
      LiveTrackingService.instance = new LiveTrackingService()
    }
    return LiveTrackingService.instance
  }

  /**
   * Listen to live bus data for a specific bus
   * First tries to find by busId, then by driverId if not found
   */
  subscribeToBusData(
    searchId: string, 
    callback: (data: LiveBusData | null) => void
  ): () => void {
    console.log('🔍 Subscribing to live data for ID:', searchId)
    
    // First try direct lookup by driver ID
    const driverRef = ref(database, `active_drivers/${searchId}`)
    
    const unsubscribe = onValue(driverRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        console.log('✅ Found driver data directly:', data.driverId)
        callback(data as LiveBusData)
      } else {
        console.log('❌ No direct driver data, searching by route/bus ID...')
        // If not found by driverId, try to find by searching all active drivers
        this.findDriverByRouteOrBusId(searchId, callback)
      }
    }, (error) => {
      console.error('Error listening to driver data:', error)
      // Try alternative search
      this.findDriverByRouteOrBusId(searchId, callback)
    })

    // Store the unsubscribe function
    this.listeners.set(searchId, unsubscribe)
    
    // Return cleanup function
    return () => {
      unsubscribe()
      this.listeners.delete(searchId)
    }
  }

  /**
   * Find driver data by searching through all active drivers
   */
  private findDriverByRouteOrBusId(searchId: string, callback: (data: LiveBusData | null) => void): void {
    console.log('🔍 Searching for driver by route/bus ID:', searchId)
    const allDriversRef = ref(database, 'active_drivers')
    
    onValue(allDriversRef, (snapshot) => {
      const allDrivers = snapshot.val()
      if (allDrivers) {
        console.log('📊 Searching through', Object.keys(allDrivers).length, 'active drivers')
        
        // First priority: Search by routeId (most likely to match)
        for (const [driverId, driverData] of Object.entries(allDrivers)) {
          const data = driverData as LiveBusData
          console.log(`  🔍 Checking driver ${driverId}: busNumber=${data.busNumber}, routeId=${data.routeId}`)
          
          if (data.routeId === searchId) {
            console.log('✅ Found driver by route ID:', driverId, 'for route:', searchId)
            callback(data)
            return
          }
        }
        
        // Second priority: Search by busNumber
        for (const [driverId, driverData] of Object.entries(allDrivers)) {
          const data = driverData as LiveBusData
          if (data.busNumber === searchId) {
            console.log('✅ Found driver by bus number:', driverId, 'for bus:', searchId)
            callback(data)
            return
          }
        }
        
        // Third priority: Search by driverId
        for (const [driverId, driverData] of Object.entries(allDrivers)) {
          const data = driverData as LiveBusData
          if (data.driverId === searchId) {
            console.log('✅ Found driver by driver ID:', driverId)
            callback(data)
            return
          }
        }
        
        console.log('❌ No matching driver found for:', searchId)
      }
      callback(null)
    }, (error) => {
      console.error('Error searching for driver:', error)
      callback(null)
    })
  }

  /**
   * Get current bus data (one-time fetch)
   */
  async getCurrentBusData(searchId: string): Promise<LiveBusData | null> {
    try {
      // First try direct lookup by driver ID
      const driverRef = ref(database, `active_drivers/${searchId}`)
      const snapshot = await get(driverRef)
      
      if (snapshot.exists()) {
        return snapshot.val() as LiveBusData
      }

      // If not found, search through all active drivers
      const allDriversRef = ref(database, 'active_drivers')
      const allDriversSnapshot = await get(allDriversRef)
      
      if (allDriversSnapshot.exists()) {
        const allDrivers = allDriversSnapshot.val()
        
        // First priority: Search by routeId
        for (const [driverId, driverData] of Object.entries(allDrivers)) {
          const data = driverData as LiveBusData
          if (data.routeId === searchId) {
            return data
          }
        }
        
        // Second priority: Search by busNumber
        for (const [driverId, driverData] of Object.entries(allDrivers)) {
          const data = driverData as LiveBusData
          if (data.busNumber === searchId) {
            return data
          }
        }
        
        // Third priority: Search by driverId
        for (const [driverId, driverData] of Object.entries(allDrivers)) {
          const data = driverData as LiveBusData
          if (data.driverId === searchId) {
            return data
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching bus data:', error)
      return null
    }
  }

  /**
   * Get all active drivers
   */
  async getAllActiveDrivers(): Promise<LiveBusData[]> {
    try {
      const driversRef = ref(database, 'active_drivers')
      const snapshot = await get(driversRef)
      
      if (snapshot.exists()) {
        const driversData = snapshot.val()
        return Object.values(driversData) as LiveBusData[]
      }
      return []
    } catch (error) {
      console.error('Error fetching active drivers:', error)
      return []
    }
  }

  /**
   * Get driver information
   */
  async getDriverData(driverId: string): Promise<DriverData | null> {
    try {
      const driverRef = ref(database, `drivers/${driverId}`)
      const snapshot = await get(driverRef)
      
      if (snapshot.exists()) {
        return snapshot.val() as DriverData
      }
      return null
    } catch (error) {
      console.error('Error fetching driver data:', error)
      return null
    }
  }

  /**
   * Get route information
   */
  async getRouteData(routeId: string): Promise<RouteData | null> {
    try {
      const routeRef = ref(database, `routes/${routeId}`)
      const snapshot = await get(routeRef)
      
      if (snapshot.exists()) {
        return snapshot.val() as RouteData
      }
      return null
    } catch (error) {
      console.error('Error fetching route data:', error)
      return null
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  /**
   * Calculate ETA based on distance and speed
   */
  calculateETA(distance: number, speed: number): number {
    if (speed <= 0) return 0
    return Math.round(distance / (speed * 1000 / 60)) // ETA in minutes
  }

  /**
   * Calculate speed in km/h
   */
  calculateSpeedInKmh(speed: number): number {
    return Math.round(speed * 3.6)
  }

  /**
   * Format distance for display
   */
  formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)} m`
    } else {
      return `${(distance / 1000).toFixed(1)} km`
    }
  }

  /**
   * Format time for display
   */
  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }
  }

  /**
   * Check if bus data is recent (within last 5 minutes)
   */
  isDataRecent(timestamp: number): boolean {
    const now = Date.now()
    const tenMinutes = 10 * 60 * 1000 // Increased to 10 minutes
    const timeDiff = now - timestamp
    console.log('Timestamp check:', {
      now: new Date(now).toISOString(),
      dataTime: new Date(timestamp).toISOString(),
      timeDiff: timeDiff,
      isRecent: timeDiff < tenMinutes
    })
    return timeDiff < tenMinutes
  }

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe()
    })
    this.listeners.clear()
  }
}

// Export singleton instance
export const liveTrackingService = LiveTrackingService.getInstance()
