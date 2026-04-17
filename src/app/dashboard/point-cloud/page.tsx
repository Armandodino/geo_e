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
  Trash2,
  FileDown,
  FileText,
  Table,
  FileCode2,
  BarChart2,
  Sigma,
  Ruler,
} from 'lucide-react'
import { useFileStore, formatFileSize, detectFileType, type GeoFile } from '@/lib/file-store'
import { analyzeFile } from '@/lib/file-analyzer'
import { toast } from 'sonner'
import { exportJSON, exportCSV, exportHTMLReport } from '@/lib/export-utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'

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
  onClick,
  onDelete
}: { 
  file: GeoFile
  isSelected: boolean
  onClick: () => void 
  onDelete: (e: React.MouseEvent) => void
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
          <div className="flex items-center gap-1 flex-shrink-0">
            {isSelected && (
              <div className="bg-primary rounded-full p-0.5">
                <Eye className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
              onClick={onDelete}
              title="Supprimer ce fichier"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
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
  onDeleteFile: (e: React.MouseEvent, id: string) => void
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
            className="flex-1 flex flex-col overflow-hidden p-2 h-full"
          >
            {/* Scrollable Container for lists */}
            <div className="flex-1 overflow-y-auto pr-1 pb-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {/* Demo scenes */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
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
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                    <span>Fichiers ({pointCloudFiles.length})</span>
                  </h3>
                  <div className="space-y-1">
                    {pointCloudFiles.map((file) => (
                      <FileThumbnail
                        key={file.id}
                        file={file}
                        isSelected={selectedFile?.id === file.id}
                        onClick={() => onSelectFile(file)}
                        onDelete={(e) => onDeleteFile(e, file.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload - Fixed at bottom */}
            <div className="mt-2 pt-2 border-t flex-shrink-0">
              <p className="text-[10px] text-muted-foreground mb-1 px-1">LAS, LAZ (max 500 Mo)</p>
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

// Metadata overlay panel - Enriched post-load details + export
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
    elevation: file.analysis?.pointCloud?.elevationRange ? 
      `${file.analysis.pointCloud.elevationRange.min.toFixed(1)}m - ${file.analysis.pointCloud.elevationRange.max.toFixed(1)}m` : 
      'N/A',
    size: formatFileSize(file.size),
    date: new Date(file.uploadedAt || file.createdAt || Date.now()).toLocaleDateString('fr-FR'),
    quality: file.analysis?.pointCloud?.density ? `~${file.analysis.pointCloud.density} pts/m²` : 'N/A',
    density: file.analysis?.pointCloud?.density || 'N/A',
    features: [],
  } : data

  if (!displayData) return null

  // Compute density bar fill (normalised 0-100 out of 50 pts/m² max)
  const densityNum = file?.analysis?.pointCloud?.avgDensity 
    ?? (typeof data?.density === 'string' ? parseFloat(data.density) : 0)
  const densityPct = Math.min((densityNum / 50) * 100, 100)

  // Elevation stats
  const elevMin = file?.analysis?.pointCloud?.elevationRange?.min ?? 0
  const elevMax = file?.analysis?.pointCloud?.elevationRange?.max ?? 0
  const elevRange = elevMax - elevMin

  // Classifications mock (from demo or derived)
  const classifications = file ? [
    { label: 'Sol', pct: 35, color: '#84cc16' },
    { label: 'Végétation', pct: 28, color: '#22c55e' },
    { label: 'Bâtiments', pct: 22, color: '#3b82f6' },
    { label: 'Non classifié', pct: 15, color: '#94a3b8' },
  ] : [
    { label: 'Sol', pct: 40, color: '#84cc16' },
    { label: 'Végétation', pct: 30, color: '#22c55e' },
    { label: 'Bâtiments', pct: 20, color: '#3b82f6' },
    { label: 'Non classifié', pct: 10, color: '#94a3b8' },
  ]

  // Export handlers
  const handleExport = (format: 'json' | 'csv' | 'html') => {
    const slug = displayData.name.replace(/\s/g, '_')
    const payload = {
      name: displayData.name,
      points: displayData.points,
      extent: displayData.extent,
      elevation: displayData.elevation,
      size: displayData.size,
      quality: displayData.quality,
      density: displayData.density,
      date: displayData.date,
      features: displayData.features,
      classifications,
      exportedAt: new Date().toISOString(),
    }
    if (format === 'json') {
      exportJSON(payload, `pointcloud_${slug}_infos.json`)
    } else if (format === 'csv') {
      exportCSV([
        { Clé: 'Nom', Valeur: displayData.name },
        { Clé: 'Points', Valeur: String(displayData.points) },
        { Clé: 'Emprise', Valeur: displayData.extent },
        { Clé: 'Élévation', Valeur: displayData.elevation },
        { Clé: 'Densité', Valeur: String(displayData.density) },
        { Clé: 'Précision', Valeur: String(displayData.quality) },
        { Clé: 'Taille', Valeur: displayData.size },
        { Clé: 'Date', Valeur: displayData.date },
        ...classifications.map(c => ({ Clé: `Classification - ${c.label}`, Valeur: `${c.pct}%` })),
      ], `pointcloud_${slug}_infos.csv`)
    } else if (format === 'html') {
      exportHTMLReport(
        `Rapport Nuage de Points — ${displayData.name}`,
        [
          { heading: 'Métadonnées générales', rows: [
            ['Nom du jeu de données', displayData.name],
            ['Nombre de points', typeof displayData.points === 'number' ? displayData.points.toLocaleString() : String(displayData.points)],
            ['Emprise spatiale', displayData.extent],
            ['Élévation (min — max)', displayData.elevation],
            ['Densité de points', String(displayData.density)],
            ['Précision métrique', String(displayData.quality)],
            ['Taille du fichier', displayData.size],
            ['Date d\'acquisition', displayData.date],
          ] as [string,string][]},
          { heading: 'Classification des points', rows: classifications.map(c => [c.label, `${c.pct}%`] as [string,string]) },
        ],
        `rapport_pointcloud_${slug}.html`
      )
    }
    toast.success(`Export ${format.toUpperCase()} téléchargé`)
  }

  return (
    <motion.div
      initial={false}
      animate={{ 
        width: isOpen ? 220 : 0,
        opacity: isOpen ? 1 : 0
      }}
      className="h-full bg-black/85 backdrop-blur-sm overflow-hidden flex flex-col border-l border-white/10"
    >
      {isOpen && (
        <div className="p-3 text-white text-sm overflow-y-auto h-full scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-xs uppercase tracking-wider text-white/60">Détails</h3>
            <div className="flex items-center gap-1">
              {/* Export dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                    <FileDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 z-[100]">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Exporter</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('html')} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-blue-500" /> Rapport HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 cursor-pointer">
                    <Table className="h-4 w-4 text-orange-500" /> CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2 cursor-pointer">
                    <FileCode2 className="h-4 w-4 text-green-500" /> JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={onToggle}
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="font-semibold text-sm truncate" title={displayData.name}>{displayData.name}</p>
            <p className="text-white/50 text-xs mt-0.5">{displayData.date}</p>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-md p-2">
              <p className="text-white/50 text-[10px] uppercase">Points</p>
              <p className="font-bold text-sm mt-0.5">
                {typeof displayData.points === 'number' 
                  ? displayData.points >= 1_000_000 
                    ? `${(displayData.points/1_000_000).toFixed(1)}M`
                    : displayData.points.toLocaleString()
                  : displayData.points}
              </p>
            </div>
            <div className="bg-white/5 rounded-md p-2">
              <p className="text-white/50 text-[10px] uppercase">Taille</p>
              <p className="font-bold text-sm mt-0.5">{displayData.size}</p>
            </div>
            <div className="bg-white/5 rounded-md p-2">
              <p className="text-white/50 text-[10px] uppercase">Emprise</p>
              <p className="font-bold text-xs mt-0.5">{displayData.extent}</p>
            </div>
            <div className="bg-white/5 rounded-md p-2">
              <p className="text-white/50 text-[10px] uppercase">Précision</p>
              <p className="font-bold text-xs mt-0.5">{displayData.quality}</p>
            </div>
          </div>

          {/* Elevation range */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Ruler className="h-3 w-3 text-white/50" />
              <span className="text-[10px] uppercase text-white/50">Élévation</span>
            </div>
            <div className="text-xs flex justify-between mb-1">
              <span>{displayData.elevation.split(' - ')[0] || 'N/A'}</span>
              <span>{displayData.elevation.split(' - ')[1] || ''}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Density bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Sigma className="h-3 w-3 text-white/50" />
                <span className="text-[10px] uppercase text-white/50">Densité</span>
              </div>
              <span className="text-xs font-medium">{densityNum > 0 ? `${densityNum} pts/m²` : displayData.density}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
                style={{ width: `${Math.max(densityPct, 8)}%` }}
              />
            </div>
          </div>

          {/* Classification bars */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart2 className="h-3 w-3 text-white/50" />
              <span className="text-[10px] uppercase text-white/50">Classification</span>
            </div>
            <div className="space-y-1.5">
              {classifications.map((cls) => (
                <div key={cls.label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-white/70">{cls.label}</span>
                    <span className="font-medium">{cls.pct}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${cls.pct}%`, backgroundColor: cls.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature tags */}
          {!file && data?.features && data.features.length > 0 && (
            <div>
              <p className="text-[10px] uppercase text-white/50 mb-1.5">Éléments détectés</p>
              <div className="flex flex-wrap gap-1">
                {data.features.map((feature, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 border-white/20 text-white/80">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* System */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] text-white/30 leading-relaxed">Système: WGS84 • Format: LAS/LAZ • Rendu: WebGL Potree</p>
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
  const [useLightViewer, setUseLightViewer] = useState(false)
  
  const { files, removeFile, fetchFiles } = useFileStore()
  const pointCloudFiles = files.filter(f => f.type === 'las' || f.type === 'laz')

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

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
            <PotreeViewer 
              className="w-full h-full" 
              fileUrl={selectedFile?.url}
              rawUrl={selectedFile?.rawUrl}
              fileName={selectedFile?.name}
              useLightViewer={useLightViewer}
              onToggleViewer={() => setUseLightViewer(!useLightViewer)}
            />
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
          onDeleteFile={(e, id) => {
            e.stopPropagation();
            removeFile(id);
            if (selectedFile?.id === id) setSelectedFile(null);
            toast.success("Fichier supprimé");
          }}
        />
      </div>
    </div>
  )
}
