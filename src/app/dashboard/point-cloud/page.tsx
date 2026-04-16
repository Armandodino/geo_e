'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move3D, 
  RotateCw, 
  Square, 
  Ruler,
  Mountain,
  Eye,
  Upload,
  FolderOpen,
  Box,
  Crosshair,
  MapPin,
  Layers,
  Sun,
  Moon
} from 'lucide-react'

const measurementTools = [
  { id: 'distance', name: 'Distance', icon: Ruler, description: 'Mesurer la distance entre deux points' },
  { id: 'angle', name: 'Angle', icon: Crosshair, description: 'Mesurer un angle' },
  { id: 'height', name: 'Hauteur', icon: Mountain, description: 'Mesurer la hauteur' },
  { id: 'area', name: 'Surface', icon: Square, description: 'Calculer la surface' },
  { id: 'volume', name: 'Volume', icon: Box, description: 'Calculer le volume' },
]

const viewPresets = [
  { id: 'top', name: 'Vue dessus', icon: Eye },
  { id: 'front', name: 'Vue avant', icon: Eye },
  { id: 'side', name: 'Vue côté', icon: Eye },
  { id: 'iso', name: 'Isométrique', icon: Box },
]

export default function PointCloudPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pointSize, setPointSize] = useState([2])
  const [pointBudget, setPointBudget] = useState([1.5])
  const [fov, setFov] = useState([75])
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Main viewer */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* View controls */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" title="Zoom avant">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Zoom arrière">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Réinitialiser la vue">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Navigation modes */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" title="Orbite">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Pan">
                  <Move3D className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* View presets */}
              <div className="flex items-center gap-1">
                {viewPresets.map((preset) => (
                  <Button key={preset.id} variant="ghost" size="sm" className="gap-1">
                    <preset.icon className="h-3 w-3" />
                    {preset.name}
                  </Button>
                ))}
              </div>

              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" title="Afficher/Masquer la grille" onClick={() => setShowGrid(!showGrid)}>
                  <Layers className={`h-4 w-4 ${showGrid ? 'text-primary' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3D Viewer */}
        <Card className="flex-1 min-h-0">
          <CardContent className="p-0 h-full">
            <div 
              ref={containerRef} 
              className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden"
            >
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  <p className="text-white text-sm">Chargement du visualiseur 3D...</p>
                </div>
              ) : (
                <>
                  {/* Simulated 3D scene */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="relative mb-8">
                        {/* 3D cube visualization */}
                        <div className="w-40 h-40 mx-auto relative" style={{ perspective: '1000px' }}>
                          <div 
                            className="w-full h-full relative"
                            style={{ 
                              transformStyle: 'preserve-3d',
                              animation: 'rotate 20s linear infinite'
                            }}
                          >
                            <div className="absolute inset-0 border-2 border-primary/30 bg-primary/5" style={{ transform: 'translateZ(80px)' }} />
                            <div className="absolute inset-0 border-2 border-primary/30 bg-primary/5" style={{ transform: 'translateZ(-80px)' }} />
                            <div className="absolute inset-0 border-2 border-primary/30 bg-primary/5" style={{ transform: 'rotateY(90deg) translateZ(80px)' }} />
                            <div className="absolute inset-0 border-2 border-primary/30 bg-primary/5" style={{ transform: 'rotateY(-90deg) translateZ(80px)' }} />
                            <div className="absolute inset-0 border-2 border-primary/30 bg-primary/5" style={{ transform: 'rotateX(90deg) translateZ(80px)' }} />
                            <div className="absolute inset-0 border-2 border-primary/30 bg-primary/5" style={{ transform: 'rotateX(-90deg) translateZ(80px)' }} />
                          </div>
                        </div>
                        {/* Floating points */}
                        <div className="absolute inset-0">
                          {[...Array(50)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
                              style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                opacity: 0.3 + Math.random() * 0.7
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Visualiseur de Nuages de Points</h3>
                      <p className="text-slate-400 text-sm max-w-md">
                        Importez vos fichiers LAS/LAZ pour visualiser vos nuages de points en 3D
                      </p>
                      <Button className="mt-4 gap-2">
                        <Upload className="h-4 w-4" />
                        Charger un fichier
                      </Button>
                    </div>
                  </div>

                  {/* Grid overlay */}
                  {showGrid && (
                    <div 
                      className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                        transform: 'perspective(500px) rotateX(60deg)',
                        transformOrigin: 'bottom'
                      }}
                    />
                  )}

                  {/* Info overlay */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur rounded-lg p-3 text-white text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span>Position: 5.3599° N, -4.0083° W</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mountain className="h-3 w-3 text-primary" />
                      <span>Altitude: 0 - 150 m</span>
                    </div>
                  </div>

                  {/* Compass */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur rounded-lg p-2">
                    <div className="w-12 h-12 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500" />
                      </div>
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 text-white text-xs font-bold">N</span>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white text-xs">S</span>
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white text-xs">O</span>
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-white text-xs">E</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <Card className="w-full lg:w-80 flex flex-col">
        <Tabs defaultValue="tools" className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <TabsList className="w-full">
              <TabsTrigger value="tools" className="flex-1">Outils</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">Paramètres</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden p-0">
            <TabsContent value="tools" className="m-0 h-full">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Mesures</h4>
                    <div className="space-y-2">
                      {measurementTools.map((tool) => (
                        <Button
                          key={tool.id}
                          variant={activeTool === tool.id ? 'default' : 'outline'}
                          className="w-full justify-start gap-3 h-auto py-3"
                          onClick={() => setActiveTool(tool.id)}
                        >
                          <tool.icon className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-xs text-muted-foreground">{tool.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Fichiers récents</h4>
                    <div className="space-y-2">
                      {['Abidjan_Centre.laz', 'San_Pedro.las', 'Yamoussoukro.laz'].map((file, i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                        >
                          <FolderOpen className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="settings" className="m-0 h-full">
              <ScrollArea className="h-full p-4">
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">Taille des points</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Slider
                        value={pointSize}
                        onValueChange={setPointSize}
                        min={0.5}
                        max={5}
                        step={0.5}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-8">{pointSize[0]}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Budget de points (M)</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Slider
                        value={pointBudget}
                        onValueChange={setPointBudget}
                        min={0.5}
                        max={5}
                        step={0.5}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-8">{pointBudget[0]}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Champ de vision (FOV)</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Slider
                        value={fov}
                        onValueChange={setFov}
                        min={30}
                        max={120}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-8">{fov[0]}°</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Éclairage</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="gap-2">
                        <Sun className="h-4 w-4" />
                        Jour
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Moon className="h-4 w-4" />
                        Nuit
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Rendu</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        Couleur par élévation
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Couleur par intensité
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Couleur par classification
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <style jsx global>{`
        @keyframes rotate {
          from { transform: rotateX(-20deg) rotateY(0deg); }
          to { transform: rotateX(-20deg) rotateY(360deg); }
        }
      `}</style>
    </div>
  )
}
