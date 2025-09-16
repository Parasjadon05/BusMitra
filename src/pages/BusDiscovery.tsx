
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Clock, Bus, Navigation, AlertCircle, RefreshCw, IndianRupee, Wifi, WifiOff } from 'lucide-react'
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api'
import { firebaseStopsService } from '@/services/firebaseStopsService'
import { routeService } from '@/services/routeService'
import { searchService } from '@/services/searchService'
import type { FirebaseStop } from '@/services/firebaseStopsService'
import type { Route } from '@/services/routeService'

// Define BusWithDetails interface
interface BusWithDetails {
  bus: {
    id: string
    busNumber: string
    busName: string
    type: string
    capacity: number
    assignedRoute: string
    status: string
  }
  route: {
    id: string
    routeNumber: string
    routeName: string
    from: string
    to: string
    stops: string[]
    fare: number
    totalDistance: number
    estimatedTime: string
    driverOnDuty?: boolean
    driverId?: string
  }
  fromStop: {
    name: string
    distance: number
  }
  toStop: {
    name: string
    distance: number
  }
  realtimeStatus: {
    busId: string
    driverId: string
    location: {
      lat: number
      lng: number
      timestamp: number
    }
    status: string
    lastUpdated: number
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
  height: '400px'
}
const defaultCenter = { lat: 12.8249, lng: 80.0461 } // Andaman and Nicobar Islands

export default function BusDiscovery() {
  const navigate = useNavigate()
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [fromQuery, setFromQuery] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [fromSuggestions, setFromSuggestions] = useState<FirebaseStop[]>([])
  const [toSuggestions, setToSuggestions] = useState<FirebaseStop[]>([])
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [selectedStop, setSelectedStop] = useState<FirebaseStop | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [displayedBuses, setDisplayedBuses] = useState<BusWithDetails[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [fromCoordinates, setFromCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [toCoordinates, setToCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [routeDistance, setRouteDistance] = useState<string>('')
  const [routeDuration, setRouteDuration] = useState<string>('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [nearbyStops, setNearbyStops] = useState<FirebaseStop[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapLoadKey, setMapLoadKey] = useState(Date.now())

  // Prevent multiple Google Maps script loads
  useEffect(() => {
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
    existingScripts.forEach(script => script.remove())
  }, [])

  // Function to calculate directions using Google Maps Directions API
  const calculateRoute = useCallback((origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
    if (!isMapLoaded || !window.google?.maps) {
      setError('Google Maps API not loaded. Please try again.')
      return
    }
    try {
      const directionsService = new window.google.maps.DirectionsService()
      directionsService.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            setDirections(result)
            if (result.routes[0]?.legs[0]) {
              setRouteDistance(result.routes[0].legs[0].distance?.text || 'N/A')
              setRouteDuration(result.routes[0].legs[0].duration?.text || 'N/A')
            }
          } else {
            setError(`Failed to calculate route: ${status}`)
          }
        }
      )
    } catch (err) {
      setError('Failed to calculate route. Please try again.')
    }
  }, [isMapLoaded])

  // Load initial location
  useEffect(() => {
    const loadLocation = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const location = await firebaseStopsService.getCurrentLocation()
        const userLoc = { lat: location.latitude, lng: location.longitude }
        setUserLocation(userLoc)
        const address = await firebaseStopsService.getAddressFromCoordinates(location.latitude, location.longitude)
        setUserAddress(address)
        const nearestStops = await firebaseStopsService.getNearbyStopsFromDB(location, 50000)
        setNearbyStops(nearestStops)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load location')
      } finally {
        setIsLoading(false)
      }
    }
    loadLocation()
  }, [])

