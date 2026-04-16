'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ZoomIn,
  ZoomOut,
  Locate,
  Layers,
  Ruler,
  Download,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

// Dynamic import for Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null
let GeoRasterLayer: any = null

if (typeof window !== 'undefined') {
  import('leaflet').then((leaflet) => {
    L = leaflet.default
  })
  import('georaster-layer-for-leaflet').then((module) => {
    GeoRasterLayer = module.default || module
  })
}

export interface MapPoint {
  lat: number
  lng: number
  id?: string
  label?: string
}

export interface MapFeature {
  id: string
  type: 'point' | 'line' | 'polygon' | 'circle' | 'rectangle'
  coordinates: MapPoint[]
  properties?: Record<string, unknown>
  layer?: L.Layer
}

export interface MapLayer {
  id: string
  name: string
  type: 'tile' | 'geojson' | 'wms' | 'geotiff'
  url?: string
  visible: boolean
  opacity: number
  layer?: L.Layer
}

interface MapViewerProps {
  center?: [number, number]
  zoom?: number
  onMapClick?: (latlng: { lat: number; lng: number }) => void
  onDraw?: (feature: MapFeature) => void
  onFeatureSelect?: (feature: MapFeature | null) => void
  className?: string
  height?: string
  drawingMode?: 'point' | 'line' | 'polygon' | 'rectangle' | 'circle' | null
  features?: MapFeature[]
  layers?: MapLayer[]
}

// Base tile layers
const baseLayers: Record<string, { url: string; attribution: string; name: string }> = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
  terrain: {
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com/">CARTO</a>',
  },
}

