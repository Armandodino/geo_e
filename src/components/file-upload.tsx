'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Map, 
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Eye
} from 'lucide-react'
import { useFileStore, detectFileType, formatFileSize, formatAnalysisSummary, type FileType, type GeoFile, type FileAnalysis } from '@/lib/file-store'
import { analyzeFile } from '@/lib/file-analyzer'
import { toast } from 'sonner'

interface FileUploadProps {
  acceptedTypes?: FileType[]
  onFileUpload?: (file: GeoFile) => void
  onAnalysisComplete?: (file: GeoFile, analysis: FileAnalysis) => void
  multiple?: boolean
  maxSize?: number // in bytes
  autoAnalyze?: boolean
  className?: string
}

const fileTypeIcons: Record<FileType, typeof File> = {
  geojson: Map,
  kml: Map,
  shp: Map,
  las: Map,
  laz: Map,
  pdf: FileText,
  image: Image,
  video: Video,
  geotiff: Map,
  gpx: Map,
  unknown: File,
}

const fileTypeAccept: Record<FileType, string[]> = {
  geojson: ['.geojson', '.json'],
  kml: ['.kml', '.kmz'],
  shp: ['.shp', '.dbf', '.shx'],
  las: ['.las'],
  laz: ['.laz'],
  pdf: ['.pdf'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
  video: ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
  geotiff: ['.tif', '.tiff'],
  gpx: ['.gpx'],
  unknown: [],
}

const fileTypeLabels: Record<FileType, string> = {
  geojson: 'GeoJSON',
  kml: 'KML',
  shp: 'Shapefile',
  las: 'LAS',
  laz: 'LAZ',
  pdf: 'PDF',
  image: 'Image',
  video: 'Vidéo',
  geotiff: 'GeoTIFF',
  gpx: 'GPX',
  unknown: 'Fichier',
}

export function FileUpload({
  acceptedTypes,
  onFileUpload,
  onAnalysisComplete,
  multiple = true,
  maxSize = 500 * 1024 * 1024, // 500MB default
  autoAnalyze = true,
  className = '',
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Array<{
    name: string
    progress: number
    status: 'uploading' | 'analyzing' | 'converting' | 'success' | 'error'
    error?: string
    analysisSummary?: string
  }>>([])
  
  const addFile = useFileStore((state) => state.addFile)
  const updateFileAnalysis = useFileStore((state) => state.updateFileAnalysis)
  const updateFile = useFileStore((state) => state.updateFile)

  const getAcceptedExtensions = useCallback(() => {
    if (!acceptedTypes) return undefined
    return acceptedTypes.flatMap((type) => fileTypeAccept[type] || [])
  }, [acceptedTypes])

  const processFile = async (file: globalThis.File): Promise<GeoFile> => {
    const fileType = detectFileType(file.name)
    const dataUrl = URL.createObjectURL(file)
    
    // Read file content based on type
    let data: unknown = null
    let metadata: GeoFile['metadata'] = {}

    if (fileType === 'geojson' || fileType === 'gpx') {
      // Read as text for geospatial formats
      const text = await file.text()
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    } else if (fileType === 'kml') {
      // Read as text for KML
      const text = await file.text()
      data = text
    } else if (fileType === 'image') {
      // Get image dimensions
      const img = new window.Image()
      img.src = dataUrl
      await new Promise((resolve) => {
        img.onload = resolve
      })
      metadata = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      }
    } else if (fileType === 'pdf') {
      // Get page count (would need pdf.js for real implementation)
      metadata = { pages: 1 }
    } else if (fileType === 'las' || fileType === 'laz') {
      // Point cloud files
      metadata = { points: 0 }
    }

    return {
      name: file.name,
      type: fileType,
      size: file.size,
      data,
      url: dataUrl,
      metadata,
    }
  }

  const performAnalysis = async (file: globalThis.File, geoFile: GeoFile, index: number): Promise<void> => {
    try {
      const analysisResult = await analyzeFile(
        file,
        geoFile.type,
        geoFile.data,
        geoFile.url
      )
      
      const analysis: FileAnalysis = {
        ...analysisResult,
        status: 'completed',
        analyzedAt: new Date()
      }
      
      // Update file with analysis results
      updateFileAnalysis(geoFile.id, analysis)
      
      // Update UI
      setUploadingFiles((prev) =>
        prev.map((f, idx) =>
          idx === index ? { 
            ...f, 
            status: 'success',
            analysisSummary: formatAnalysisSummary(analysis)
          } : f
        )
      )
      
      // POTREE ENGINE: Process ALL point clouds via the heavy C++ converter
      if (geoFile.type === 'las' || geoFile.type === 'laz') {
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === index ? { 
              ...f, 
              status: 'converting'
            } : f
          )
        )
        // Simulate a 4s processing time
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadRes = await fetch('/api/process-pointcloud', {
            method: 'POST',
            body: formData
          });
          
          if (!uploadRes.ok) {
            const errResult = await uploadRes.json().catch(() => ({}));
            throw new Error(errResult.error || `Erreur serveur HTTP ${uploadRes.status}: La taille du fichier dépasse peut-être la limite du serveur Next.js`);
          }
          
          const processResult = await uploadRes.json();
          geoFile.rawUrl = geoFile.url; // Save the raw blob URL
          geoFile.url = processResult.url; // Replace heavy blob URL with optimized static URL
          geoFile.size = processResult.processedSize;
          
          updateFile(geoFile.id, {
             url: processResult.url,
             rawUrl: geoFile.rawUrl,
             size: processResult.processedSize
          });
          updateFileAnalysis(geoFile.id, {
             ...geoFile.analysis,
             status: 'completed',
             fileSize: processResult.processedSize
          });
          
        } catch(err: any) {
          console.error('Python pipe failed', err);
          
          // Stop execution and show error!
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === index ? { 
                ...f, 
                status: 'error',
                error: err.message
              } : f
            )
          );
          toast.error("Le traitement serveur a échoué: " + err.message);
          window.alert("DIAGNOSTIC ERREUR CRITIQUE: \n\n" + err.message + "\n\nEnvoyez-moi ce message exact !");
          return; // STOP execution!!
        }
        
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === index ? { 
              ...f, 
              status: 'success'
            } : f
          )
        )
      }
      
      // Callback
      if (onAnalysisComplete) {
        onAnalysisComplete({ ...geoFile, analysis }, analysis)
      }
      
      // Show success toast with analysis summary
      const summary = formatAnalysisSummary(analysis)
      if (summary && summary !== 'Analyse terminée') {
        toast.success(`Analyse: ${summary}`)
      }
      
    } catch (error) {
      updateFileAnalysis(geoFile.id, {
        status: 'error',
        error: String(error)
      })
      
      setUploadingFiles((prev) =>
        prev.map((f, idx) =>
          idx === index ? { 
            ...f, 
            status: 'success',
            analysisSummary: 'Analyse non disponible'
          } : f
        )
      )
    }
  }

  const onDrop = useCallback(async (acceptedFiles: globalThis.File[]) => {
    const newUploadingFiles = acceptedFiles.map((file) => ({
      name: file.name,
      progress: 0,
      status: 'uploading' as const,
    }))
    setUploadingFiles(newUploadingFiles)

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      
      try {
        // Simulate progress for upload phase
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, progress: 50 } : f
          )
        )

        const geoFile = await processFile(file)
        const id = addFile(geoFile)
        geoFile.id = id

        // Update to analyzing phase
        if (autoAnalyze) {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, progress: 75, status: 'analyzing' } : f
            )
          )
          
          // Perform automatic analysis
          await performAnalysis(file, geoFile, i)
        } else {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, progress: 100, status: 'success' } : f
            )
          )
        }

        if (onFileUpload) {
          onFileUpload({ ...geoFile, id })
        }

        toast.success(`"${file.name}" importé avec succès`)
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'error', error: String(error) }
              : f
          )
        )
        toast.error(`Erreur lors de l'import de "${file.name}"`)
      }
    }

    // Clear uploading files after a delay
    setTimeout(() => {
      setUploadingFiles([])
    }, 5000)
  }, [addFile, onFileUpload, onAnalysisComplete, autoAnalyze, updateFileAnalysis])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedExtensions()?.reduce(
      (acc, ext) => ({ ...acc, [ext]: [] }),
      {}
    ),
    multiple,
    maxSize,
  })

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">{progress}%</Badge>
      case 'analyzing':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Analyse
          </Badge>
        )
      case 'converting':
        return (
          <Badge variant="default" className="bg-purple-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Conversion Cloud
          </Badge>
        )
      case 'success':
        return <Badge variant="default" className="bg-green-500">Terminé</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      default:
        return null
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-4 rounded-full transition-colors duration-200
            ${isDragActive ? 'bg-primary/10' : 'bg-muted'}
          `}>
            <Upload className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragActive
                ? 'Déposez vos fichiers ici'
                : 'Glissez-déposez vos fichiers ici'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou cliquez pour sélectionner
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {acceptedTypes ? (
              acceptedTypes.map((type) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {fileTypeLabels[type]}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-xs">
                Tous formats supportés
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Taille maximale: {formatFileSize(maxSize)}
            {autoAnalyze && ' • Analyse automatique activée'}
          </p>
        </div>
      </div>

      {/* Uploading files list */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file, index) => {
            const Icon = fileTypeIcons[detectFileType(file.name)]
            return (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          {getStatusBadge(file.status, file.progress)}
                        </div>
                        <div className="flex items-center gap-1">
                          {file.status === 'success' && (
                            <>
                              {file.analysisSummary && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  {file.analysisSummary}
                                </Badge>
                              )}
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </>
                          )}
                          {file.status === 'error' && (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          )}
                          {(file.status === 'uploading' || file.status === 'analyzing' || file.status === 'converting') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeUploadingFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {file.status === 'analyzing' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Analyse des données géospatiales en cours...
                        </div>
                      )}
                      {file.status === 'converting' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground text-purple-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Génération des tuiles 3D (Octree) via le moteur serveur...
                        </div>
                      )}
                      {(file.status === 'uploading') && (
                        <Progress value={file.progress} className="h-1 mt-2" />
                      )}
                      {file.status === 'error' && file.error && (
                        <p className="text-xs text-destructive mt-1">{file.error}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
