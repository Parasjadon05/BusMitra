
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

export interface Route {
  id: string
  name: string
  startPoint: string
  endPoint: string
  distance: number
  estimatedTime: number
  fare?: number
  active: boolean
  createdAt: string
  updatedAt: string
  stops: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    sequence: number
    address?: string
  }>
}

export interface RouteBus {
  id: string
  busNumber: string
  busName?: string
  type?: string
  capacity?: number
  assignedRoute: string
  status?: string
  driverId?: string
}

export interface Driver {
  id: string
  name: string
  phone: string
}

// Mock data for development
const mockRoutes: Route[] = [
  {
    id: 'route_570',
    name: 'Route 570: Koyambedu to Kelambakkam',
    startPoint: 'Koyambedu CMBT',
    endPoint: 'Kelambakkam',
    distance: 25.5,
    estimatedTime: 90,
    fare: 15,
    active: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    stops: [
      { id: 'stop1', name: 'Koyambedu CMBT', latitude: 13.0718, longitude: 80.2124, sequence: 1, address: 'Koyambedu' },
      { id: 'stop2', name: 'Kelambakkam', latitude: 12.8249, longitude: 80.0461, sequence: 2, address: 'Kelambakkam' }
    ]
  }
]

const mockBuses: RouteBus[] = [
  {
    id: 'BUS-001',
    busNumber: 'KA01AB1234',
    busName: 'Route 570 Bus',
    type: 'Regular',
    capacity: 40,
    assignedRoute: 'route_570',
    status: 'active',
    driverId: 'DRV001'
  }
]

const mockDrivers: Driver[] = [
  {
    id: 'DRV001',
    name: 'Rajesh Kumar',
    phone: '+91-9876543210',
    license: 'TEMP-000'
  }
]

export const routeService = {
  /**
   * Fetches all routes from Cloud Firestore
   */
  getAllRoutes: async (): Promise<Route[]> => {
    try {
      console.log('🔍 Fetching routes from Firestore...')
      const routesRef = collection(db, 'routes')
      const snapshot = await getDocs(routesRef)
      
      if (!snapshot.empty) {
        const routes: Route[] = []
        snapshot.forEach((doc) => {
          const routeData = doc.data()
          const route: Route = {
            id: doc.id,
            name: routeData.name || '',
            startPoint: routeData.startPoint || '',
            endPoint: routeData.endPoint || '',
            distance: Number(routeData.distance) || 0,
            estimatedTime: Number(routeData.estimatedTime) || 0,
            fare: routeData.fare ? Number(routeData.fare) : undefined,
            active: routeData.active ?? true,
            createdAt: routeData.createdAt || '',
            updatedAt: routeData.updatedAt || '',
            stops: (routeData.stops || []).map((stop: any, index: number) => ({
              id: stop.id || `stop_${index}`,
              name: stop.name || `Stop ${index + 1}`,
              latitude: Number(stop.latitude) || 0,
              longitude: Number(stop.longitude) || 0,
              sequence: Number(stop.sequence) || index + 1,
              address: stop.name || `Stop ${index + 1}`
            }))
          }
          routes.push(route)
        })
        console.log('✅ Loaded routes from Firestore:', routes.length)
        console.log('📋 Route IDs:', routes.map(r => r.id))
        return routes
      }
      
      console.log('⚠️ No routes found in Firestore, using mock data')
      return mockRoutes
    } catch (error) {
      console.error('Error fetching routes from Firestore:', error)
      return mockRoutes
    }
  },

  /**
   * Fetches buses assigned to a specific route from Cloud Firestore
   */
  getBusesByAssignedRoute: async (routeId: string): Promise<RouteBus[]> => {
    try {
      console.log('🔍 Fetching buses for route:', routeId)
      const busesRef = collection(db, 'buses')
      const q = query(busesRef, where('assignedRoute', '==', routeId))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const buses: RouteBus[] = []
        snapshot.forEach((doc) => {
          const busData = doc.data()
          const bus: RouteBus = {
            id: doc.id,
            busNumber: busData.busNumber || '',
            busName: busData.busName || busData.name || undefined,
            type: busData.type || 'Regular',
            capacity: Number(busData.capacity) || 40,
            assignedRoute: busData.assignedRoute || busData.routeId || '',
            status: busData.status || 'active',
            driverId: busData.driverId || undefined
          }
          buses.push(bus)
        })
        console.log('✅ Found buses for route', routeId, ':', buses.length)
        return buses
      }
      
      console.log('⚠️ No buses found for route', routeId, 'in Firestore, using mock data')
      return mockBuses.filter(bus => bus.assignedRoute === routeId)
    } catch (error) {
      console.error('Error fetching buses from Firestore:', error)
      return mockBuses.filter(bus => bus.assignedRoute === routeId)
    }
  },

  /**
   * Fetches driver details by driver ID from Cloud Firestore
   */
  getDriverById: async (driverId: string): Promise<Driver | undefined> => {
    try {
      const driverRef = collection(db, 'drivers')
      const q = query(driverRef, where('__name__', '==', driverId))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const driverData = doc.data()
        return {
          id: driverId,
          name: driverData.name || '',
          phone: driverData.phone || ''
        }
      }
      
      // Fallback to mock data if driver not found
      return mockDrivers.find(d => d.id === driverId)
    } catch (error) {
      console.error('Error fetching driver from Firestore:', error)
      // Fallback to mock data on error
      return mockDrivers.find(d => d.id === driverId)
    }
  }
}

// Export missing interfaces
export interface Bus {
  id: string
  number: string
  type: string
  capacity: number
  busNumber?: string
  busName?: string
  status?: string
  assignedRoute?: string
  driverId?: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  license: string
}

export interface RouteDetails {
  id: string
  name: string
  stops: RouteStop[]
}

export interface RouteStop {
  id: string
  name: string
  latitude: number
  longitude: number
}
