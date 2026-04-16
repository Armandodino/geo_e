'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  Image, 
  Video, 
  Upload, 
  Search, 
  Grid, 
  List, 
  FolderOpen, 
  File, 
  Download, 
  Trash2, 
  Eye, 
  MoreVertical,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const mediaFiles = [
  { id: 1, name: 'Orthophoto_Abidjan.tif', type: 'geotiff', size: '1.2 GB', date: '2024-01-15', thumbnail: null },
  { id: 2, name: 'Rapport_Analyse.pdf', type: 'pdf', size: '2.3 MB', date: '2024-01-14', thumbnail: null },
  { id: 3, name: 'Vue_Aerienne.png', type: 'image', size: '15 MB', date: '2024-01-13', thumbnail: null },
  { id: 4, name: 'Inspection_Drone.mp4', type: 'video', size: '450 MB', date: '2024-01-12', thumbnail: null },
  { id: 5, name: 'Carte_Zone.jpg', type: 'image', size: '8 MB', date: '2024-01-11', thumbnail: null },
  { id: 6, name: 'Documentation.pdf', type: 'pdf', size: '1.5 MB', date: '2024-01-10', thumbnail: null },
  { id: 7, name: 'Orthophoto_SanPedro.tif', type: 'geotiff', size: '890 MB', date: '2024-01-09', thumbnail: null },
  { id: 8, name: 'Interview_Expert.mp4', type: 'video', size: '280 MB', date: '2024-01-08', thumbnail: null },
]

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return FileText
    case 'image':
    case 'geotiff':
      return Image
    case 'video':
      return Video
    default:
      return File
  }
}

const getFileColor = (type: string) => {
  switch (type) {
    case 'pdf':
      return 'text-red-500'
    case 'image':
      return 'text-green-500'
    case 'geotiff':
      return 'text-purple-500'
    case 'video':
      return 'text-blue-500'
    default:
      return 'text-gray-500'
  }
}

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'images' && (file.type === 'image' || file.type === 'geotiff')) ||
      (activeTab === 'videos' && file.type === 'video') ||
      (activeTab === 'documents' && file.type === 'pdf')
    return matchesSearch && matchesTab
  })

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Visionneuse Média</h1>
          <p className="text-muted-foreground">Gérez vos fichiers et documents</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Importer
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* File browser */}
        <Card className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <TabsList>
                <TabsTrigger value="all">Tous ({mediaFiles.length})</TabsTrigger>
                <TabsTrigger value="images">Images ({mediaFiles.filter(f => f.type === 'image' || f.type === 'geotiff').length})</TabsTrigger>
                <TabsTrigger value="videos">Vidéos ({mediaFiles.filter(f => f.type === 'video').length})</TabsTrigger>
                <TabsTrigger value="documents">Documents ({mediaFiles.filter(f => f.type === 'pdf').length})</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredFiles.map((file) => {
                      const Icon = getFileIcon(file.type)
                      const color = getFileColor(file.type)
                      return (
                        <Card 
                          key={file.id}
                          className={`cursor-pointer hover:shadow-md transition-all ${selectedFile === file.id ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => setSelectedFile(file.id)}
                        >
                          <CardContent className="p-4">
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-3">
                              {file.type === 'video' ? (
                                <div className="relative">
                                  <Icon className={`h-12 w-12 ${color}`} />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-8 w-8 bg-white/80 rounded-full flex items-center justify-center">
                                      <Play className="h-4 w-4 text-slate-900" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <Icon className={`h-12 w-12 ${color}`} />
                              )}
                            </div>
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">{file.size}</span>
                              <Badge variant="secondary" className="text-xs uppercase">
                                {file.type}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFiles.map((file) => {
                      const Icon = getFileIcon(file.type)
                      const color = getFileColor(file.type)
                      return (
                        <div 
                          key={file.id}
                          className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${selectedFile === file.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                          onClick={() => setSelectedFile(file.id)}
                        >
                          <Icon className={`h-8 w-8 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{file.date}</p>
                          </div>
                          <Badge variant="secondary" className="uppercase">{file.type}</Badge>
                          <span className="text-sm text-muted-foreground">{file.size}</span>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Tabs>
        </Card>

        {/* Preview panel */}
        {selectedFile && (
          <Card className="w-80 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Aperçu</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {/* Preview area */}
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {(() => {
                  const file = mediaFiles.find(f => f.id === selectedFile)
                  if (!file) return null
                  const Icon = getFileIcon(file.type)
                  const color = getFileColor(file.type)
                  
                  if (file.type === 'video') {
                    return (
                      <div className="relative w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-sm text-white/70">Aperçu vidéo</p>
                        </div>
                        {/* Video controls overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => setIsPlaying(!isPlaying)}>
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <div className="flex-1 h-1 bg-white/30 rounded-full">
                              <div className="w-1/3 h-full bg-primary rounded-full" />
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => setIsMuted(!isMuted)}>
                              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                              <Maximize className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  return <Icon className={`h-16 w-16 ${color}`} />
                })()}
              </div>

              {/* File info */}
              {(() => {
                const file = mediaFiles.find(f => f.id === selectedFile)
                if (!file) return null
                
                return (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{file.date}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted rounded-lg p-2">
                        <p className="text-muted-foreground">Taille</p>
                        <p className="font-medium">{file.size}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium uppercase">{file.type}</p>
                      </div>
                    </div>

                    {/* Image controls */}
                    {(file.type === 'image' || file.type === 'geotiff') && (
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* PDF controls */}
                    {file.type === 'pdf' && (
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">1 / 24</span>
                        <Button variant="outline" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="flex-1" />

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full gap-2">
                  <Eye className="h-4 w-4" />
                  Ouvrir
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Télécharger
                  </Button>
                  <Button variant="outline" className="gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Storage info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Stockage utilisé</p>
                <p className="text-xs text-muted-foreground">4.2 GB sur 10 GB</p>
              </div>
            </div>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div className="w-[42%] h-full bg-primary rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
