'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Mountain, 
  Building2, 
  TreePine, 
  Layers, 
  ChevronLeft,
  ChevronRight,
  Database,
  HardDrive,
  MapPin,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react'
import { useFileStore, formatFileSize, detectFileType, type GeoFile } from '@/lib/file-store'
import { analyzeFile } from '@/lib/file-analyzer'
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

// Compact file upload component
function CompactFileUpload({ 
  acceptedTypes,
  onFileUpload,
  maxSize = 500 * 1024 * 1024
}: { 
  acceptedTypes?: string[]
  onFileUpload?: (file: GeoFile) => void
  maxSize?: number
}) {
  const fileInputRef = useState<HTMLInputElement | null>(null)[0]
  const [isUploading, setIsUploading] = useState(false)
  const addFile = useFileStore((state) => state.addFile)
  const updateFileAnalysis = useFileStore((state) => state.updateFileAnalysis)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    for (const file of Array.from(files)) {
      try {
        const fileType = detectFileType(file.name)
        const dataUrl = URL.createObjectURL(file)
        
        const geoFile: GeoFile = {
          name: file.name,
          type: fileType,
          size: file.size,
          data: null,
          url: dataUrl,
          metadata: {},
        }
        
        const id = addFile(geoFile)
        geoFile.id = id
        
        // Analyze
        try {
          const analysisResult = await analyzeFile(file, fileType, null, dataUrl)
          updateFileAnalysis(id, {
            ...analysisResult,
            status: 'completed',
            analyzedAt: new Date()
          })
        } catch {
          // Skip analysis errors
        }
        
        if (onFileUpload) {
          onFileUpload({ ...geoFile, id })
        }
        
        toast.success(`"${file.name}" importé`)
      } catch (error) {
        toast.error(`Erreur: ${file.name}`)
      }
    }
    
    setIsUploading(false)
    e.target.value = ''
  }

  return (
    <label className="flex items-center justify-center gap-2 w-full p-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors text-xs text-muted-foreground hover:text-foreground">
      <input
        type="file"
        accept={acceptedTypes?.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {isUploading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Upload className="h-3 w-3" />
      )}
      <span>{isUploading ? 'Import...' : 'Importer'}</span>
    </label>
  )
}

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

// Thumbnail card component - Compact version
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
      className={`relative w-full rounded-lg overflow-hidden transition-all ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:bg-muted/50 border border-border'
      }`}
      whileTap={{ scale: 0.98 }}
    >
      {/* Compact data card */}
      <div className="p-2 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate flex-1">{data.name}</p>
          {isSelected && (
            <div className="bg-primary rounded-full p-0.5 flex-shrink-0">
              <Eye className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
        
        {/* Data row - compact */}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{data.points.toLocaleString()} pts</span>
          <span>•</span>
          <span>{data.extent}</span>
          <span>•</span>
          <span>{data.size}</span>
        </div>
      </div>
    </motion.button>
  )
}

// Uploaded file thumbnail - Compact version
function FileThumbnail({ 
  file, 
  isSelected, 
  onClick 
}: { 
  file: GeoFile
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full rounded-lg overflow-hidden transition-all ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:bg-muted/50 border border-border'
      }`}
      whileTap={{ scale: 0.98 }}
    >
      {/* Compact data card */}
      <div className="p-2 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate flex-1">{file.name}</p>
          {isSelected && (
            <div className="bg-primary rounded-full p-0.5 flex-shrink-0">
              <Eye className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
        
        {/* Data row - compact */}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs px-1.5 py-0">{file.type.toUpperCase()}</Badge>
          <span>{formatFileSize(file.size)}</span>
          {file.analysis?.pointCloud?.pointCount && (
            <>
              <span>•</span>
              <span className="font-medium text-foreground">{file.analysis.pointCloud.pointCount.toLocaleString()} pts</span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  )
}

// Data panel component - Compact
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
      animate={{ width: isOpen ? 260 : 40 }}
      className="h-full bg-background/95 backdrop-blur border-l flex flex-col relative z-20"
    >
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -left-4 top-2 z-30 h-7 w-7 rounded-full border bg-background shadow-md"
      >
        {isOpen ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden p-2"
          >
            {/* Demo scenes */}
            <div className="mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 px-1">
                Démo
              </h3>
              <div className="space-y-1">
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
              <div className="mb-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 px-1">
                  Fichiers ({pointCloudFiles.length})
                </h3>
                <div className="space-y-1">
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

            {/* Upload */}
            <div className="mt-auto pt-2 border-t">
              <CompactFileUpload
                acceptedTypes={['.las', '.laz']}
                onFileUpload={(file) => {
                  toast.success(`Fichier "${file.name}" importé`)
                }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-2 gap-1"
          >
            <Layers className="h-4 w-4 text-muted-foreground" />
            <div className="w-6 h-px bg-border my-1" />
            {DEMO_POINT_CLOUDS.slice(0, 3).map((demo) => (
              <motion.button
                key={demo.id}
                onClick={() => {
                  onSelectDemo(demo)
                  onSelectFile(null)
                  onToggle()
                }}
                className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] font-bold ${
                  selectedDemo.id === demo.id && !selectedFile
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={demo.name}
              >
                {demo.name.charAt(0)}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Metadata overlay panel - Compact
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
        width: isOpen ? 200 : 0,
        opacity: isOpen ? 1 : 0
      }}
      className="h-full bg-black/80 backdrop-blur-sm overflow-hidden flex flex-col border-l border-white/10"
    >
      {isOpen && (
        <div className="p-3 text-white text-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-xs uppercase tracking-wider">Infos</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-5 w-5 text-white/60 hover:text-white hover:bg-white/10"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>

          <p className="font-semibold text-sm truncate mb-2">{displayData.name}</p>

          {/* Stats - compact */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Points</span>
              <span className="font-medium">{typeof displayData.points === 'number' ? displayData.points.toLocaleString() : displayData.points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Emprise</span>
              <span>{displayData.extent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Élévation</span>
              <span>{displayData.elevation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Taille</span>
              <span>{displayData.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Précision</span>
              <span>{displayData.quality}</span>
            </div>
          </div>

          {/* Features */}
          {!file && data?.features && data.features.length > 0 && (
            <div className="mt-3 pt-2 border-t border-white/10">
              <p className="text-xs text-white/60 mb-1">Éléments</p>
              <div className="flex flex-wrap gap-1">
                {data.features.map((feature, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 border-white/30 text-white">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
