import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// In-memory file storage (for demo - in production use a proper storage)
const fileStorage = new Map<string, {
  id: string
  name: string
  type: string
  size: number
  mimeType: string
  data: ArrayBuffer
  createdAt: Date
}>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (id) {
    const file = fileStorage.get(id)
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    return new NextResponse(file.data, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
    })
  }
  
  // List all files
  const files = Array.from(fileStorage.values()).map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    size: f.size,
    createdAt: f.createdAt,
  }))
  
  return NextResponse.json({ files })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Detect file type
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    let fileType = 'unknown'
    
    if (['geojson', 'json'].includes(ext)) fileType = 'geojson'
    else if (['kml', 'kmz'].includes(ext)) fileType = 'kml'
    else if (ext === 'shp') fileType = 'shp'
    else if (ext === 'las') fileType = 'las'
    else if (ext === 'laz') fileType = 'laz'
    else if (ext === 'pdf') fileType = 'pdf'
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) fileType = 'image'
    else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) fileType = 'video'
    else if (['tif', 'tiff'].includes(ext)) fileType = 'geotiff'
    else if (ext === 'gpx') fileType = 'gpx'
    
    // Read file data
    const data = await file.arrayBuffer()
    
    // Store file
    const id = uuidv4()
    const fileData = {
      id,
      name: file.name,
      type: fileType,
      size: file.size,
      mimeType: file.type,
      data,
      createdAt: new Date(),
    }
    
    fileStorage.set(id, fileData)
    
    return NextResponse.json({
      id,
      name: file.name,
      type: fileType,
      size: file.size,
      createdAt: fileData.createdAt,
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'No file ID provided' }, { status: 400 })
  }
  
  if (!fileStorage.has(id)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
  
  fileStorage.delete(id)
  return NextResponse.json({ success: true })
}
