'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Loader2, 
  Box, 
  Mountain, 
  Building2, 
  TreePine, 
  Layers, 
  ChevronLeft,
  ChevronRight,
  Database,
  Ruler,
  BarChart3,
  Camera,
  FileImage,
  Calendar,
  HardDrive,
  MapPin,
  Info,
  Eye,
  EyeOff,
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
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement du visualiseur 3D...</p>
        </div>
      </div>
    ),
  }
)

// Demo point cloud data with thumbnails
const DEMO_POINT_CLOUDS = [
  {
    id: 'terrain',
    name: 'Terrain - Abidjan',
    description: 'MNT zone urbaine',
    icon: Mountain,
    points: 50000,
    extent: '100m x 100m',
    elevation: '0m - 20m',
    thumbnail: '/thumbnails/terrain.jpg',
    color: 'from-green-500 to-emerald-600',
    features: ['Terrain naturel', 'Végétation', 'Éléments urbains'],
    date: '2024-01-15',
    size: '45 MB',
    quality: '±5cm',
    density: '15 pts/m²',
  },
  {
    id: 'building',
    name: 'Bâtiment - Centre commercial',
    description: 'Scan 3D bâtiment',
    icon: Building2,
    points: 80000,
    extent: '40m x 40m',
    elevation: '0m - 35m',
    thumbnail: '/thumbnails/building.jpg',
    color: 'from-blue-500 to-indigo-600',
    features: ['Façades', 'Toiture', 'Détails architecturaux'],
    date: '2024-02-20',
    size: '72 MB',
    quality: '±3cm',
    density: '25 pts/m²',
  },
  {
    id: 'forest',
    name: 'Zone forestière',
    description: 'Scan LiDAR forêt',
    icon: TreePine,
    points: 60000,
    extent: '100m x 100m',
    elevation: '0m - 18m',
    thumbnail: '/thumbnails/forest.jpg',
    color: 'from-lime-500 to-green-600',
    features: ['Couvert forestier', 'Troncs', 'Sous-bois'],
    date: '2024-03-10',
    size: '58 MB',
    quality: '±8cm',
    density: '12 pts/m²',
  },
]

// Stats overlay component
function StatsOverlay({ data }: { data: typeof DEMO_POINT_CLOUDS[0] | null }) {
  if (!data) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
    >
      <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-3 text-white text-sm">
        <Badge variant="outline" className="border-white/30 text-white bg-white/10">
          {data.points.toLocaleString()} pts
        </Badge>
        <span className="font-medium">{data.name}</span>
        <Badge variant="outline" className="border-white/30 text-white bg-white/10">
          {data.extent}
        </Badge>
      </div>
    </motion.div>
  )
}

