export interface Location {
  lat: number
  lng: number
}

export interface PlaceResult {
  place_id: string
  formatted_address: string
  name?: string
  geometry: {
    location: Location
  }
  types: string[]
}

export interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number }
      duration: { text: string; value: number }
      start_address: string
      end_address: string
      steps: Array<{
        html_instructions: string
        distance: { text: string; value: number }
        duration: { text: string; value: number }
        start_location: Location
        end_location: Location
      }>
    }>
    overview_polyline: {
      points: string
    }
  }>
}

export interface BusStop {
  id: string
  name: string
  address: string
  location: Location
  distance?: number
  type: 'bus_stop' | 'bus_terminal' | 'bus_station'
}

export class GoogleMapsService {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api'

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  }

  /**
   * Search for places using Google Places API
   */
  async searchPlaces(query: string, location?: Location, radius?: number): Promise<PlaceResult[]> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        input: query,
        inputtype: 'textquery',
        fields: 'place_id,formatted_address,name,geometry,types'
      })

      if (location) {
        params.append('location', `${location.lat},${location.lng}`)
        if (radius) {
          params.append('radius', radius.toString())
        }
      }

      const response = await fetch(`${this.baseUrl}/place/autocomplete/json?${params}`)
      
      if (!response.ok) {
        throw new Error(`Places API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.predictions || []
    } catch (error) {
      console.error('Error searching places:', error)
      return []
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        place_id: placeId,
        fields: 'place_id,formatted_address,name,geometry,types'
      })

      const response = await fetch(`${this.baseUrl}/place/details/json?${params}`)
      
      if (!response.ok) {
        throw new Error(`Place Details API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.result || null
    } catch (error) {
      console.error('Error getting place details:', error)
      return null
    }
  }

  /**
   * Get directions between two points
   */
  async getDirections(origin: Location, destination: Location, mode: 'driving' | 'transit' | 'walking' = 'transit'): Promise<DirectionsResult | null> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: mode,
        transit_mode: 'bus',
        alternatives: 'true'
      })

      const response = await fetch(`${this.baseUrl}/directions/json?${params}`)
      
      if (!response.ok) {
        throw new Error(`Directions API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error getting directions:', error)
      return null
    }
  }

  /**
   * Find nearby bus stops using Google Places API
   */
  async findNearbyBusStops(location: Location, radius: number = 1000): Promise<BusStop[]> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        location: `${location.lat},${location.lng}`,
        radius: radius.toString(),
        type: 'bus_station',
        keyword: 'bus stop'
      })

      const response = await fetch(`${this.baseUrl}/place/nearbysearch/json?${params}`)
      
      if (!response.ok) {
        throw new Error(`Nearby Search API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      return (data.results || []).map((place: any, index: number) => ({
        id: `google_${place.place_id}`,
        name: place.name || `Bus Stop ${index + 1}`,
        address: place.vicinity || place.formatted_address || 'Address not available',
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        type: this.determineBusStopType(place.types)
      }))
    } catch (error) {
      console.error('Error finding nearby bus stops:', error)
      return []
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<Location | null> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        address: address
      })

      const response = await fetch(`${this.baseUrl}/geocode/json?${params}`)
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return {
          lat: location.lat,
          lng: location.lng
        }
      }
      
      return null
    } catch (error) {
      console.error('Error geocoding address:', error)
      return null
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(location: Location): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        latlng: `${location.lat},${location.lng}`
      })

      const response = await fetch(`${this.baseUrl}/geocode/json?${params}`)
      
      if (!response.ok) {
        throw new Error(`Reverse Geocoding API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address
      }
      
      return null
    } catch (error) {
      console.error('Error reverse geocoding:', error)
      return null
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180
    const φ2 = point2.lat * Math.PI / 180
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  /**
   * Determine bus stop type from Google Places types
   */
  private determineBusStopType(types: string[]): BusStop['type'] {
    if (types.includes('bus_station') || types.includes('transit_station')) {
      return 'bus_station'
    }
    if (types.includes('subway_station') || types.includes('train_station')) {
      return 'bus_terminal'
    }
    return 'bus_stop'
  }

  /**
   * Get user's current location using browser geolocation
   */
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
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
  }
}

export const googleMapsService = new GoogleMapsService()
