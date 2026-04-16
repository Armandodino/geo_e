'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Map, 
  Layers, 
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
  ChevronRight
} from 'lucide-react'

const layerTypes = [
  { id: 'satellite', name: 'Satellite', icon: Map },
  { id: 'streets', name: 'Routes', icon: Map },
  { id: 'terrain', name: 'Terrain', icon: Map },
  { id: 'topo', name: 'Topographique', icon: Map },
]

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

const sampleLayers = [
  { id: 1, name: 'Limites communales', type: 'SHP', visible: true, color: '#10b981' },
  { id: 2, name: 'Réseau routier', type: 'GeoJSON', visible: true, color: '#3b82f6' },
  { id: 3, name: 'Points d\'intérêt', type: 'KML', visible: false, color: '#f59e0b' },
  { id: 4, name: 'Zones urbaines', type: 'SHP', visible: true, color: '#8b5cf6' },
]

const supportedFormats = [
  { name: 'Shapefile', ext: '.shp', icon: FolderOpen },
  { name: 'GeoJSON', ext: '.geojson', icon: FileJson },
  { name: 'KML', ext: '.kml', icon: Map },
  { name: 'GPX', ext: '.gpx', icon: MapPin },
]

export default function GISPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [activeTool, setActiveTool] = useState('pan')
  const [activeLayerType, setActiveLayerType] = useState('streets')
  const [layers, setLayers] = useState(sampleLayers)
  const [mapCenter] = useState({ lat: 5.3599, lng: -4.0083 }) // Abidjan coordinates

  const toggleLayerVisibility = (id: number) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ))
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Main viewer */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Map controls */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" title="Zoom avant">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Zoom arrière">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Centrer sur la position">
                  <Locate className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Drawing tools */}
              <div className="flex items-center gap-1">
                {drawingTools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={activeTool === tool.id ? 'default' : 'ghost'}
                    size="icon"
                    title={tool.name}
                    onClick={() => setActiveTool(tool.id)}
                  >
                    <tool.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>

              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
                <Button size="sm" className="gap-2">
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
            <div 
              ref={mapRef} 
              className="relative w-full h-full min-h-[400px] bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden"
            >
              {/* Simulated map with grid */}
              <div className="absolute inset-0">
                {/* Map grid background */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                  }}
                />

                {/* Simulated map features */}
                <svg className="absolute inset-0 w-full h-full">
                  {/* Water body */}
                  <ellipse cx="70%" cy="60%" rx="15%" ry="20%" fill="rgba(59, 130, 246, 0.3)" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
                  
                  {/* Roads */}
                  <path d="M0 30% Q30% 50% 100% 40%" fill="none" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="3" />
                  <path d="M20% 0 Q40% 50% 60% 100%" fill="none" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="3" />
                  <path d="M0 70% Q50% 60% 100% 80%" fill="none" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="2" />
                  
                  {/* Boundaries */}
                  <path d="M10% 10% L90% 15% L85% 90% L15% 85% Z" fill="none" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="2" strokeDasharray="10,5" />
                  
                  {/* Points of interest */}
                  <circle cx="25%" cy="35%" r="8" fill="rgba(139, 92, 246, 0.8)" />
                  <circle cx="50%" cy="50%" r="8" fill="rgba(139, 92, 246, 0.8)" />
                  <circle cx="70%" cy="30%" r="8" fill="rgba(139, 92, 246, 0.8)" />
                  <circle cx="40%" cy="70%" r="8" fill="rgba(139, 92, 246, 0.8)" />
                  
                  {/* Urban zones */}
                  <rect x="35%" y="25%" width="20%" height="15%" fill="rgba(16, 185, 129, 0.2)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
                  <rect x="55%" y="45%" width="15%" height="20%" fill="rgba(16, 185, 129, 0.2)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
                </svg>

                {/* Map attribution */}
                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-400">
                  © Geo E | Données: OpenStreetMap
                </div>

                {/* Scale bar */}
                <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-20 h-1 bg-slate-400 flex">
                      <div className="w-1/2 h-full bg-slate-600" />
                    </div>
                    <span>0 — 5 km</span>
                  </div>
                </div>

                {/* Coordinates display */}
                <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-800/90 px-3 py-2 rounded">
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div>Lat: {mapCenter.lat.toFixed(4)}° N</div>
                    <div>Lng: {mapCenter.lng.toFixed(4)}° W</div>
                  </div>
                </div>

                {/* Zoom controls */}
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col gap-1">
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <Card className="w-full lg:w-80 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Couches</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {/* Base maps */}
              <div>
                <h4 className="text-sm font-medium mb-3">Fond de carte</h4>
                <div className="grid grid-cols-2 gap-2">
                  {layerTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant={activeLayerType === type.id ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start gap-2"
                      onClick={() => setActiveLayerType(type.id)}
                    >
                      <type.icon className="h-4 w-4" />
                      {type.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Layers list */}
              <div>
                <h4 className="text-sm font-medium mb-3">Couches importées</h4>
                <div className="space-y-2">
                  {layers.map((layer) => (
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
                      <Badge variant="secondary" className="text-xs">{layer.type}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Import formats */}
              <div>
                <h4 className="text-sm font-medium mb-3">Formats supportés</h4>
                <div className="grid grid-cols-2 gap-2">
                  {supportedFormats.map((format) => (
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

              <Separator />

              {/* Export options */}
              <div>
                <h4 className="text-sm font-medium mb-3">Exporter</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileJson className="h-4 w-4" />
                    Exporter en GeoJSON
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Exporter en Shapefile
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Map className="h-4 w-4" />
                    Exporter en KML
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
