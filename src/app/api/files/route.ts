import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

import { db } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  try {
    if (id) {
      const file = await db.geoFile.findUnique({ where: { id } })
      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      return NextResponse.json(file)
    }
    
    // List all files from DB
    const files = await db.geoFile.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ files })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to fetch files from database' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    // Support JSON payload for direct Metadata insertion
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const geoFile = await db.geoFile.create({
        data: {
          id: body.id,
          name: body.name,
          type: body.type,
          size: body.size,
          url: body.url,
          rawUrl: body.rawUrl,
          thumbnail: body.thumbnail,
          metadata: body.metadata ? JSON.stringify(body.metadata) : null,
          analysis: body.analysis ? JSON.stringify(body.analysis) : null,
          userId: body.userId || null
        }
      })
      return NextResponse.json(geoFile)
    }

    // Standard FormData fallback for actual physical upload
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
    
    // Ensure uploads directory exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {})
    
    // Read and save file to local Disk
    const data = await file.arrayBuffer()
    const buffer = Buffer.from(data)
    
    // Create new DB record first to get the unique ID
    const geoFile = await db.geoFile.create({
      data: {
        name: file.name,
        type: fileType,
        size: file.size,
        url: null, // Will be updated later
        rawUrl: null 
      }
    })

    const fileName = `${geoFile.id}.${ext}`
    const filePath = path.join(UPLOADS_DIR, fileName)
    const publicUrl = `/uploads/${fileName}`

    await fs.writeFile(filePath, buffer)

    // Update with file URL
    const updatedFile = await db.geoFile.update({
      where: { id: geoFile.id },
      data: { 
        rawUrl: publicUrl,
        url: publicUrl // Default to raw url unless it's a point cloud, which gets updated later
      }
    })
    
    return NextResponse.json({
      id: updatedFile.id,
      name: updatedFile.name,
      type: updatedFile.type,
      size: updatedFile.size,
      url: updatedFile.url,
      rawUrl: updatedFile.rawUrl,
      createdAt: updatedFile.createdAt,
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
  
  try {
    const file = await db.geoFile.findUnique({ where: { id } })
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Attempt to delete physical file if present
    if (file.rawUrl?.startsWith('/uploads/')) {
      const fileName = path.basename(file.rawUrl)
      const filePath = path.join(UPLOADS_DIR, fileName)
      await fs.unlink(filePath).catch(() => console.warn(`Could not delete file: ${filePath}`))
    }

    // Delete DB Record
    await db.geoFile.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting file:', err)
    return NextResponse.json({ error: 'Could not delete file' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'No file ID provided' }, { status: 400 })
  }
  
  try {
    const body = await request.json()
    const { url, rawUrl, metadata, analysis, size } = body
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    if (url !== undefined) updateData.url = url
    if (rawUrl !== undefined) updateData.rawUrl = rawUrl
    if (size !== undefined) updateData.size = size
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata)
    if (analysis !== undefined) updateData.analysis = JSON.stringify(analysis)

    const updatedFile = await db.geoFile.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(updatedFile)
  } catch (err) {
    console.error('Error updating file:', err)
    return NextResponse.json({ error: 'Could not update file' }, { status: 500 })
  }
}
