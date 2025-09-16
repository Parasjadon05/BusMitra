import { googleMapsService, Location, BusStop } from './googleMapsService'

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

export class MapService {
  /**
   * Get user's current location using browser geolocation API
   */
  async getCurrentLocation(): Promise<UserLocation> {
    try {
      const location = await googleMapsService.getCurrentLocation()
      return {
        latitude: location.lat,
        longitude: location.lng
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      throw error
    }
  }

  /**
   * Get address from coordinates using Google Maps reverse geocoding
   */
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const location: Location = { lat: latitude, lng: longitude }
      const address = await googleMapsService.reverseGeocode(location)
      return address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    } catch (error) {
      console.error('Error getting address from coordinates:', error)
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    }
  }

  /**
   * Find nearby bus stops using Google Places API
   */
  async findNearbyBusStands(userLocation: UserLocation, radius: number = 1000): Promise<BusStop[]> {
    try {
      const location: Location = {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      }

      const busStops = await googleMapsService.findNearbyBusStops(location, radius)
      
      // Add distance calculation
      return busStops.map(stop => ({
        ...stop,
        distance: googleMapsService.calculateDistance(location, stop.location)
      }))
    } catch (error) {
      console.error('Error finding nearby bus stands:', error)
      return []
    }
  }

  /**
   * Get directions between two points using Google Maps
   */
  async getDirections(
    from: [number, number], 
    to: [number, number],
    mode: 'driving' | 'transit' | 'walking' = 'transit'
  ): Promise<any> {
    try {
      const fromLocation: Location = { lat: from[1], lng: from[0] }
      const toLocation: Location = { lat: to[1], lng: to[0] }
      
      return await googleMapsService.getDirections(fromLocation, toLocation, mode)
    } catch (error) {
      console.error('Error getting directions:', error)
      return null
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const point1: Location = { lat: lat1, lng: lon1 }
    const point2: Location = { lat: lat2, lng: lon2 }
    return googleMapsService.calculateDistance(point1, point2)
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`
    }
  }
}

export const mapService = new MapService()
