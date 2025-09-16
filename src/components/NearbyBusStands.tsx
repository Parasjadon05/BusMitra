import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BusStand, mapService } from '@/services/mapService'
import { MapPin, Navigation, Clock, Users, ArrowRight } from 'lucide-react'

interface NearbyBusStandsProps {
  busStands: BusStand[]
  userLocation: { latitude: number; longitude: number } | null
  onBusStandSelect?: (busStand: BusStand) => void
  selectedBusStand?: BusStand | null
  isLoading?: boolean
}

export default function NearbyBusStands({
  busStands,
  userLocation,
  onBusStandSelect,
  selectedBusStand,
  isLoading = false
}: NearbyBusStandsProps) {
  const [expandedStand, setExpandedStand] = useState<string | null>(null)

  const getBusStandTypeColor = (type: BusStand['type']) => {
    switch (type) {
      case 'bus_terminal':
        return 'bg-blue-100 text-blue-800'
      case 'bus_station':
        return 'bg-purple-100 text-purple-800'
      case 'bus_stop':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBusStandTypeLabel = (type: BusStand['type']) => {
    switch (type) {
      case 'bus_terminal':
        return 'Terminal'
      case 'bus_station':
        return 'Station'
      case 'bus_stop':
        return 'Stop'
      default:
        return 'Bus Stand'
    }
  }

  const handleBusStandClick = (busStand: BusStand) => {
    setExpandedStand(expandedStand === busStand.id ? null : busStand.id)
    onBusStandSelect?.(busStand)
  }

  const handleGetDirections = (busStand: BusStand) => {
    if (!userLocation) return
    
    // Open Google Maps with directions
    const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${busStand.coordinates[1]},${busStand.coordinates[0]}`
    window.open(url, '_blank')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nearby Bus Stands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (busStands.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nearby Bus Stands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No bus stands found nearby</p>
            <p className="text-sm text-gray-500 mt-2">
              Try enabling location access or searching in a different area
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Nearby Bus Stands
        </CardTitle>
        <CardDescription>
          {busStands.length} bus stands found within 5km
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {busStands.map((busStand, index) => (
            <div
              key={busStand.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedBusStand?.id === busStand.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleBusStandClick(busStand)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{busStand.name}</h3>
                    <Badge className={getBusStandTypeColor(busStand.type)}>
                      {getBusStandTypeLabel(busStand.type)}
                    </Badge>
                    {index === 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Closest
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{busStand.address}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Navigation className="h-4 w-4" />
                      <span>{mapService.formatDistance(busStand.distance)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>~{Math.ceil(busStand.distance / 100)} min walk</span>
                    </div>
                  </div>

                  {expandedStand === busStand.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Users className="h-4 w-4" />
                        <span>Estimated wait time: 5-10 minutes</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGetDirections(busStand)
                          }}
                          className="flex-1"
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Get Directions
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle bus tracking
                          }}
                          className="flex-1"
                        >
                          Track Buses
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
