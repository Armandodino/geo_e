/**
 * File Analyzer Service
 * Automatically analyzes uploaded files and extracts geospatial metadata
 */

export interface FileAnalysisResult {
  fileId: string
  fileName: string
  fileType: string
  fileSize: number
  analyzedAt: Date
  location?: string
  
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
    classification?: Record<string, number>
  }
  
  // Raster specific
  raster?: {
    width: number
    height: number
    resolution?: number
    bands: number
    noDataValue?: number
  }
  
  // Image specific
  image?: {
    width: number
    height: number
    hasGps: boolean
    gpsCoordinates?: { lat: number; lng: number }
    capturedAt?: Date
    cameraModel?: string
  }
  
  // PDF specific
  document?: {
    pages: number
    hasGeospatial: boolean
    title?: string
    author?: string
  }
  
  // Video specific
  video?: {
    duration: number
    width: number
    height: number
    fps: number
    codec?: string
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
}

/**
 * Analyze a GeoJSON file
 */
export async function analyzeGeoJSON(data: unknown): Promise<Partial<FileAnalysisResult>> {
  const result: Partial<FileAnalysisResult> = {}
  
  try {
    const geojson = data as GeoJSON.GeoJSON
    
    let bounds = { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
    let featureCount = 0
    let totalArea = 0
    let totalPerimeter = 0
    const centroidPoints: { lat: number; lng: number }[] = []
    let geometryType = 'Unknown'
    
    const extractCoordinates = (coords: number[] | number[][] | number[][][]): void => {
      if (typeof coords[0] === 'number') {
        const [lng, lat] = coords as number[]
        bounds.minLat = Math.min(bounds.minLat, lat)
        bounds.maxLat = Math.max(bounds.maxLat, lat)
        bounds.minLng = Math.min(bounds.minLng, lng)
        bounds.maxLng = Math.max(bounds.maxLng, lng)
      } else {
        (coords as number[][]).forEach(c => extractCoordinates(c as number[] | number[][]))
      }
    }
    
    const calculatePolygonArea = (rings: number[][][]): number => {
      // Simplified Shoelace formula for area calculation
      let area = 0
      const ring = rings[0] // Outer ring
      for (let i = 0; i < ring.length - 1; i++) {
        area += ring[i][0] * ring[i + 1][1]
        area -= ring[i + 1][0] * ring[i][1]
      }
      return Math.abs(area / 2) * 111319.5 * 111319.5 // Convert to m² approximately
    }
    
    const calculateLineLength = (coords: number[][]): number => {
      let length = 0
      for (let i = 0; i < coords.length - 1; i++) {
        const dx = (coords[i + 1][0] - coords[i][0]) * 111319.5
        const dy = (coords[i + 1][1] - coords[i][1]) * 111319.5
        length += Math.sqrt(dx * dx + dy * dy)
      }
      return length
    }
    
    if (geojson.type === 'FeatureCollection') {
      featureCount = geojson.features.length
      geometryType = geojson.features[0]?.geometry?.type || 'Unknown'
      
      geojson.features.forEach((feature) => {
        if (feature.geometry) {
          extractCoordinates(feature.geometry.coordinates as number[] | number[][] | number[][][])
          centroidPoints.push({
            lat: (bounds.minLat + bounds.maxLat) / 2,
            lng: (bounds.minLng + bounds.maxLng) / 2
          })
          
          if (feature.geometry.type === 'Polygon') {
            totalArea += calculatePolygonArea(feature.geometry.coordinates as number[][][])
          } else if (feature.geometry.type === 'LineString') {
            totalPerimeter += calculateLineLength(feature.geometry.coordinates as number[][])
          } else if (feature.geometry.type === 'MultiPolygon') {
            (feature.geometry.coordinates as number[][][][]).forEach(poly => {
              totalArea += calculatePolygonArea(poly)
            })
          }
        }
      })
    } else if (geojson.type === 'Feature') {
      featureCount = 1
      geometryType = geojson.geometry?.type || 'Unknown'
      if (geojson.geometry) {
        extractCoordinates(geojson.geometry.coordinates as number[] | number[][] | number[][][])
      }
    }
    
    result.boundingBox = bounds
    result.geometry = {
      type: geometryType,
      featureCount,
      totalArea: totalArea > 0 ? totalArea : undefined,
      totalPerimeter: totalPerimeter > 0 ? totalPerimeter : undefined,
      centroid: centroidPoints.length > 0 ? {
        lat: (bounds.minLat + bounds.maxLat) / 2,
        lng: (bounds.minLng + bounds.maxLng) / 2
      } : undefined
    }
    
    result.calculations = {
      totalArea: totalArea > 0 ? totalArea : undefined,
      totalDistance: totalPerimeter > 0 ? totalPerimeter : undefined,
      coverageArea: (bounds.maxLat - bounds.minLat) * (bounds.maxLng - bounds.minLng) * 111319.5 * 111319.5
    }
    
  } catch (error) {
    result.error = `Erreur d'analyse GeoJSON: ${error}`
  }
  
  return result
}

/**
 * Analyze a KML file
 */
export async function analyzeKML(text: string): Promise<Partial<FileAnalysisResult>> {
  const result: Partial<FileAnalysisResult> = {}
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/xml')
    
    let bounds = { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
    let featureCount = 0
    
    // Parse coordinates from KML
    const coordinates = doc.getElementsByTagName('coordinates')
    for (let i = 0; i < coordinates.length; i++) {
      const coordText = coordinates[i].textContent || ''
      const coordPairs = coordText.trim().split(/\s+/)
      
      coordPairs.forEach(pair => {
        const [lng, lat] = pair.split(',').map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.minLat = Math.min(bounds.minLat, lat)
          bounds.maxLat = Math.max(bounds.maxLat, lat)
          bounds.minLng = Math.min(bounds.minLng, lng)
          bounds.maxLng = Math.max(bounds.maxLng, lng)
        }
      })
      
      featureCount++
    }
    
    if (bounds.minLat !== Infinity) {
      result.boundingBox = bounds
    }
    
    result.geometry = {
      type: 'KML Features',
      featureCount,
      centroid: {
        lat: (bounds.minLat + bounds.maxLat) / 2,
        lng: (bounds.minLng + bounds.maxLng) / 2
      }
    }
    
  } catch (error) {
    result.error = `Erreur d'analyse KML: ${error}`
  }
  
  return result
}

