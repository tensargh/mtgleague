'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Navigation, ExternalLink, Search, Store } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Store {
  id: string
  name: string
  address: string
  logo_url?: string
  latitude?: number
  longitude?: number
  created_at: string
}

interface StoreWithDistance extends Store {
  distance: number
}

export default function StoreFinderPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<StoreWithDistance[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if ((window as any).google && (window as any).google.maps) {
        initializeMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  // Load stores
  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      const { data: storesData, error } = await supabase
        .from('stores')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading stores:', error)
        return
      }

      setStores(storesData || [])
      setFilteredStores((storesData || []).map(store => ({ ...store, distance: 0 })))
      // Only add markers, do not fit to them
      addMarkersToMap(storesData || [], false)
    } catch (error) {
      console.error('Error loading stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || !(window as any).google) return;

    // UK bounding box
    // @ts-ignore
    const ukBounds = new (window as any).google.maps.LatLngBounds(
      { lat: 49.864, lng: -8.649 }, // Southwest
      { lat: 60.860, lng: 1.768 }   // Northeast
    );

    const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
      // Center and zoom are required, but will be overridden by fitBounds
      center: { lat: 54.0, lng: -2.0 },
      zoom: 6,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstance.fitBounds(ukBounds);
    setMap(mapInstance);
  };

  const addMarkersToMap = (storesToShow: Store[], fitToMarkers = false) => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];

    storesToShow.forEach(store => {
      if (store.latitude && store.longitude) {
        // @ts-ignore
        const marker = new (window as any).google.maps.Marker({
          position: { lat: store.latitude, lng: store.longitude },
          map: map,
          title: store.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#2563eb"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(24, 24),
            anchor: new (window as any).google.maps.Point(12, 24)
          }
        });

        marker.addListener('click', () => {
          setSelectedStore(store);
          showStoreInfoWindow(marker, store);
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);

    if (fitToMarkers && newMarkers.length > 0) {
      // @ts-ignore
      const bounds = new (window as any).google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()!));
      map.fitBounds(bounds);
    }
  };

  const showStoreInfoWindow = (marker: google.maps.Marker, store: Store) => {
    const infoWindow = new (window as any).google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${store.name}</h3>
          <p style="margin: 0 0 8px 0; font-size: 14px;">${store.address}</p>
          <button onclick="window.open('/store/${store.id}', '_blank')" style="background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            View Store
          </button>
        </div>
      `
    })

    infoWindow.open(map, marker)
  }

  const searchByLocation = async () => {
    if (!searchQuery.trim()) return

    try {
      const geocoder = new (window as any).google.maps.Geocoder()
      
      geocoder.geocode({ address: searchQuery }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location
          setUserLocation({ lat: location.lat(), lng: location.lng() })

          // Calculate distances and find nearest stores
          const storesWithDistance = stores
            .filter(store => store.latitude && store.longitude)
            .map(store => ({
              ...store,
              distance: calculateDistance(
                location.lat(),
                location.lng(),
                store.latitude!,
                store.longitude!
              )
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5)

          setFilteredStores(storesWithDistance)
          addMarkersToMap(storesWithDistance, true) // fit to markers when searching

          // Center map on search location
          if (map) {
            map.setCenter(location)
            map.setZoom(10)
          }
        }
      })
    } catch (error) {
      console.error('Error searching location:', error)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const resetMap = () => {
    setSearchQuery('')
    setUserLocation(null)
    setFilteredStores(stores.map(store => ({ ...store, distance: 0 })))
    addMarkersToMap(stores, false)
    if (map) {
      // UK bounding box
      // @ts-ignore
      const ukBounds = new (window as any).google.maps.LatLngBounds(
        { lat: 49.864, lng: -8.649 },
        { lat: 60.860, lng: 1.768 }
      );
      map.fitBounds(ukBounds);
    }
  }

  const handleStoreSelect = (store: Store) => {
    router.push(`/store/${store.id}`)
  }

  // Update markers when filtered stores change
  useEffect(() => {
    if (map && filteredStores.length > 0) {
      addMarkersToMap(filteredStores)
    }
  }, [filteredStores, map])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading stores...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Store Finder</span>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Box */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span>Find Stores Near You</span>
                </CardTitle>
                <CardDescription>
                  Enter your postcode or city to find the nearest stores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter postcode or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchByLocation()}
                  />
                  <Button onClick={searchByLocation}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={resetMap} className="w-full">
                  Show All Stores
                </Button>
              </CardContent>
            </Card>

            {/* Nearest Stores */}
            {userLocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Navigation className="h-5 w-5 text-blue-600" />
                    <span>Nearest Stores</span>
                  </CardTitle>
                  <CardDescription>
                    Stores within {Math.max(...filteredStores.map(s => s.distance)).toFixed(1)}km
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredStores.map((store) => (
                    <div
                      key={store.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => handleStoreSelect(store)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                          {store.logo_url ? (
                            <img 
                              src={store.logo_url} 
                              alt={`${store.name} logo`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Store className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {store.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {store.address}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {store.distance.toFixed(1)}km away
                            </Badge>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Store Count */}
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredStores.length} of {stores.length} stores shown
                </p>
                {userLocation && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Showing stores near your search location
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Store Locations</CardTitle>
                <CardDescription>
                  Click on a pin to see store details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef} 
                  className="w-full h-96 rounded-lg border"
                  style={{ minHeight: '400px' }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 