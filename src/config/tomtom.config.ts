// OpenStreetMap Configuration
export const mapConfig = {
  // TomTom API key for search functionality
  apiKey: import.meta.env.VITE_TOMTOM_API_KEY,
  baseUrl: 'https://api.tomtom.com', // Keep for search functionality
  // Use OpenStreetMap tiles (free and reliable)
  mapStyle: {
    version: 8 as const,
    sources: {
      'osm': {
        type: 'raster' as const,
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster' as const,
        source: 'osm'
      }
    ]
  },
  defaultCenter: [77.2090, 28.6139] as [number, number], // Delhi, India coordinates
  defaultZoom: 12,
  searchRadius: 10000, // 10km radius for bus stand search
  maxResults: 10
}

// Map styles - using free alternatives
export const mapStyles = {
  main: 'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
  satellite: 'https://api.maptiler.com/maps/satellite/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
  night: 'https://api.maptiler.com/maps/dark/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
}
