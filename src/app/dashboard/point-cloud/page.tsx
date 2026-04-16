'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
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
  Moon,
  Loader2,
} from 'lucide-react'
import { FileUpload } from '@/components/file-upload'
import { useFileStore } from '@/lib/file-store'
import { toast } from 'sonner'

// Dynamic import for Potree to avoid SSR
const PotreeViewer = dynamic(
  () => import('@/components/potree-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement du visualiseur 3D...</p>
        </div>
      </div>
    ),
  }
)

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
  const [pointSize, setPointSize] = useState([2])
  const [pointBudget, setPointBudget] = useState([1.5])
  const [fov, setFov] = useState([75])
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [edlEnabled, setEdlEnabled] = useState(true)
  const [edlStrength, setEdlStrength] = useState([1.0])
  const [nightMode, setNightMode] = useState(false)
  
  const { files, addFile } = useFileStore()
  const lasFiles = files.filter(f => f.type === 'las' || f.type === 'laz')

  const handleToolSelect = (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId)
    // Tool activation will be handled by the Potree viewer
  }

  const handleFileUpload = (file: { id: string; name: string; type: string }) => {
    if (file.type === 'las' || file.type === 'laz') {
      toast.info('Le fichier a été importé. Le chargement direct de LAS/LAZ nécessite une conversion.')
    }
  }

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
                    <span className="hidden sm:inline">{preset.name}</span>
                  </Button>
                ))}
              </div>

              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Afficher/Masquer la grille" 
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Layers className={`h-4 w-4 ${showGrid ? 'text-primary' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Mode jour/nuit"
                  onClick={() => setNightMode(!nightMode)}
                >
                  {nightMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
            <Suspense
              fallback={
                <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Chargement du visualiseur 3D...</p>
                  </div>
                </div>
              }
            >
              <PotreeViewer
                className="w-full h-full min-h-[400px] rounded-lg"
                onPointCloudLoad={(pc) => {
                  console.log('Point cloud loaded:', pc)
                }}
                onMeasurement={(type, value) => {
                  console.log('Measurement:', type, value)
                }}
              />
            </Suspense>
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
              <TabsTrigger value="import" className="flex-1">Import</TabsTrigger>
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
                          onClick={() => handleToolSelect(tool.id)}
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
                    {lasFiles.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun fichier importé</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {lasFiles.map((file) => (
                          <div 
                            key={file.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                          >
                            <FolderOpen className="h-4 w-4 text-primary" />
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Eye-Dome Lighting</Label>
                      <Switch
                        checked={edlEnabled}
                        onCheckedChange={setEdlEnabled}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Améliore la perception de profondeur
                    </p>
                  </div>

                  {edlEnabled && (
                    <div>
                      <Label className="text-sm font-medium">Intensité EDL</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <Slider
                          value={edlStrength}
                          onValueChange={setEdlStrength}
                          min={0}
                          max={3}
                          step={0.1}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-8">{edlStrength[0].toFixed(1)}</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Éclairage</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={nightMode ? 'outline' : 'default'} 
                        className="gap-2"
                        onClick={() => setNightMode(false)}
                      >
                        <Sun className="h-4 w-4" />
                        Jour
                      </Button>
                      <Button 
                        variant={nightMode ? 'default' : 'outline'} 
                        className="gap-2"
                        onClick={() => setNightMode(true)}
                      >
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
                      <Button variant="outline" className="w-full justify-start">
                        Couleur RVB
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="import" className="m-0 h-full">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  <FileUpload
                    acceptedTypes={['las', 'laz']}
                    onFileUpload={handleFileUpload}
                    maxSize={500 * 1024 * 1024}
                  />

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-2">Formats supportés</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-primary" />
                        <span>LAS (.las) - Standard LiDAR</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-primary" />
                        <span>LAZ (.laz) - LAS compressé</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">Note</h4>
                    <p className="text-xs text-muted-foreground">
                      Les fichiers LAS/LAZ doivent être convertis au format Potree (conversion en tuiles) 
                      pour être visualisés. Cette conversion nécessite un traitement côté serveur.
                    </p>
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