/**
 * Analyze LAS/LAZ point cloud file header
 */
export async function analyzePointCloud(file: File): Promise<Partial<FileAnalysisResult>> {
  const result: Partial<FileAnalysisResult> = {}
  
  try {
    // Read the first 227 bytes (LAS header size)
    const buffer = await file.slice(0, 227).arrayBuffer()
    const view = new DataView(buffer)
    
    // Check LAS signature
    const signature = new TextDecoder().decode(new Uint8Array(buffer, 0, 4))
    if (signature !== 'LASF') {
      throw new Error('Format LAS/LAZ non valide')
    }
    
    // Parse LAS header
    const fileSourceId = view.getUint16(4, true)
    const versionMajor = view.getUint8(24)
    const versionMinor = view.getUint8(25)
    const pointDataRecordLength = view.getUint16(94, true)
    const legacyPointCount = view.getUint32(96, true)
    
    // Bounding box
    const scaleFactorX = view.getFloat64(131, true)
    const scaleFactorY = view.getFloat64(139, true)
    const scaleFactorZ = view.getFloat64(147, true)
    const offsetX = view.getFloat64(155, true)
    const offsetY = view.getFloat64(163, true)
    const offsetZ = view.getFloat64(171, true)
    const maxX = view.getFloat64(179, true)
    const minX = view.getFloat64(187, true)
    const maxY = view.getFloat64(195, true)
    const minY = view.getFloat64(203, true)
    const maxZ = view.getFloat64(211, true)
    const minZ = view.getFloat64(219, true)
    
    // Convert to geographic coordinates (assuming UTM or local)
    const pointCount = legacyPointCount || Math.floor(file.size / pointDataRecordLength)
    
    result.boundingBox = {
      minLat: minY * scaleFactorY + offsetY,
      maxLat: maxY * scaleFactorY + offsetY,
      minLng: minX * scaleFactorX + offsetX,
      maxLng: maxX * scaleFactorX + offsetX
    }
    
    result.coordinateSystem = {
      name: 'Local Coordinate System',
      epsg: undefined
    }
    
    result.pointCloud = {
      pointCount,
      elevationRange: {
        min: minZ * scaleFactorZ + offsetZ,
        max: maxZ * scaleFactorZ + offsetZ
      },
      avgDensity: pointCount > 0 ? 
        pointCount / ((maxX - minX) * (maxY - minY)) : undefined
    }
    
    result.calculations = {
      pointDensity: result.pointCloud.avgDensity,
      coverageArea: (maxX - minX) * (maxY - minY)
    }
    
    // Store version info
    result.geometry = {
      type: `LAS v${versionMajor}.${versionMinor}`,
      featureCount: pointCount
    }
    
  } catch (error) {
    result.error = `Erreur d'analyse nuage de points: ${error}`
  }
  
  return result
}

