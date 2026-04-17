'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import dynamic from 'next/dynamic'
import { 
  Ruler, 
  Mountain, 
  Square, 
  Box, 
  Compass, 
  Crosshair,
  Play,
  RotateCcw,
  Download,
  FileText,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  ArrowRight,
  Circle,
  Layers,
  Plus,
  Minus,
  FileDown,
  Table,
  FileCode2,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { exportJSON, exportCSV, exportGeoJSON, exportHTMLReport, exportTextReport } from '@/lib/export-utils'
import {
  calculateDistance,
  calculateTotalDistance,
  calculateArea,
  calculatePerimeter,
  calculateBearing,
  calculateAngle,
  calculateVolume,
  calculateCentroid,
  createBuffer,
  formatDistance,
  formatArea,
  formatVolume,
  getBounds,
} from '@/lib/geo-utils'

// Dynamic import for map viewer
const MapViewer = dynamic(
  () => import('@/components/map-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    ),
  }
)

interface Coordinate {
  lat: number
  lng: number
}

interface AnalysisResult {
  type: string
  value: number
  formatted: string
  unit: string
  inputs: Record<string, unknown>
  timestamp: Date
}

interface HistoryItem {
  id: string
  name: string
  type: string
  result: string
  date: string
}

const analysisTools = [
  {
    id: 'distance',
    name: 'Mesure de distance',
    icon: Ruler,
    description: 'Mesurez la distance entre deux ou plusieurs points',
    color: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    id: 'angle',
    name: 'Mesure d\'angle',
    icon: Compass,
    description: 'Calculez l\'angle entre trois points',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 'height',
    name: 'Mesure de hauteur',
    icon: Mountain,
    description: 'Déterminez la hauteur d\'un objet ou d\'un terrain',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    id: 'area',
    name: 'Calcul de surface',
    icon: Square,
    description: 'Calculez la surface d\'une zone délimitée',
    color: 'bg-amber-500/10 text-amber-500',
  },
  {
    id: 'perimeter',
    name: 'Calcul de périmètre',
    icon: Circle,
    description: 'Calculez le périmètre d\'une zone',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    id: 'volume',
    name: 'Calcul de volume',
    icon: Box,
    description: 'Estimez le volume d\'une zone 3D',
    color: 'bg-rose-500/10 text-rose-500',
  },
  {
    id: 'buffer',
    name: 'Zone tampon',
    icon: Layers,
    description: 'Créez une zone tampon autour d\'un point',
    color: 'bg-cyan-500/10 text-cyan-500',
  },
  {
    id: 'centroid',
    name: 'Centroïde',
    icon: Crosshair,
    description: 'Trouvez le centre d\'une zone',
    color: 'bg-teal-500/10 text-teal-500',
  },
  {
    id: 'bearing',
    name: 'Relèvement',
    icon: TrendingUp,
    description: 'Calculez le relèvement entre deux points',
    color: 'bg-indigo-500/10 text-indigo-500',
  },
]

export default function AnalysisPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  
  // Input states
  const [distancePoints, setDistancePoints] = useState<Coordinate[]>([
    { lat: 5.3599, lng: -4.0083 },
    { lat: 5.4500, lng: -4.0500 },
  ])
  const [areaPoints, setAreaPoints] = useState<Coordinate[]>([
    { lat: 5.3599, lng: -4.0083 },
    { lat: 5.3699, lng: -4.0083 },
    { lat: 5.3699, lng: -3.9983 },
    { lat: 5.3599, lng: -3.9983 },
  ])
  const [anglePoints, setAnglePoints] = useState<Coordinate[]>([
    { lat: 5.3599, lng: -4.0083 },
    { lat: 5.3699, lng: -4.0183 },
    { lat: 5.3799, lng: -4.0083 },
  ])
  const [bufferCenter, setBufferCenter] = useState<Coordinate>({ lat: 5.3599, lng: -4.0083 })
  const [bufferRadius, setBufferRadius] = useState('1000')
  const [volumeInputs, setVolumeInputs] = useState({ baseArea: '1000', height: '10' })
  const [heightInputs, setHeightInputs] = useState({ baseElevation: '0', topElevation: '50' })
  
  // Map drawing state
  const [drawingMode, setDrawingMode] = useState<'point' | 'line' | 'polygon' | null>(null)
  const [mapFeatures, setMapFeatures] = useState<Array<{
    id: string
    type: 'point' | 'line' | 'polygon'
    coordinates: Coordinate[]
  }>>([])

  // Add point to distance measurement
  const addDistancePoint = () => {
    setDistancePoints([...distancePoints, {
      lat: distancePoints[distancePoints.length - 1].lat + 0.01,
      lng: distancePoints[distancePoints.length - 1].lng + 0.01,
    }])
  }

  // Remove point from distance measurement
  const removeDistancePoint = (index: number) => {
    if (distancePoints.length > 2) {
      setDistancePoints(distancePoints.filter((_, i) => i !== index))
    }
  }

  // Calculate distance
  const handleCalculateDistance = useCallback(() => {
    const totalDist = calculateTotalDistance(distancePoints)
    const formatted = formatDistance(totalDist)
    
    const result: AnalysisResult = {
      type: 'distance',
      value: totalDist,
      formatted,
      unit: totalDist < 1000 ? 'm' : 'km',
      inputs: { points: distancePoints },
      timestamp: new Date(),
    }
    
    setResults(result)
    addToHistory('Mesure de distance', 'distance', formatted)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distancePoints])

  // Calculate area
  const handleCalculateArea = useCallback(() => {
    const area = calculateArea(areaPoints)
    const perimeter = calculatePerimeter(areaPoints)
    const formatted = formatArea(area)
    
    const result: AnalysisResult = {
      type: 'area',
      value: area,
      formatted,
      unit: area < 10000 ? 'm²' : 'ha',
      inputs: { points: areaPoints, perimeter },
      timestamp: new Date(),
    }
    
    setResults(result)
    addToHistory('Calcul de surface', 'area', formatted)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaPoints])

  // Calculate perimeter
  const handleCalculatePerimeter = useCallback(() => {
    const perimeter = calculatePerimeter(areaPoints)
    const formatted = formatDistance(perimeter)
    
    const result: AnalysisResult = {
      type: 'perimeter',
      value: perimeter,
      formatted,
      unit: perimeter < 1000 ? 'm' : 'km',
      inputs: { points: areaPoints },
      timestamp: new Date(),
    }
    
    setResults(result)
    addToHistory('Calcul de périmètre', 'perimeter', formatted)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaPoints])

  // Calculate angle
  const handleCalculateAngle = useCallback(() => {
    if (anglePoints.length < 3) {
      toast.error('Trois points sont nécessaires pour calculer un angle')
      return
    }
    
    const angle = calculateAngle(anglePoints[0], anglePoints[1], anglePoints[2])
    const formatted = `${angle.toFixed(2)}°`
    
    const result: AnalysisResult = {
      type: 'angle',
      value: angle,
      formatted,
      unit: '°',
      inputs: { points: anglePoints },
      timestamp: new Date(),
    }
    
    setResults(result)
    addToHistory('Mesure d\'angle', 'angle', formatted)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anglePoints])

  // Calculate bearing
  const handleCalculateBearing = useCallback(() => {
    const bearing = calculateBearing(
      distancePoints[0].lat, distancePoints[0].lng,
      distancePoints[1].lat, distancePoints[1].lng
    )
    const formatted = `${bearing.toFixed(2)}°`
    
    const result: AnalysisResult = {
      type: 'bearing',
      value: bearing,
      formatted,
      unit: '°',
      inputs: { from: distancePoints[0], to: distancePoints[1] },
      timestamp: new Date(),
    }
    
    setResults(result)
    addToHistory('Calcul de relèvement', 'bearing', formatted)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distancePoints])

  // Calculate volume
  const handleCalculateVolume = useCallback(() => {
    const baseArea = parseFloat(volumeInputs.baseArea)
    const height = parseFloat(volumeInputs.height)
    
    if (isNaN(baseArea) || isNaN(height) || baseArea <= 0 || height <= 0) {
      toast.error('Veuillez entrer des valeurs valides')
      return
    }
    
    const vol = calculateVolume(baseArea, height)
    const formatted = formatVolume(vol)
    
    const result: AnalysisResult = {
      type: 'volume',
      value: vol,
      formatted,
      unit: 'm³',
      inputs: { baseArea, height },
      timestamp: new Date(),
    }
    
    setResults(result)
    addToHistory('Calcul de volume', 'volume', formatted)
  }, [volumeInputs])

  // Calculate height
  const handleCalculateHeight = useCallback(() => {
    const base = parseFloat(heightInputs.baseElevation)
    const top = parseFloat(heightInputs.topElevation)
    
    if (isNaN(base) || isNaN(top)) {
      toast.error('Veuillez entrer des valeurs valides')
      return
    }
    
    const height = Math.abs(top - base)
    const formatted = `${height.toFixed(2)} m`
    
    const result: AnalysisResult = {
      type: 'height',
      value: height,
      formatted,
      unit: 'm',
      inputs: { baseElevation: base, topElevation: top },
      timestamp: new Date(),
    }
    
    setResults(result)
    addToHistory('Mesure de hauteur', 'height', formatted)
  }, [heightInputs])

  // Calculate buffer
  const handleCalculateBuffer = useCallback(() => {
    const radius = parseFloat(bufferRadius)
    
    if (isNaN(radius) || radius <= 0) {
      toast.error('Veuillez entrer un rayon valide')
      return
    }
    
    const buffer = createBuffer([bufferCenter], radius, 'point')
    
    if (buffer) {
      const formatted = `Rayon: ${formatDistance(radius)}`
      
      const result: AnalysisResult = {
        type: 'buffer',
        value: radius,
        formatted,
        unit: 'm',
        inputs: { center: bufferCenter, radius },
        timestamp: new Date(),
      }
      
      setResults(result)
      addToHistory('Zone tampon', 'buffer', formatted)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bufferCenter, bufferRadius])

  // Calculate centroid
  const handleCalculateCentroid = useCallback(() => {
    if (areaPoints.length < 3) {
      toast.error('Au moins trois points sont nécessaires')
      return
    }
    
    const centroid = calculateCentroid(areaPoints)
    const formatted = `${centroid.lat.toFixed(6)}, ${centroid.lng.toFixed(6)}`
    
    const result: AnalysisResult = {
      type: 'centroid',
      value: 0,
      formatted,
      unit: 'coord',
      inputs: { centroid, points: areaPoints },
      timestamp: new Date(),
    }
    
    setResults(result)
    addToHistory('Calcul du centroïde', 'centroid', formatted)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaPoints])

  // Add to history
  const addToHistory = (name: string, type: string, result: string) => {
    const item: HistoryItem = {
      id: Date.now().toString(),
      name,
      type,
      result,
      date: new Date().toLocaleDateString(),
    }
    setHistory(prev => [item, ...prev].slice(0, 20))
  }

  // Handle map draw
  const handleMapDraw = useCallback((feature: { id: string; type: 'point' | 'line' | 'polygon'; coordinates: Coordinate[] }) => {
    setMapFeatures(prev => [...prev, feature])
    
    // Update inputs based on drawn feature
    if (feature.type === 'point') {
      setBufferCenter(feature.coordinates[0])
    } else if (feature.type === 'line') {
      setDistancePoints(feature.coordinates)
      setActiveTool('distance')
    } else if (feature.type === 'polygon') {
      setAreaPoints(feature.coordinates)
      setActiveTool('area')
    }
    
    toast.success('Élément ajouté')
  }, [])

  // Reset inputs
  const resetInputs = () => {
    setDistancePoints([
      { lat: 5.3599, lng: -4.0083 },
      { lat: 5.4500, lng: -4.0500 },
    ])
    setAreaPoints([
      { lat: 5.3599, lng: -4.0083 },
      { lat: 5.3699, lng: -4.0083 },
      { lat: 5.3699, lng: -3.9983 },
      { lat: 5.3599, lng: -3.9983 },
    ])
    setAnglePoints([
      { lat: 5.3599, lng: -4.0083 },
      { lat: 5.3699, lng: -4.0183 },
      { lat: 5.3799, lng: -4.0083 },
    ])
    setBufferCenter({ lat: 5.3599, lng: -4.0083 })
    setBufferRadius('1000')
    setVolumeInputs({ baseArea: '1000', height: '10' })
    setHeightInputs({ baseElevation: '0', topElevation: '50' })
    setResults(null)
    setMapFeatures([])
    toast.success('Réinitialisé')
  }

  // Export results — multiple formats
  const exportResults = (format: 'json' | 'csv' | 'geojson' | 'html' | 'txt' = 'json') => {
    if (!results) return
    const ts = results.timestamp.toISOString()

    if (format === 'json') {
      exportJSON({
        type: results.type, value: results.value, formatted: results.formatted,
        unit: results.unit, inputs: results.inputs, timestamp: ts,
        system: 'WGS84', method: 'Géodésique', precision: '±0.5%'
      }, `analyse_${results.type}_${Date.now()}.json`)
    }

    else if (format === 'csv') {
      // Flatten inputs into rows
      const rows: Record<string, unknown>[] = []
      if (Array.isArray(results.inputs.points)) {
        ;(results.inputs.points as {lat:number;lng:number}[]).forEach((p, i) =>
          rows.push({ Index: i+1, Latitude: p.lat, Longitude: p.lng })
        )
      } else {
        rows.push({ Clé: 'Résultat', Valeur: results.formatted, Unité: results.unit })
        Object.entries(results.inputs).forEach(([k,v]) => rows.push({Clé: k, Valeur: String(v), Unité: ''}))
      }
      rows.push({ Clé: '--- Résultat final ---', Valeur: results.formatted, Unité: results.unit })
      exportCSV(rows, `analyse_${results.type}_${Date.now()}.csv`)
    }

    else if (format === 'geojson') {
      const pts = (results.inputs.points as {lat:number;lng:number}[] | undefined) ?? []
      if (pts.length === 0) { toast.error('Pas de points à exporter en GeoJSON'); return }
      const geoType = pts.length === 1 ? 'Point' : results.type === 'area' || results.type === 'perimeter' || results.type === 'centroid' ? 'Polygon' : 'LineString'
      exportGeoJSON(
        pts.map(p => ({...p})),
        geoType as 'Point' | 'LineString' | 'Polygon',
        { type: results.type, result: results.formatted, timestamp: ts },
        `analyse_${results.type}_${Date.now()}.geojson`
      )
    }

    else if (format === 'html') {
      const inputRows: [string, string][] = Object.entries(results.inputs)
        .flatMap(([k,v]) => {
          if (Array.isArray(v)) return (v as {lat:number;lng:number}[]).map((p,i): [string,string] => [`Point ${i+1}`, `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`])
          return [[k, String(v)] as [string, string]]
        })
      exportHTMLReport(
        `Analyse spatiale — ${results.type}`,
        [
          { heading: 'Résultat principal', rows: [['Valeur', results.formatted], ['Unité', results.unit], ['Date', new Date(ts).toLocaleString('fr-FR')]] },
          { heading: 'Paramètres de calcul', rows: inputRows },
          { heading: 'Métadonneau', rows: [['Système', 'WGS84'], ['Méthode', 'Géodésique'], ['Précision', '±0.5%']] }
        ],
        `rapport_analyse_${results.type}_${Date.now()}.html`
      )
    }

    else if (format === 'txt') {
      exportTextReport(
        [
          { title: 'Résultat', lines: [`Type : ${results.type}`, `Valeur : ${results.formatted}`, `Unité : ${results.unit}`, `Date : ${new Date(ts).toLocaleString('fr-FR')}`] },
          { title: 'Métadonneau', lines: ['Système : WGS84', 'Méthode : Géodésique', 'Précision : ±0.5%'] },
        ],
        `rapport_analyse_${results.type}_${Date.now()}.txt`
      )
    }

    toast.success(`Export ${format.toUpperCase()} généré`)
  }

  // Export full history
  const exportHistory = (format: 'json' | 'csv') => {
    if (history.length === 0) { toast.error('Aucune analyse dans l\'historique'); return }
    if (format === 'json') {
      exportJSON(history, `historique_analyses_${Date.now()}.json`)
    } else {
      exportCSV(
        history.map(h => ({ ID: h.id, Nom: h.name, Type: h.type, Résultat: h.result, Date: h.date })),
        `historique_analyses_${Date.now()}.csv`
      )
    }
    toast.success(`Historique exporté en ${format.toUpperCase()}`)
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Outils d'Analyse</h1>
        <p className="text-muted-foreground">Effectuez des mesures et analyses spatiales</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Tools selection */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Outils disponibles</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-2">
                {analysisTools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      activeTool === tool.id 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setActiveTool(tool.id)
                      setResults(null)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${tool.color} flex items-center justify-center`}>
                        <tool.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Analysis workspace */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 p-0">
            <Tabs defaultValue="workspace" className="h-full flex flex-col">
              <div className="px-4 pt-4">
                <TabsList>
                  <TabsTrigger value="workspace">Espace de travail</TabsTrigger>
                  <TabsTrigger value="map">Carte interactive</TabsTrigger>
                  <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="workspace" className="flex-1 m-0">
                <div className="h-full flex">
                  {/* Input area */}
                  <div className="flex-1 p-6 border-r overflow-auto">
                    {!activeTool && (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <Crosshair className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">Sélectionnez un outil</h3>
                          <p className="text-muted-foreground">
                            Choisissez un outil dans le panneau de gauche<br />
                            pour commencer votre analyse
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Distance tool */}
                    {activeTool === 'distance' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Ruler className="h-5 w-5 text-primary" />
                            Mesure de distance
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Entrez les coordonnées des points pour calculer la distance
                          </p>
                        </div>

                        <div className="space-y-4">
                          {distancePoints.map((point, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Latitude {index + 1}</Label>
                                  <Input 
                                    type="number" 
                                    step="any"
                                    value={point.lat} 
                                    onChange={(e) => {
                                      const newPoints = [...distancePoints]
                                      newPoints[index] = { ...newPoints[index], lat: parseFloat(e.target.value) }
                                      setDistancePoints(newPoints)
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Longitude {index + 1}</Label>
                                  <Input 
                                    type="number"
                                    step="any"
                                    value={point.lng}
                                    onChange={(e) => {
                                      const newPoints = [...distancePoints]
                                      newPoints[index] = { ...newPoints[index], lng: parseFloat(e.target.value) }
                                      setDistancePoints(newPoints)
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                {distancePoints.length > 2 && (
                                  <Button variant="ghost" size="icon" onClick={() => removeDistancePoint(index)}>
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          <Button variant="outline" size="sm" onClick={addDistancePoint}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un point
                          </Button>
                        </div>

                        <Button onClick={handleCalculateDistance} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer la distance
                        </Button>
                      </div>
                    )}

                    {/* Area tool */}
                    {activeTool === 'area' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Square className="h-5 w-5 text-primary" />
                            Calcul de surface
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Définissez les sommets du polygone
                          </p>
                        </div>

                        <div className="space-y-4">
                          {areaPoints.map((point, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Latitude {index + 1}</Label>
                                  <Input 
                                    type="number" 
                                    step="any"
                                    value={point.lat} 
                                    onChange={(e) => {
                                      const newPoints = [...areaPoints]
                                      newPoints[index] = { ...newPoints[index], lat: parseFloat(e.target.value) }
                                      setAreaPoints(newPoints)
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Longitude {index + 1}</Label>
                                  <Input 
                                    type="number"
                                    step="any"
                                    value={point.lng}
                                    onChange={(e) => {
                                      const newPoints = [...areaPoints]
                                      newPoints[index] = { ...newPoints[index], lng: parseFloat(e.target.value) }
                                      setAreaPoints(newPoints)
                                    }}
                                  />
                                </div>
                              </div>
                              <MapPin className="h-5 w-5 text-primary" />
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleCalculateArea} className="gap-2">
                            <Play className="h-4 w-4" />
                            Calculer la surface
                          </Button>
                          <Button variant="outline" onClick={handleCalculatePerimeter} className="gap-2">
                            <Circle className="h-4 w-4" />
                            Calculer le périmètre
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Angle tool */}
                    {activeTool === 'angle' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Compass className="h-5 w-5 text-primary" />
                            Mesure d'angle
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Trois points sont nécessaires (point 2 est le sommet)
                          </p>
                        </div>

                        <div className="space-y-4">
                          {['Point 1', 'Sommet', 'Point 3'].map((label, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                  <Label>{label} - Latitude</Label>
                                  <Input 
                                    type="number" 
                                    step="any"
                                    value={anglePoints[index].lat} 
                                    onChange={(e) => {
                                      const newPoints = [...anglePoints]
                                      newPoints[index] = { ...newPoints[index], lat: parseFloat(e.target.value) }
                                      setAnglePoints(newPoints)
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>{label} - Longitude</Label>
                                  <Input 
                                    type="number"
                                    step="any"
                                    value={anglePoints[index].lng}
                                    onChange={(e) => {
                                      const newPoints = [...anglePoints]
                                      newPoints[index] = { ...newPoints[index], lng: parseFloat(e.target.value) }
                                      setAnglePoints(newPoints)
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button onClick={handleCalculateAngle} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer l'angle
                        </Button>
                      </div>
                    )}

                    {/* Volume tool */}
                    {activeTool === 'volume' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Box className="h-5 w-5 text-primary" />
                            Calcul de volume
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Entrez la surface de base et la hauteur
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Surface de base (m²)</Label>
                            <Input 
                              type="number" 
                              value={volumeInputs.baseArea}
                              onChange={(e) => setVolumeInputs({
                                ...volumeInputs, 
                                baseArea: e.target.value
                              })}
                            />
                          </div>
                          <div>
                            <Label>Hauteur (m)</Label>
                            <Input 
                              type="number" 
                              value={volumeInputs.height}
                              onChange={(e) => setVolumeInputs({
                                ...volumeInputs, 
                                height: e.target.value
                              })}
                            />
                          </div>
                        </div>

                        <Button onClick={handleCalculateVolume} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer le volume
                        </Button>
                      </div>
                    )}

                    {/* Height tool */}
                    {activeTool === 'height' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Mountain className="h-5 w-5 text-primary" />
                            Mesure de hauteur
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Entrez l'altitude de la base et du sommet
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Altitude base (m)</Label>
                            <Input 
                              type="number" 
                              value={heightInputs.baseElevation}
                              onChange={(e) => setHeightInputs({
                                ...heightInputs, 
                                baseElevation: e.target.value
                              })}
                            />
                          </div>
                          <div>
                            <Label>Altitude sommet (m)</Label>
                            <Input 
                              type="number" 
                              value={heightInputs.topElevation}
                              onChange={(e) => setHeightInputs({
                                ...heightInputs, 
                                topElevation: e.target.value
                              })}
                            />
                          </div>
                        </div>

                        <Button onClick={handleCalculateHeight} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer la hauteur
                        </Button>
                      </div>
                    )}

                    {/* Buffer tool */}
                    {activeTool === 'buffer' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Zone tampon
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Créez une zone tampon autour d'un point
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Latitude du centre</Label>
                              <Input 
                                type="number" 
                                step="any"
                                value={bufferCenter.lat} 
                                onChange={(e) => setBufferCenter({
                                  ...bufferCenter,
                                  lat: parseFloat(e.target.value)
                                })}
                              />
                            </div>
                            <div>
                              <Label>Longitude du centre</Label>
                              <Input 
                                type="number"
                                step="any"
                                value={bufferCenter.lng}
                                onChange={(e) => setBufferCenter({
                                  ...bufferCenter,
                                  lng: parseFloat(e.target.value)
                                })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Rayon (mètres)</Label>
                            <Input 
                              type="number" 
                              value={bufferRadius}
                              onChange={(e) => setBufferRadius(e.target.value)}
                            />
                          </div>
                        </div>

                        <Button onClick={handleCalculateBuffer} className="gap-2">
                          <Play className="h-4 w-4" />
                          Créer la zone tampon
                        </Button>
                      </div>
                    )}

                    {/* Bearing tool */}
                    {activeTool === 'bearing' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Calcul de relèvement
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Calculez le relèvement entre deux points
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Point de départ</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Latitude</Label>
                                <Input 
                                  type="number" 
                                  step="any"
                                  value={distancePoints[0].lat} 
                                  onChange={(e) => {
                                    const newPoints = [...distancePoints]
                                    newPoints[0] = { ...newPoints[0], lat: parseFloat(e.target.value) }
                                    setDistancePoints(newPoints)
                                  }}
                                />
                              </div>
                              <div>
                                <Label>Longitude</Label>
                                <Input 
                                  type="number"
                                  step="any"
                                  value={distancePoints[0].lng}
                                  onChange={(e) => {
                                    const newPoints = [...distancePoints]
                                    newPoints[0] = { ...newPoints[0], lng: parseFloat(e.target.value) }
                                    setDistancePoints(newPoints)
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Point d'arrivée</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Latitude</Label>
                                <Input 
                                  type="number" 
                                  step="any"
                                  value={distancePoints[1].lat} 
                                  onChange={(e) => {
                                    const newPoints = [...distancePoints]
                                    newPoints[1] = { ...newPoints[1], lat: parseFloat(e.target.value) }
                                    setDistancePoints(newPoints)
                                  }}
                                />
                              </div>
                              <div>
                                <Label>Longitude</Label>
                                <Input 
                                  type="number"
                                  step="any"
                                  value={distancePoints[1].lng}
                                  onChange={(e) => {
                                    const newPoints = [...distancePoints]
                                    newPoints[1] = { ...newPoints[1], lng: parseFloat(e.target.value) }
                                    setDistancePoints(newPoints)
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button onClick={handleCalculateBearing} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer le relèvement
                        </Button>
                      </div>
                    )}

                    {/* Centroid tool */}
                    {activeTool === 'centroid' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Crosshair className="h-5 w-5 text-primary" />
                            Calcul du centroïde
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Trouvez le centre d'une zone polygonale
                          </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            Les coordonnées actuelles définissent la zone:
                          </p>
                          <div className="text-sm space-y-1">
                            {areaPoints.map((p, i) => (
                              <p key={i}>Point {i + 1}: {p.lat.toFixed(4)}, {p.lng.toFixed(4)}</p>
                            ))}
                          </div>
                        </div>

                        <Button onClick={handleCalculateCentroid} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer le centroïde
                        </Button>
                      </div>
                    )}

                    {/* Perimeter tool */}
                    {activeTool === 'perimeter' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Circle className="h-5 w-5 text-primary" />
                            Calcul de périmètre
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Calculez le périmètre d'une zone polygonale
                          </p>
                        </div>

                        <Button onClick={handleCalculatePerimeter} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer le périmètre
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Results panel */}
                  <div className="w-80 p-6 bg-muted/30 overflow-auto">
                    <h4 className="font-semibold mb-4">Résultats</h4>
                    
                    {results ? (
                      <div className="space-y-4">
                        <Card className="bg-primary/10 border-primary/30">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">Résultat du calcul</p>
                            <p className="text-2xl font-bold text-primary">{results.formatted}</p>
                            <Badge variant="secondary" className="mt-2">{results.type}</Badge>
                          </CardContent>
                        </Card>

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 gap-2" onClick={resetInputs}>
                            <RotateCcw className="h-4 w-4" />
                            Réinitialiser
                          </Button>
                          {/* Multi-format export dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="flex-1 gap-2">
                                <FileDown className="h-4 w-4" />
                                Exporter
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel className="text-xs text-muted-foreground">Format d'export</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => exportResults('html')} className="gap-2 cursor-pointer">
                                <FileText className="h-4 w-4 text-blue-500" /> Rapport HTML
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportResults('json')} className="gap-2 cursor-pointer">
                                <FileCode2 className="h-4 w-4 text-green-500" /> JSON
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportResults('csv')} className="gap-2 cursor-pointer">
                                <Table className="h-4 w-4 text-orange-500" /> CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportResults('geojson')} className="gap-2 cursor-pointer">
                                <Globe className="h-4 w-4 text-teal-500" /> GeoJSON
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportResults('txt')} className="gap-2 cursor-pointer">
                                <Download className="h-4 w-4 text-gray-500" /> Rapport TXT
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Détails</h5>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>• Précision: ±0.5%</p>
                            <p>• Système: WGS84</p>
                            <p>• Méthode: Géodésique</p>
                            <p>• Date: {results.timestamp.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Ruler className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Lancez un calcul pour voir les résultats
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="map" className="flex-1 m-0 p-4">
                <div className="h-full flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Select value={drawingMode || ''} onValueChange={(v) => setDrawingMode(v as typeof drawingMode)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Mode dessin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="point">Point</SelectItem>
                        <SelectItem value="line">Ligne</SelectItem>
                        <SelectItem value="polygon">Polygone</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setMapFeatures([])}>
                      Effacer
                    </Button>
                  </div>
                  <div className="flex-1 min-h-[300px]">
                    <MapViewer
                      drawingMode={drawingMode}
                      onDraw={handleMapDraw}
                      features={mapFeatures}
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="flex-1 m-0 p-6 overflow-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Analyses récentes</h4>
                    {history.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <FileDown className="h-3.5 w-3.5" /> Exporter historique
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => exportHistory('csv')} className="gap-2 cursor-pointer">
                            <Table className="h-4 w-4" /> CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportHistory('json')} className="gap-2 cursor-pointer">
                            <FileCode2 className="h-4 w-4" /> JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune analyse récente</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {item.date}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">{item.type}</Badge>
                            <p className="text-sm font-medium">{item.result}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
