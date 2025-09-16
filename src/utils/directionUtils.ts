import { RouteDetails, RouteStop } from '@/services/routeService'

export type Direction = 'going' | 'coming'

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Find the closest stop to a given position
 */
export function findClosestStop(
  lat: number, 
  lng: number, 
  stops: RouteStop[]
): { stop: RouteStop; distance: number } | null {
  if (stops.length === 0) return null

  let closestStop = stops[0]
  let minDistance = calculateDistance(
    lat, lng, 
    closestStop.coordinates?.latitude || 0, 
    closestStop.coordinates?.longitude || 0
  )

  for (const stop of stops) {
    if (!stop.coordinates) continue
    
    const distance = calculateDistance(
      lat, lng,
      stop.coordinates.latitude,
      stop.coordinates.longitude
    )
    
    if (distance < minDistance) {
      minDistance = distance
      closestStop = stop
    }
  }

  return { stop: closestStop, distance: minDistance }
}

/**
 * Determine bus direction based on position relative to route stops
 */
export function detectBusDirection(
  busLat: number,
  busLng: number,
  goingRoute: RouteDetails | null,
  comingRoute: RouteDetails | null,
  goingStops: RouteStop[],
  comingStops: RouteStop[]
): Direction {
  if (!goingRoute || !comingRoute) {
    // If only one route exists, default to going
    return goingRoute ? 'going' : 'coming'
  }

  // Find closest stops in both routes
  const closestGoingStop = findClosestStop(busLat, busLng, goingStops)
  const closestComingStop = findClosestStop(busLat, busLng, comingStops)

  if (!closestGoingStop || !closestComingStop) {
    return 'going' // Default fallback
  }

  // Determine direction based on which route the bus is closer to
  // If bus is significantly closer to going route stops, it's going
  // If bus is significantly closer to coming route stops, it's coming
  const distanceThreshold = 0.5 // 500 meters threshold

  if (closestGoingStop.distance < closestComingStop.distance - distanceThreshold) {
    return 'going'
  } else if (closestComingStop.distance < closestGoingStop.distance - distanceThreshold) {
    return 'coming'
  } else {
    // If distances are similar, use route progression logic
    return determineDirectionByProgression(
      busLat, busLng, 
      goingRoute, comingRoute,
      goingStops, comingStops
    )
  }
}

/**
 * Determine direction by analyzing route progression
 */
function determineDirectionByProgression(
  busLat: number,
  busLng: number,
  goingRoute: RouteDetails,
  comingRoute: RouteDetails,
  goingStops: RouteStop[],
  comingStops: RouteStop[]
): Direction {
  // Find the closest stop in each route
  const closestGoingStop = findClosestStop(busLat, busLng, goingStops)
  const closestComingStop = findClosestStop(busLat, busLng, comingStops)

  if (!closestGoingStop || !closestComingStop) {
    return 'going'
  }

  // Get the position of closest stops in their respective routes
  const goingStopIndex = goingStops.findIndex(s => s.id === closestGoingStop.stop.id)
  const comingStopIndex = comingStops.findIndex(s => s.id === closestComingStop.stop.id)

  // If bus is near the beginning of going route, it's going
  // If bus is near the beginning of coming route, it's coming
  const goingRouteLength = goingStops.length
  const comingRouteLength = comingStops.length

  const goingProgress = goingStopIndex / goingRouteLength
  const comingProgress = comingStopIndex / comingRouteLength

  // If bus is early in going route (first 30%) and late in coming route (last 30%)
  if (goingProgress < 0.3 && comingProgress > 0.7) {
    return 'going'
  }
  
  // If bus is late in going route (last 30%) and early in coming route (first 30%)
  if (goingProgress > 0.7 && comingProgress < 0.3) {
    return 'coming'
  }

  // Default to going if unclear
  return 'going'
}

/**
 * Get the appropriate route and stops based on detected direction
 */
export function getRouteByDirection(
  direction: Direction,
  goingRoute: RouteDetails | null,
  comingRoute: RouteDetails | null,
  goingStops: RouteStop[],
  comingStops: RouteStop[]
): {
  route: RouteDetails | null;
  stops: RouteStop[];
  fromStop: RouteStop | null;
  toStop: RouteStop | null;
} {
  if (direction === 'coming') {
    return {
      route: comingRoute,
      stops: comingStops,
      fromStop: comingStops[comingStops.length - 1] || null, // Last stop becomes from
      toStop: comingStops[0] || null // First stop becomes to
    }
  } else {
    return {
      route: goingRoute,
      stops: goingStops,
      fromStop: goingStops[0] || null, // First stop is from
      toStop: goingStops[goingStops.length - 1] || null // Last stop is to
    }
  }
}

