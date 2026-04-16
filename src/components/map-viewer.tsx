'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Map as MapIcon,
  Satellite,
  Mountain,
  Layers,
  MapPin,
  Pencil,
  Square,
  Circle,
  Trash2,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Locate,
  Ruler,
  Search,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface MapViewerProps {
  className?: string
}

// Map tile providers
const TILE_PROVIDERS = [
  {
    id: 'google-satellite',
    name: 'Satellite',
    icon: Satellite,
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
  },
  {
    id: 'google-hybrid',
    name: 'Hybride',
    icon: Layers,
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
  },
  {
    id: 'google-terrain',
    name: 'Terrain',
    icon: Mountain,
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
  },
  {
    id: 'google-streets',
    name: 'Plan',
    icon: MapIcon,
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
  },
]

// Côte d'Ivoire cities
const CITIES = [
  { name: 'Abidjan', lat: 5.3599, lng: -4.0083 },
  { name: 'Yamoussoukro', lat: 6.8276, lng: -5.2893 },
  { name: 'Bouaké', lat: 7.6892, lng: -5.0309 },
  { name: 'San-Pédro', lat: 4.7453, lng: -6.6389 },
  { name: 'Korhogo', lat: 9.4581, lng: -5.6294 },
]

export function MapViewerComponent({ className = '' }: MapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null)
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeLayer, setActiveLayer] = useState('google-satellite')
  const [drawingMode, setDrawingMode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [measurements, setMeasurements] = useState<Array<{ type: string; value: string }>>([])
  const [coords, setCoords] = useState({ lat: 5.36, lng: -4.01 })
  const [zoom, setZoom] = useState(12)

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLeaflet = async () => {
      // Load CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      // Load JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      
      await new Promise((resolve) => {
        script.onload = resolve
        document.head.appendChild(script)
      })

      setIsLoaded(true)
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current) return

    const L = (window as any).L
    if (!L) return

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: [5.3599, -4.0083],
      zoom: 12,
      zoomControl: false,
    })

    // Add tile layer
    const tileLayer = L.tileLayer(TILE_PROVIDERS[0].url, {
      attribution: TILE_PROVIDERS[0].attribution,
      maxZoom: 20,
    })
    tileLayer.addTo(map)
    tileLayerRef.current = tileLayer

    // Add feature group for drawings
    const drawnItems = L.featureGroup()
    drawnItems.addTo(map)
    drawnItemsRef.current = drawnItems

    // Track coordinates
    map.on('move', () => {
      const center = map.getCenter()
      setCoords({ lat: center.lat, lng: center.lng })
    })
    map.on('zoomend', () => {
      setZoom(map.getZoom())
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [isLoaded])

  // Change tile layer
  const changeTileLayer = useCallback((layerId: string) => {
    const L = (window as any).L
    if (!L || !mapRef.current || !tileLayerRef.current) return

    const provider = TILE_PROVIDERS.find(p => p.id === layerId)
    if (!provider) return

    tileLayerRef.current.remove()
    tileLayerRef.current = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: 20,
    })
    tileLayerRef.current.addTo(mapRef.current)
    setActiveLayer(layerId)
  }, [])

  // Zoom controls
  const zoomIn = useCallback(() => {
    mapRef.current?.zoomIn()
  }, [])

  const zoomOut = useCallback(() => {
    mapRef.current?.zoomOut()
  }, [])

  const goToLocation = useCallback((lat: number, lng: number, z: number = 14) => {
    mapRef.current?.setView([lat, lng], z)
  }, [])

  // Search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const city = CITIES.find(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    if (city) {
      goToLocation(city.lat, city.lng, 12)
      toast.success(`${city.name} trouvé`)
      return
    }

    const parts = searchQuery.split(',').map(s => parseFloat(s.trim()))
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      goToLocation(parts[0], parts[1], 14)
      toast.success('Position trouvée')
    } else {
      toast.error('Lieu non trouvé')
    }
  }, [searchQuery, goToLocation])

  // Drawing handlers
  const startDrawing = useCallback((mode: string) => {
    const L = (window as any).L
    if (!L || !mapRef.current || !drawnItemsRef.current) return

    setDrawingMode(mode)
    mapRef.current.getContainer().style.cursor = 'crosshair'

    let points: [number, number][] = []
    let tempLine: L.Polyline | null = null

    const onClick = (e: L.LeafletMouseEvent) => {
      points.push([e.latlng.lat, e.latlng.lng])

      if (mode === 'marker') {
        L.marker(e.latlng).addTo(drawnItemsRef.current!)
        setMeasurements(prev => [...prev, { type: 'Point', value: `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}` }])
        finishDrawing()
      } else if (mode === 'polyline') {
        if (tempLine) tempLine.remove()
        tempLine = L.polyline(points, { color: '#14b8a6', weight: 3 }).addTo(mapRef.current!)
      } else if (mode === 'polygon') {
        if (tempLine) tempLine.remove()
        tempLine = L.polyline(points, { color: '#14b8a6', weight: 3 }).addTo(mapRef.current!)
      }
    }

    const onDblClick = (e: L.LeafletMouseEvent) => {
      if (mode === 'polyline' && points.length >= 2) {
        if (tempLine) tempLine.remove()
        L.polyline(points, { color: '#14b8a6', weight: 3 }).addTo(drawnItemsRef.current!)
        
        // Calculate distance
        let distance = 0
        for (let i = 0; i < points.length - 1; i++) {
          distance += mapRef.current!.distance(points[i], points[i + 1])
        }
        setMeasurements(prev => [...prev, { type: 'Distance', value: `${(distance / 1000).toFixed(2)} km` }])
      } else if (mode === 'polygon' && points.length >= 3) {
        if (tempLine) tempLine.remove()
        L.polygon(points, { color: '#14b8a6', weight: 3, fillOpacity: 0.3 }).addTo(drawnItemsRef.current!)
        setMeasurements(prev => [...prev, { type: 'Polygone', value: `${points.length} points` }])
      }
      finishDrawing()
    }

    const finishDrawing = () => {
      mapRef.current!.off('click', onClick)
      mapRef.current!.off('dblclick', onDblClick)
      if (tempLine) tempLine.remove()
      mapRef.current!.getContainer().style.cursor = ''
      setDrawingMode(null)
    }

    mapRef.current.on('click', onClick)
    mapRef.current.on('dblclick', onDblClick)
    
    toast.info(`Cliquez pour ajouter des points. Double-clic pour terminer.`)
  }, [])

  // Clear drawings
  const clearDrawings = useCallback(() => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers()
      setMeasurements([])
      toast.success('Dessins effacés')
    }
  }, [])

  // Export GeoJSON
  const exportGeoJSON = useCallback(() => {
    if (!drawnItemsRef.current) return
    
    const L = (window as any).L
    const geojson = drawnItemsRef.current.toGeoJSON()
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'geo_e_export.geojson'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('GeoJSON exporté')
  }, [])

  // Import GeoJSON
  const importGeoJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !drawnItemsRef.current || !mapRef.current) return

    const L = (window as any).L
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const geojson = JSON.parse(event.target?.result as string)
        const layer = L.geoJSON(geojson, {
          style: { color: '#14b8a6', weight: 3, fillOpacity: 0.3 },
        })
        layer.addTo(drawnItemsRef.current)
        mapRef.current.fitBounds(layer.getBounds())
        toast.success('GeoJSON importé')
      } catch {
        toast.error('Erreur lors de l\'import')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  return (
    <div className={`relative h-full ${className}`}>
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center rounded-lg">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-[1000]">
        {/* Search */}
        <Card className="p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur pointer-events-auto">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Rechercher un lieu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 h-8"
            />
            <Button type="submit" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        {/* Zoom controls */}
        <Card className="p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur pointer-events-auto">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Layer switcher */}
      <div className="absolute top-20 left-4 z-[1000]">
        <Card className="p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="flex flex-col gap-1">
            {TILE_PROVIDERS.map((provider) => (
              <Button
                key={provider.id}
                variant={activeLayer === provider.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeTileLayer(provider.id)}
                className="justify-start gap-2"
              >
                <provider.icon className="h-4 w-4" />
                {provider.name}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Drawing tools */}
      <div className="absolute top-20 right-4 z-[1000]">
        <Card className="p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="flex flex-col gap-1">
            <Button
              variant={drawingMode === 'marker' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => startDrawing('marker')}
              title="Point"
            >
              <MapPin className="h-4 w-4" />
            </Button>
            <Button
              variant={drawingMode === 'polyline' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => startDrawing('polyline')}
              title="Ligne"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={drawingMode === 'polygon' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => startDrawing('polygon')}
              title="Polygone"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearDrawings}
              title="Effacer"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Import/Export */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Card className="p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-1" />
                Import
                <input type="file" accept=".geojson,.json" className="hidden" onChange={importGeoJSON} />
              </label>
            </Button>
            <Button variant="outline" size="sm" onClick={exportGeoJSON}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </Card>
      </div>

      {/* Coordinates display */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Card className="p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">Lat: </span>
              <span className="font-mono">{coords.lat.toFixed(5)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Lng: </span>
              <span className="font-mono">{coords.lng.toFixed(5)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Zoom: </span>
              <span className="font-mono">{zoom}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick cities */}
      <div className="absolute bottom-16 left-4 z-[1000]">
        <Card className="p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="flex gap-1">
            {CITIES.slice(0, 3).map((city) => (
              <Button
                key={city.name}
                variant="ghost"
                size="sm"
                onClick={() => goToLocation(city.lat, city.lng, 12)}
              >
                {city.name}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Measurements */}
      {measurements.length > 0 && (
        <div className="absolute top-36 left-4 z-[1000]">
          <Card className="p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
            <div className="flex items-center gap-2 text-sm">
              <Ruler className="h-4 w-4" />
              <div className="flex flex-wrap gap-2">
                {measurements.map((m, i) => (
                  <Badge key={i} variant="secondary">
                    {m.type}: {m.value}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function MapViewer(props: MapViewerProps) {
  return <MapViewerComponent {...props} />
}
