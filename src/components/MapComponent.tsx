import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { mapConfig } from '@/config/tomtom.config'
import { BusStand, UserLocation } from '@/services/mapService'
import { MapPin, Navigation, Bus, Wifi, WifiOff } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'

export interface BusLocation {
  lat: number
  lng: number
  timestamp: number
  speed?: number
  heading?: number
  accuracy?: number
}

export interface LiveBusData {
  busId: string
  driverId: string
  location: BusLocation
  status: 'in_transit' | 'at_stop' | 'off_duty' | 'delayed'
  nextStop?: string
  estimatedArrival?: string
  lastUpdated: number
}

interface MapComponentProps {
  userLocation: UserLocation | null
  userAddress?: string | null
  busStands: BusStand[]
  onBusStandSelect?: (busStand: BusStand) => void
  selectedBusStand?: BusStand | null
  liveBusData?: LiveBusData | null
  routeStops?: Array<{ id: string; name: string; coordinates: { lat: number; lng: number } }>
  userFromStop?: { id: string; name: string; coordinates: { lat: number; lng: number } }
  onSpeedAndETAUpdate?: (speed: number | null, eta: string | null) => void
  className?: string
}

export default function MapComponent({
  userLocation,
  userAddress,
  busStands,
  onBusStandSelect,
  selectedBusStand,
  liveBusData,
  routeStops,
  userFromStop,
  onSpeedAndETAUpdate,
  className = "h-96 w-full"
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const busMarker = useRef<maplibregl.Marker | null>(null)
  const userMarker = useRef<maplibregl.Marker | null>(null)
  const routeLine = useRef<maplibregl.LineLayer | null>(null)
  const [previousBusLocation, setPreviousBusLocation] = useState<BusLocation | null>(null)
  const [calculatedSpeed, setCalculatedSpeed] = useState<number | null>(null)
  const [etaToUserStop, setEtaToUserStop] = useState<string | null>(null)

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
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

  // Calculate speed and ETA
  const calculateSpeedAndETA = (currentLocation: BusLocation) => {
    if (previousBusLocation) {
      // Check if coordinates actually changed
      const latDiff = Math.abs(previousBusLocation.lat - currentLocation.lat)
      const lngDiff = Math.abs(previousBusLocation.lng - currentLocation.lng)
      
      if (latDiff < 0.000001 && lngDiff < 0.000001) {
        console.log('🗺️ MAP: Bus coordinates unchanged, setting speed to 0')
        setCalculatedSpeed(0) // Set speed to 0 when not moving
        return
      }
      
      const distance = calculateDistance(
        previousBusLocation.lat,
        previousBusLocation.lng,
        currentLocation.lat,
        currentLocation.lng
      )
      
      const timeDiff = (currentLocation.timestamp - previousBusLocation.timestamp) / 1000 // Convert to seconds
      
      if (timeDiff > 0 && distance > 0) {
        const speed = distance / timeDiff // Speed in m/s
        console.log('🗺️ MAP: Calculated speed:', Math.round(speed * 3.6), 'km/h')
        setCalculatedSpeed(speed)
        
        // Calculate ETA to user's from stop
        if (userFromStop) {
          const distanceToUserStop = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            userFromStop.coordinates.lat,
            userFromStop.coordinates.lng
          )
          
          if (speed > 0) {
            const etaSeconds = distanceToUserStop / speed
            const etaMinutes = Math.round(etaSeconds / 60)
            console.log('🗺️ MAP: Calculated ETA:', etaMinutes, 'min')
            setEtaToUserStop(`${etaMinutes} min`)
          }
        }
      } else {
        // If time difference is 0 or distance is 0, set speed to 0
        setCalculatedSpeed(0)
      }
    } else {
      // First location update, set speed to 0
      setCalculatedSpeed(0)
    }
    
    setPreviousBusLocation(currentLocation)
  }

  // Call callback when speed and ETA are updated
  useEffect(() => {
    if (onSpeedAndETAUpdate) {
      onSpeedAndETAUpdate(calculatedSpeed, etaToUserStop)
    }
  }, [calculatedSpeed, etaToUserStop, onSpeedAndETAUpdate])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map with OpenStreetMap
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapConfig.mapStyle,
      center: mapConfig.defaultCenter,
      zoom: mapConfig.defaultZoom,
      attributionControl: false
    })

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Add scale control
    map.current.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left')

    map.current.on('load', () => {
      setIsMapLoaded(true)
    })

    // Handle map style loading errors
    map.current.on('error', (e) => {
      console.warn('Map style failed to load:', e)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update map center - prioritize bus location over user location
  useEffect(() => {
    if (!map.current || !isMapLoaded) return

    // If we have live bus data, center on bus location
    if (liveBusData && liveBusData.location.lat && liveBusData.location.lng) {
      map.current.flyTo({
        center: [liveBusData.location.lng, liveBusData.location.lat],
        zoom: 16,
        duration: 1000
      })
    }
    // Otherwise, center on user location if available
    else if (userLocation) {
      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        duration: 1000
      })
    }
    // If no bus or user location, center on a default location (Delhi)
    else {
      map.current.flyTo({
        center: [77.2090, 28.6139], // Delhi coordinates
        zoom: 12,
        duration: 1000
      })
    }
  }, [userLocation, liveBusData, isMapLoaded])

  // Create bus marker only once when liveBusData first becomes available
  useEffect(() => {
    if (!map.current || !isMapLoaded || !liveBusData || busMarker.current) {
      return
    }

    // Create bus marker element with inline styles to ensure visibility
    const busMarkerEl = document.createElement('div')
    busMarkerEl.className = 'bus-marker'
    busMarkerEl.style.cssText = `
      width: 32px;
      height: 32px;
      background-color: #2563eb;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1000;
    `
    busMarkerEl.innerHTML = `
      <div style="color: white; font-size: 16px; font-weight: bold;">🚌</div>
    `

    // Add bus marker to map
    busMarker.current = new maplibregl.Marker({
      element: busMarkerEl
    })
      .setLngLat([liveBusData.location.lng, liveBusData.location.lat])
      .addTo(map.current)

    console.log('🗺️ MAP: Live bus marker successfully added to map')

    // Calculate speed and ETA
    calculateSpeedAndETA(liveBusData.location)

    // Create popup for bus marker
    const popup = new maplibregl.Popup({
      offset: 25,
      closeButton: false
    }).setHTML(`
      <div class="p-2">
        <div class="font-semibold text-sm">Live Bus Location</div>
        <div class="text-xs text-gray-600 mt-1">
          Status: ${liveBusData.status.replace('_', ' ')}
        </div>
        <div class="text-xs text-gray-600">
          Updated: ${new Date(liveBusData.lastUpdated).toLocaleTimeString()}
        </div>
        ${liveBusData.location.speed ? `
          <div class="text-xs text-gray-600">
            Speed: ${Math.round(liveBusData.location.speed * 3.6)} km/h
          </div>
        ` : ''}
      </div>
    `)

    busMarker.current.setPopup(popup)

    // Add route line if route stops are provided
    if (routeStops && routeStops.length > 0) {
      const routeCoordinates = routeStops.map(stop => [stop.coordinates.lng, stop.coordinates.lat])
      
      // Remove existing route line
      if (map.current.getSource('route')) {
        map.current.removeLayer('route')
        map.current.removeSource('route')
      }
      
      // Add route line source
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        }
      })
      
      // Add route line layer
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 4,
          'line-opacity': 0.8
        }
      })
    }

    // Add user's from stop marker
    if (userFromStop) {
      const userStopMarkerEl = document.createElement('div')
      userStopMarkerEl.className = 'user-stop-marker'
      userStopMarkerEl.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: #10b981;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 999;
      `
      userStopMarkerEl.innerHTML = `
        <div style="color: white; font-size: 12px;">📍</div>
      `

      const userStopMarker = new maplibregl.Marker({
        element: userStopMarkerEl
      })
        .setLngLat([userFromStop.coordinates.lng, userFromStop.coordinates.lat])
        .addTo(map.current)

      // Add popup for user stop
      const userStopPopup = new maplibregl.Popup({
        offset: 25,
        closeButton: false
      }).setHTML(`
        <div class="p-2">
          <div class="font-semibold text-sm">Your Stop</div>
          <div class="text-xs text-gray-600 mt-1">
            ${userFromStop.name}
          </div>
          ${etaToUserStop ? `
            <div class="text-xs text-green-600 font-medium">
              ETA: ${etaToUserStop}
            </div>
          ` : ''}
        </div>
      `)

      userStopMarker.setPopup(userStopPopup)
    }

    return () => {
      if (busMarker.current) {
        busMarker.current.remove()
        busMarker.current = null
      }
    }
  }, [isMapLoaded, liveBusData?.busId]) // Only depend on map loaded state and busId

  // Update bus marker position and popup when liveBusData changes
  useEffect(() => {
    if (!busMarker.current || !liveBusData) {
      return
    }

    const currentPosition = busMarker.current.getLngLat()
    const newLng = liveBusData.location.lng
    const newLat = liveBusData.location.lat
    
    // Only update position if coordinates actually changed
    if (currentPosition.lng !== newLng || currentPosition.lat !== newLat) {
      console.log('🗺️ MAP: Updating bus marker position from', currentPosition.lng, currentPosition.lat, 'to', newLng, newLat)
      busMarker.current.setLngLat([newLng, newLat])
    } else {
      console.log('🗺️ MAP: Bus coordinates unchanged, skipping position update')
    }

    // Always update popup content as other data might change
    const popup = new maplibregl.Popup({
      offset: 25,
      closeButton: false
    }).setHTML(`
      <div class="p-2">
        <div class="font-semibold text-sm">Live Bus Location</div>
        <div class="text-xs text-gray-600 mt-1">
          Status: ${liveBusData.status.replace('_', ' ')}
        </div>
        <div class="text-xs text-gray-600">
          Updated: ${new Date(liveBusData.lastUpdated).toLocaleTimeString()}
        </div>
        ${liveBusData.location.speed ? `
          <div class="text-xs text-gray-600">
            Speed: ${Math.round(liveBusData.location.speed * 3.6)} km/h
          </div>
        ` : ''}
      </div>
    `)
    busMarker.current.setPopup(popup)

    // Calculate speed and ETA
    calculateSpeedAndETA(liveBusData.location)
  }, [liveBusData, calculatedSpeed, etaToUserStop])

  // Add route line if route stops are provided
  useEffect(() => {
    if (!map.current || !isMapLoaded || !routeStops || routeStops.length === 0) {
      return
    }

    const routeCoordinates = routeStops.map(stop => [stop.coordinates.lng, stop.coordinates.lat])
    
    // Remove existing route line
    if (map.current.getSource('route')) {
      map.current.removeLayer('route')
      map.current.removeSource('route')
    }
    
    // Add route line source
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      }
    })
    
    // Add route line layer
    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#2563eb',
        'line-width': 4,
        'line-opacity': 0.8
      }
    })

    return () => {
      if (map.current && map.current.getSource('route')) {
        map.current.removeLayer('route')
        map.current.removeSource('route')
      }
    }
  }, [isMapLoaded, routeStops])

  // Add user's from stop marker
  useEffect(() => {
    if (!map.current || !isMapLoaded || !userFromStop) {
      return
    }

    const userStopMarkerEl = document.createElement('div')
    userStopMarkerEl.className = 'user-stop-marker'
    userStopMarkerEl.style.cssText = `
      width: 24px;
      height: 24px;
      background-color: #10b981;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 999;
    `
    userStopMarkerEl.innerHTML = `
      <div style="color: white; font-size: 12px;">📍</div>
    `

    const userStopMarker = new maplibregl.Marker({
      element: userStopMarkerEl
    })
      .setLngLat([userFromStop.coordinates.lng, userFromStop.coordinates.lat])
      .addTo(map.current)

    // Add popup for user stop
    const userStopPopup = new maplibregl.Popup({
      offset: 25,
      closeButton: false
    }).setHTML(`
      <div class="p-2">
        <div class="font-semibold text-sm">Your Stop</div>
        <div class="text-xs text-gray-600 mt-1">
          ${userFromStop.name}
        </div>
        ${etaToUserStop ? `
          <div class="text-xs text-green-600 font-medium">
            ETA: ${etaToUserStop}
          </div>
        ` : ''}
      </div>
    `)

    userStopMarker.setPopup(userStopPopup)

    return () => {
      userStopMarker.remove()
    }
  }, [isMapLoaded, userFromStop, etaToUserStop])


  // Add user location marker
  useEffect(() => {
    if (!map.current || !userLocation || !isMapLoaded) return

    // Remove existing user marker
    const existingMarker = document.getElementById('user-location-marker')
    if (existingMarker) {
      existingMarker.remove()
    }

    // Create user location marker
    const userMarker = new maplibregl.Marker({
      element: createUserMarkerElement(),
      anchor: 'center'
    })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current)

    return () => {
      userMarker.remove()
    }
  }, [userLocation, isMapLoaded])

  // Add bus stand markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return

    // Clear existing bus stand markers
    const existingMarkers = document.querySelectorAll('.bus-stand-marker')
    existingMarkers.forEach(marker => marker.remove())

    // Add new bus stand markers
    busStands.forEach((busStand, index) => {
      const marker = new maplibregl.Marker({
        element: createBusStandMarkerElement(busStand, index),
        anchor: 'bottom'
      })
        .setLngLat(busStand.coordinates)
        .addTo(map.current!)

      // Add click handler
      marker.getElement().addEventListener('click', () => {
        onBusStandSelect?.(busStand)
      })
    })
  }, [busStands, isMapLoaded, onBusStandSelect])

  // Highlight selected bus stand
  useEffect(() => {
    if (!map.current || !selectedBusStand || !isMapLoaded) return

    // Remove existing highlight
    const existingHighlight = document.getElementById('selected-bus-stand-highlight')
    if (existingHighlight) {
      existingHighlight.remove()
    }

    // Add highlight for selected bus stand
    const highlightMarker = new maplibregl.Marker({
      element: createHighlightMarkerElement(),
      anchor: 'center'
    })
      .setLngLat(selectedBusStand.coordinates)
      .addTo(map.current)

    return () => {
      highlightMarker.remove()
    }
  }, [selectedBusStand, isMapLoaded])

  const createUserMarkerElement = (): HTMLElement => {
    const el = document.createElement('div')
    el.id = 'user-location-marker'
    el.className = 'user-location-marker'
    el.innerHTML = `
      <div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
        </svg>
      </div>
    `
    return el
  }

  const createBusStandMarkerElement = (busStand: BusStand, index: number): HTMLElement => {
    const el = document.createElement('div')
    el.className = 'bus-stand-marker cursor-pointer'
    el.innerHTML = `
      <div class="relative">
        <div class="w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"></path>
          </svg>
        </div>
        <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          ${busStand.name}
        </div>
      </div>
    `
    return el
  }

  const createHighlightMarkerElement = (): HTMLElement => {
    const el = document.createElement('div')
    el.id = 'selected-bus-stand-highlight'
    el.className = 'selected-bus-stand-highlight'
    el.innerHTML = `
      <div class="w-12 h-12 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-pulse">
        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"></path>
        </svg>
      </div>
    `
    return el
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