export function MapViewer({
  center = [5.3599, -4.0083], // Abidjan coordinates
  zoom = 12,
  onMapClick,
  onDraw,
  onFeatureSelect,
  className = '',
  height = '100%',
  drawingMode = null,
  features = [],
  layers = [],
}: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null)
  const baseLayersRef = useRef<Map<string, L.TileLayer>>(new Map())
  const currentBaseLayerRef = useRef<string>('osm')
  const [isMapReady, setIsMapReady] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [currentCenter, setCurrentCenter] = useState(center)
  const [activeBaseLayer, setActiveBaseLayer] = useState('osm')
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const drawingPointsRef = useRef<MapPoint[]>([])
  const tempLayerRef = useRef<L.Layer | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !L) return

    // Import Leaflet CSS
    import('leaflet/dist/leaflet.css')

    // Fix default marker icon
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })

    // Create map
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
    })

    // Create feature group for drawn items
    const drawnItems = L.featureGroup()
    drawnItems.addTo(map)
    drawnItemsRef.current = drawnItems

    // Add base layers
    Object.entries(baseLayers).forEach(([key, layer]) => {
      const tileLayer = L.tileLayer(layer.url, {
        attribution: layer.attribution,
      })
      baseLayersRef.current.set(key, tileLayer)
      if (key === 'osm') {
        tileLayer.addTo(map)
      }
    })

    // Event handlers
    map.on('zoomend', () => {
      const center = map.getCenter()
      setCurrentZoom(map.getZoom())
      setCurrentCenter([center.lat, center.lng])
    })

    map.on('moveend', () => {
      const center = map.getCenter()
      setCurrentCenter([center.lat, center.lng])
    })

    map.on('click', (e: L.LeafletMouseEvent) => {
      const latlng = { lat: e.latlng.lat, lng: e.latlng.lng }
      onMapClick?.(latlng)

      // Handle drawing
      if (drawingMode) {
        handleDrawingClick(latlng)
      }
    })

    mapInstanceRef.current = map
    setIsMapReady(true)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle drawing click
  const handleDrawingClick = useCallback((latlng: { lat: number; lng: number }) => {
    const map = mapInstanceRef.current
    if (!map || !L || !drawingMode) return

    drawingPointsRef.current.push(latlng)

    // Remove temp layer
    if (tempLayerRef.current) {
      map.removeLayer(tempLayerRef.current)
    }

    // Draw temporary shape
    const points = drawingPointsRef.current
    let tempLayer: L.Layer | null = null

    switch (drawingMode) {
      case 'point':
        tempLayer = L.marker([latlng.lat, latlng.lng])
        break
      case 'line':
        if (points.length >= 2) {
          tempLayer = L.polyline(points.map(p => [p.lat, p.lng]), {
            color: '#10b981',
            weight: 3,
          })
        }
        break
      case 'polygon':
        if (points.length >= 2) {
          tempLayer = L.polyline(points.map(p => [p.lat, p.lng]), {
            color: '#10b981',
            weight: 3,
            dashArray: '5, 5',
          })
        }
        if (points.length >= 3) {
          tempLayer = L.polygon(points.map(p => [p.lat, p.lng]), {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 3,
          })
        }
        break
      case 'rectangle':
        if (points.length === 1) {
          tempLayer = L.marker([latlng.lat, latlng.lng])
        } else if (points.length === 2) {
          const bounds = L.latLngBounds([
            [points[0].lat, points[0].lng],
            [points[1].lat, points[1].lng],
          ])
          tempLayer = L.rectangle(bounds, {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 3,
          })
        }
        break
      case 'circle':
        if (points.length === 1) {
          tempLayer = L.marker([latlng.lat, latlng.lng])
        } else if (points.length >= 2) {
          const radius = map.distance(
            [points[0].lat, points[0].lng],
            [points[1].lat, points[1].lng]
          )
          tempLayer = L.circle([points[0].lat, points[0].lng], {
            radius,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 3,
          })
        }
        break
    }

    if (tempLayer) {
      tempLayer.addTo(map)
      tempLayerRef.current = tempLayer
    }

    // Finalize drawing on double-click or specific conditions
    if (drawingMode === 'point') {
      finalizeDrawing()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingMode])

  // Finalize drawing
  const finalizeDrawing = useCallback(() => {
    const map = mapInstanceRef.current
    const drawnItems = drawnItemsRef.current
    if (!map || !L || !drawnItems || !drawingMode) return

    const points = drawingPointsRef.current
    if (points.length === 0) return

    // Remove temp layer
    if (tempLayerRef.current) {
      map.removeLayer(tempLayerRef.current)
      tempLayerRef.current = null
    }

    // Create final layer
    let finalLayer: L.Layer | null = null
    let featureType: MapFeature['type'] = drawingMode

    switch (drawingMode) {
      case 'point':
        finalLayer = L.marker([points[0].lat, points[0].lng])
        break
      case 'line':
        if (points.length >= 2) {
          finalLayer = L.polyline(points.map(p => [p.lat, p.lng]), {
            color: '#10b981',
            weight: 3,
          })
        }
        break
      case 'polygon':
        if (points.length >= 3) {
          finalLayer = L.polygon(points.map(p => [p.lat, p.lng]), {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 3,
          })
        }
        break
      case 'rectangle':
        if (points.length >= 2) {
          const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
          finalLayer = L.rectangle(bounds, {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 3,
          })
        }
        break
      case 'circle':
        if (points.length >= 2) {
          const radius = map.distance(
            [points[0].lat, points[0].lng],
            [points[1].lat, points[1].lng]
          )
          finalLayer = L.circle([points[0].lat, points[0].lng], {
            radius,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 3,
          })
        }
        break
    }

    if (finalLayer) {
      const featureId = `feature-${Date.now()}`
      finalLayer.addTo(drawnItems)

      const feature: MapFeature = {
        id: featureId,
        type: featureType,
        coordinates: points,
        layer: finalLayer,
      }

      onDraw?.(feature)

      // Add click handler to select feature
      finalLayer.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e)
        onFeatureSelect?.(feature)
      })
    }

    // Reset drawing state
    drawingPointsRef.current = []
    toast.success('Forme ajoutée')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingMode])

  // Cancel drawing
  const cancelDrawing = useCallback(() => {
    const map = mapInstanceRef.current
    if (map && tempLayerRef.current) {
      map.removeLayer(tempLayerRef.current)
      tempLayerRef.current = null
    }
    drawingPointsRef.current = []
  }, [])

  // Change base layer
  const changeBaseLayer = useCallback((layerId: string) => {
    const map = mapInstanceRef.current
    if (!map) return

    const currentLayer = baseLayersRef.current.get(currentBaseLayerRef.current)
    const newLayer = baseLayersRef.current.get(layerId)

    if (currentLayer && newLayer) {
      map.removeLayer(currentLayer)
      newLayer.addTo(map)
      currentBaseLayerRef.current = layerId
      setActiveBaseLayer(layerId)
    }
  }, [])

  // Zoom controls
  const zoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn()
  }, [])

  const zoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut()
  }, [])

  const locateUser = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return

    map.locate({ setView: true, maxZoom: 16 })
    map.on('locationfound', (e) => {
      L?.marker(e.latlng)
        .addTo(map)
        .bindPopup('Vous êtes ici')
        .openPopup()
    })
    map.on('locationerror', () => {
      toast.error('Impossible de déterminer votre position')
    })
  }, [])

  // Clear all drawings
  const clearDrawings = useCallback(() => {
    const drawnItems = drawnItemsRef.current
    if (drawnItems) {
      drawnItems.clearLayers()
      toast.success('Dessins effacés')
    }
  }, [])

  // Export as GeoJSON
  const exportGeoJSON = useCallback(() => {
    const drawnItems = drawnItemsRef.current
    if (!drawnItems || !L) return

    const geojson = drawnItems.toGeoJSON()
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'features.geojson'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('GeoJSON exporté')
  }, [])

  // Add GeoJSON layer
  const addGeoJSON = useCallback((geojson: GeoJSON.GeoJSON) => {
    const map = mapInstanceRef.current
    const drawnItems = drawnItemsRef.current
    if (!map || !L || !drawnItems) return

    L.geoJSON(geojson, {
      style: {
        color: '#10b981',
        weight: 3,
        fillColor: '#10b981',
        fillOpacity: 0.2,
      },
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng)
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          layer.bindPopup(
            Object.entries(feature.properties)
              .map(([k, v]) => `<b>${k}:</b> ${v}`)
              .join('<br/>')
          )
        }
      },
    }).addTo(drawnItems)

    // Fit bounds
    const bounds = drawnItems.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    toast.success('GeoJSON ajouté')
  }, [])

  // Expose methods
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { mapViewerRef: { current: {
        addGeoJSON: typeof addGeoJSON
        clearDrawings: typeof clearDrawings
        exportGeoJSON: typeof exportGeoJSON
        changeBaseLayer: typeof changeBaseLayer
        zoomIn: typeof zoomIn
        zoomOut: typeof zoomOut
        cancelDrawing: typeof cancelDrawing
        finalizeDrawing: typeof finalizeDrawing
      } } }).mapViewerRef = {
        current: {
          addGeoJSON,
          clearDrawings,
          exportGeoJSON,
          changeBaseLayer,
          zoomIn,
          zoomOut,
          cancelDrawing,
          finalizeDrawing,
        },
      }
    }
  }, [addGeoJSON, clearDrawings, exportGeoJSON, changeBaseLayer, zoomIn, zoomOut, cancelDrawing, finalizeDrawing])

  // Update features
  useEffect(() => {
    const drawnItems = drawnItemsRef.current
    if (!drawnItems || !L) return

    // Clear existing layers
    drawnItems.clearLayers()

    // Add features
    features.forEach((feature) => {
      let layer: L.Layer | null = null

      switch (feature.type) {
        case 'point':
          layer = L.marker([feature.coordinates[0].lat, feature.coordinates[0].lng])
          break
        case 'line':
          layer = L.polyline(feature.coordinates.map(c => [c.lat, c.lng]), {
            color: '#10b981',
            weight: 3,
          })
          break
        case 'polygon':
          layer = L.polygon(feature.coordinates.map(c => [c.lat, c.lng]), {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 3,
          })
          break
      }

      if (layer) {
        layer.addTo(drawnItems)
      }
    })
  }, [features])

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-background/95 backdrop-blur rounded-lg shadow-lg p-1 flex flex-col gap-1">
          <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom avant">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom arrière">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={locateUser} title="Ma position">
            <Locate className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Layer selector */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="bg-background/95 backdrop-blur rounded-lg shadow-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowLayerPanel(!showLayerPanel)}
          >
            <Layers className="h-4 w-4" />
            Couches
          </Button>
        </div>

        {showLayerPanel && (
          <Card className="w-48">
            <CardContent className="p-2">
              <div className="space-y-1">
                {Object.entries(baseLayers).map(([key, layer]) => (
                  <Button
                    key={key}
                    variant={activeBaseLayer === key ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => changeBaseLayer(key)}
                  >
                    {layer.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Drawing info */}
      {drawingMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Card>
            <CardContent className="p-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Mode dessin: <Badge>{drawingMode}</Badge>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={finalizeDrawing}
                >
                  Terminer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelDrawing}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions bar */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={exportGeoJSON}
        >
          <Download className="h-4 w-4" />
          Exporter
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={clearDrawings}
        >
          <Trash2 className="h-4 w-4" />
          Effacer
        </Button>
      </div>

      {/* Coordinates display */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-lg p-2 text-xs">
        <div className="text-muted-foreground">
          Lat: {currentCenter[0].toFixed(6)} | Lng: {currentCenter[1].toFixed(6)} | Zoom: {currentZoom}
        </div>
      </div>
    </div>
  )
}

// Export helper function to load GeoJSON into map
export function loadGeoJSONToMap(geojson: GeoJSON.GeoJSON) {
  const mapViewer = (window as unknown as { mapViewerRef?: { current: { addGeoJSON: (g: GeoJSON.GeoJSON) => void } } }).mapViewerRef
  mapViewer?.current?.addGeoJSON(geojson)
}

export function finalizeMapDrawing() {
  const mapViewer = (window as unknown as { mapViewerRef?: { current: { finalizeDrawing: () => void } } }).mapViewerRef
  mapViewer?.current?.finalizeDrawing()
}

export function cancelMapDrawing() {
  const mapViewer = (window as unknown as { mapViewerRef?: { current: { cancelDrawing: () => void } } }).mapViewerRef
  mapViewer?.current?.cancelDrawing()
}