  // Ensure map operations are delayed until API is fully loaded
  useEffect(() => {
    if (isMapLoaded && userLocation && fromCoordinates && window.google?.maps) {
      const timer = setTimeout(() => {
        calculateRoute(userLocation, fromCoordinates)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isMapLoaded, userLocation, fromCoordinates, calculateRoute])

  // Fallback for user location
  useEffect(() => {
    if (!userLocation) {
      const timer = setTimeout(() => {
        if (!userLocation) {
          setUserLocation(defaultCenter)
          setUserAddress('Default Location (Andaman and Nicobar Islands)')
        }
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [userLocation])

  // Check geolocation permissions
  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'denied') {
        setError('Location access denied. Please enable location permissions.')
      }
    })
  }, [])

  // Fetch all stops for suggestions
  const fetchStopSuggestions = async (query: string, setSuggestions: (suggestions: FirebaseStop[]) => void) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    try {
      console.log('Fetching suggestions for query:', query)
      const stops = await firebaseStopsService.getStopsFromDB(query, 10)
      console.log('Received suggestions:', stops)
      setSuggestions(stops)
    } catch (err) {
      console.error('Failed to fetch stop suggestions:', err)
      // Don't set error state, just use empty suggestions
      setSuggestions([])
    }
  }

  // Handle from input change and suggestions
  const handleFromInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFromQuery(value)
    setFromLocation(value)
    
    if (value.length >= 2) {
      await fetchStopSuggestions(value, (suggestions) => {
        setFromSuggestions(suggestions)
        setShowFromDropdown(suggestions.length > 0)
      })
    } else {
      setFromSuggestions([])
      setShowFromDropdown(false)
    }
  }

  // Handle to input change and suggestions
  const handleToInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setToQuery(value)
    setToLocation(value)
    
