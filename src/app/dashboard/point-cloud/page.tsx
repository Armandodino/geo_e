'use client'

import { Suspense, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Upload, 
  Box, 
  Mountain, 
  Ruler, 
  Layers, 
  Building2, 
  TreePine, 
  Map, 
  Camera,
  FileUp,
  BarChart3,
  Crosshair,
  Database,
} from 'lucide-react'
import { FileUpload } from '@/components/file-upload'
import { useFileStore, formatFileSize, type GeoFile } from '@/lib/file-store'
import { toast } from 'sonner'

// Dynamic import for 3D viewer to avoid SSR
const PotreeViewer = dynamic(
  () => import('@/components/potree-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] bg-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement du visualiseur 3D...</p>
        </div>
      </div>
    ),
  }
)

// Demo point cloud data
const DEMO_POINT_CLOUDS = [
  {
    id: 'terrain',
    name: 'Terrain - Abidjan',
    description: 'Modèle numérique de terrain (MNT) d\'une zone urbaine',
    icon: Mountain,
    points: 50000,
    extent: '100m x 100m',
    elevation: '0m - 20m',
    features: ['Terrain naturel', 'Végétation', 'Éléments urbains'],
  },
  {
    id: 'building',
    name: 'Bâtiment - Centre commercial',
    description: 'Scan 3D d\'un bâtiment commercial',
    icon: Building2,
    points: 80000,
    extent: '40m x 40m',
    elevation: '0m - 35m',
    features: ['Façades', 'Toiture', 'Détails architecturaux'],
  },
  {
    id: 'forest',
    name: 'Zone forestière',
    description: 'Scan LiDAR d\'une zone forestière',
    icon: TreePine,
    points: 60000,
    extent: '100m x 100m',
    elevation: '0m - 18m',
    features: ['Couvert forestier', 'Troncs', 'Sous-bois'],
  },
]

// Sample data information
const SAMPLE_DATA_INFO = [
  {
    name: 'Abidjan_2024.laz',
    size: '245 MB',
    points: '12.5M',
    description: 'Levant aerien du district d\'Abidjan',
    available: true,
  },
  {
    name: 'SanPedro_port.laz',
    size: '180 MB',
    points: '8.2M',
    description: 'Scan du port de San Pedro',
    available: true,
  },
  {
    name: 'Yamoussoukro_centre.laz',
    size: '95 MB',
    points: '4.8M',
    description: 'Centre ville de Yamoussoukro',
    available: false,
  },
]

