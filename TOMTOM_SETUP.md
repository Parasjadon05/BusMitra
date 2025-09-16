# OpenStreetMap Integration Setup

This guide explains the OpenStreetMap integration for the BusMitraUser app to show nearest bus stands with distance and interactive maps.

## Prerequisites

**None!** OpenStreetMap is completely free and doesn't require any API keys or registration.

## Setup Steps

### 1. No Setup Required!

OpenStreetMap integration works out of the box with no configuration needed. The app uses:
- **Free OSM tiles**: No API key required
- **Reliable service**: OpenStreetMap is a stable, community-driven project
- **No rate limits**: No usage restrictions for basic tile access

### 2. Features Included

The OpenStreetMap integration includes:

- **Real-time Location**: Get user's current location using browser geolocation
- **Interactive Map**: MapLibre GL map with OpenStreetMap tiles
- **Bus Stand Search**: Find real nearby bus stops, terminals, and stations from OpenStreetMap data
- **Distance Calculation**: Calculate walking distance and time
- **Interactive Markers**: Click on bus stands for more information
- **Directions**: Get directions to selected bus stands
- **Free & Reliable**: No API keys, no rate limits, no setup required

### 4. Components Created

- **MapService**: Core service for location and search functionality
- **useMap Hook**: React hook for map state management
- **MapComponent**: Interactive map component with markers
- **NearbyBusStands**: List component showing nearby bus stands

### 5. Usage

The integration is automatically active in the Bus Discovery page. Users can:

1. Allow location access when prompted
2. View their location on the interactive map
3. See nearby bus stands with distances (real data with API key, demo data without)
4. Click on bus stands for more information
5. Get directions to selected bus stands

**Real Data**: The app uses OpenStreetMap's Overpass API to find actual bus stops, terminals, and stations around your location. If real data is not available in your area, it falls back to location-aware sample data for demonstration purposes.

### 6. API Limits

TomTom's free tier includes:
- 2,500 requests per day
- 1,000 map loads per day
- 1,000 geocoding requests per day

### 7. Troubleshooting

**Location not working:**
- Ensure HTTPS is enabled (required for geolocation)
- Check browser permissions for location access
- Verify the API key is correctly set

**Map not loading:**
- Check your TomTom API key
- Verify internet connection
- Check browser console for errors

**No bus stands found:**
- Try refreshing the location
- Check if you're in an area with public transport
- Verify the search radius (currently set to 5km)

### 8. Customization

You can customize the integration by modifying:

- **Search radius**: Change `searchRadius` in `tomtom.config.ts`
- **Map style**: Modify `mapStyle` in `tomtom.config.ts`
- **Default location**: Update `defaultCenter` in `tomtom.config.ts`
- **Search queries**: Modify search terms in `mapService.ts`

## Support

For issues with TomTom integration:
1. Check the [TomTom Developer Documentation](https://developer.tomtom.com/maps-sdk-web)
2. Verify your API key and usage limits
3. Check browser console for error messages
