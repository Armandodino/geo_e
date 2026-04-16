'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Ruler, 
  Mountain, 
  Square, 
  Box, 
  Compass, 
  Move3D, 
  Crosshair,
  Play,
  RotateCcw,
  Download,
  FileText,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  ArrowRight
} from 'lucide-react'

const analysisTools = [
  {
    id: 'distance',
    name: 'Mesure de distance',
    icon: Ruler,
    description: 'Mesurez la distance entre deux ou plusieurs points',
    color: 'bg-emerald-500/10 text-emerald-500'
  },
  {
    id: 'angle',
    name: 'Mesure d\'angle',
    icon: Compass,
    description: 'Calculez l\'angle entre trois points',
    color: 'bg-blue-500/10 text-blue-500'
  },
  {
    id: 'height',
    name: 'Mesure de hauteur',
    icon: Mountain,
    description: 'Déterminez la hauteur d\'un objet ou d\'un terrain',
    color: 'bg-purple-500/10 text-purple-500'
  },
  {
    id: 'area',
    name: 'Calcul de surface',
    icon: Square,
    description: 'Calculez la surface d\'une zone délimitée',
    color: 'bg-amber-500/10 text-amber-500'
  },
  {
    id: 'volume',
    name: 'Calcul de volume',
    icon: Box,
    description: 'Estimez le volume d\'une zone 3D',
    color: 'bg-rose-500/10 text-rose-500'
  },
  {
    id: 'profile',
    name: 'Profil topographique',
    icon: TrendingUp,
    description: 'Générez un profil en coupe du terrain',
    color: 'bg-cyan-500/10 text-cyan-500'
  },
]

const recentAnalyses = [
  { name: 'Distance Abidjan-Bouaké', type: 'distance', result: '342.5 km', date: '2024-01-15' },
  { name: 'Surface Zone Industrielle', type: 'area', result: '125.3 ha', date: '2024-01-14' },
  { name: 'Volume Stock Terril', type: 'volume', result: '45,230 m³', date: '2024-01-13' },
  { name: 'Hauteur Bâtiment', type: 'height', result: '45.2 m', date: '2024-01-12' },
]

export default function AnalysisPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [measurements, setMeasurements] = useState<{
    distance: { points: { lat: string; lng: string }[] }
    area: { points: { lat: string; lng: string }[] }
    height: { base: string; top: string }
    volume: { baseArea: string; height: string }
  }>({
    distance: { points: [{ lat: '5.3599', lng: '-4.0083' }, { lat: '5.4500', lng: '-4.0500' }] },
    area: { points: [{ lat: '5.3599', lng: '-4.0083' }] },
    height: { base: '0', top: '45.2' },
    volume: { baseArea: '1000', height: '10' }
  })
  const [results, setResults] = useState<string | null>(null)

  const calculateDistance = () => {
    // Simulated calculation
    const dist = (Math.random() * 100 + 10).toFixed(2)
    setResults(`${dist} km`)
  }

  const calculateArea = () => {
    const area = (Math.random() * 1000 + 100).toFixed(2)
    setResults(`${area} hectares`)
  }

  const calculateVolume = () => {
    const vol = (Math.random() * 10000 + 1000).toFixed(0)
    setResults(`${Number(vol).toLocaleString()} m³`)
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
                  <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="workspace" className="flex-1 m-0">
                <div className="h-full flex">
                  {/* Input area */}
                  <div className="flex-1 p-6 border-r">
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
                          {measurements.distance.points.map((point, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Latitude {index + 1}</Label>
                                  <Input 
                                    type="number" 
                                    value={point.lat} 
                                    onChange={(e) => {
                                      const newPoints = [...measurements.distance.points]
                                      newPoints[index] = { ...newPoints[index], lat: e.target.value }
                                      setMeasurements({ ...measurements, distance: { points: newPoints } })
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Longitude {index + 1}</Label>
                                  <Input 
                                    type="number" 
                                    value={point.lng}
                                    onChange={(e) => {
                                      const newPoints = [...measurements.distance.points]
                                      newPoints[index] = { ...newPoints[index], lng: e.target.value }
                                      setMeasurements({ ...measurements, distance: { points: newPoints } })
                                    }}
                                  />
                                </div>
                              </div>
                              <MapPin className="h-5 w-5 text-primary" />
                            </div>
                          ))}
                        </div>

                        <Button onClick={calculateDistance} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer la distance
                        </Button>
                      </div>
                    )}

                    {activeTool === 'area' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Square className="h-5 w-5 text-primary" />
                            Calcul de surface
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Définissez les sommets du polygone pour calculer sa surface
                          </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-6 text-center">
                          <Square className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
                          <p className="text-muted-foreground">
                            Cliquez sur la carte pour ajouter des points<br />
                            ou importez un fichier de limites
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="gap-2">
                            <MapPin className="h-4 w-4" />
                            Dessiner sur la carte
                          </Button>
                          <Button variant="outline" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Importer fichier
                          </Button>
                        </div>

                        <Button onClick={calculateArea} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer la surface
                        </Button>
                      </div>
                    )}

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
                              value={measurements.volume.baseArea}
                              onChange={(e) => setMeasurements({
                                ...measurements, 
                                volume: { ...measurements.volume, baseArea: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Hauteur (m)</Label>
                            <Input 
                              type="number" 
                              value={measurements.volume.height}
                              onChange={(e) => setMeasurements({
                                ...measurements, 
                                volume: { ...measurements.volume, height: e.target.value }
                              })}
                            />
                          </div>
                        </div>

                        <Button onClick={calculateVolume} className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer le volume
                        </Button>
                      </div>
                    )}

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
                              value={measurements.height.base}
                              onChange={(e) => setMeasurements({
                                ...measurements, 
                                height: { ...measurements.height, base: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Altitude sommet (m)</Label>
                            <Input 
                              type="number" 
                              value={measurements.height.top}
                              onChange={(e) => setMeasurements({
                                ...measurements, 
                                height: { ...measurements.height, top: e.target.value }
                              })}
                            />
                          </div>
                        </div>

                        <Button className="gap-2">
                          <Play className="h-4 w-4" />
                          Calculer la hauteur
                        </Button>
                      </div>
                    )}

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
                  </div>

                  {/* Results panel */}
                  <div className="w-80 p-6 bg-muted/30">
                    <h4 className="font-semibold mb-4">Résultats</h4>
                    
                    {results ? (
                      <div className="space-y-4">
                        <Card className="bg-primary/10 border-primary/30">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">Résultat du calcul</p>
                            <p className="text-2xl font-bold text-primary">{results}</p>
                          </CardContent>
                        </Card>

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Réinitialiser
                          </Button>
                          <Button variant="outline" className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            Exporter
                          </Button>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Détails</h5>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>• Précision: ±0.5%</p>
                            <p>• Système: WGS84</p>
                            <p>• Méthode: Géodésique</p>
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

              <TabsContent value="history" className="flex-1 m-0 p-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Analyses récentes</h4>
                  <div className="space-y-2">
                    {recentAnalyses.map((analysis, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{analysis.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {analysis.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-1">{analysis.type}</Badge>
                          <p className="text-sm font-medium">{analysis.result}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