export default function PointCloudPage() {
  const [activeTab, setActiveTab] = useState('viewer')
  const [selectedDemo, setSelectedDemo] = useState(DEMO_POINT_CLOUDS[0])
  
  const { files, addFile } = useFileStore()
  const pointCloudFiles = files.filter(f => f.type === 'las' || f.type === 'laz')

  const handleFileUpload = useCallback((file: GeoFile) => {
    toast.success(`Fichier "${file.name}" importé - ${formatFileSize(file.size)}`)
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nuages de Points 3D</h1>
            <p className="text-muted-foreground">
              Visualisation et analyse de données LiDAR et photogrammétriques
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Database className="h-3 w-3" />
              {pointCloudFiles.length} fichiers
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left sidebar - Demo data & Upload */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Données
            </CardTitle>
            <CardDescription>
              Scènes de démonstration et vos fichiers
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <Tabs defaultValue="demo" className="h-full flex flex-col">
              <div className="px-4 pt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="demo" className="flex-1">Démo</TabsTrigger>
                  <TabsTrigger value="upload" className="flex-1">Import</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="demo" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Scènes de démonstration interactives pour explorer les fonctionnalités.
                    </p>
                    
                    {DEMO_POINT_CLOUDS.map((demo) => (
                      <Card 
                        key={demo.id}
                        className={`cursor-pointer transition-all ${
                          selectedDemo.id === demo.id 
                            ? 'ring-2 ring-primary' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedDemo(demo)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <demo.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{demo.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {demo.description}
                              </p>
                            </div>
                          </div>
                          
                          {selectedDemo.id === demo.id && (
                            <div className="mt-3 pt-3 border-t space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Points:</span>
                                  <p className="font-medium">{demo.points.toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Emprise:</span>
                                  <p className="font-medium">{demo.extent}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Élévation:</span>
                                  <p className="font-medium">{demo.elevation}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {demo.features.map((f, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {f}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="upload" className="flex-1 m-0 overflow-hidden p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Importer vos fichiers</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Formats supportés: LAS, LAZ (jusqu'à 500 Mo)
                    </p>
                  </div>

                  <FileUpload
                    acceptedTypes={['las', 'laz']}
                    onFileUpload={handleFileUpload}
                    multiple
                    maxSize={500 * 1024 * 1024}
                  />

                  {/* Sample data */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Données d'exemple
                    </h4>
                    <div className="space-y-2">
                      {SAMPLE_DATA_INFO.map((data, i) => (
                        <div 
                          key={i}
                          className={`p-3 rounded-lg border ${data.available ? 'cursor-pointer hover:border-primary/50' : 'opacity-50'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{data.name}</p>
                              <p className="text-xs text-muted-foreground">{data.description}</p>
                            </div>
                            {data.available ? (
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-xs">Bientôt</Badge>
                            )}
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{data.size}</span>
                            <span>{data.points} points</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Your files */}
                  {pointCloudFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Vos fichiers</h4>
                      <div className="space-y-2">
                        {pointCloudFiles.map((file) => (
                          <div 
                            key={file.id}
                            className="p-3 rounded-lg border hover:border-primary/50 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm truncate flex-1">{file.name}</span>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{formatFileSize(file.size)}</span>
                              {file.analysis?.pointCloud?.pointCount && (
                                <span>{file.analysis.pointCloud.pointCount.toLocaleString()} pts</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main viewer */}
        <Card className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="viewer" className="gap-2">
                    <Box className="h-4 w-4" />
                    Visualiseur 3D
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analyse
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Camera className="h-3 w-3" />
                    {selectedDemo.name}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <TabsContent value="viewer" className="h-full m-0">
                <Suspense
                  fallback={
                    <div className="w-full h-full min-h-[500px] bg-slate-900 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p>Initialisation du visualiseur 3D...</p>
                      </div>
                    </div>
                  }
                >
                  <PotreeViewer className="h-full min-h-[500px] rounded-lg" />
                </Suspense>
              </TabsContent>

              <TabsContent value="analysis" className="h-full m-0 p-6 overflow-auto">
                <div className="space-y-6">
                  {/* Point cloud info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Informations du nuage de points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Nombre de points</p>
                          <p className="text-2xl font-bold">{selectedDemo.points.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Emprise</p>
                          <p className="text-2xl font-bold">{selectedDemo.extent}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Élévation min</p>
                          <p className="text-2xl font-bold">{selectedDemo.elevation.split(' - ')[0]}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Élévation max</p>
                          <p className="text-2xl font-bold">{selectedDemo.elevation.split(' - ')[1]}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analysis tools */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Ruler className="h-5 w-5" />
                        Outils de mesure
                      </CardTitle>
                      <CardDescription>
                        Utilisez le visualiseur 3D pour effectuer des mesures
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { icon: Ruler, name: 'Distance', desc: 'Distance 3D entre deux points' },
                          { icon: Mountain, name: 'Hauteur', desc: 'Différence d\'élévation' },
                          { icon: Box, name: 'Volume', desc: 'Volume d\'une zone' },
                          { icon: Crosshair, name: 'Angle', desc: 'Angle entre trois points' },
                        ].map((tool, i) => (
                          <div key={i} className="p-4 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors">
                            <tool.icon className="h-8 w-8 text-primary mb-2" />
                            <p className="font-medium">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">{tool.desc}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Classification */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Classification des points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { label: 'Sol', color: 'bg-amber-500', percent: 35 },
                          { label: 'Végétation basse', color: 'bg-green-400', percent: 20 },
                          { label: 'Végétation haute', color: 'bg-green-600', percent: 25 },
                          { label: 'Bâtiments', color: 'bg-slate-500', percent: 15 },
                          { label: 'Eau', color: 'bg-blue-500', percent: 3 },
                          { label: 'Non classifié', color: 'bg-gray-400', percent: 2 },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded ${item.color}`} />
                            <span className="flex-1 text-sm">{item.label}</span>
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">{item.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Density map */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Densité de points</CardTitle>
                      <CardDescription>
                        Distribution spatiale des points
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: 25 }).map((_, i) => {
                          const density = Math.random()
                          const color = density > 0.8 ? 'bg-green-600' 
                            : density > 0.6 ? 'bg-green-500' 
                            : density > 0.4 ? 'bg-green-400' 
                            : density > 0.2 ? 'bg-green-300' 
                            : 'bg-green-200'
                          return (
                            <div 
                              key={i} 
                              className={`aspect-square rounded ${color} opacity-80`}
                              title={`Densité: ${(density * 100).toFixed(0)}%`}
                            />
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Faible densité</span>
                        <span>Forte densité</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Right sidebar - Quick info */}
        <Card className="w-64 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Points totaux</p>
                <p className="text-xl font-bold">{selectedDemo.points.toLocaleString()}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Emprise au sol</p>
                <p className="text-xl font-bold">{selectedDemo.extent}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Plage d'élévation</p>
                <p className="text-xl font-bold">{selectedDemo.elevation}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Éléments détectés</h4>
              <div className="space-y-2">
                {selectedDemo.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Qualité des données</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Précision</span>
                  <Badge variant="secondary">±5cm</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Densité</span>
                  <Badge variant="secondary">15 pts/m²</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Couverture</span>
                  <Badge variant="secondary">98%</Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Actions rapides</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Ruler className="h-4 w-4" />
                  Mesurer une distance
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Box className="h-4 w-4" />
                  Calculer un volume
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Layers className="h-4 w-4" />
                  Exporter la vue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Missing import
function Download({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