/**
 * Analyze image file (extract EXIF and GPS data)
 */
export async function analyzeImage(file: File, dataUrl?: string): Promise<Partial<FileAnalysisResult>> {
  const result: Partial<FileAnalysisResult> = {}
  
  try {
    // Get image dimensions
    if (dataUrl) {
      const img = new Image()
      img.src = dataUrl
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      
      result.image = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        hasGps: false
      }
    }
    
    // Try to extract EXIF data (simplified - would need exif-js for full support)
    if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      const buffer = await file.slice(0, 65536).arrayBuffer()
      const view = new DataView(buffer)
      
      // Check JPEG SOI marker
      if (view.getUint16(0, false) === 0xFFD8) {
        // Look for EXIF marker
        let offset = 2
        while (offset < buffer.byteLength - 2) {
          const marker = view.getUint16(offset, false)
          if (marker === 0xFFE1) {
            // Found APP1 marker (EXIF)
            // Simplified: would need proper EXIF parsing
            result.image = {
              ...result.image!,
              hasGps: false,
              cameraModel: 'Detected from EXIF'
            }
            break
          }
          offset += 2
        }
      }
    }
    
    // Calculate coverage for drone imagery
    if (result.image) {
      result.calculations = {
        coverageArea: result.image.width * result.image.height / 1000000 // Approximation in m²
      }
    }
    
  } catch (error) {
    result.error = `Erreur d'analyse image: ${error}`
  }
  
  return result
}

/**
 * Analyze video file
 */
export async function analyzeVideo(file: File, videoElement?: HTMLVideoElement): Promise<Partial<FileAnalysisResult>> {
  const result: Partial<FileAnalysisResult> = {}
  
  try {
    if (videoElement) {
      result.video = {
        duration: videoElement.duration,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
        fps: 30, // Default assumption
        hasGpsTrack: false
      }
    } else {
      // Estimate based on file size (rough approximation)
      const estimatedDuration = file.size / (1024 * 1024 * 2) // ~2MB per second
      result.video = {
        duration: estimatedDuration,
        width: 1920,
        height: 1080,
        fps: 30,
        hasGpsTrack: false
      }
    }
    
  } catch (error) {
    result.error = `Erreur d'analyse vidéo: ${error}`
  }
  
  return result
}

/**
 * Analyze PDF file (check for geospatial content)
 */
export async function analyzePDF(file: File): Promise<Partial<FileAnalysisResult>> {
  const result: Partial<FileAnalysisResult> = {}
  
  try {
    // Read first bytes to check PDF signature
    const buffer = await file.slice(0, 1024).arrayBuffer()
    const text = new TextDecoder().decode(buffer)
    
    if (!text.startsWith('%PDF')) {
      throw new Error('Format PDF non valide')
    }
    
    // Look for geospatial keywords
    const hasGeospatial = text.toLowerCase().includes('geospatial') || 
                          text.toLowerCase().includes('geotiff') ||
                          text.toLowerCase().includes('coordinate')
    
    // Estimate page count (rough - based on file size)
    const estimatedPages = Math.max(1, Math.floor(file.size / (100 * 1024)))
    
    result.document = {
      pages: estimatedPages,
      hasGeospatial,
      title: file.name
    }
    
  } catch (error) {
    result.error = `Erreur d'analyse PDF: ${error}`
  }
  
  return result
}

/**
 * Main analysis function - routes to appropriate analyzer
 */
