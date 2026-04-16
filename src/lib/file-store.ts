import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type FileType = 'geojson' | 'kml' | 'shp' | 'las' | 'laz' | 'pdf' | 'image' | 'video' | 'geotiff' | 'gpx' | 'unknown'

export interface GeoFile {
  id: string
  name: string
  type: FileType
  size: number
  data?: unknown
  url?: string
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
  createdAt: Date
  updatedAt: Date
}

export interface FileStore {
  files: GeoFile[]
  selectedFileId: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  addFile: (file: Omit<GeoFile, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateFile: (id: string, updates: Partial<GeoFile>) => void
  removeFile: (id: string) => void
  selectFile: (id: string | null) => void
  getFile: (id: string) => GeoFile | undefined
  getFilesByType: (type: FileType) => GeoFile[]
  clearAll: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  selectedFileId: null,
  isLoading: false,
  error: null,

  addFile: (file) => {
    const id = uuidv4()
    const now = new Date()
    const newFile: GeoFile = {
      ...file,
      id,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ files: [...state.files, newFile] }))
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
  },

  removeFile: (id) => {
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
      selectedFileId: state.selectedFileId === id ? null : state.selectedFileId,
    }))
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
