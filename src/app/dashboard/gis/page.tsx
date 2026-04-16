'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Map, 
  Upload, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Locate, 
  Pencil,
  Square,
  Circle,
  Hexagon,
  Trash2,
  MousePointer,
  Hand,
  Search,
  MapPin,
  FileJson,
  FolderOpen,
  Eye,
  EyeOff,
  ChevronRight,
  Layers,
  Check,
} from 'lucide-react'
import { useFileStore, type GeoFile } from '@/lib/file-store'
import { FileUpload } from '@/components/file-upload'
import { toast } from 'sonner'

// Dynamic import for MapViewer to avoid SSR issues
const MapViewer = dynamic(
  () => import('@/components/map-viewer').then(mod => mod.MapViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
)

// Parse KML to GeoJSON
async function parseKML(file: File): Promise<GeoJSON.GeoJSON> {
  const { kml } = await import('@tmcw/togeojson')
  const text = await file.text()
  const parser = new DOMParser()
  const kmlDoc = parser.parseFromString(text, 'text/xml')
  return kml(kmlDoc)
}

// Parse GPX to GeoJSON
async function parseGPX(file: File): Promise<GeoJSON.GeoJSON> {
  const { gpx } = await import('@tmcw/togeojson')
  const text = await file.text()
  const parser = new DOMParser()
  const gpxDoc = parser.parseFromString(text, 'text/xml')
  return gpx(gpxDoc)
}

// Parse Shapefile to GeoJSON
async function parseShapefile(file: File): Promise<GeoJSON.GeoJSON> {
  const shp = (await import('shpjs')).default
  const arrayBuffer = await file.arrayBuffer()
  return shp(arrayBuffer)
}

interface MapFeature {
  id: string
  type: 'point' | 'line' | 'polygon' | 'circle' | 'rectangle'
  coordinates: Array<{ lat: number; lng: number }>
  properties?: Record<string, unknown>
}

interface MapLayer {
  id: string
  name: string
  type: 'geojson' | 'kml' | 'shp' | 'gpx'
  visible: boolean
  color: string
  features: number
}

const drawingTools = [
  { id: 'select', name: 'Sélectionner', icon: MousePointer },
  { id: 'pan', name: 'Déplacer', icon: Hand },
  { id: 'point', name: 'Point', icon: MapPin },
  { id: 'line', name: 'Ligne', icon: Pencil },
  { id: 'polygon', name: 'Polygone', icon: Hexagon },
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Cercle', icon: Circle },
  { id: 'delete', name: 'Supprimer', icon: Trash2 },
]

const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444']

export default function GISPage() {
  const [activeTool, setActiveTool] = useState('pan')
  const [drawingMode, setDrawingMode] = useState<'point' | 'line' | 'polygon' | 'rectangle' | 'circle' | null>(null)
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([])
  const [features, setFeatures] = useState<MapFeature[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null)
  
  const { files, addFile, removeFile } = useFileStore()

  // Handle tool selection
  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId)
    
    if (['point', 'line', 'polygon', 'rectangle', 'circle'].includes(toolId)) {
      setDrawingMode(toolId as typeof drawingMode)
    } else {
      setDrawingMode(null)
    }
    
    if (toolId === 'delete') {
      // Clear selected feature
      if (selectedFeature) {
        setFeatures(prev => prev.filter(f => f.id !== selectedFeature.id))
        setSelectedFeature(null)
        toast.success('Élément supprimé')
      }
    }
  }

  // Handle file import
  const handleFileImport = useCallback(async (geoFile: GeoFile) => {
    try {
      let geojson: GeoJSON.GeoJSON | null = null
      let layerType: MapLayer['type'] = 'geojson'

      if (geoFile.type === 'geojson' && geoFile.data) {
        geojson = geoFile.data as GeoJSON.GeoJSON
        layerType = 'geojson'
      } else if (geoFile.type === 'kml') {
        // Parse KML
        if (typeof geoFile.data === 'string') {
          const { kml } = await import('@tmcw/togeojson')
          const parser = new DOMParser()
          const kmlDoc = parser.parseFromString(geoFile.data, 'text/xml')
          geojson = kml(kmlDoc)
        }
        layerType = 'kml'
      } else if (geoFile.type === 'gpx') {
        if (typeof geoFile.data === 'string') {
          const { gpx } = await import('@tmcw/togeojson')
          const parser = new DOMParser()
          const gpxDoc = parser.parseFromString(geoFile.data, 'text/xml')
          geojson = gpx(gpxDoc)
        }
        layerType = 'gpx'
      } else if (geoFile.type === 'shp') {
        // Shapefile parsing would need the binary data
        layerType = 'shp'
        toast.info('Les shapefiles doivent être importés avec les fichiers associés (.dbf, .shx)')
        return
      }

      if (geojson) {
        // Load into map
        const mapViewer = (window as unknown as { mapViewerRef?: { current: { addGeoJSON: (g: GeoJSON.GeoJSON) => void } } }).mapViewerRef
        mapViewer?.current?.addGeoJSON(geojson)

        // Count features
        let featureCount = 0
        if (geojson.type === 'FeatureCollection') {
          featureCount = geojson.features.length
        } else if (geojson.type === 'Feature') {
          featureCount = 1
        }

        // Add to layers list
        const newLayer: MapLayer = {
          id: geoFile.id,
          name: geoFile.name,
          type: layerType,
          visible: true,
          color: colors[mapLayers.length % colors.length],
          features: featureCount,
        }
        setMapLayers(prev => [...prev, newLayer])

        toast.success(`Fichier "${geoFile.name}" importé (${featureCount} éléments)`)
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Erreur lors de l\'import du fichier')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers.length])

  // Handle drawing
  const handleDraw = useCallback((feature: MapFeature) => {
    setFeatures(prev => [...prev, feature])
    setDrawingMode(null)
    setActiveTool('select')
  }, [])

  // Handle feature selection
  const handleFeatureSelect = useCallback((feature: MapFeature | null) => {
    setSelectedFeature(feature)
  }, [])

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    setMapLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ))
  }

  // Remove layer
  const handleRemoveLayer = (layerId: string) => {
    setMapLayers(prev => prev.filter(layer => layer.id !== layerId))
    removeFile(layerId)
    toast.success('Couche supprimée')
  }

  // Export features as GeoJSON
  const exportGeoJSON = useCallback(() => {
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: features.map((f, index) => ({
        type: 'Feature' as const,
        properties: { id: f.id, type: f.type },
        geometry: {
          type: f.type === 'point' ? 'Point' as const :
                f.type === 'line' ? 'LineString' as const :
                'Polygon' as const,
          coordinates: f.type === 'point'
            ? [f.coordinates[0].lng, f.coordinates[0].lat]
            : f.coordinates.map(c => [c.lng, c.lat]),
        },
      })),
    }

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'export.geojson'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('GeoJSON exporté')
  }, [features])

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Main viewer */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Drawing tools */}
              <div className="flex items-center gap-1">
                {drawingTools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={activeTool === tool.id ? 'default' : 'ghost'}
                    size="icon"
                    title={tool.name}
                    onClick={() => handleToolChange(tool.id)}
                  >
                    <tool.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>

              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={exportGeoJSON}>
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm" className="gap-2" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Importer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map viewer */}
        <Card className="flex-1 min-h-0">
          <CardContent className="p-0 h-full">
            <Suspense
              fallback={
                <div className="w-full h-full min-h-[400px] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
                  </div>
                </div>
              }
            >
              <MapViewer
                center={[5.3599, -4.0083]}
                zoom={12}
                drawingMode={drawingMode}
                onDraw={handleDraw}
                onFeatureSelect={handleFeatureSelect}
                features={features}
                className="w-full h-full min-h-[400px] rounded-lg"
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <Card className="w-full lg:w-80 flex flex-col">
        <Tabs defaultValue="layers" className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <TabsList className="w-full">
              <TabsTrigger value="layers" className="flex-1">Couches</TabsTrigger>
              <TabsTrigger value="import" className="flex-1">Import</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden p-0">
            <TabsContent value="layers" className="m-0 h-full">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {/* Imported layers */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Couches importées</h4>
                    {mapLayers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune couche importée</p>
                        <p className="text-xs mt-1">Importez un fichier pour commencer</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {mapLayers.map((layer) => (
                          <div 
                            key={layer.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer group"
                          >
                            <button
                              onClick={() => toggleLayerVisibility(layer.id)}
                              className="flex-shrink-0"
                            >
                              {layer.visible ? (
                                <Eye className="h-4 w-4 text-primary" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: layer.color }}
                            />
                            <span className="text-sm flex-1 truncate">{layer.name}</span>
                            <Badge variant="secondary" className="text-xs">{layer.type.toUpperCase()}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={() => handleRemoveLayer(layer.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Drawn features */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Éléments dessinés ({features.length})</h4>
                    {features.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun élément dessiné</p>
                    ) : (
                      <div className="space-y-2">
                        {features.map((feature) => (
                          <div 
                            key={feature.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                              selectedFeature?.id === feature.id 
                                ? 'bg-primary/10' 
                                : 'bg-muted/50 hover:bg-muted'
                            }`}
                            onClick={() => setSelectedFeature(feature)}
                          >
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm flex-1">{feature.type} #{feature.id.slice(-4)}</span>
                            <Badge variant="outline" className="text-xs">{feature.type}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="import" className="m-0 h-full">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  <FileUpload
                    acceptedTypes={['geojson', 'kml', 'gpx', 'shp']}
                    onFileUpload={handleFileImport}
                    maxSize={100 * 1024 * 1024}
                  />

                  <Separator />

                  {/* Supported formats */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Formats supportés</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'GeoJSON', ext: '.geojson, .json', icon: FileJson },
                        { name: 'KML', ext: '.kml, .kmz', icon: Map },
                        { name: 'GPX', ext: '.gpx', icon: MapPin },
                        { name: 'Shapefile', ext: '.shp + .dbf', icon: FolderOpen },
                      ].map((format) => (
                        <div 
                          key={format.ext}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                        >
                          <format.icon className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-xs font-medium">{format.name}</div>
                            <div className="text-xs text-muted-foreground">{format.ext}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
