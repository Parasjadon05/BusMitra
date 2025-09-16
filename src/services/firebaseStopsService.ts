
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface FirebaseStop {
  id: string
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  routeId?: string
  sequence?: number
  distance?: number
}

export const firebaseStopsService = {
  // Get user's current location using browser geolocation
  async getCurrentLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  },

  // Convert coordinates to address using Google Maps Geocoding API
  async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch address from Google Maps API')
      }
      const data = await response.json()
      if (data.status === 'OK' && data.results[0]) {
        return data.results[0].formatted_address
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  },

  // Search for stops by name/address from Cloud Firestore
  async getStopsFromDB(searchQuery: string, limit: number = 10): Promise<FirebaseStop[]> {
    // Check if Firebase is properly configured
    if (!db) {
      console.warn('Firebase Firestore not initialized, using mock data')
      return this.getMockStops(searchQuery, limit)
    }

    try {
      console.log('Fetching stops from Firestore for query:', searchQuery)
      const routesRef = collection(db, 'routes')
      const snapshot = await getDocs(routesRef)
      
      if (!snapshot.empty) {
        const allStops: FirebaseStop[] = []
        const stopMap = new Map<string, FirebaseStop>()
        
        // Extract stops from all routes
        snapshot.forEach((doc) => {
          const routeData = doc.data()
          const routeId = doc.id
          
          // Add start point
          if (routeData.startPoint) {
            const startStop: FirebaseStop = {
              id: `${routeId}-start`,
              name: routeData.startPoint,
              address: routeData.startPoint,
              coordinates: { 
                lat: Number(routeData.startLat) || 0, 
                lng: Number(routeData.startLng) || 0 
              },
              routeId,
              sequence: 0
            }
            if (startStop.coordinates.lat !== 0 && startStop.coordinates.lng !== 0) {
              const uniqueKey = `${routeId}-start-${routeData.startPoint}`.toLowerCase()
              stopMap.set(uniqueKey, startStop)
            }
          }
          
          // Add end point
          if (routeData.endPoint) {
            const endStop: FirebaseStop = {
              id: `${routeId}-end`,
              name: routeData.endPoint,
              address: routeData.endPoint,
              coordinates: { 
                lat: Number(routeData.endLat) || 0, 
                lng: Number(routeData.endLng) || 0 
              },
              routeId,
              sequence: 999
            }
            if (endStop.coordinates.lat !== 0 && endStop.coordinates.lng !== 0) {
              const uniqueKey = `${routeId}-end-${routeData.endPoint}`.toLowerCase()
              stopMap.set(uniqueKey, endStop)
            }
          }
          
          // Add route stops
          if (routeData.stops && Array.isArray(routeData.stops)) {
            routeData.stops.forEach((stop: any, index: number) => {
              // Debug log to see the actual stop data structure
              if (index === 0) {
                console.log('Sample stop data from route', routeId, ':', stop)
              }
              
              const routeStop: FirebaseStop = {
                id: `${routeId}-${stop.id || `stop-${index}`}`,
                name: (stop.name && typeof stop.name === 'string') ? stop.name : `Stop ${index + 1}`,
                address: (stop.name && typeof stop.name === 'string') ? stop.name : `Stop ${index + 1}`,
                coordinates: {
                  lat: Number(stop.latitude) || 0,
                  lng: Number(stop.longitude) || 0
                },
                routeId,
                sequence: Number(stop.sequence) || index + 1
              }
              if (routeStop.coordinates.lat !== 0 && routeStop.coordinates.lng !== 0) {
                // Use a unique key that combines route and stop name to avoid duplicates
                const stopName = (stop.name && typeof stop.name === 'string') ? stop.name : `stop-${index}`
                const uniqueKey = `${routeId}-${stopName}`.toLowerCase()
                stopMap.set(uniqueKey, routeStop)
              }
            })
          }
        })
        
        const allStopsArray = Array.from(stopMap.values())
        console.log('All stops extracted from Firestore:', allStopsArray)
        
        // Filter stops based on search query - search in both name and route context
        const filteredStops = allStopsArray.filter(stop => {
          const nameMatch = stop.name && typeof stop.name === 'string' && 
            stop.name.toLowerCase().includes(searchQuery.toLowerCase())
          const addressMatch = stop.address && typeof stop.address === 'string' && 
            stop.address.toLowerCase().includes(searchQuery.toLowerCase())
          const routeMatch = stop.routeId && typeof stop.routeId === 'string' && 
            stop.routeId.toLowerCase().includes(searchQuery.toLowerCase())
          
          return nameMatch || addressMatch || routeMatch
        })
        
        // Sort by exact match first, then by route relevance, then alphabetically
        const sortedStops = filteredStops.sort((a, b) => {
          const aName = a.name || ''
          const bName = b.name || ''
          const aExact = aName.toLowerCase() === searchQuery.toLowerCase()
          const bExact = bName.toLowerCase() === searchQuery.toLowerCase()
          
          // Exact name matches first
          if (aExact && !bExact) return -1
          if (!aExact && bExact) return 1
          
          // Then by route ID (to group stops by route)
          const aRouteId = a.routeId || ''
          const bRouteId = b.routeId || ''
          const routeCompare = aRouteId.localeCompare(bRouteId)
          if (routeCompare !== 0) return routeCompare
          
          // Finally by sequence within the route
          return (a.sequence || 0) - (b.sequence || 0)
        })
        
        console.log('Filtered stops for query:', searchQuery, ':', sortedStops.slice(0, limit))
        return sortedStops.slice(0, limit)
      }
      
      console.warn('No routes found in Firestore, using mock data')
      // Fallback to mock data if no routes found
      return this.getMockStops(searchQuery, limit)
    } catch (error) {
      console.error('Error fetching stops from Firestore:', error)
      // Fallback to mock data on error
      return this.getMockStops(searchQuery, limit)
    }
  },

  // Mock data fallback
  getMockStops(searchQuery: string, limit: number): Promise<FirebaseStop[]> {
    const mockStops: FirebaseStop[] = [
      {
        id: 'stop1',
        name: 'Broadway Bus Terminus',
        address: 'Broadway, Chennai',
        coordinates: { lat: 13.0878, lng: 80.2785 },
        routeId: 'route_102',
        sequence: 1
      },
      {
        id: 'stop2',
        name: 'Marina Beach',
        address: 'Marina Beach, Chennai',
        coordinates: { lat: 13.05, lng: 80.2824 },
        routeId: 'route_102',
        sequence: 2
      },
      {
        id: 'stop3',
        name: 'Mylapore',
        address: 'Mylapore, Chennai',
        coordinates: { lat: 13.033, lng: 80.2684 },
        routeId: 'route_102',
        sequence: 3
      },
      {
        id: 'stop4',
        name: 'Adyar',
        address: 'Adyar, Chennai',
        coordinates: { lat: 13.0007, lng: 80.255 },
        routeId: 'route_102',
        sequence: 4
      },
      {
        id: 'stop5',
        name: 'Thiruvanmiyur',
        address: 'Thiruvanmiyur, Chennai',
        coordinates: { lat: 12.9846, lng: 80.2591 },
        routeId: 'route_102',
        sequence: 5
      },
      {
        id: 'stop6',
        name: 'Koyambedu CMBT',
        address: 'Koyambedu, Chennai',
        coordinates: { lat: 13.0718, lng: 80.2124 },
        routeId: 'route_570',
        sequence: 1
      },
      {
        id: 'stop7',
        name: 'Kelambakkam',
        address: 'Kelambakkam, Chennai',
        coordinates: { lat: 12.8249, lng: 80.0461 },
        routeId: 'route_570',
        sequence: 2
      }
    ]

    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredStops = mockStops.filter(stop => 
          stop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stop.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
        console.log('Mock stops filtered for query:', searchQuery, ':', filteredStops)
        resolve(filteredStops.slice(0, limit))
      }, 100)
    })
  },

  // Find nearest stops from user location (mock data for now)
  async getNearbyStopsFromDB(userLocation: UserLocation, radiusInMeters: number = 50000): Promise<FirebaseStop[]> {
    const allStops = await this.getStopsFromDB('', 100)
    
    const stopsWithCoords = allStops.filter(stop => 
      stop.coordinates.lat !== 0 && 
      stop.coordinates.lng !== 0 && 
      !isNaN(stop.coordinates.lat) && 
      !isNaN(stop.coordinates.lng)
    )
    
    if (stopsWithCoords.length === 0) {
      return []
    }
    
    const nearbyStops = stopsWithCoords
      .map(stop => ({
        ...stop,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          stop.coordinates.lat,
          stop.coordinates.lng
        )
      }))
      .filter(stop => stop.distance <= radiusInMeters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
    
    return nearbyStops
  },

  // Calculate distance between two coordinates (Haversine formula)
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
}
