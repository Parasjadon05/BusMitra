
interface RouteTrackerProps {
  stops: Array<{ id: string; name: string; time: string; status: 'completed' | 'current' | 'upcoming' }>
  currentStop: string
  nextStop: string
  estimatedArrival: string
}

export default function RouteTracker({ stops, currentStop, nextStop, estimatedArrival }: RouteTrackerProps) {
  return (
    <div className="p-4">
      {stops.map(stop => (
        <div key={stop.id} className={`flex items-center gap-2 mb-2 ${stop.status === 'current' ? 'font-bold' : ''}`}>
          <div className={`w-4 h-4 rounded-full ${stop.status === 'completed' ? 'bg-green-500' : stop.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <span>{stop.name} ({stop.time})</span>
          {stop.name === currentStop && <span className="text-blue-600">Current</span>}
          {stop.name === nextStop && <span className="text-orange-600">Next</span>}
        </div>
      ))}
      <p className="mt-2 text-sm">Estimated Arrival: {estimatedArrival}</p>
    </div>
  )
}