export async function analyzeFile(
  file: File,
  fileType: string,
  data?: unknown,
  dataUrl?: string
): Promise<Partial<FileAnalysisResult>> {
  let result: Partial<FileAnalysisResult> = {
    fileName: file.name,
    fileType,
    fileSize: file.size,
    analyzedAt: new Date(),
    status: 'analyzing'
  }
  
  try {
    switch (fileType) {
      case 'geojson':
        result = { ...result, ...(await analyzeGeoJSON(data)) }
        break
        
      case 'kml':
        result = { ...result, ...(await analyzeKML(data as string)) }
        break
        
      case 'las':
      case 'laz':
        result = { ...result, ...(await analyzePointCloud(file)) }
        break
        
      case 'image':
        result = { ...result, ...(await analyzeImage(file, dataUrl)) }
        break
        
      case 'video':
        result = { ...result, ...(await analyzeVideo(file)) }
        break
        
      case 'pdf':
        result = { ...result, ...(await analyzePDF(file)) }
        break
        
      default:
        result.error = `Type de fichier non supporté pour l'analyse: ${fileType}`
    }
    
    // Automatic Geocoding if we have bounds
    if (result.boundingBox && !result.location) {
      const centerLat = (result.boundingBox.minLat + result.boundingBox.maxLat) / 2;
      const centerLng = (result.boundingBox.minLng + result.boundingBox.maxLng) / 2;
      
      try {
        // Enforce user-agent per Nominatim Policy
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerLat}&lon=${centerLng}&zoom=14`, {
          headers: { 'User-Agent': 'GeoEnqueteur Analyste v1.0' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state;
            if (city && data.address.country) {
              result.location = `${city}, ${data.address.country}`;
            }
          }
        }
      } catch (err) {
        console.warn('Geocoding error:', err);
      }
    }

    result.status = 'completed'
    
  } catch (error) {
    result.status = 'error'
    result.error = `Erreur d'analyse: ${error}`
  }
  
  return result
}

/**
 * Format analysis result for display
 */
export function formatAnalysisResult(analysis: FileAnalysisResult): string[] {
  const lines: string[] = []
  
  if (analysis.location) {
    lines.push(`Localisation: ${analysis.location}`)
  }

  if (analysis.boundingBox) {
    lines.push(`Zone: ${analysis.boundingBox.minLat.toFixed(4)}° à ${analysis.boundingBox.maxLat.toFixed(4)}° N`)
    lines.push(`       ${analysis.boundingBox.minLng.toFixed(4)}° à ${analysis.boundingBox.maxLng.toFixed(4)}° E`)
  }
  
  if (analysis.geometry) {
    lines.push(`Type: ${analysis.geometry.type}`)
    lines.push(`Éléments: ${analysis.geometry.featureCount}`)
    if (analysis.geometry.totalArea) {
      lines.push(`Surface: ${(analysis.geometry.totalArea / 10000).toFixed(2)} ha`)
    }
    if (analysis.geometry.centroid) {
      lines.push(`Centre: ${analysis.geometry.centroid.lat.toFixed(6)}, ${analysis.geometry.centroid.lng.toFixed(6)}`)
    }
  }
  
  if (analysis.pointCloud) {
    lines.push(`Points: ${analysis.pointCloud.pointCount.toLocaleString()}`)
    if (analysis.pointCloud.elevationRange) {
      lines.push(`Élévation: ${analysis.pointCloud.elevationRange.min.toFixed(1)}m - ${analysis.pointCloud.elevationRange.max.toFixed(1)}m`)
    }
    if (analysis.pointCloud.avgDensity) {
      lines.push(`Densité: ${analysis.pointCloud.avgDensity.toFixed(2)} pts/m²`)
    }
  }
  
  if (analysis.image) {
    lines.push(`Dimensions: ${analysis.image.width} x ${analysis.image.height} px`)
    if (analysis.image.hasGps) {
      lines.push(`GPS: Oui`)
    }
  }
  
  if (analysis.video) {
    lines.push(`Durée: ${Math.floor(analysis.video.duration / 60)}:${Math.floor(analysis.video.duration % 60).toString().padStart(2, '0')}`)
    lines.push(`Résolution: ${analysis.video.width} x ${analysis.video.height}`)
  }
  
  if (analysis.document) {
    lines.push(`Pages: ${analysis.document.pages}`)
    if (analysis.document.hasGeospatial) {
      lines.push(`Données géospatiales: Oui`)
    }
  }
  
  return lines
}

/**
 * Store for analysis results
 */
export class AnalysisStore {
  private static instance: AnalysisStore
  private results: Map<string, FileAnalysisResult> = new Map()
  
  static getInstance(): AnalysisStore {
    if (!AnalysisStore.instance) {
      AnalysisStore.instance = new AnalysisStore()
    }
    return AnalysisStore.instance
  }
  
  set(fileId: string, result: FileAnalysisResult): void {
    this.results.set(fileId, result)
  }
  
  get(fileId: string): FileAnalysisResult | undefined {
    return this.results.get(fileId)
  }
  
  getAll(): FileAnalysisResult[] {
    return Array.from(this.results.values())
  }
  
  delete(fileId: string): boolean {
    return this.results.delete(fileId)
  }
}