// Thumbnail card component
function ThumbnailCard({ 
  data, 
  isSelected, 
  onClick 
}: { 
  data: typeof DEMO_POINT_CLOUDS[0]
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full rounded-xl overflow-hidden transition-all ${
        isSelected 
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
          : 'hover:ring-2 hover:ring-primary/50'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Thumbnail background */}
      <div className={`aspect-video bg-gradient-to-br ${data.color} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <data.icon className="h-12 w-12 text-white/80" />
        </div>
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
            <Eye className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="p-3 bg-card text-left">
        <p className="font-medium text-sm truncate">{data.name}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Database className="h-3 w-3" />
          <span>{data.points.toLocaleString()} pts</span>
          <span>•</span>
          <span>{data.size}</span>
        </div>
      </div>
    </motion.button>
  )
}

// Uploaded file thumbnail
function FileThumbnail({ 
  file, 
  isSelected, 
  onClick 
}: { 
  file: GeoFile
  isSelected: boolean
  onClick: () => void 
}) {
  const getTypeIcon = () => {
    switch (file.type) {
      case 'las':
      case 'laz':
        return Box
      default:
        return FileImage
    }
  }
  const Icon = getTypeIcon()

  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full rounded-xl overflow-hidden transition-all ${
        isSelected 
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
          : 'hover:ring-2 hover:ring-primary/50'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Thumbnail background */}
      <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-600 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-12 w-12 text-white/80" />
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
            <Eye className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="p-3 bg-card text-left">
        <p className="font-medium text-sm truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <HardDrive className="h-3 w-3" />
          <span>{formatFileSize(file.size)}</span>
          {file.analysis?.pointCloud?.pointCount && (
            <>
              <span>•</span>
              <span>{file.analysis.pointCloud.pointCount.toLocaleString()} pts</span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  )
}

// Data panel component
function DataPanel({ 
  isOpen, 
  onToggle, 
  selectedDemo,
  onSelectDemo,
  pointCloudFiles,
  selectedFile,
  onSelectFile
}: { 
  isOpen: boolean
  onToggle: () => void
  selectedDemo: typeof DEMO_POINT_CLOUDS[0]
  onSelectDemo: (data: typeof DEMO_POINT_CLOUDS[0]) => void
  pointCloudFiles: GeoFile[]
  selectedFile: GeoFile | null
  onSelectFile: (file: GeoFile | null) => void
}) {
  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 320 : 48 }}
      className="h-full bg-background border-l flex flex-col relative z-20"
    >
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -left-4 top-4 z-30 h-8 w-8 rounded-full border bg-background shadow-md"
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Données</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Scènes démo & fichiers importés
              </p>
            </div>

            {/* Scrollable content */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Demo scenes */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Scènes de démonstration
                  </h3>
                  <div className="space-y-3">
                    {DEMO_POINT_CLOUDS.map((demo) => (
                      <ThumbnailCard
                        key={demo.id}
                        data={demo}
                        isSelected={selectedDemo.id === demo.id && !selectedFile}
                        onClick={() => {
                          onSelectDemo(demo)
                          onSelectFile(null)
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Uploaded files */}
                {pointCloudFiles.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Fichiers importés ({pointCloudFiles.length})
                    </h3>
                    <div className="space-y-3">
                      {pointCloudFiles.map((file) => (
                        <FileThumbnail
                          key={file.id}
                          file={file}
                          isSelected={selectedFile?.id === file.id}
                          onClick={() => onSelectFile(file)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload area */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Importer
                  </h3>
                  <FileUpload
                    acceptedTypes={['las', 'laz']}
                    onFileUpload={(file) => {
                      toast.success(`Fichier "${file.name}" importé`)
                    }}
                    multiple
                    maxSize={500 * 1024 * 1024}
                  />
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4 gap-4"
          >
            <div className="relative">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {DEMO_POINT_CLOUDS.length + pointCloudFiles.length}
              </Badge>
            </div>
            <div className="w-8 h-px bg-border" />
            {DEMO_POINT_CLOUDS.slice(0, 2).map((demo) => (
              <motion.button
                key={demo.id}
                onClick={() => {
                  onSelectDemo(demo)
                  onSelectFile(null)
                  onToggle()
                }}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${demo.color} flex items-center justify-center`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <demo.icon className="h-4 w-4 text-white" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Metadata overlay panel
function MetadataPanel({ 
  data,
  file,
  isOpen,
  onToggle 
}: { 
  data: typeof DEMO_POINT_CLOUDS[0] | null
  file: GeoFile | null
  isOpen: boolean
  onToggle: () => void 
}) {
  const displayData = file ? {
    name: file.name,
    points: file.analysis?.pointCloud?.pointCount || 0,
    extent: file.analysis?.bounds ? 
      `${Math.round(file.analysis.bounds.maxX - file.analysis.bounds.minX)}m x ${Math.round(file.analysis.bounds.maxY - file.analysis.bounds.minY)}m` : 
      'N/A',
    elevation: file.analysis?.pointCloud?.elevationRange || 'N/A',
    size: formatFileSize(file.size),
    date: new Date(file.uploadedAt).toLocaleDateString('fr-FR'),
    quality: file.analysis?.pointCloud?.density ? `~${file.analysis.pointCloud.density} pts/m²` : 'N/A',
    density: file.analysis?.pointCloud?.density || 'N/A',
    features: [],
  } : data

  if (!displayData) return null

  return (
    <motion.div
      initial={false}
      animate={{ 
        width: isOpen ? 280 : 0,
        opacity: isOpen ? 1 : 0
      }}
      className="h-full bg-black/70 backdrop-blur-sm overflow-hidden flex flex-col border-l border-white/10"
    >
      {isOpen && (
        <div className="p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <h3 className="font-medium text-sm">Métadonnées</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-6 w-6 text-white hover:bg-white/10"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Main info */}
            <div>
              <p className="font-semibold text-base">{displayData.name}</p>
              <p className="text-xs text-white/60 mt-1">
                {file ? 'Fichier importé' : 'Scène de démonstration'}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Database className="h-3 w-3" />
                  <span className="text-xs">Points</span>
                </div>
                <p className="font-bold">{typeof displayData.points === 'number' ? displayData.points.toLocaleString() : displayData.points}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs">Emprise</span>
                </div>
                <p className="font-bold">{displayData.extent}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Mountain className="h-3 w-3" />
                  <span className="text-xs">Élévation</span>
                </div>
                <p className="font-bold">{displayData.elevation}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <HardDrive className="h-3 w-3" />
                  <span className="text-xs">Taille</span>
                </div>
                <p className="font-bold">{displayData.size}</p>
              </div>
            </div>

            {/* Additional info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-white/60" />
                <span className="text-white/60">Date:</span>
                <span>{displayData.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4 text-white/60" />
                <span className="text-white/60">Précision:</span>
                <span>{displayData.quality}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-white/60" />
                <span className="text-white/60">Densité:</span>
                <span>{displayData.density}</span>
              </div>
            </div>

            {/* Features */}
            {!file && data?.features && data.features.length > 0 && (
              <div>
                <p className="text-xs text-white/60 mb-2">Éléments détectés</p>
                <div className="flex flex-wrap gap-2">
                  {data.features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="border-white/30 text-white">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/60 mb-2">Actions rapides</p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Ruler className="h-3 w-3 mr-2" />
                  Mesurer
                </Button>
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Camera className="h-3 w-3 mr-2" />
                  Capturer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function PointCloudPage() {
  const [selectedDemo, setSelectedDemo] = useState(DEMO_POINT_CLOUDS[0])
  const [selectedFile, setSelectedFile] = useState<GeoFile | null>(null)
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(true)
  const [isMetadataOpen, setIsMetadataOpen] = useState(true)
  
  const { files } = useFileStore()
  const pointCloudFiles = files.filter(f => f.type === 'las' || f.type === 'laz')

  // Close metadata panel on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMetadataOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Main content - Full screen viewer */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* 3D Viewer - Takes full width */}
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Initialisation du visualiseur 3D...</p>
                </div>
              </div>
            }
          >
            <PotreeViewer className="w-full h-full" />
          </Suspense>

          {/* Stats overlay */}
          <StatsOverlay data={selectedFile ? null : selectedDemo} />

          {/* Toggle metadata button */}
          {!isMetadataOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 right-4 z-30"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMetadataOpen(true)}
                className="bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Infos
              </Button>
            </motion.div>
          )}

          {/* Metadata panel overlay */}
          <MetadataPanel
            data={selectedDemo}
            file={selectedFile}
            isOpen={isMetadataOpen}
            onToggle={() => setIsMetadataOpen(false)}
          />
        </div>

        {/* Data panel - Thumbnails */}
        <DataPanel
          isOpen={isDataPanelOpen}
          onToggle={() => setIsDataPanelOpen(!isDataPanelOpen)}
          selectedDemo={selectedDemo}
          onSelectDemo={setSelectedDemo}
          pointCloudFiles={pointCloudFiles}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
        />
      </div>
    </div>
  )
}
