'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
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
  ChevronRight,
  X,
  Map,
  AlertCircle,
} from 'lucide-react'
import { FileUpload } from '@/components/file-upload'
import { useFileStore, formatFileSize, formatAnalysisSummary, type GeoFile, type FileAnalysis } from '@/lib/file-store'
import { toast } from 'sonner'
import { BarChart3, MapPin, Ruler, Box, Layers, FileDown, Table, FileCode2 } from 'lucide-react'
import { exportJSON, exportCSV, exportHTMLReport } from '@/lib/export-utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'

// File type icons and colors
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

// PDF Viewer Component
function PDFViewer({ url, fileName }: { url: string; fileName: string }) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        
        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
        
        const loadingTask = pdfjsLib.getDocument(url)
        const pdf = await loadingTask.promise
        setNumPages(pdf.numPages)
        
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale })
        
        const canvas = canvasRef.current
        if (canvas) {
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width
          
          const renderContext = {
            canvasContext: context!,
            viewport: viewport,
          }
          
          await page.render(renderContext).promise
        }
        
        setLoading(false)
      } catch (err) {
        console.error('PDF loading error:', err)
        setError('Erreur lors du chargement du PDF')
        setLoading(false)
      }
    }
    
    loadPDF()
  }, [url, scale])

  const goToPage = async (page: number) => {
    if (!numPages || page < 1 || page > numPages) return
    
    try {
      const pdfjsLib = await import('pdfjs-dist')
      const loadingTask = pdfjsLib.getDocument(url)
      const pdf = await loadingTask.promise
      const pdfPage = await pdf.getPage(page)
      const viewport = pdfPage.getViewport({ scale })
      
      const canvas = canvasRef.current
      if (canvas) {
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        await pdfPage.render({
          canvasContext: context!,
          viewport: viewport,
        }).promise
      }
      
      setPageNumber(page)
    } catch (err) {
      console.error('Page navigation error:', err)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chargement du PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" asChild>
            <a href={url} download={fileName}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto flex justify-center bg-muted/50">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
      {numPages && (
        <div className="flex items-center justify-center gap-4 p-4 border-t">
          <Button variant="outline" size="icon" onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} / {numPages}
          </span>
          <Button variant="outline" size="icon" onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{(scale * 100).toFixed(0)}%</span>
          <Button variant="outline" size="icon" onClick={() => setScale(s => Math.min(3, s + 0.25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Image Viewer Component
function ImageViewer({ url, fileName }: { url: string; fileName: string }) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetView = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div 
        className="flex-1 overflow-hidden bg-muted/50 relative cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <img
            ref={imageRef}
            src={url}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 p-4 border-t">
        <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(0.25, s - 0.25))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm w-12 text-center">{(scale * 100).toFixed(0)}%</span>
        <Button variant="outline" size="icon" onClick={() => setScale(s => Math.min(5, s + 0.25))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="outline" size="icon" onClick={() => setRotation(r => r - 90)}>
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={resetView}>
          Réinitialiser
        </Button>
      </div>
    </div>
  )
}

// Video Viewer Component
function VideoViewer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime
      setCurrentTime(newTime)
      setProgress((newTime / videoRef.current.duration) * 100)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = percent * videoRef.current.duration
    }
  }

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen()
  }

  return (
    <div className="w-full h-full flex flex-col bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={url}
        className="flex-1 w-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
        <div 
          className="h-1 bg-white/30 rounded-full cursor-pointer mb-3"
          onClick={handleSeek}
        >
          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <span className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="text-white" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white"
            onClick={handleFullscreen}
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// GeoTIFF Viewer Component (simplified - shows as image for now)
function GeoTIFFViewer({ url, fileName }: { url: string; fileName: string }) {
  const [metadata, setMetadata] = useState<{
    width?: number
    height?: number
    projection?: string
    bounds?: [number, number, number, number]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGeoTIFF = async () => {
      try {
        const georaster = await import('georaster')
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const geoRaster = await georaster.default(arrayBuffer)
        
        setMetadata({
          width: geoRaster.width,
          height: geoRaster.height,
          projection: geoRaster.projection,
          bounds: geoRaster.xmin && geoRaster.ymax ? 
            [geoRaster.xmin, geoRaster.ymin, geoRaster.xmax, geoRaster.ymax] : 
            undefined,
        })
      } catch (err) {
        console.error('GeoTIFF loading error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadGeoTIFF()
  }, [url])

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <Map className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium mb-2">{fileName}</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement des métadonnées...</p>
          ) : metadata && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Dimensions: {metadata.width} × {metadata.height}</p>
              {metadata.projection && <p>Projection: {metadata.projection}</p>}
              {metadata.bounds && (
                <p>Bounds: [{metadata.bounds.map(b => b.toFixed(2)).join(', ')}]</p>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Pour visualiser les GeoTIFF sur une carte, utilisez le module GIS
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<GeoFile | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  
  const { files, addFile, removeFile, selectFile } = useFileStore()

  // Filter files based on tab and search
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'images' && (file.type === 'image' || file.type === 'geotiff')) ||
      (activeTab === 'videos' && file.type === 'video') ||
      (activeTab === 'documents' && file.type === 'pdf')
    return matchesSearch && matchesTab
  })

  // Handle file upload
  const handleFileUpload = useCallback((file: GeoFile) => {
    // File is already added to the store by FileUpload component
    toast.success(`Fichier "${file.name}" importé`)
  }, [])

  // Handle file selection
  const handleSelectFile = useCallback((file: GeoFile) => {
    setSelectedFile(file)
    selectFile(file.id)
  }, [selectFile])

  // Handle file deletion
  const handleDeleteFile = useCallback((file: GeoFile) => {
    removeFile(file.id)
    if (selectedFile?.id === file.id) {
      setSelectedFile(null)
    }
    toast.success('Fichier supprimé')
  }, [removeFile, selectedFile])

  // Download file
  const downloadFile = useCallback((file: GeoFile) => {
    if (file.url) {
      const a = document.createElement('a')
      a.href = file.url
      a.download = file.name
      a.click()
    }
  }, [])

  // Export all files as CSV
  const exportFilesCSV = useCallback(() => {
    const rows = filteredFiles.map(f => ({
      Nom: f.name,
      Type: f.type,
      Taille: formatFileSize(f.size),
      Date: f.createdAt.toLocaleDateString('fr-FR'),
      Statut: f.analysis?.status ?? 'N/A',
      Résumé: f.analysis ? formatAnalysisSummary(f.analysis) : '',
    }))
    exportCSV(rows, `bibliotheque_fichiers_${new Date().toISOString().substring(0,10)}.csv`)
    toast.success(`${rows.length} fichiers exportés en CSV`)
  }, [filteredFiles])

  // Export all files as JSON
  const exportFilesJSON = useCallback(() => {
    const data = filteredFiles.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      sizeBytes: f.size,
      formattedSize: formatFileSize(f.size),
      createdAt: f.createdAt.toISOString(),
      url: f.url,
      analysis: f.analysis,
      metadata: f.metadata,
    }))
    exportJSON(data, `bibliotheque_fichiers_${new Date().toISOString().substring(0,10)}.json`)
    toast.success(`${data.length} fichiers exportés en JSON`)
  }, [filteredFiles])

  // Export selected file as HTML report
  const exportFileReport = useCallback((file: GeoFile) => {
    const sections = [
      {
        heading: 'Informations générales',
        rows: [
          ['Nom', file.name],
          ['Type', file.type.toUpperCase()],
          ['Taille', formatFileSize(file.size)],
          ['Date d\'import', file.createdAt.toLocaleDateString('fr-FR')],
        ] as [string, string][]
      },
    ]
    if (file.analysis?.status === 'completed') {
      const a = file.analysis
      const analysisRows: [string, string][] = [['Statut', 'Analyse complète']]
      if (a.pointCloud?.pointCount) analysisRows.push(['Points', a.pointCloud.pointCount.toLocaleString()])
      if (a.pointCloud?.avgDensity) analysisRows.push(['Densité', `${a.pointCloud.avgDensity.toFixed(2)} pts/m²`])
      if (a.image?.width) analysisRows.push(['Dimensions', `${a.image.width} × ${a.image.height} px`])
      if (a.geometry?.featureCount) analysisRows.push(['Éléments', String(a.geometry.featureCount)])
      if (a.geometry?.totalArea) analysisRows.push(['Surface', `${(a.geometry.totalArea / 10000).toFixed(2)} ha`])
      if (a.boundingBox) {
        analysisRows.push(['Zone Lat', `${a.boundingBox.minLat.toFixed(4)}° — ${a.boundingBox.maxLat.toFixed(4)}°`])
        analysisRows.push(['Zone Lng', `${a.boundingBox.minLng.toFixed(4)}° — ${a.boundingBox.maxLng.toFixed(4)}°`])
      }
      sections.push({ heading: 'Résultats d\'analyse', rows: analysisRows })
    }
    exportHTMLReport(`Rapport – ${file.name}`, sections, `rapport_${file.name.replace(/\s/g,'_')}.html`)
    toast.success('Rapport HTML généré')
  }, [])

  // Render preview based on file type
  const renderPreview = () => {
    if (!selectedFile || !selectedFile.url) return null

    switch (selectedFile.type) {
      case 'pdf':
        return <PDFViewer url={selectedFile.url} fileName={selectedFile.name} />
      case 'image':
        return <ImageViewer url={selectedFile.url} fileName={selectedFile.name} />
      case 'video':
        return <VideoViewer url={selectedFile.url} />
      case 'geotiff':
        return <GeoTIFFViewer url={selectedFile.url} fileName={selectedFile.name} />
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <File className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aperçu non disponible pour ce type de fichier</p>
            </div>
          </div>
        )
    }
  }

  // Calculate storage stats
  const totalSize = files.reduce((acc, f) => acc + f.size, 0)
  const storageUsed = Math.min((totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100) // 10GB limit

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
          {/* Export dropdown for the whole library */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={filteredFiles.length === 0}>
                <FileDown className="h-4 w-4" />
                Exporter bibliothèque
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportFilesCSV} className="gap-2 cursor-pointer">
                <Table className="h-4 w-4" /> Tableau CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportFilesJSON} className="gap-2 cursor-pointer">
                <FileCode2 className="h-4 w-4" /> JSON complet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* File browser */}
        <Card className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">Tous ({files.length})</TabsTrigger>
                  <TabsTrigger value="images">Images ({files.filter(f => f.type === 'image' || f.type === 'geotiff').length})</TabsTrigger>
                  <TabsTrigger value="videos">Vidéos ({files.filter(f => f.type === 'video').length})</TabsTrigger>
                  <TabsTrigger value="documents">Documents ({files.filter(f => f.type === 'pdf').length})</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground">Aucun fichier</p>
                    <p className="text-sm text-muted-foreground mt-1">Importez des fichiers pour commencer</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredFiles.map((file) => {
                      const Icon = getFileIcon(file.type)
                      const color = getFileColor(file.type)
                      return (
                        <Card 
                          key={file.id}
                          className={`cursor-pointer hover:shadow-md transition-all ${selectedFile?.id === file.id ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => handleSelectFile(file)}
                        >
                          <CardContent className="p-4">
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                              {file.type === 'image' && file.url ? (
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                              ) : file.type === 'video' ? (
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
                              <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                              <Badge variant="secondary" className="text-xs uppercase">
                                {file.type}
                              </Badge>
                            </div>
                            {file.analysis && file.analysis.status === 'completed' && (
                              <p className="text-xs text-primary mt-1 truncate">
                                {formatAnalysisSummary(file.analysis)}
                              </p>
                            )}
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
                          className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${selectedFile?.id === file.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                          onClick={() => handleSelectFile(file)}
                        >
                          <Icon className={`h-8 w-8 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground">{file.createdAt.toLocaleDateString()}</p>
                              {file.analysis && file.analysis.status === 'completed' && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <p className="text-xs text-primary">{formatAnalysisSummary(file.analysis)}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="uppercase">{file.type}</Badge>
                          <span className="text-sm text-muted-foreground">{formatFileSize(file.size)}</span>
                          <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFile(file)
                          }}>
                            <Trash2 className="h-4 w-4" />
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
        <Card className="w-96 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedFile ? 'Aperçu' : 'Importer'}
              </CardTitle>
              {selectedFile && (
                <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            {selectedFile ? (
              <>
                {/* Preview */}
                <div className="flex-1 min-h-0">
                  {renderPreview()}
                </div>

                {/* File info */}
                <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent min-h-0">
                  <div>
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted rounded-lg p-2">
                      <p className="text-muted-foreground">Taille</p>
                      <p className="font-medium">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2">
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium uppercase">{selectedFile.type}</p>
                    </div>
                  </div>

                  {selectedFile.metadata && (
                    <div className="bg-muted rounded-lg p-2 text-sm">
                      {selectedFile.metadata.width && selectedFile.metadata.height && (
                        <p>Dimensions: {selectedFile.metadata.width} × {selectedFile.metadata.height}</p>
                      )}
                      {selectedFile.metadata.pages && (
                        <p>Pages: {selectedFile.metadata.pages}</p>
                      )}
                    </div>
                  )}

                  {/* Analysis Results */}
                  {selectedFile.analysis && selectedFile.analysis.status === 'completed' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <BarChart3 className="h-4 w-4" />
                        Analyse automatique
                      </div>
                      
                      <div className="bg-primary/5 rounded-lg p-3 space-y-2 text-sm">
                        {/* Bounding Box */}
                        {selectedFile.analysis.boundingBox && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Zone géographique</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedFile.analysis.boundingBox.minLat.toFixed(4)}° à {selectedFile.analysis.boundingBox.maxLat.toFixed(4)}° N
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selectedFile.analysis.boundingBox.minLng.toFixed(4)}° à {selectedFile.analysis.boundingBox.maxLng.toFixed(4)}° E
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Geometry */}
                        {selectedFile.analysis.geometry && (
                          <div className="flex items-start gap-2">
                            <Layers className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">{selectedFile.analysis.geometry.type}</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedFile.analysis.geometry.featureCount} élément{selectedFile.analysis.geometry.featureCount > 1 ? 's' : ''}
                              </p>
                              {selectedFile.analysis.geometry.totalArea && (
                                <p className="text-xs text-muted-foreground">
                                  Surface: {(selectedFile.analysis.geometry.totalArea / 10000).toFixed(2)} ha
                                </p>
                              )}
                              {selectedFile.analysis.geometry.centroid && (
                                <p className="text-xs text-muted-foreground">
                                  Centre: {selectedFile.analysis.geometry.centroid.lat.toFixed(6)}, {selectedFile.analysis.geometry.centroid.lng.toFixed(6)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Point Cloud */}
                        {selectedFile.analysis.pointCloud && (
                          <div className="flex items-start gap-2">
                            <Box className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Nuage de points</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedFile.analysis.pointCloud.pointCount.toLocaleString()} points
                              </p>
                              {selectedFile.analysis.pointCloud.elevationRange && (
                                <p className="text-xs text-muted-foreground">
                                  Élévation: {selectedFile.analysis.pointCloud.elevationRange.min.toFixed(1)}m - {selectedFile.analysis.pointCloud.elevationRange.max.toFixed(1)}m
                                </p>
                              )}
                              {selectedFile.analysis.pointCloud.avgDensity && (
                                <p className="text-xs text-muted-foreground">
                                  Densité: {selectedFile.analysis.pointCloud.avgDensity.toFixed(2)} pts/m²
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Image */}
                        {selectedFile.analysis.image && (
                          <div className="flex items-start gap-2">
                            <Image className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Image</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedFile.analysis.image.width} × {selectedFile.analysis.image.height} px
                              </p>
                              {selectedFile.analysis.image.hasGps && (
                                <p className="text-xs text-green-600">Données GPS détectées</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Video */}
                        {selectedFile.analysis.video && (
                          <div className="flex items-start gap-2">
                            <Video className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Vidéo</p>
                              <p className="text-xs text-muted-foreground">
                                Durée: {Math.floor(selectedFile.analysis.video.duration / 60)}:{Math.floor(selectedFile.analysis.video.duration % 60).toString().padStart(2, '0')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Résolution: {selectedFile.analysis.video.width} × {selectedFile.analysis.video.height}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Document */}
                        {selectedFile.analysis.document && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Document</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedFile.analysis.document.pages} page{selectedFile.analysis.document.pages > 1 ? 's' : ''}
                              </p>
                              {selectedFile.analysis.document.hasGeospatial && (
                                <p className="text-xs text-green-600">Contenu géospatial détecté</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Calculations */}
                        {selectedFile.analysis.calculations && (
                          <div className="flex items-start gap-2">
                            <Ruler className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Calculs</p>
                              {selectedFile.analysis.calculations.totalArea && (
                                <p className="text-xs text-muted-foreground">
                                  Surface: {(selectedFile.analysis.calculations.totalArea / 10000).toFixed(2)} ha
                                </p>
                              )}
                              {selectedFile.analysis.calculations.totalDistance && (
                                <p className="text-xs text-muted-foreground">
                                  Distance: {(selectedFile.analysis.calculations.totalDistance / 1000).toFixed(2)} km
                                </p>
                              )}
                              {selectedFile.analysis.calculations.pointDensity && (
                                <p className="text-xs text-muted-foreground">
                                  Densité: {selectedFile.analysis.calculations.pointDensity.toFixed(2)} pts/m²
                                </p>
                              )}
                              {selectedFile.analysis.calculations.coverageArea && (
                                <p className="text-xs text-muted-foreground">
                                  Couverture: {(selectedFile.analysis.calculations.coverageArea / 10000).toFixed(2)} ha
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full gap-2" onClick={() => downloadFile(selectedFile)}>
                    <Download className="h-4 w-4" />
                    Télécharger le fichier
                  </Button>
                  {/* Export report for the selected file */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <FileDown className="h-4 w-4" />
                        Exporter fiche
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Format</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => exportFileReport(selectedFile)} className="gap-2 cursor-pointer">
                        <FileText className="h-4 w-4 text-blue-500" /> Rapport HTML
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        exportJSON({
                          name: selectedFile.name, type: selectedFile.type,
                          size: selectedFile.size, createdAt: selectedFile.createdAt,
                          analysis: selectedFile.analysis, metadata: selectedFile.metadata
                        }, `fiche_${selectedFile.name}.json`)
                        toast.success('Fiche JSON exportée')
                      }} className="gap-2 cursor-pointer">
                        <FileCode2 className="h-4 w-4 text-green-500" /> JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 text-destructive" 
                    onClick={() => handleDeleteFile(selectedFile)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col">
                <FileUpload
                  acceptedTypes={['pdf', 'image', 'video', 'geotiff']}
                  onFileUpload={handleFileUpload}
                  multiple
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Storage info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Stockage utilisé</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(totalSize)} sur 10 GB</p>
              </div>
            </div>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${storageUsed}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
