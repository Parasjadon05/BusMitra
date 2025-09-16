interface DistanceMatrixResponse {
  destination_addresses: string[]
  origin_addresses: string[]
  rows: Array<{
    elements: Array<{
      distance: {
        text: string
        value: number // in meters
      }
      duration: {
        text: string
        value: number // in seconds
      }
      duration_in_traffic?: {
        text: string
        value: number // in seconds
      }
      status: string
    }>
  }>
  status: string
}

interface ETAResult {
  distance: {
    text: string
    value: number
  }
  duration: {
    text: string
    value: number
  }
  durationInTraffic?: {
    text: string
    value: number
  }
  eta: string
  etaWithTraffic: string
  distanceKm: number
  durationMinutes: number
  durationWithTrafficMinutes: number
}

class GoogleMapsMatrixService {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Google Maps API key not found. ETA calculations will use fallback methods.')
    }
  }

  /**
   * Calculate ETA using Google Maps Distance Matrix API with traffic data
   */
  async calculateETAWithTraffic(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    departureTime?: Date
  ): Promise<ETAResult | null> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not available, using fallback calculation')
      return this.fallbackCalculation(origin, destination)
    }

    try {
      const params = new URLSearchParams({
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        key: this.apiKey,
        units: 'metric',
        mode: 'driving',
        traffic_model: 'best_guess',
        departure_time: departureTime ? Math.floor(departureTime.getTime() / 1000).toString() : 'now'
      })

      const response = await fetch(`${this.baseUrl}?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: DistanceMatrixResponse = await response.json()

      if (data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${data.status}`)
      }

      const element = data.rows[0]?.elements[0]
      if (!element || element.status !== 'OK') {
        throw new Error(`No route found: ${element?.status}`)
      }

      const result: ETAResult = {
        distance: element.distance,
        duration: element.duration,
        durationInTraffic: element.duration_in_traffic,
        eta: this.formatDuration(element.duration.value),
        etaWithTraffic: element.duration_in_traffic 
          ? this.formatDuration(element.duration_in_traffic.value)
          : this.formatDuration(element.duration.value),
        distanceKm: element.distance.value / 1000,
        durationMinutes: Math.round(element.duration.value / 60),
        durationWithTrafficMinutes: element.duration_in_traffic 
          ? Math.round(element.duration_in_traffic.value / 60)
          : Math.round(element.duration.value / 60)
      }

      console.log('🚗 Google Maps ETA calculation:', {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        distance: result.distance.text,
        duration: result.duration.text,
        durationInTraffic: result.durationInTraffic?.text,
        eta: result.eta,
        etaWithTraffic: result.etaWithTraffic
      })

      return result

    } catch (error) {
      console.error('Error calculating ETA with Google Maps:', error)
      return this.fallbackCalculation(origin, destination)
    }
  }

  /**
   * Fallback calculation using Haversine formula when Google Maps API is not available
   */
  private fallbackCalculation(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): ETAResult {
    const distance = this.calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng)
    const distanceKm = distance / 1000
    const durationMinutes = Math.round(distanceKm / 30 * 60) // Assume 30 km/h average speed

    return {
      distance: {
        text: distanceKm < 1 ? `${Math.round(distance)} m` : `${distanceKm.toFixed(1)} km`,
        value: distance
      },
      duration: {
        text: `${durationMinutes} min`,
        value: durationMinutes * 60
      },
      eta: this.formatDuration(durationMinutes * 60),
      etaWithTraffic: this.formatDuration(durationMinutes * 60),
      distanceKm,
      durationMinutes,
      durationWithTrafficMinutes: durationMinutes
    }
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
   * Format duration in seconds to human-readable format
   */
  private formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60)
    
    if (minutes < 60) {
      return `${minutes} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
  }

  /**
   * Get real-time traffic data for a route
   */
  async getTrafficData(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{
    hasTrafficData: boolean
    trafficDelay: number // in minutes
    trafficCondition: 'light' | 'moderate' | 'heavy' | 'unknown'
  }> {
    try {
      const result = await this.calculateETAWithTraffic(origin, destination)
      
      if (!result || !result.durationInTraffic) {
        return {
          hasTrafficData: false,
          trafficDelay: 0,
          trafficCondition: 'unknown'
        }
      }

      const trafficDelay = result.durationWithTrafficMinutes - result.durationMinutes
      let trafficCondition: 'light' | 'moderate' | 'heavy' | 'unknown' = 'unknown'

      if (trafficDelay <= 5) {
        trafficCondition = 'light'
      } else if (trafficDelay <= 15) {
        trafficCondition = 'moderate'
      } else {
        trafficCondition = 'heavy'
      }

      return {
        hasTrafficData: true,
        trafficDelay,
        trafficCondition
      }
    } catch (error) {
      console.error('Error getting traffic data:', error)
      return {
        hasTrafficData: false,
        trafficDelay: 0,
        trafficCondition: 'unknown'
      }
    }
  }
}

export const googleMapsMatrixService = new GoogleMapsMatrixService()
export type { ETAResult }
