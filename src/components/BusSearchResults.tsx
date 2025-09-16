import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BusSearchResult {
  id: string
  connectionType: 'direct' | 'transfer'
  route: {
    id: string
    routeNumber: string
    routeName: string
    from: string
    to: string
  }
  from: string
  to: string
  fromLocation: {
    lat: number
    lng: number
    name: string
    distance: string
  }
  toLocation: {
    lat: number
    lng: number
    name: string
    distance: string
  }
  estimatedTime: string
  estimatedFare: number
  stops: string[]
  status: 'on-time' | 'delayed' | 'early'
  busType: 'AC' | 'Non-AC' | 'Deluxe'
}
import { 
  Bus, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Navigation, 
  ArrowRight,
  Route,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface BusSearchResultsProps {
  results: BusSearchResult[]
  isSearching: boolean
  error: string | null
  onRetry: () => void
  onSelectBus: (result: BusSearchResult) => void
}

export function BusSearchResults({ 
  results, 
  isSearching, 
  error, 
  onRetry, 
  onSelectBus 
}: BusSearchResultsProps) {
  if (isSearching) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-gray-600">Searching for buses...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-800 font-medium">Search Error</span>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Buses Found</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any buses connecting your selected locations.
          </p>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Search Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Found {results.length} Bus{results.length !== 1 ? 'es' : ''}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {results.filter(r => r.connectionType === 'direct').length} Direct
        </Badge>
      </div>

      {results.map((result, index) => (
        <Card key={`${result.route.id}-${index}`} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bus className="h-5 w-5 text-blue-500" />
                {result.route.routeNumber} - {result.route.routeName}
              </CardTitle>
              <Badge 
                variant={result.connectionType === 'direct' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {result.connectionType === 'direct' ? 'Direct' : 'Connecting'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Route Information */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Route className="h-4 w-4" />
              <span>{result.route.from}</span>
              <ArrowRight className="h-3 w-3" />
              <span>{result.route.to}</span>
            </div>

            {/* Bus Stand Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-gray-700">From:</span>
                </div>
                <p className="text-sm text-gray-600 ml-6">
                  {result.fromLocation.name}
                </p>
                <p className="text-xs text-gray-500 ml-6">
                  {result.fromLocation.distance.toFixed(1)} km away
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-gray-700">To:</span>
                </div>
                <p className="text-sm text-gray-600 ml-6">
                  {result.toLocation.name}
                </p>
                <p className="text-xs text-gray-500 ml-6">
                  {result.toLocation.distance.toFixed(1)} km away
                </p>
              </div>
            </div>

            {/* Journey Details */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{result.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">₹{result.estimatedFare}</span>
                </div>
              </div>
              
              <Button 
                onClick={() => onSelectBus(result)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