    if (value.length >= 2) {
      await fetchStopSuggestions(value, (suggestions) => {
        setToSuggestions(suggestions)
        setShowToDropdown(suggestions.length > 0)
      })
    } else {
      setToSuggestions([])
      setShowToDropdown(false)
    }
  }

  // Handle from suggestion select
  const handleFromSuggestionSelect = (suggestion: FirebaseStop) => {
    setFromQuery(suggestion.name)
    setFromLocation(suggestion.name)
    setShowFromDropdown(false)
    if (suggestion.coordinates && suggestion.coordinates.lat !== 0 && suggestion.coordinates.lng !== 0) {
      const coords = { lat: suggestion.coordinates.lat, lng: suggestion.coordinates.lng }
      setFromCoordinates(coords)
      if (userLocation && isMapLoaded && window.google?.maps) {
        calculateRoute(userLocation, coords)
      }
    }
  }

  // Handle to suggestion select
  const handleToSuggestionSelect = (suggestion: FirebaseStop) => {
    setToQuery(suggestion.name)
    setToLocation(suggestion.name)
    setShowToDropdown(false)
    if (suggestion.coordinates && suggestion.coordinates.lat !== 0 && suggestion.coordinates.lng !== 0) {
      setToCoordinates({ lat: suggestion.coordinates.lat, lng: suggestion.coordinates.lng })
    }
  }

  // Handle find buses
  const handleFindBuses = async () => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      setError('Please enter both from and to locations')
      return
    }

    // Check if we have coordinates for both locations
    if (!fromCoordinates || !toCoordinates) {
      setError('Please select locations from the suggestions to get accurate results')
      return
    }

    try {
      setIsSearching(true)
      setShowSearchResults(true)
      setError(null)

      console.log('🔍 Searching buses with coordinates:', {
        from: fromLocation,
        to: toLocation,
        fromCoords: fromCoordinates,
        toCoords: toCoordinates
      })

      // Use the enhanced search service with coordinates
      const searchResults = await searchService.searchBuses({
        fromLocation: fromLocation,
        toLocation: toLocation,
        fromCoordinates: fromCoordinates,
        toCoordinates: toCoordinates,
        maxDistance: 5000 // 5km max distance from stops
      })

      console.log('🎯 Search results:', searchResults)

      if (searchResults.length === 0) {
        setError('No buses found connecting these locations. Please try different locations.')
        setDisplayedBuses([])
        return
      }

      // Convert search results to the expected format
      const busDetails: BusWithDetails[] = []
      
      for (const result of searchResults) {
        for (const bus of result.buses) {
          const driver = bus.driverId ? await routeService.getDriverById(bus.driverId) : undefined
          
          busDetails.push({
            bus: {
              id: bus.id,
              busNumber: bus.busNumber,
              busName: bus.busName || result.route.name,
              type: bus.type || 'Regular',
              capacity: bus.capacity || 40,
              assignedRoute: result.route.id,
              status: bus.status || 'active'
            },
            route: {
              id: result.route.id,
              routeNumber: result.route.id,
              routeName: result.route.name,
              from: result.fromLocation.name,
              to: result.toLocation.name,
              stops: result.route.stops?.map(s => s.name) || [],
              fare: result.estimatedFare || 0,
              totalDistance: result.totalDistance || 0,
              estimatedTime: result.estimatedTime?.toString() || 'N/A',
              driverOnDuty: bus.driverId ? true : false,
              driverId: bus.driverId
            },
            fromStop: {
              name: result.fromLocation.name,
              distance: result.fromLocation.distance
            },
            toStop: {
              name: result.toLocation.name,
              distance: result.toLocation.distance
            },
            realtimeStatus: {
              busId: bus.id,
              driverId: bus.driverId || '',
              location: {
                lat: result.fromLocation.location.lat,
                lng: result.fromLocation.location.lng,
                timestamp: Date.now()
              },
              status: bus.status || 'in_transit',
              lastUpdated: Date.now()
            },
            driver
          })
        }
      }

      setDisplayedBuses(busDetails)
      console.log('✅ Found buses:', busDetails.length)

    } catch (err) {
      console.error('Error finding buses:', err)
      setError('Failed to find buses. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const location = await firebaseStopsService.getCurrentLocation()
      const userLoc = { lat: location.latitude, lng: location.longitude }
      setUserLocation(userLoc)
      const address = await firebaseStopsService.getAddressFromCoordinates(location.latitude, location.longitude)
      setUserAddress(address)
      const nearestStops = await firebaseStopsService.getNearbyStopsFromDB(location, 50000)
      setNearbyStops(nearestStops)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRealBusSelect = (busWithDetails: BusWithDetails) => {
    navigate(`/bus/${busWithDetails.bus.id}`, {
      state: { 
        busWithDetails, 
        fromLocation, 
        toLocation,
        fromCoordinates,
        toCoordinates
      }
    })
  }

  const handleRefreshLocation = () => {
    setError(null)
    handleGetCurrentLocation()
  }

  const retrySearch = () => handleFindBuses()

  const retryMapLoad = () => {
    setIsMapLoaded(false)
    setMapLoadKey(Date.now())
    setError(null)
  }

  // Monitor network status
  useEffect(() => {
    const handleOnlineStatus = () => {
      if (!navigator.onLine) {
        setError('No internet connection. Please check your network.')
      } else if (error === 'No internet connection. Please check your network.') {
        setError(null)
        retryMapLoad()
      }
    }
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
    return () => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="mr-4 text-[#87281B] hover:bg-[#87281B]/10 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#87281B] tracking-tight">Find Your Bus</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Panel - Map & Search */}
          <div className="space-y-6">
            {/* Search Section */}
            <Card className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100/50">
              <CardHeader className="border-b border-gray-100/70 p-6">
                <CardTitle className="flex items-center gap-3 text-[#87281B] text-xl sm:text-2xl font-semibold">
                  <Navigation className="h-6 w-6" />
                  Plan Your Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-4 relative">
                  <div className="w-full sm:w-1/2">
                    <input
                      placeholder="From (e.g., Koyambedu)"
                      value={fromQuery}
                      onChange={handleFromInputChange}
                      onFocus={() => fromQuery.length >= 2 && setShowFromDropdown(true)}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#87281B]/40 transition-all duration-200"
                    />
                    {showFromDropdown && fromSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-40 overflow-auto shadow-lg">
                        {fromSuggestions.map((suggestion) => (
                          <li
                            key={suggestion.id}
                            className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                            onClick={() => handleFromSuggestionSelect(suggestion)}
                          >
                            <div className="font-medium text-gray-900">{suggestion.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Route: {suggestion.routeId} • Stop #{suggestion.sequence}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className="hidden sm:block text-lg font-medium text-gray-600">to</span>
                  <div className="w-full sm:w-1/2 relative">
                    <input
                      placeholder="To (e.g., Kelambakkam)"
                      value={toQuery}
                      onChange={handleToInputChange}
                      onFocus={() => toQuery.length >= 2 && setShowToDropdown(true)}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#87281B]/40 transition-all duration-200"
                    />
                    {showToDropdown && toSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-40 overflow-auto shadow-lg">
                        {toSuggestions.map((suggestion) => (
                          <li
                            key={suggestion.id}
                            className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                            onClick={() => handleToSuggestionSelect(suggestion)}
                          >
                            <div className="font-medium text-gray-900">{suggestion.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Route: {suggestion.routeId} • Stop #{suggestion.sequence}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-[#87281B] to-[#601c13] text-white py-3 rounded-xl text-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70"
                    onClick={handleFindBuses}
                    disabled={!fromLocation.trim() || !toLocation.trim() || isSearching}
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Find Buses'
                    )}
                  </Button>
                  <Button
                    onClick={handleGetCurrentLocation}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-2 border-[#87281B] text-[#87281B] hover:bg-[#87281B]/5 py-3 rounded-xl text-lg font-medium transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-5 w-5 mr-2" />
                        Use My Live Location
                      </>
                    )}
                  </Button>
                </div>
                {error && (
                  <div className="text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map Section with Google Maps */}
            <Card className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100/50">
              <CardHeader className="border-b border-gray-100/70 p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-[#87281B] text-xl sm:text-2xl font-semibold">
                    <MapPin className="h-6 w-6" />
                    {isLoading && !userLocation ? 'Fetching your location...' : 'My Location & Nearby Stops'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshLocation}
                    disabled={isLoading}
                    className="border-[#87281B] text-[#87281B] hover:bg-[#87281B]/5"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE' ? (
                  <div className="h-64 bg-red-50/80 rounded-xl flex items-center justify-center">
                    <div className="text-center text-red-600">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium text-lg">Invalid Google Maps API Key</p>
                      <p className="text-sm text-red-500">Please configure VITE_GOOGLE_MAPS_API_KEY in .env</p>
                    </div>
                  </div>
                ) : isLoading && !userLocation ? (
                  <div className="h-64 bg-gray-100/80 rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <RefreshCw className="h-12 w-12 mx-auto mb-2 animate-spin" />
                      <p className="font-medium text-lg">Getting your location...</p>
                      <p className="text-sm">Please allow location access</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="h-64 bg-red-50/80 rounded-xl flex items-center justify-center">
                    <div className="text-center text-red-600">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium text-lg">Error</p>
                      <p className="text-sm text-red-500">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshLocation}
                        className="mt-3 border-[#87281B] text-[#87281B] hover:bg-[#87281B]/5"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <LoadScript
                    key={mapLoadKey}
                    googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                    onLoad={() => setIsMapLoaded(true)}
                    onError={() => {
                      setError('Failed to load Google Maps. Please check your API key or network.')
                      setIsMapLoaded(false)
                      setMapLoadKey(Date.now())
                    }}
                    loadingElement={
                      <div className="h-64 bg-gray-100/80 rounded-xl flex items-center justify-center">
                        <div className="text-center text-gray-600">
                          <RefreshCw className="h-12 w-12 mx-auto mb-2 animate-spin" />
                          <p className="font-medium text-lg">Loading Google Maps...</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={retryMapLoad}
                            className="mt-2 border-[#87281B] text-[#87281B] hover:bg-[#87281B]/5"
                          >
                            Retry Load
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    {isMapLoaded && window.google?.maps && (
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={userLocation || defaultCenter}
                        zoom={15}
                        options={{
                          mapTypeControl: false,
                          streetViewControl: false,
                          fullscreenControl: false,
                        }}
                      >
                        {directions && <DirectionsRenderer directions={directions} />}
                        {userLocation && (
                          <Marker
                            position={userLocation}
                            icon={{
                              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                              scaledSize: new window.google.maps.Size(32, 32),
                            }}
                            title="Your Current Location"
                          />
                        )}
                        {fromCoordinates && fromCoordinates.lat !== 0 && fromCoordinates.lng !== 0 && (
                          <Marker
                            position={fromCoordinates}
                            icon={{
                              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                              scaledSize: new window.google.maps.Size(32, 32),
                            }}
                            title="From Stop"
                          />
                        )}
                        {nearbyStops.map((stop) => (
                          stop.coordinates.lat !== 0 && stop.coordinates.lng !== 0 && (
                            <Marker
                              key={stop.id}
                              position={stop.coordinates}
                              icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                scaledSize: new window.google.maps.Size(32, 32),
                              }}
                              title={stop.name}
                            />
                          )
                        ))}
                      </GoogleMap>
                    )}
                  </LoadScript>
                )}
                {userLocation && (
                  <div className="mt-5 space-y-3">
                    <div className="h-12 bg-gray-50/80 rounded-xl flex items-center px-4 shadow-sm">
                      <span className="text-sm sm:text-base text-gray-700">
                        Current Location: {userAddress}
                      </span>
                    </div>
                    {fromCoordinates && routeDistance && (
                      <div className="h-12 bg-blue-50/80 rounded-xl flex items-center px-4 shadow-sm">
                        <span className="text-sm sm:text-base text-blue-700">
                          <Navigation className="h-4 w-4 inline mr-1" />
                          Route to From Stop: {routeDistance} ({routeDuration})
                        </span>
                      </div>
                    )}
                    {nearbyStops.length > 0 && (
                      <>
                        <div className="h-12 bg-[#87281B]/10 rounded-xl flex items-center px-4 shadow-sm">
                          <span className="text-sm sm:text-base text-[#87281B]">
                            Nearest Stop: {nearbyStops[0].name} ({Math.round(nearbyStops[0].distance || 0)}m)
                          </span>
                        </div>
                        <div className="h-12 bg-green-50/80 rounded-xl flex items-center px-4 shadow-sm">
                          <span className="text-sm sm:text-base text-green-700">
                            Walk Time: ~{Math.ceil((nearbyStops[0].distance || 0) / 100)} mins
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Source Notice */}
            {isLoading && (
              <Card className="bg-[#87281B]/10 border border-[#87281B]/20 rounded-xl shadow-md">
                <CardContent className="p-4 flex items-center gap-2 text-[#87281B]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Loading Real Data</span>
                  <span className="text-xs text-[#87281B]/70">From Firebase</span>
                </CardContent>
              </Card>
            )}

            {!isLoading && nearbyStops.length > 0 && (
              <Card className="bg-green-50/80 border border-green-200 rounded-xl shadow-md">
                <CardContent className="p-4 flex items-center gap-2 text-green-800">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Firebase Database</span>
                  <span className="text-xs text-green-600">Real stops from routes</span>
                </CardContent>
              </Card>
            )}

            {/* Nearby Bus Stops */}
            <Card className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100/50">
              <CardHeader className="border-b border-gray-100/70 p-6">
                <CardTitle className="flex items-center gap-3 text-[#87281B] text-xl sm:text-2xl font-semibold">
                  <MapPin className="h-6 w-6" />
                  Nearby Bus Stops
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2 text-[#87281B]" />
                    <span className="text-sm text-gray-600">Loading stops...</span>
                  </div>
                ) : nearbyStops.length > 0 ? (
                  <div className="space-y-4">
                    {nearbyStops.slice(0, 5).map((stop) => (
                      <div
                        key={stop.id}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedStop?.id === stop.id
                            ? 'border-[#87281B] bg-[#87281B]/5 shadow-md'
                            : 'border-gray-200 hover:border-[#87281B]/40 hover:shadow-sm'
                        }`}
                        onClick={() => {
                          setSelectedStop(stop)
                          const coords = { lat: stop.coordinates.lat, lng: stop.coordinates.lng }
                          setFromCoordinates(coords)
                          setFromLocation(stop.name)
                          setFromQuery(stop.name)
                          if (userLocation && isMapLoaded && window.google?.maps) {
                            calculateRoute(userLocation, coords)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base sm:text-lg text-gray-900">{stop.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">{stop.address}</p>
                            {stop.routeId && <p className="text-xs text-gray-500">Route: {stop.routeId}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-xs sm:text-sm font-medium text-gray-700">
                              {stop.distance ? `${(stop.distance / 1000).toFixed(1)} km` : 'N/A'}
                            </p>
                            <Badge variant="secondary" className="text-xs sm:text-sm mt-1 bg-gray-100 text-gray-800">
                              {stop.sequence || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm sm:text-base text-gray-500">No nearby bus stops found.</p>
                    <p className="text-xs text-gray-400">Please check Firebase data or increase search radius.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Bus List */}
          <div>
            <Card className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100/50">
              <CardHeader className="border-b border-gray-100/70 p-6">
                <CardTitle className="flex items-center gap-3 text-[#87281B] text-xl sm:text-2xl font-semibold">
                  <Bus className="h-6 w-6" />
                  {showSearchResults ? 'Search Results' : 'Available Buses'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="min-h-[600px] sm:min-h-[400px]">
                  {!showSearchResults ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 bg-gray-50/80 rounded-xl p-6">
                      <div className="w-28 h-28 bg-gradient-to-br from-[#87281B] to-[#601c13] rounded-full flex items-center justify-center shadow-lg">
                        <Bus className="h-14 w-14 text-white" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Find Your Perfect Bus</h3>
                        <p className="text-gray-600 text-sm sm:text-base max-w-md">
                          Enter your destinations above and click "Find Buses" to explore real-time routes from Firebase.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm sm:text-base text-gray-500">
                        <MapPin className="h-5 w-5" />
                        <span>Search by location</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isSearching ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center space-y-4">
                            <RefreshCw className="h-10 w-10 mx-auto animate-spin text-[#87281B]" />
                            <p className="text-gray-700 font-medium text-lg sm:text-xl">Searching for buses...</p>
                            <p className="text-sm sm:text-base text-gray-500">Querying Firebase routes</p>
                          </div>
                        </div>
                      ) : displayedBuses.length > 0 ? (
                        <div>
                          <div className="mb-4 p-3 bg-[#87281B]/5 rounded-xl">
                            <span className="font-medium text-gray-700 text-sm sm:text-base">
                              Found {displayedBuses.length} bus{displayedBuses.length !== 1 ? 'es' : ''}
                            </span>
                          </div>
                          {displayedBuses.map((busWithDetails, index) => (
                            <Card
                              key={`${busWithDetails.bus.id}-${index}`}
                              className="cursor-pointer hover:shadow-xl transition-all duration-300"
                              onClick={() => handleRealBusSelect(busWithDetails)}
                            >
                              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="w-12 h-12 bg-gradient-to-br from-[#87281B]/10 to-[#601c13]/10 rounded-full flex items-center justify-center">
                                    <Bus className="h-6 w-6 text-[#87281B]" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg sm:text-xl text-gray-900">{busWithDetails.bus.busNumber}</h3>
                                    <p className="text-sm sm:text-base text-gray-600">{busWithDetails.route.routeName}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {busWithDetails.realtimeStatus.status === 'off_duty' && (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs sm:text-sm py-1 px-2">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Off Duty
                                    </Badge>
                                  )}
                                  <Badge
                                    variant={
                                      busWithDetails.realtimeStatus.status === 'in_transit' ? 'default' :
                                      busWithDetails.realtimeStatus.status === 'at_stop' ? 'secondary' :
                                      busWithDetails.realtimeStatus.status === 'delayed' ? 'destructive' : 'outline'
                                    }
                                    className="text-xs sm:text-sm py-1 px-2"
                                  >
                                    {busWithDetails.realtimeStatus.status === 'in_transit' ? 'In Transit' :
                                     busWithDetails.realtimeStatus.status === 'at_stop' ? 'At Stop' :
                                     busWithDetails.realtimeStatus.status === 'delayed' ? 'Delayed' : 'Off Duty'}
                                  </Badge>
                                  {busWithDetails.realtimeStatus && (
                                    <div className="flex items-center gap-1">
                                      {busWithDetails.realtimeStatus.status !== 'off_duty' ? (
                                        <Wifi className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <WifiOff className="h-4 w-4 text-red-600" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardContent className="p-4 pt-0 border-t border-gray-100/70">
                                <div className="grid grid-cols-2 gap-4 text-sm sm:text-base text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>ETA: {busWithDetails.route.estimatedTime}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <IndianRupee className="h-4 w-4" />
                                    <span>₹{busWithDetails.route.fare}</span>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-sm sm:text-base">
                                  <span className="text-gray-600">
                                    From: {busWithDetails.fromStop.name} to {busWithDetails.toStop.name}
                                  </span>
                                  <Button size="sm" variant="outline" className="border-[#87281B] text-[#87281B] hover:bg-[#87281B]/5">
                                    View Details
                                  </Button>
                                </div>
                                {busWithDetails.route.driverId && (
                                  <div className="mt-2 text-xs sm:text-sm text-gray-500">
                                    Driver ID: {busWithDetails.route.driverId}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center space-y-4">
                            <Bus className="h-12 w-12 mx-auto text-gray-400" />
                            <div className="space-y-2">
                              <h3 className="text-lg sm:text-xl font-medium text-gray-900">No Buses Found</h3>
                              <p className="text-gray-600 text-sm sm:text-base">
                                No buses available for these locations in Firebase.
                              </p>
                            </div>
                            <Button onClick={retrySearch} variant="outline" size="sm" className="border-[#87281B] text-[#87281B] hover:bg-[#87281B]/5">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
