'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Map, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useFileStore, detectFileType, formatFileSize, type FileType, type GeoFile } from '@/lib/file-store'
import { toast } from 'sonner'

interface FileUploadProps {
  acceptedTypes?: FileType[]
  onFileUpload?: (file: GeoFile) => void
  multiple?: boolean
  maxSize?: number // in bytes
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

export function FileUpload({
  acceptedTypes,
  onFileUpload,
  multiple = true,
  maxSize = 500 * 1024 * 1024, // 500MB default
  className = '',
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Array<{
    name: string
    progress: number
    status: 'uploading' | 'success' | 'error'
    error?: string
  }>>([])
  
  const addFile = useFileStore((state) => state.addFile)

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

    if (fileType === 'geojson' || fileType === 'kml' || fileType === 'gpx') {
      // Read as text for geospatial formats
      const text = await file.text()
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
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
        // Simulate progress
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, progress: 50 } : f
          )
        )

        const geoFile = await processFile(file)
        const id = addFile(geoFile)

        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, progress: 100, status: 'success' } : f
          )
        )

        if (onFileUpload) {
          onFileUpload({ ...geoFile, id })
        }

        toast.success(`Fichier "${file.name}" importé avec succès`)
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
    }, 3000)
  }, [addFile, onFileUpload])

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
          <p className="text-xs text-muted-foreground">
            Taille maximale: {formatFileSize(maxSize)}
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
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        {file.status === 'uploading' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeUploadingFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {file.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      {file.status === 'uploading' && (
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
