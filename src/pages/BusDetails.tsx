import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Bus,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight,
  Route,
  Gauge,
  Timer,
  Navigation
} from 'lucide-react'
import { GoogleMap, LoadScript } from '@react-google-maps/api'
import { useLiveTracking } from '@/hooks/useLiveTracking'
import { routeService } from '@/services/routeService'

// Interface for route data
interface RouteStop {
  id: string
  name: string
  latitude: number
  longitude: number
  sequence: number
  distance?: number
}

interface RouteData {
  id: string
  routeNumber: string
  routeName: string
  stops: RouteStop[]
  from: string
  to: string
  totalDistance: number
  estimatedTime: number
}

// Interface for bus details
interface BusDetails {
  bus: {
    id: string
    busNumber: string
    busName: string
    type: string
    capacity: number
    assignedRoute: string
    status: string
  }
  route: RouteData
  fromStop: {
    name: string
    distance: number
  }
  toStop: {
    name: string
    distance: number
  }
  driver?: {
    id: string
    name: string
    phone: string
  }
}

// Google Maps configuration
const GOOGLE_MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'
const mapContainerStyle = {
  width: '100%',
  height: '100%'
}

const defaultCenter = { lat: 12.8249, lng: 80.0461 }

export default function BusDetails() {
  const { busId } = useParams<{ busId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Early return if no busId
  if (!busId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">No bus ID provided</p>
          <Button onClick={() => navigate('/discover')} className="bg-[#87281B] text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    )
  }
  
  // State for bus details and live tracking
  const [busDetails, setBusDetails] = useState<BusDetails | null>(null)
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isRoutePanelExpanded, setIsRoutePanelExpanded] = useState(false)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isRouteDataLoaded, setIsRouteDataLoaded] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  
  // Get user coordinates from navigation state or use default
  const userCoordinates = location.state?.fromCoordinates || { lat: 12.8249, lng: 80.0461 }
  const userStopName = location.state?.fromLocation || 'Your Stop'
  
  // State for the matched stop from route database
  const [matchedUserStop, setMatchedUserStop] = useState<RouteStop | null>(null)
  const [followBus, setFollowBus] = useState(false)
  
  // Driver availability states
  const [driverStatus, setDriverStatus] = useState<'available' | 'not-assigned' | 'off-duty' | 'on-break'>('available')
  const [driverStatusMessage, setDriverStatusMessage] = useState('')
  
  // Debug follow bus state
  console.log('🔄 Follow Bus state:', followBus)
  console.log('👨‍💼 Driver status:', driverStatus)
  
  console.log('📍 Navigation state data:', {
    fromLocation: location.state?.fromLocation,
    fromCoordinates: location.state?.fromCoordinates,
    toLocation: location.state?.toLocation,
    toCoordinates: location.state?.toCoordinates,
    userCoordinates,
    userStopName
  })
  
  // Use live tracking hook with route ID to find the assigned driver
  // The live tracking service will search for drivers assigned to this route
  const routeId = busDetails?.route?.id || ''
  const {
    liveBusData,
    // driverData,
    isLoading,
    error,
    eta,
    speed,
    distance,
    etaWithTraffic,
    trafficDelay,
    trafficCondition,
    isCalculatingETA,
    refreshData
  } = useLiveTracking(routeId, userCoordinates)
  
  // Debug live tracking state after hook call
  console.log('📊 Live tracking state:', { liveBusData: !!liveBusData, error, isLoading, busDetails: !!busDetails })
  
  // Refs for map and directions
  const mapRef = useRef<google.maps.Map | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const busMarkerRef = useRef<google.maps.Marker | null>(null)
  const userStopMarkerRef = useRef<google.maps.Marker | null>(null)
  const routeStopMarkersRef = useRef<google.maps.Marker[]>([])
  
  // Fetch route data dynamically based on bus assignment
  useEffect(() => {
    const fetchRouteData = async () => {
      if (!busId) return
      
      setIsLoadingRoute(true)
      setRouteError(null)
      
      try {
        console.log('🔍 Fetching route data for bus:', busId)
        
        // Get all routes to find the one assigned to this bus
        const routes = await routeService.getAllRoutes()
        console.log('📊 Available routes:', routes.length)
        
        // Find the route assigned to this bus
        let assignedRoute = null
        for (const route of routes) {
          const buses = await routeService.getBusesByAssignedRoute(route.id)
          const bus = buses.find(b => b.id === busId)
          if (bus) {
            assignedRoute = { route, bus }
            console.log('✅ Found assigned route:', route.id, 'for bus:', busId)
            break
          }
        }
        
        if (assignedRoute) {
          const { route, bus } = assignedRoute
          
          // Set bus details
          const busDetails: BusDetails = {
            bus: {
              id: bus.id,
              busNumber: bus.busNumber,
              busName: bus.busName || route.name,
              type: bus.type || 'Regular',
              capacity: bus.capacity || 40,
              assignedRoute: route.id,
              status: bus.status || 'active'
            },
            route: {
              id: route.id,
              routeNumber: route.id,
              routeName: route.name,
              from: route.startPoint,
              to: route.endPoint,
              stops: route.stops?.map(s => ({
                id: s.id || `stop_${s.sequence}`,
                name: s.name,
                latitude: s.latitude,
                longitude: s.longitude,
                sequence: s.sequence
              })) || [],
              totalDistance: route.distance || 0,
              estimatedTime: route.estimatedTime || 0
            },
            fromStop: {
              name: route.startPoint,
              distance: 0
            },
            toStop: {
              name: route.endPoint,
              distance: 0
            },
            driver: bus.driverId ? await routeService.getDriverById(bus.driverId) : undefined
          }
          
          setBusDetails(busDetails)
          
          // Convert route stops to our interface
          const routeStops: RouteStop[] = route.stops?.map((stop: any, index: number) => ({
            id: stop.id || `stop_${index}`,
            name: stop.name || `Stop ${index + 1}`,
            latitude: stop.latitude || 0,
            longitude: stop.longitude || 0,
            sequence: stop.sequence || index + 1
          })) || []
          
          console.log('📍 Setting route stops:', routeStops)
          console.log('📍 Route stops count:', routeStops.length)
          console.log('📍 First route stop:', routeStops[0])
          setRouteStops(routeStops)
          setIsRouteDataLoaded(true)
          console.log('✅ Route data loaded successfully')
        } else {
          console.log('❌ No route found for bus:', busId)
          setRouteError('No route assigned to this bus')
          setIsRouteDataLoaded(false)
        }
      } catch (err) {
        console.error('Error fetching route data:', err)
        setRouteError('Failed to load route data')
        setIsRouteDataLoaded(false)
      } finally {
        setIsLoadingRoute(false)
      }
    }
    
    fetchRouteData()
  }, [busId])

  // Update bus details when live data is available
  useEffect(() => {
    console.log('🔍 Live tracking data check:', {
      liveBusData: !!liveBusData,
      busDetails: !!busDetails,
      isLoading,
      error,
      routeId
    })
    
    if (liveBusData && busDetails) {
      // Update bus details with live data if needed
      console.log('✅ Live bus data updated:', liveBusData)
      
      // Determine driver status based on live data
      if (!liveBusData.isOnDuty) {
        setDriverStatus('off-duty')
        setDriverStatusMessage('Driver is off duty')
      } else if (!liveBusData.isOnline) {
        setDriverStatus('on-break')
        setDriverStatusMessage('Driver is on break')
      } else {
        setDriverStatus('available')
        setDriverStatusMessage('Driver is available')
      }
    } else if (error) {
      console.log('❌ Live tracking error:', error)
      setDriverStatus('not-assigned')
      setDriverStatusMessage('No driver assigned to this route')
    } else if (isLoading) {
      console.log('⏳ Loading live tracking data...')
      setDriverStatus('available')
      setDriverStatusMessage('Loading driver status...')
    } else {
      console.log('❌ No live data available')
      setDriverStatus('not-assigned')
      setDriverStatusMessage('No driver assigned to this route')
    }
    
    // Ensure driver status is set even if there's an error
    if (error && !liveBusData) {
      setDriverStatus('not-assigned')
      setDriverStatusMessage('No driver assigned to this route')
    }
  }, [liveBusData, busDetails, isLoading, error, routeId])

  // Create route stop markers when route stops are loaded
  useEffect(() => {
    console.log('🔍 Route markers useEffect triggered:', {
      isMapLoaded,
      routeStopsLength: routeStops.length,
      hasMapRef: !!mapRef.current,
      routeStops: routeStops,
      isLoadingRoute
    })

    if (!isMapLoaded || !routeStops.length || !mapRef.current || isLoadingRoute || !isRouteDataLoaded) {
      console.log('❌ Missing requirements for route markers:', {
        isMapLoaded,
        routeStopsLength: routeStops.length,
        hasMapRef: !!mapRef.current,
        isLoadingRoute,
        isRouteDataLoaded
      })
      return
    }

    // Add a small delay to ensure map is fully rendered
    const timer = setTimeout(() => {
      createRouteMarkers()
    }, 100)

    return () => clearTimeout(timer)
  }, [isMapLoaded, routeStops, isLoadingRoute, isRouteDataLoaded])

  const createRouteMarkers = () => {
    if (!mapRef.current || !routeStops.length) return

    try {
      // Clear existing route stop markers
      routeStopMarkersRef.current.forEach(marker => {
        if (marker) {
          marker.setMap(null)
        }
      })
      routeStopMarkersRef.current = []

      console.log('🎯 Creating markers for route stops:', routeStops)
      console.log('🎯 Route stops details:', routeStops.map(s => ({
        name: s.name,
        lat: s.latitude,
        lng: s.longitude,
        sequence: s.sequence,
        valid: !!(s.latitude && s.longitude && s.latitude !== 0 && s.longitude !== 0)
      })))
      console.log('🎯 Map ref available:', !!mapRef.current)
      console.log('🎯 Google Maps available:', !!window.google?.maps)

      // Create new markers for each route stop
      routeStops.forEach((stop, index) => {
        console.log(`📍 Processing stop ${index + 1}:`, {
          name: stop.name,
          lat: stop.latitude,
          lng: stop.longitude,
          sequence: stop.sequence
        })

        if (stop.latitude && stop.longitude && stop.latitude !== 0 && stop.longitude !== 0) {
          try {
            const marker = new google.maps.Marker({
              position: {
                lat: stop.latitude,
                lng: stop.longitude
              },
              map: mapRef.current,
              title: `${stop.sequence}. ${stop.name}`,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 15
              },
              label: {
                text: stop.sequence.toString(),
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              },
              zIndex: 1000 // Ensure markers are on top
            })

            // Add info window for each stop
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h3 class="font-semibold text-sm">${stop.sequence}. ${stop.name}</h3>
                  <p class="text-xs text-gray-600">Stop #${stop.sequence}</p>
                  <p class="text-xs text-gray-500">${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}</p>
                </div>
              `
            })

            marker.addListener('click', () => {
              infoWindow.open(mapRef.current, marker)
            })

            routeStopMarkersRef.current.push(marker)
            console.log(`✅ Created marker for stop: ${stop.name} at`, {
              lat: stop.latitude,
              lng: stop.longitude
            })
            console.log(`✅ Marker added to map:`, marker.getMap() !== null)
          } catch (markerError) {
            console.error(`❌ Error creating marker for stop ${stop.name}:`, markerError)
          }
        } else {
          console.log(`❌ Skipped stop ${stop.name} - invalid coordinates:`, {
            lat: stop.latitude,
            lng: stop.longitude
          })
        }
      })

      console.log(`✅ Created ${routeStopMarkersRef.current.length} route stop markers`)
    } catch (error) {
      console.error('Error creating route stop markers:', error)
    }
  }

  // Find matching user stop from route database
  useEffect(() => {
    if (!routeStops.length || !userStopName) return

    console.log('🔍 Finding matching stop for user:', userStopName)
    console.log('📍 Available route stops:', routeStops.map(s => s.name))

    // Try to find exact match first
    let matchedStop = routeStops.find(stop => 
      stop.name.toLowerCase().includes(userStopName.toLowerCase()) ||
      userStopName.toLowerCase().includes(stop.name.toLowerCase())
    )

    // If no exact match, try to find the closest stop by coordinates
    if (!matchedStop && userCoordinates.lat !== 12.8249 && userCoordinates.lng !== 80.0461) {
      console.log('🔍 No exact name match, trying coordinate-based matching...')
      
      let minDistance = Infinity
      let closestStop: RouteStop | undefined = undefined

      routeStops.forEach(stop => {
        if (stop.latitude && stop.longitude) {
          // Calculate distance between user coordinates and stop coordinates
          const distance = Math.sqrt(
            Math.pow(stop.latitude - userCoordinates.lat, 2) + 
            Math.pow(stop.longitude - userCoordinates.lng, 2)
          )
          
          if (distance < minDistance) {
            minDistance = distance
            closestStop = stop
          }
        }
      })

      if (closestStop && minDistance < 0.01) { // Within ~1km
        matchedStop = closestStop
        console.log('✅ Found closest stop by coordinates:', (closestStop as RouteStop)?.name || 'Unknown', 'Distance:', minDistance)
      }
    }

    if (matchedStop) {
      console.log('✅ Matched user stop to route stop:', matchedStop)
      setMatchedUserStop(matchedStop)
    } else {
      console.log('❌ No matching stop found in route data')
      setMatchedUserStop(null)
    }
  }, [routeStops, userStopName, userCoordinates])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (busMarkerRef.current) {
        busMarkerRef.current.setMap(null)
      }
      if (userStopMarkerRef.current) {
        userStopMarkerRef.current.setMap(null)
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }
      // Cleanup route stop markers
      routeStopMarkersRef.current.forEach(marker => {
        if (marker) {
          marker.setMap(null)
        }
      })
      routeStopMarkersRef.current = []
    }
  }, [])

  // Handle map load - optimized to prevent unnecessary re-renders
  const onMapLoad = useCallback((map: google.maps.Map) => {
    if (mapRef.current) {
      console.log('🗺️ Map already loaded, skipping re-initialization')
      return
    }
    
    mapRef.current = map
    setIsMapLoaded(true)
    
    console.log('🗺️ Map loaded, setting stable center...')
    
    // Set initial map center - this will be stable and not change
    // The map will stay centered on the route area, bus marker will move
    const setStableCenter = () => {
      if (matchedUserStop) {
        // Center on user's selected stop
        map.setCenter({
          lat: matchedUserStop.latitude,
          lng: matchedUserStop.longitude
        })
        console.log('📍 Map centered on user stop:', matchedUserStop.name)
      } else if (routeStops.length > 0) {
        // Center on middle of route
        const middleIndex = Math.floor(routeStops.length / 2)
        const middleStop = routeStops[middleIndex]
        map.setCenter({
          lat: middleStop.latitude,
          lng: middleStop.longitude
        })
        console.log('📍 Map centered on route middle:', middleStop.name)
      } else {
        // Default center
        map.setCenter({ lat: 12.8249, lng: 80.0461 })
        console.log('📍 Using default center')
      }
    }
    
    setStableCenter()
    
    // Don't create bus marker here - let the useEffect handle it
    console.log('🗺️ Map loaded, bus marker will be handled by useEffect')
  }, []) // Remove dependencies to prevent re-creation

  // Separate effect to handle map centering when route data changes
  useEffect(() => {
    if (mapRef.current && (matchedUserStop || routeStops.length > 0)) {
      const setStableCenter = () => {
        if (matchedUserStop) {
          // Center on user's selected stop
          mapRef.current!.setCenter({
            lat: matchedUserStop.latitude,
            lng: matchedUserStop.longitude
          })
          console.log('📍 Map re-centered on user stop:', matchedUserStop.name)
        } else if (routeStops.length > 0) {
          // Center on middle of route
          const middleIndex = Math.floor(routeStops.length / 2)
          const middleStop = routeStops[middleIndex]
          mapRef.current!.setCenter({
            lat: middleStop.latitude,
            lng: middleStop.longitude
          })
          console.log('📍 Map re-centered on route middle:', middleStop.name)
        }
      }
      
      setStableCenter()
    }
  }, [matchedUserStop, routeStops])

  // Create and update bus marker - optimized to prevent unnecessary re-renders
  useEffect(() => {
    console.log('🚌 Bus marker useEffect triggered:', {
      isMapLoaded,
      hasLiveBusData: !!liveBusData,
      hasMapRef: !!mapRef.current,
      driverStatus,
      hasBusMarker: !!busMarkerRef.current,
      isLoadingRoute
    })

    if (!isMapLoaded || !mapRef.current || isLoadingRoute || !isRouteDataLoaded) {
      console.log('❌ Missing requirements for bus marker:', {
        isMapLoaded,
        hasMapRef: !!mapRef.current,
        isLoadingRoute,
        isRouteDataLoaded
      })
      return
    }

    // Clean up existing marker if driver is not available
    if (driverStatus !== 'available' || !liveBusData) {
      if (busMarkerRef.current) {
        console.log('🚌 Removing bus marker - driver not available')
        busMarkerRef.current.setMap(null)
        busMarkerRef.current = null
      }
      return
    }

    // Only create marker if it doesn't exist, otherwise just update position
    if (!busMarkerRef.current) {
      createBusMarker()
    } else {
      updateBusMarkerPosition()
    }
  }, [isMapLoaded, liveBusData, driverStatus, isLoadingRoute, isRouteDataLoaded])

  // Separate effect for updating marker position when coordinates change
  useEffect(() => {
    if (busMarkerRef.current && liveBusData && driverStatus === 'available' && isMapLoaded) {
      updateBusMarkerPosition()
    }
  }, [liveBusData?.latitude, liveBusData?.longitude, isMapLoaded, driverStatus])

  const createBusMarker = () => {
    if (!mapRef.current || !liveBusData || driverStatus !== 'available') return

    try {
      // Validate coordinates before using them
      const lat = Number(liveBusData.latitude)
      const lng = Number(liveBusData.longitude)
      
      console.log('📍 Bus coordinates:', { lat, lng, original: { lat: liveBusData.latitude, lng: liveBusData.longitude } })
      
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        console.warn('❌ Invalid coordinates received:', { lat, lng })
        return
      }

      const position = {
        lat: lat,
        lng: lng
      }

      console.log('🚌 Creating bus marker with live data')
      busMarkerRef.current = new google.maps.Marker({
        position: position,
        map: mapRef.current,
        title: `Bus ${liveBusData.busNumber}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/bus.png',
          scaledSize: new google.maps.Size(50, 50),
          anchor: new google.maps.Point(25, 25)
        },
        animation: google.maps.Animation.DROP,
        zIndex: 1000
      })
      console.log('✅ Created bus marker')

      // Add info window with error handling
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <div class="font-semibold text-sm">Bus ${liveBusData.busNumber}</div>
            <div class="text-xs text-gray-600 mt-1">
              Driver: ${liveBusData.driverName || 'Unknown'}
            </div>
            <div class="text-xs text-gray-600">
              Speed: ${Math.round((liveBusData.speed || 0) * 3.6)} km/h
            </div>
            <div class="text-xs text-gray-600">
              Status: ${liveBusData.isOnDuty ? 'On Duty' : 'Off Duty'}
            </div>
          </div>
        `
      })

      busMarkerRef.current.addListener('click', () => {
        if (mapRef.current) {
          infoWindow.open(mapRef.current, busMarkerRef.current)
        }
      })

      // Center map on bus location with error handling
      if (mapRef.current) {
        mapRef.current.setCenter(position)
        mapRef.current.setZoom(15)
      }
    } catch (error) {
      console.error('Error creating bus marker:', error)
    }
  }

  const updateBusMarkerPosition = () => {
    if (!busMarkerRef.current || !liveBusData || !mapRef.current) return

    try {
      // Validate coordinates before using them
      const lat = Number(liveBusData.latitude)
      const lng = Number(liveBusData.longitude)
      
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        console.warn('❌ Invalid coordinates for marker update:', { lat, lng })
        return
      }

      const position = {
        lat: lat,
        lng: lng
      }

      // Update marker position smoothly without recreating
      busMarkerRef.current.setPosition(position)
      busMarkerRef.current.setTitle(`Bus ${liveBusData.busNumber}`)
      
      console.log('🚌 Updated bus marker position smoothly:', position)
      
      // Optionally center map on bus if follow mode is enabled
      if (followBus && mapRef.current) {
        mapRef.current.setCenter(position)
        console.log('🎯 Following bus - centered map on bus position')
      }
    } catch (error) {
      console.error('Error updating bus marker position:', error)
    }
  }

  // Add user stop marker
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !isRouteDataLoaded) return

    try {
      // Remove existing user stop marker
      if (userStopMarkerRef.current) {
        userStopMarkerRef.current.setMap(null)
      }

      // Use matched stop coordinates if available, otherwise fall back to user coordinates
      const stopToUse = matchedUserStop || {
        name: userStopName,
        latitude: userCoordinates.lat,
        longitude: userCoordinates.lng
      }

      const userStopPosition = {
        lat: stopToUse.latitude,
        lng: stopToUse.longitude
      }

      console.log('📍 Creating user stop marker at:', userStopPosition, 'for stop:', stopToUse.name)

      userStopMarkerRef.current = new google.maps.Marker({
        position: userStopPosition,
        map: mapRef.current,
        title: `Your Stop: ${stopToUse.name}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 15
        }
      })
      
      console.log('✅ User stop marker created:', userStopMarkerRef.current)
      console.log('✅ User stop marker on map:', userStopMarkerRef.current.getMap() !== null)
    } catch (error) {
      console.error('Error adding user stop marker:', error)
    }

  }, [isMapLoaded, matchedUserStop, userStopName, userCoordinates, isRouteDataLoaded])

  // Draw route line
  useEffect(() => {
    console.log('🛣️ Route line useEffect triggered:', {
      isMapLoaded,
      hasLiveBusData: !!liveBusData,
      hasBusDetails: !!busDetails,
      hasMapRef: !!mapRef.current,
      hasMatchedUserStop: !!matchedUserStop
    })

    if (!isMapLoaded || !liveBusData || !busDetails || !mapRef.current) {
      console.log('❌ Missing requirements for route line:', {
        isMapLoaded,
        hasLiveBusData: !!liveBusData,
        hasBusDetails: !!busDetails,
        hasMapRef: !!mapRef.current,
        driverStatus
      })
      return
    }

    try {
      // Clear existing directions
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }

      // Create directions service
      const directionsService = new google.maps.DirectionsService()
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#87281B',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      })

      directionsRenderer.setMap(mapRef.current)
      directionsRendererRef.current = directionsRenderer

      // Calculate route from bus to user stop
      const userStopCoords = matchedUserStop ? 
        { lat: matchedUserStop.latitude, lng: matchedUserStop.longitude } :
        { lat: userCoordinates.lat, lng: userCoordinates.lng }
      
      directionsService.route({
        origin: { lat: liveBusData.latitude, lng: liveBusData.longitude },
        destination: userStopCoords, // Use matched user stop coordinates
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result)
        } else {
          console.warn('Directions request failed:', status)
        }
      })
    } catch (error) {
      console.error('Error drawing route:', error)
    }

  }, [isMapLoaded, liveBusData, busDetails, matchedUserStop, userCoordinates, driverStatus])

  const handleRefresh = () => {
    refreshData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#87281B]" />
          <p className="text-gray-600">Loading bus details...</p>
        </div>
      </div>
    )
  }

  // Don't show error state - instead show driver unavailable state
  // The driver status logic will handle displaying appropriate messages
  // Only show error if bus details are completely missing
  if (!busDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">Bus details not found</p>
          <Button onClick={() => navigate('/discover')} className="bg-[#87281B] text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Section - Bus Details and Journey Details */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            {/* Mobile-first header layout */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/discover')}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-2 bg-[#87281B] rounded-lg flex-shrink-0">
                    <Bus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {busDetails?.bus.busNumber || 'BUS-002'}
                    </h1>
                    <p className="text-sm sm:text-lg text-gray-600 truncate">
                      {busDetails?.route.routeName || 'Route 23C: Besant Nagar to Vadapalani'}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      Driver: {busDetails?.driver?.name || 'Rajesh Kumar'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Status badges - responsive layout */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                {liveBusData && (
                  <div className="flex items-center space-x-2">
                    <Badge variant={liveBusData.isOnline ? "default" : "secondary"} className="px-2 py-1 text-xs">
                      {liveBusData.isOnline ? (
                        <>
                          <Wifi className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Online</span>
                          <span className="sm:hidden">On</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Offline</span>
                          <span className="sm:hidden">Off</span>
                        </>
                      )}
                    </Badge>
                    <Badge variant={liveBusData.isOnDuty ? "default" : "secondary"} className="px-2 py-1 text-xs">
                      <span className="hidden sm:inline">{liveBusData.isOnDuty ? 'On Duty' : 'Off Duty'}</span>
                      <span className="sm:hidden">{liveBusData.isOnDuty ? 'On' : 'Off'}</span>
                    </Badge>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-gray-500">Route:</p>
                  <p className="text-xs sm:text-sm font-medium">{busDetails?.route.id || 'route_23C'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Mobile-first responsive layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-6">
          
          {/* Route Stops Panel - Mobile: Full width, Desktop: Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="h-auto lg:h-[calc(100vh-200px)]">
              <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Route Stops</h3>
                  {/* Only show collapse button on mobile */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRoutePanelExpanded(!isRoutePanelExpanded)}
                    className="text-xs sm:text-sm lg:hidden"
                  >
                    {isRoutePanelExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
                
                <div className={`${isRoutePanelExpanded ? 'flex-1' : 'max-h-64'} lg:flex-1 overflow-y-auto`}>
                  <div className="space-y-2">
                    {routeStops.map((stop, index) => (
                      <div key={stop.id} className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 border-l-4 border-[#87281B]">
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-[#87281B] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                          {stop.sequence}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {stop.name}
                          </p>
                          <p className="text-xs text-gray-500 hidden sm:block">
                            {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                          </p>
                        </div>
                        {index < routeStops.length - 1 && (
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map Panel - Mobile: Full width, Desktop: Main content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="h-64 sm:h-80 lg:h-[calc(100vh-200px)]">
              <CardContent className="p-0 h-full relative">
                {!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE' ? (
                  <div className="h-full bg-red-50 flex items-center justify-center">
                    <div className="text-center text-red-600">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium text-lg">Google Maps API Key Required</p>
                      <p className="text-sm text-red-500">Please configure VITE_GOOGLE_MAPS_API_KEY in .env</p>
                    </div>
                  </div>
                ) : (
                  <LoadScript
                    googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                    onLoad={() => {
                      setIsScriptLoaded(true)
                      setIsMapLoaded(true)
                    }}
                    loadingElement={<div className="h-full bg-gray-100 flex items-center justify-center">Loading Map...</div>}
                  >
                    {isScriptLoaded && (
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={{ lat: 12.8249, lng: 80.0461 }} // Fixed center - will be updated in onMapLoad
                        zoom={15}
                        onLoad={onMapLoad}
                        options={{
                          disableDefaultUI: false,
                          zoomControl: true,
                          streetViewControl: false,
                          mapTypeControl: false,
                          fullscreenControl: false
                        }}
                      >
                        {/* Directions will be rendered here */}
                      </GoogleMap>
                    )}
                  </LoadScript>
                )}
                
                {/* Map Title Overlay - Mobile responsive */}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
                  <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-lg px-2 py-1 sm:px-3 sm:py-2 shadow-lg">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Live Tracking</h3>
                  </div>
                </div>
                
                {/* Follow Bus Button Overlay - Mobile responsive */}
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                  <Button
                    variant={followBus ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      console.log('🔄 Follow Bus clicked, current state:', followBus)
                      setFollowBus(!followBus)
                      console.log('🔄 Follow Bus new state:', !followBus)
                    }}
                    className={`flex items-center space-x-1 sm:space-x-2 backdrop-blur-md shadow-lg transition-all duration-200 text-xs sm:text-sm ${
                      followBus 
                        ? 'bg-blue-500/90 text-white border-2 border-blue-400/50 hover:bg-blue-600/90' 
                        : 'bg-white/80 text-gray-700 border border-white/20 hover:bg-white/90'
                    }`}
                  >
                    {followBus ? (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                    ) : (
                      <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                    <span className="hidden sm:inline font-medium">
                      {followBus ? 'Following' : 'Follow Bus'}
                    </span>
                    <span className="sm:hidden font-medium">
                      {followBus ? 'Follow' : 'Follow'}
                    </span>
                  </Button>
                </div>
                
                {/* Driver Status Overlay - Mobile responsive */}
                <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10">
                  <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-lg px-2 py-1 sm:px-3 sm:py-2 shadow-lg">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                        driverStatus === 'available' ? 'bg-green-500' :
                        driverStatus === 'off-duty' ? 'bg-orange-500' :
                        driverStatus === 'on-break' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-32 sm:max-w-none">
                        {driverStatusMessage}
                      </span>
                      {driverStatus === 'available' && liveBusData && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-1 py-0.5 sm:px-2 sm:py-1 rounded-full hidden sm:inline">
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Metrics (ETA, Speed, Distance) - Mobile responsive */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className={`bg-gradient-to-r border-2 ${
            driverStatus === 'available' 
              ? 'from-blue-50 to-blue-100 border-blue-200' 
              : 'from-gray-50 to-gray-100 border-gray-300'
          }`}>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Timer className={`h-5 w-5 sm:h-6 sm:w-6 ${driverStatus === 'available' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-sm sm:text-lg font-semibold ${driverStatus === 'available' ? 'text-blue-800' : 'text-gray-500'}`}>ETA</span>
                {isCalculatingETA && driverStatus === 'available' && (
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${driverStatus === 'available' ? 'text-blue-900' : 'text-gray-400'}`}>
                {driverStatus === 'available' ? (etaWithTraffic || eta) : 'N/A'}
              </p>
              <p className={`text-xs sm:text-sm mt-1 ${driverStatus === 'available' ? 'text-blue-600' : 'text-gray-500'}`}>
                {driverStatus === 'available' ? (
                  trafficDelay > 0 ? (
                    <div className="space-y-1">
                      <div>With Traffic • +{trafficDelay}min delay</div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        trafficCondition === 'light' ? 'bg-green-100 text-green-800' :
                        trafficCondition === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        trafficCondition === 'heavy' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trafficCondition} traffic
                      </span>
                    </div>
                  ) : (
                    'Estimated Time of Arrival'
                  )
                ) : (
                  <span className="truncate block">{driverStatusMessage}</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-r border-2 ${
            driverStatus === 'available' 
              ? 'from-green-50 to-green-100 border-green-200' 
              : 'from-gray-50 to-gray-100 border-gray-300'
          }`}>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Gauge className={`h-5 w-5 sm:h-6 sm:w-6 ${driverStatus === 'available' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm sm:text-lg font-semibold ${driverStatus === 'available' ? 'text-green-800' : 'text-gray-500'}`}>Speed</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${driverStatus === 'available' ? 'text-green-900' : 'text-gray-400'}`}>
                {driverStatus === 'available' ? speed : 'N/A'}
              </p>
              <p className={`text-xs sm:text-sm mt-1 ${driverStatus === 'available' ? 'text-green-600' : 'text-gray-500'}`}>
                {driverStatus === 'available' ? 'Current Speed' : <span className="truncate block">{driverStatusMessage}</span>}
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-r border-2 ${
            driverStatus === 'available' 
              ? 'from-purple-50 to-purple-100 border-purple-200' 
              : 'from-gray-50 to-gray-100 border-gray-300'
          }`}>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Route className={`h-5 w-5 sm:h-6 sm:w-6 ${driverStatus === 'available' ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`text-sm sm:text-lg font-semibold ${driverStatus === 'available' ? 'text-purple-800' : 'text-gray-500'}`}>Distance</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${driverStatus === 'available' ? 'text-purple-900' : 'text-gray-400'}`}>
                {driverStatus === 'available' ? distance : 'N/A'}
              </p>
              <p className={`text-xs sm:text-sm mt-1 ${driverStatus === 'available' ? 'text-purple-600' : 'text-gray-500'}`}>
                {driverStatus === 'available' ? 'Distance to Stop' : <span className="truncate block">{driverStatusMessage}</span>}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
