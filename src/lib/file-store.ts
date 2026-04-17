import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type FileType = 'geojson' | 'kml' | 'shp' | 'las' | 'laz' | 'pdf' | 'image' | 'video' | 'geotiff' | 'gpx' | 'unknown'

export interface FileAnalysis {
  // Bounding box
  boundingBox?: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
  
  // Coordinate system
  coordinateSystem?: {
    name: string
    epsg?: number
  }
  
  // Geometry info
  geometry?: {
    type: string
    featureCount: number
    totalArea?: number
    totalPerimeter?: number
    centroid?: { lat: number; lng: number }
  }
  
  // Point cloud specific
  pointCloud?: {
    pointCount: number
    avgDensity?: number
    elevationRange?: { min: number; max: number }
  }
  
  // Raster specific
  raster?: {
    width: number
    height: number
    resolution?: number
    bands: number
  }
  
  // Image specific
  image?: {
    width: number
    height: number
    hasGps: boolean
    gpsCoordinates?: { lat: number; lng: number }
  }
  
  // PDF specific
  document?: {
    pages: number
    hasGeospatial: boolean
  }
  
  // Video specific
  video?: {
    duration: number
    width: number
    height: number
    fps: number
    hasGpsTrack: boolean
  }
  
  // Automatic calculations
  calculations?: {
    totalArea?: number
    totalDistance?: number
    estimatedVolume?: number
    pointDensity?: number
    coverageArea?: number
  }
  
  // Status
  status: 'pending' | 'analyzing' | 'completed' | 'error'
  error?: string
  analyzedAt?: Date
}

export interface GeoFile {
  id: string
  name: string
  type: FileType
  size: number
  data?: unknown
  url?: string
  rawUrl?: string
  thumbnail?: string
  metadata?: {
    width?: number
    height?: number
    pages?: number
    duration?: number
    bounds?: [[number, number], [number, number]]
    crs?: string
    features?: number
    points?: number
  }
  analysis?: FileAnalysis
  createdAt: Date
  updatedAt: Date
}

export interface FileStore {
  files: GeoFile[]
  selectedFileId: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchFiles: () => Promise<void>
  addFile: (file: Omit<GeoFile, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateFile: (id: string, updates: Partial<GeoFile>) => void
  updateFileAnalysis: (id: string, analysis: FileAnalysis) => void
  removeFile: (id: string) => void
  selectFile: (id: string | null) => void
  getFile: (id: string) => GeoFile | undefined
  getFilesByType: (type: FileType) => GeoFile[]
  getRecentFiles: (limit?: number) => GeoFile[]
  getAnalyzedFiles: () => GeoFile[]
  clearAll: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  selectedFileId: null,
  isLoading: false,
  error: null,

  fetchFiles: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/files')
      if (!res.ok) throw new Error('Erreur de chargement')
      const data = await res.json()
      if (data.files) {
        set({
          files: data.files.map((f: any) => ({
            ...f,
            createdAt: new Date(f.createdAt),
            updatedAt: new Date(f.updatedAt)
          }))
        })
      }
    } catch (error) {
      console.error(error)
      set({ error: 'Erreur lors de la récupération des fichiers' })
    } finally {
      set({ isLoading: false })
    }
  },

  addFile: (file) => {
    const id = uuidv4()
    const now = new Date()
    const newFile: GeoFile = {
      ...file,
      id,
      createdAt: now,
      updatedAt: now,
      analysis: {
        status: 'pending'
      }
    }
    
    // Optimistic UI
    set((state) => ({ files: [...state.files, newFile] }))
    
    // Background DB save
    fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFile)
    }).catch(console.error)
    
    return id
  },

  updateFile: (id, updates) => {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id
          ? { ...file, ...updates, updatedAt: new Date() }
          : file
      ),
    }))
    // Background DB save
    fetch(`/api/files?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(console.error)
  },

  updateFileAnalysis: (id, analysis) => {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id
          ? { 
              ...file, 
              analysis: { ...file.analysis, ...analysis },
              updatedAt: new Date() 
            }
          : file
      ),
    }))
    // Background DB save
    fetch(`/api/files?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis })
    }).catch(console.error)
  },

  removeFile: (id) => {
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
      selectedFileId: state.selectedFileId === id ? null : state.selectedFileId,
    }))
    fetch(`/api/files?id=${id}`, { method: 'DELETE' }).catch(console.error)
  },

  selectFile: (id) => {
    set({ selectedFileId: id })
  },

  getFile: (id) => {
    return get().files.find((file) => file.id === id)
  },

  getFilesByType: (type) => {
    return get().files.filter((file) => file.type === type)
  },

  getRecentFiles: (limit = 10) => {
    return [...get().files]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  },

  getAnalyzedFiles: () => {
    return get().files.filter((file) => file.analysis?.status === 'completed')
  },

  clearAll: () => {
    set({ files: [], selectedFileId: null })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setError: (error) => {
    set({ error })
  },
}))

// Helper function to detect file type from extension
export function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'geojson':
    case 'json':
      return 'geojson'
    case 'kml':
      return 'kml'
    case 'kmz':
      return 'kml'
    case 'shp':
      return 'shp'
    case 'las':
      return 'las'
    case 'laz':
      return 'laz'
    case 'pdf':
      return 'pdf'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'bmp':
      return 'image'
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'avi':
    case 'mkv':
      return 'video'
    case 'tif':
    case 'tiff':
      return 'geotiff'
    case 'gpx':
      return 'gpx'
    default:
      return 'unknown'
  }
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper to format analysis summary
export function formatAnalysisSummary(analysis: FileAnalysis | undefined): string {
  if (!analysis || analysis.status !== 'completed') {
    return 'En attente d\'analyse...'
  }
  
  const parts: string[] = []
  
  if (analysis.geometry?.featureCount) {
    parts.push(`${analysis.geometry.featureCount} éléments`)
  }
  
  if (analysis.pointCloud?.pointCount) {
    parts.push(`${analysis.pointCloud.pointCount.toLocaleString()} points`)
  }
  
  if (analysis.calculations?.totalArea) {
    const area = analysis.calculations.totalArea
    if (area > 10000) {
      parts.push(`${(area / 10000).toFixed(2)} ha`)
    } else {
      parts.push(`${area.toFixed(0)} m²`)
    }
  }
  
  if (analysis.image) {
    parts.push(`${analysis.image.width}×${analysis.image.height}px`)
  }
  
  if (analysis.video) {
    const mins = Math.floor(analysis.video.duration / 60)
    const secs = Math.floor(analysis.video.duration % 60)
    parts.push(`${mins}:${secs.toString().padStart(2, '0')}`)
  }
  
  if (analysis.document?.pages) {
    parts.push(`${analysis.document.pages} pages`)
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Analyse terminée'
}
