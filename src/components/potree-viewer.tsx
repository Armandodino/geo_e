'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move3D,
  Box,
  MapPin,
  Loader2,
  Ruler,
  Mountain,
  Square,
  Crosshair,
  AlertCircle,
  Maximize,
  Sun,
  Moon,
} from 'lucide-react'
import { toast } from 'sonner'

// Three.js imports
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Loaders.gl for LAZ/LAS support
import { parse } from '@loaders.gl/core'
import { LASLoader } from '@loaders.gl/las'

type ColorMode = 'rgb' | 'height' | 'intensity' | 'classification'

interface PointCloudViewerProps {
  className?: string
  height?: string
  fileUrl?: string | null
  rawUrl?: string | null
  fileName?: string
  useLightViewer?: boolean
  onToggleViewer?: () => void
  onPointCloudLoad?: (pointcloud: unknown) => void
  onMeasurement?: (type: string, value: number) => void
}

// Demo scenes
const DEMO_SCENES = [
  { id: 'terrain', name: 'Terrain', description: 'Terrain synthétique' },
  { id: 'building', name: 'Bâtiment', description: 'Scan de bâtiment' },
  { id: 'forest', name: 'Forêt', description: 'Scan forestier' },
]

// Generate demo point cloud
function generateDemoPointCloud(sceneType: string): { positions: Float32Array; colors: Float32Array; count: number } {
  const count = sceneType === 'building' ? 80000 : sceneType === 'forest' ? 60000 : 50000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  
  if (sceneType === 'building') {
    for (let i = 0; i < count; i++) {
      const isWall = Math.random() > 0.3
      if (isWall) {
        const side = Math.floor(Math.random() * 4)
        const x = side === 0 ? -20 : side === 1 ? 20 : (Math.random() - 0.5) * 40
        const z = side === 2 ? -20 : side === 3 ? 20 : (Math.random() - 0.5) * 40
        const y = Math.random() * 30
        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z
      } else {
        positions[i * 3] = (Math.random() - 0.5) * 40
        positions[i * 3 + 1] = 30 + Math.random() * 5
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      }
      colors[i * 3] = 0.7 + Math.random() * 0.3
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.2
      colors[i * 3 + 2] = 0.5 + Math.random() * 0.2
    }
  } else if (sceneType === 'forest') {
    for (let i = 0; i < count; i++) {
      const treeX = Math.floor(Math.random() * 20) * 5 - 50
      const treeZ = Math.floor(Math.random() * 20) * 5 - 50
      const isTree = Math.random() > 0.2
      if (isTree) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 2
        positions[i * 3] = treeX + Math.cos(angle) * radius
        positions[i * 3 + 1] = Math.random() * 15
        positions[i * 3 + 2] = treeZ + Math.sin(angle) * radius
        colors[i * 3] = 0.1 + Math.random() * 0.2
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.4
        colors[i * 3 + 2] = 0.1 + Math.random() * 0.2
      } else {
        positions[i * 3] = (Math.random() - 0.5) * 100
        positions[i * 3 + 1] = Math.random() * 0.5
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100
        colors[i * 3] = 0.3 + Math.random() * 0.2
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.1
        colors[i * 3 + 2] = 0.1
      }
    }
  } else {
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 100
      const z = (Math.random() - 0.5) * 100
      const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 10 + Math.random() * 5
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      const normalizedY = (y + 10) / 20
      colors[i * 3] = normalizedY * 0.8
      colors[i * 3 + 1] = 0.6 - normalizedY * 0.4
      colors[i * 3 + 2] = normalizedY * 0.2 + 0.2
    }
  }
  
  return { positions, colors, count }
}

// Parse LAS/LAZ file using loaders.gl
async function parsePointCloudFile(
  url: string,
  onProgress?: (progress: number) => void
): Promise<{ positions: Float32Array; colors: Float32Array; count: number }> {
  if (onProgress) onProgress(5)
  
  // Fetch file locally to get ArrayBuffer to avoid Worker fetch issues
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  
  if (onProgress) onProgress(30);

  // Determine a safe decimation factor to avoid Out Of Memory (OOM) errors in WebAssembly
  // LAZ is highly compressed. 1MB compressed ~ 300,000 points.
  // We want to limit the decoded points to ~1 million to avoid WebAssembly OOM
  const fileSizeMb = arrayBuffer.byteLength / (1024 * 1024);
  const skipFactor = Math.max(1, Math.floor(fileSizeMb / 2));
  
  // Parse manually using Array Buffer
  const data = await parse(arrayBuffer, LASLoader, {
    las: { skip: skipFactor },
    worker: false // Run on main thread to disable MEMFS IPC issues
  });

  if (onProgress) onProgress(85)

  const positionBuffer = data.attributes?.POSITION?.value;
  if (!positionBuffer) {
    throw new Error('Fichier LAZ/LAS invalide: Pas de positions.');
  }

  // Loaders.gl LASLoader limits points (or loads all) - check its length
  // We limit to 2 million points for browser safety but load() usually handles whole file
  // Actually, we'll keep the whole file if small, or apply a decimation step
  const totalCount = positionBuffer.length / 3;
  const maxPoints = 2000000;
  const step = Math.max(1, Math.floor(totalCount / maxPoints));
  const count = Math.min(totalCount, maxPoints);
  
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity

  const CHUNK_SIZE = 50000;

  // Pass 1: Find bounds
  for (let i = 0; i < count; i++) {
    if (i > 0 && i % CHUNK_SIZE === 0) {
      if (onProgress) onProgress(85 + Math.round((i / count) * 5));
      await new Promise(r => setTimeout(r, 0));
    }
    const idx = (i * step) * 3;
    const x = positionBuffer[idx];
    const y = positionBuffer[idx + 1];
    const z = positionBuffer[idx + 2];

    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  }

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const centerZ = (minZ + maxZ) / 2
  const scale = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 100 || 1;

  const colorBuffer = data.attributes?.COLOR_0?.value;
  const is16BitColor = colorBuffer instanceof Uint16Array;
  // Determine if it's RGB (3) or RGBA (4)
  const colorChannels = colorBuffer ? Math.round(colorBuffer.length / totalCount) : 0;

  // Pass 2: Transfer and normalize
  for (let i = 0; i < count; i++) {
    if (i > 0 && i % CHUNK_SIZE === 0) {
      if (onProgress) onProgress(90 + Math.round((i / count) * 10));
      await new Promise(r => setTimeout(r, 0));
    }
    
    const idx = i * step;
    const posIdx = idx * 3;
    
    const ox = positionBuffer[posIdx]
    const oy = positionBuffer[posIdx + 1]
    const oz = positionBuffer[posIdx + 2]

    // Center and scale
    const x = (ox - centerX) / scale
    const y = (oy - centerY) / scale
    const z = (oz - centerZ) / scale

    // Y up in Three.js
    positions[i * 3] = x
    positions[i * 3 + 1] = z // Swap Y and Z
    positions[i * 3 + 2] = y

    if (colorBuffer && colorChannels > 0) {
      const colIdx = idx * colorChannels;
      const divider = is16BitColor ? 65535 : 255;
      colors[i * 3] = colorBuffer[colIdx] / divider;
      colors[i * 3 + 1] = colorBuffer[colIdx + 1] / divider;
      colors[i * 3 + 2] = colorBuffer[colIdx + 2] / divider;
    } else {
      // Use height-based coloring if no colors available
      const normalizedZ = (oz - minZ) / (maxZ - minZ || 1)
      colors[i * 3] = normalizedZ * 0.8
      colors[i * 3 + 1] = 0.6 - normalizedZ * 0.4
      colors[i * 3 + 2] = normalizedZ * 0.2 + 0.2
    }
  }

  if (onProgress) onProgress(100);
  return { positions, colors, count }
}

export function PotreeViewerComponent({
  className = '',
  height = '100%',
  fileUrl,
  rawUrl,
  fileName,
  useLightViewer = false,
  onToggleViewer,
  onPointCloudLoad,
  onMeasurement,
}: PointCloudViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const pointCloudRef = useRef<THREE.Points | null>(null)
  const gridHelperRef = useRef<THREE.GridHelper | null>(null)
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const loadedUrlRef = useRef<string | null | undefined>('__initial__')
  
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pointSize, setPointSize] = useState(2)
  const [colorMode, setColorMode] = useState<ColorMode>('rgb')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [currentScene, setCurrentScene] = useState('terrain')
  const [pointCount, setPointCount] = useState(0)
  const [isRealFile, setIsRealFile] = useState(false)
  const [measurementValue, setMeasurementValue] = useState<string | null>(null)
  const [viewerTheme, setViewerTheme] = useState<'dark' | 'light'>('dark')

  // Store raw positions + original RGB colors for re-coloring
  const rawPositionsRef = useRef<Float32Array | null>(null)
  const rawColorsRef = useRef<Float32Array | null>(null)

  // Measurement state
  const activeToolRef = useRef<string | null>(null) // mirror for click handler closure
  const measurePointsRef = useRef<THREE.Vector3[]>([]) // accumulated click points
  const measureMarkersRef = useRef<THREE.Object3D[]>([]) // visual markers to dispose
  const [measureResult, setMeasureResult] = useState<{ label: string; value: string; points: {x:number;y:number;z:number}[] } | null>(null)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    try {
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
      })
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setClearColor(0x1a1a2e, 1)
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      const scene = new THREE.Scene()
      scene.fog = new THREE.Fog(0x1a1a2e, 50, 200)
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      )
      camera.position.set(50, 50, 50)
      cameraRef.current = camera

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.screenSpacePanning = true
      controls.minDistance = 10
      controls.maxDistance = 500
      controlsRef.current = controls

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
      directionalLight.position.set(50, 100, 50)
      scene.add(directionalLight)

      const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x333333)
      scene.add(gridHelper)

      const axesHelper = new THREE.AxesHelper(20)
      scene.add(axesHelper)

      const handleResize = () => {
        if (!containerRef.current) return
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }
      window.addEventListener('resize', handleResize)

      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      setIsLoading(false)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current)
        }
        renderer.dispose()
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement)
        }
      }
    } catch (err) {
      console.error('Failed to initialize Three.js:', err)
      setError('Erreur lors de l\'initialisation du visualiseur 3D')
    }
  }, [])

  // Load point cloud from URL or demo
  const loadPointCloud = useCallback(async (url: string | null | undefined, sceneType?: string) => {
    if (!sceneRef.current) return

    // Remove existing point cloud
    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current)
      pointCloudRef.current.geometry.dispose()
      ;(pointCloudRef.current.material as THREE.Material).dispose()
    }

    setIsLoading(true)
    setLoadProgress(0)
    setError(null)

    try {
      let positions: Float32Array
      let colors: Float32Array
      let count: number

      if (url) {
        // Load real file
        const result = await parsePointCloudFile(url, setLoadProgress)
        positions = result.positions
        colors = result.colors
        count = result.count
        setIsRealFile(true)
        setCurrentScene('file')
        toast.success(`Fichier chargé: ${count.toLocaleString()} points`)
      } else {
        // Load demo
        const result = generateDemoPointCloud(sceneType || 'terrain')
        positions = result.positions
        colors = result.colors
        count = result.count
        setIsRealFile(false)
        setCurrentScene(sceneType || 'terrain')
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      // Store raw data for re-coloring
      rawPositionsRef.current = positions
      rawColorsRef.current = colors

      const material = new THREE.PointsMaterial({
        size: pointSize,
        vertexColors: true,
        sizeAttenuation: true,
      })

      const pointCloud = new THREE.Points(geometry, material)
      sceneRef.current.add(pointCloud)
      pointCloudRef.current = pointCloud
      
      setPointCount(count)

      // Fit camera
      if (cameraRef.current && controlsRef.current) {
        controlsRef.current.reset()
        cameraRef.current.position.set(60, 40, 60)
      }

      if (onPointCloudLoad) {
        onPointCloudLoad({ pointCount: count })
      }
    } catch (err) {
      console.error('Error loading point cloud:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      toast.error('Erreur lors du chargement du fichier')
    }

    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPointCloudLoad]) // Note: pointSize handled by separate effect

  // Load file when URL changes
  useEffect(() => {
    // Don't gate on isLoading — that was blocking demo re-loads
    if (!sceneRef.current) return;
    
    const targetUrl = (fileUrl && fileUrl.includes('.html')) ? (rawUrl || null) : fileUrl;
    
    if (loadedUrlRef.current !== targetUrl) {
      loadedUrlRef.current = targetUrl;
      setColorMode('rgb') // Reset color mode on new load
      if (targetUrl) {
        loadPointCloud(targetUrl);
      } else {
        loadPointCloud(null, 'terrain');
      }
    }
  }, [fileUrl, rawUrl, loadPointCloud])

  // Update point size
  useEffect(() => {
    if (pointCloudRef.current) {
      (pointCloudRef.current.material as THREE.PointsMaterial).size = pointSize
    }
  }, [pointSize])

  // Apply color mode whenever it changes
  useEffect(() => {
    if (!pointCloudRef.current || !rawPositionsRef.current || !rawColorsRef.current) return
    const count = rawPositionsRef.current.length / 3
    const newColors = new Float32Array(count * 3)
    const positions = rawPositionsRef.current
    const originalColors = rawColorsRef.current

    if (colorMode === 'rgb') {
      // Restore original RGB colors
      newColors.set(originalColors)
    } else if (colorMode === 'height') {
      // Height-based: blue (low) -> green -> red (high)
      let minY = Infinity, maxY = -Infinity
      for (let i = 0; i < count; i++) { 
        const y = positions[i * 3 + 1]
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
      const range = maxY - minY || 1
      for (let i = 0; i < count; i++) {
        const t = (positions[i * 3 + 1] - minY) / range // 0..1
        // Blue -> Cyan -> Green -> Yellow -> Red
        if (t < 0.25) { newColors[i*3]=0; newColors[i*3+1]=t*4; newColors[i*3+2]=1 }
        else if (t < 0.5) { newColors[i*3]=0; newColors[i*3+1]=1; newColors[i*3+2]=1-(t-0.25)*4 }
        else if (t < 0.75) { newColors[i*3]=(t-0.5)*4; newColors[i*3+1]=1; newColors[i*3+2]=0 }
        else { newColors[i*3]=1; newColors[i*3+1]=1-(t-0.75)*4; newColors[i*3+2]=0 }
      }
    } else if (colorMode === 'intensity') {
      // Grayscale based on original luminance
      for (let i = 0; i < count; i++) {
        const lum = originalColors[i*3]*0.299 + originalColors[i*3+1]*0.587 + originalColors[i*3+2]*0.114
        newColors[i*3] = lum; newColors[i*3+1] = lum; newColors[i*3+2] = lum
      }
    } else if (colorMode === 'classification') {
      // Pseudo-classification by height quartiles: ground, low-veg, high-veg, buildings
      const palette = [
        [0.52, 0.37, 0.26], // ground: brown
        [0.20, 0.70, 0.20], // low vegetation: light green
        [0.06, 0.44, 0.12], // high vegetation: dark green
        [0.20, 0.45, 0.90], // buildings: blue
      ]
      let minY = Infinity, maxY = -Infinity
      for (let i = 0; i < count; i++) {
        const y = positions[i * 3 + 1]
        minY = Math.min(minY, y); maxY = Math.max(maxY, y)
      }
      const range = maxY - minY || 1
      for (let i = 0; i < count; i++) {
        const t = (positions[i * 3 + 1] - minY) / range
        const cls = t < 0.05 ? 0 : t < 0.25 ? 1 : t < 0.70 ? 2 : 3
        const [r,g,b] = palette[cls]
        newColors[i*3] = r; newColors[i*3+1] = g; newColors[i*3+2] = b
      }
    }

    const attr = pointCloudRef.current.geometry.getAttribute('color') as THREE.BufferAttribute
    attr.array.set(newColors)
    attr.needsUpdate = true
  }, [colorMode])

  // Update theme background
  useEffect(() => {
    if (rendererRef.current && sceneRef.current) {
      const color = viewerTheme === 'dark' ? 0x1a1a2e : 0xf8fafc
      rendererRef.current.setClearColor(color, 1)
      sceneRef.current.fog = new THREE.Fog(color, 50, 200)
    }
  }, [viewerTheme])

  // Camera controls
  const zoomIn = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(0.9)
    }
  }, [])

  const zoomOut = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(1.1)
    }
  }, [])

  const resetView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      controlsRef.current.reset()
      cameraRef.current.position.set(50, 50, 50)
    }
  }, [])

  // Fullscreen support
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement
    if (!el) return
    
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(err => {
        toast.error(`Erreur plein écran: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  const setTopView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 100, 0)
      controlsRef.current.update()
    }
  }, [])

  const setFrontView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 25, 100)
      controlsRef.current.update()
    }
  }, [])

  const setSideView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(100, 25, 0)
      controlsRef.current.update()
    }
  }, [])

  const setIsoView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(60, 40, 60)
      controlsRef.current.update()
    }
  }, [])

  // ─── Measurement Tools Engine ─────────────────────────────────────────────

  // Clear all measurement markers from scene
  const clearMeasureMarkers = useCallback(() => {
    measureMarkersRef.current.forEach(obj => {
      sceneRef.current?.remove(obj)
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose()
    })
    measureMarkersRef.current = []
    measurePointsRef.current = []
    setMeasureResult(null)
  }, [])

  // Add a sphere marker at a 3D position
  const addMarker = useCallback((pos: THREE.Vector3, color = 0xff4400, radius = 0.5) => {
    if (!sceneRef.current) return
    const geo = new THREE.SphereGeometry(radius, 8, 8)
    const mat = new THREE.MeshBasicMaterial({ color })
    const sphere = new THREE.Mesh(geo, mat)
    sphere.position.copy(pos)
    sceneRef.current.add(sphere)
    measureMarkersRef.current.push(sphere)
  }, [])

  // Draw a line between two 3D points
  const addLine = useCallback((a: THREE.Vector3, b: THREE.Vector3, color = 0xffdd00) => {
    if (!sceneRef.current) return
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 })
    const geo = new THREE.BufferGeometry().setFromPoints([a, b])
    const line = new THREE.Line(geo, mat)
    sceneRef.current.add(line)
    measureMarkersRef.current.push(line)
  }, [])

  // Raycast a canvas click to the nearest point cloud point
  const pickPoint = useCallback((e: MouseEvent): THREE.Vector3 | null => {
    if (!containerRef.current || !cameraRef.current || !pointCloudRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    const raycaster = new THREE.Raycaster()
    raycaster.params.Points = { threshold: 1.5 } // generous picking radius
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current)
    const hits = raycaster.intersectObject(pointCloudRef.current)
    return hits.length > 0 ? hits[0].point.clone() : null
  }, [])

  // Handle canvas click according to active tool
  const handleMeasureClick = useCallback((e: MouseEvent) => {
    const tool = activeToolRef.current
    if (!tool) return
    const pt = pickPoint(e)
    if (!pt) { toast.warning('Cliquez directement sur un point du nuage'); return }

    if (tool === 'coords') {
      clearMeasureMarkers()
      addMarker(pt, 0x00ccff)
      setMeasureResult({
        label: 'Coordonnées',
        value: `X: ${pt.x.toFixed(2)} | Y: ${pt.y.toFixed(2)} | Z: ${pt.z.toFixed(2)}`,
        points: [{ x: pt.x, y: pt.y, z: pt.z }]
      })
      return
    }

    if (tool === 'height') {
      clearMeasureMarkers()
      const ground = new THREE.Vector3(pt.x, 0, pt.z)
      addMarker(pt, 0xffaa00)
      addMarker(ground, 0x888888, 0.3)
      addLine(ground, pt, 0xffaa00)
      setMeasureResult({
        label: 'Hauteur',
        value: `${Math.abs(pt.y).toFixed(2)} m`,
        points: [{ x: pt.x, y: pt.y, z: pt.z }]
      })
      return
    }

    if (tool === 'distance') {
      measurePointsRef.current.push(pt)
      addMarker(pt, 0x00ff88)
      const pts = measurePointsRef.current
      if (pts.length >= 2) {
        addLine(pts[pts.length - 2], pts[pts.length - 1], 0x00ff88)
        let total = 0
        for (let i = 1; i < pts.length; i++) total += pts[i - 1].distanceTo(pts[i])
        setMeasureResult({
          label: 'Distance totale',
          value: `${total.toFixed(2)} m${pts.length > 2 ? ` (${pts.length - 1} segments)` : ''}`,
          points: pts.map(p => ({ x: p.x, y: p.y, z: p.z }))
        })
      } else {
        toast.info('Cliquez un 2è point pour mesurer la distance')
      }
      return
    }

    if (tool === 'area') {
      measurePointsRef.current.push(pt)
      const pts = measurePointsRef.current
      addMarker(pt, 0xcc44ff)
      if (pts.length >= 2) addLine(pts[pts.length - 2], pts[pts.length - 1], 0xcc44ff)
      if (pts.length >= 3) {
        // Close preview line back to first point
        const existing = measureMarkersRef.current.filter(o => o instanceof THREE.Line && (o as THREE.Line).geometry.getAttribute('position').count === 2)
        const lastPreview = existing[existing.length - 1] as THREE.Line | undefined
        if (lastPreview) { sceneRef.current?.remove(lastPreview); measureMarkersRef.current.pop() }
        addLine(pts[pts.length - 1], pts[0], 0x8822cc)

        // Shoelace formula on XZ plane
        let area = 0
        const n = pts.length
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n
          area += pts[i].x * pts[j].z - pts[j].x * pts[i].z
        }
        area = Math.abs(area) / 2
        setMeasureResult({
          label: `Surface (${pts.length} sommets)`,
          value: area >= 10000 ? `${(area / 10000).toFixed(4)} ha` : `${area.toFixed(2)} m²`,
          points: pts.map(p => ({ x: p.x, y: p.y, z: p.z }))
        })
      } else {
        toast.info(`Ajoutez encore ${3 - pts.length} point(s) puis continuez`)
      }
      return
    }
  }, [pickPoint, clearMeasureMarkers, addMarker, addLine])

  // Attach / detach click listener based on active tool
  const activateTool = useCallback((tool: string) => {
    const next = activeToolRef.current === tool ? null : tool
    activeToolRef.current = next
    setActiveTool(next)
    clearMeasureMarkers()

    if (next) {
      const el = containerRef.current
      if (el) el.addEventListener('click', handleMeasureClick)
      const labels: Record<string, string> = {
        distance: 'Cliquez pour placer les points (Distance)',
        height: 'Cliquez sur un point pour mesurer sa hauteur',
        area: 'Cliquez pour tracer le polygone (Surface)',
        coords: 'Cliquez sur un point pour voir ses coordonnées',
      }
      toast.info(labels[next] || `Outil ${next} activé`)
    } else {
      const el = containerRef.current
      if (el) el.removeEventListener('click', handleMeasureClick)
    }
  }, [clearMeasureMarkers, handleMeasureClick])

  // Clean up listener when component unmounts or tool changes
  useEffect(() => {
    return () => {
      const el = containerRef.current
      if (el) el.removeEventListener('click', handleMeasureClick)
    }
  }, [handleMeasureClick])

  if (error) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
          <div className="text-center text-white">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <p className="text-lg font-medium">Erreur de chargement</p>
            <p className="text-sm text-slate-400 mt-2">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      
      {/* ⚡ If Expert Potree Mode */}
      {fileUrl && (fileUrl.includes('.html') || fileUrl.includes('/potree/')) && !useLightViewer && (
        <div className="absolute inset-0 z-50 rounded-lg overflow-hidden bg-slate-900 flex flex-col">
          <iframe
            src={fileUrl}
            className="flex-1 w-full border-0"
            title="Potree Web Desktop"
            allowFullScreen
          />
          {/* Quick toggle inside iframe overlay */}
          <div className="absolute top-4 right-4 z-[60] pointer-events-auto">
            {onToggleViewer && (
               <Button variant="secondary" onClick={onToggleViewer} className="bg-black/60 hover:bg-black/80 text-white backdrop-blur shadow-xl border border-white/20">
                  <Box className="w-4 h-4 mr-2" /> Passer en WebGL
               </Button>
            )}
          </div>
          <div className="absolute bottom-4 right-4 z-[60] pointer-events-none">
            <Badge variant="default" className="bg-slate-900/80 text-primary border border-primary/20 shadow-xl backdrop-blur">
               ⚡ Moteur Potree Intégré
            </Badge>
          </div>
        </div>
      )}

      {/* 🔹 Basic WebGL Canvas Mode */}
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-lg overflow-hidden"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-lg z-10 w-full h-full">
          <div className="text-center text-white w-64 max-w-[80%]">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="mb-2">{fileUrl ? 'Chargement du fichier...' : 'Chargement...'}</p>
            {fileUrl && (
              <>
                <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden mt-4">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">{loadProgress}%</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-20">
        <Card className="p-1 bg-black/50 border-none pointer-events-auto">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom avant" className="text-white hover:text-white hover:bg-white/20">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom arrière" className="text-white hover:text-white hover:bg-white/20">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={resetView} title="Réinitialiser" className="text-white hover:text-white hover:bg-white/20">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="w-px bg-white/20 mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setViewerTheme(t => t === 'dark' ? 'light' : 'dark')} title="Thème du fond (Clair/Sombre)" className="text-white hover:text-white hover:bg-white/20">
              {viewerTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Visualiseur en Plein Écran" className="text-white hover:text-white hover:bg-white/20">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-1 bg-black/50 border-none pointer-events-auto">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={setTopView} className="text-white hover:text-white hover:bg-white/20">Dessus</Button>
            <Button variant="ghost" size="sm" onClick={setFrontView} className="text-white hover:text-white hover:bg-white/20">Avant</Button>
            <Button variant="ghost" size="sm" onClick={setSideView} className="text-white hover:text-white hover:bg-white/20">Côté</Button>
            <Button variant="ghost" size="sm" onClick={setIsoView} className="text-white hover:text-white hover:bg-white/20">ISO</Button>
            
            {onToggleViewer && fileUrl && fileUrl.includes('.html') && (
              <>
                <div className="w-px bg-white/20 mx-1" />
                <Button variant="outline" size="sm" onClick={onToggleViewer} className="bg-primary/20 text-white border-primary/50 hover:bg-primary/40 hover:text-white">
                  <Box className="w-4 h-4 mr-1" /> Revenir à Potree
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Tool panel: Settings */}
      <div className="absolute top-20 left-4 z-20 flex flex-col gap-2">
        <Card className="p-2 bg-black/50 border-none">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white">Points:</span>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={pointSize}
                onChange={(e) => setPointSize(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-xs text-white w-6">{pointSize}</span>
            </div>
            {/* Color mode buttons */}
            <div>
              <span className="text-[10px] text-white/60 uppercase tracking-wider block mb-1.5">Couleurs</span>
              <div className="grid grid-cols-2 gap-1">
                {(['rgb','height','intensity','classification'] as ColorMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setColorMode(mode)}
                    className={`text-[10px] px-2 py-1 rounded transition-all font-medium ${
                      colorMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {mode === 'rgb' ? 'RGB' : mode === 'height' ? 'Altitude' : mode === 'intensity' ? 'Intensité' : 'Classes'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Demo scenes selector - only show if no real file */}
      {!isRealFile && !fileUrl && (
        <div className="absolute bottom-4 left-4 pointer-events-auto z-20">
          <Card className="p-2 bg-black/50 border-none">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white">Démo:</span>
              {DEMO_SCENES.map((scene) => (
                <Button
                  key={scene.id}
                  variant={currentScene === scene.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => loadPointCloud(null, scene.id)}
                  title={scene.description}
                  className={currentScene === scene.id ? '' : 'text-white hover:text-white hover:bg-white/20'}
                >
                  {scene.name}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Measurement tools */}
      <div className="absolute bottom-4 right-4 pointer-events-auto z-20">
        <Card className="p-2 bg-black/70 border-none backdrop-blur">
          <div className="text-[10px] text-white/50 text-center mb-1.5 uppercase tracking-wider">Mesures</div>
          <div className="flex items-center gap-1">
            <Button
              variant={activeTool === 'distance' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => activateTool('distance')}
              title="Distance: cliquez plusieurs points"
              className={`relative group ${activeTool === 'distance' ? 'bg-green-500 hover:bg-green-600' : 'text-white hover:text-white hover:bg-white/20'}`}
            >
              <Ruler className="h-4 w-4" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Distance
              </span>
            </Button>
            <Button
              variant={activeTool === 'height' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => activateTool('height')}
              title="Hauteur: cliquez un point"
              className={`relative group ${activeTool === 'height' ? 'bg-orange-500 hover:bg-orange-600' : 'text-white hover:text-white hover:bg-white/20'}`}
            >
              <Mountain className="h-4 w-4" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Hauteur
              </span>
            </Button>
            <Button
              variant={activeTool === 'area' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => activateTool('area')}
              title="Surface: cliquez 3+ points"
              className={`relative group ${activeTool === 'area' ? 'bg-purple-500 hover:bg-purple-600' : 'text-white hover:text-white hover:bg-white/20'}`}
            >
              <Square className="h-4 w-4" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Surface
              </span>
            </Button>
            <Button
              variant={activeTool === 'coords' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => activateTool('coords')}
              title="Coordonnées: cliquez un point"
              className={`relative group ${activeTool === 'coords' ? 'bg-cyan-500 hover:bg-cyan-600' : 'text-white hover:text-white hover:bg-white/20'}`}
            >
              <Crosshair className="h-4 w-4" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                XYZ
              </span>
            </Button>
            {activeTool && (
              <>
                <div className="w-px bg-white/20 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => activateTool(activeTool)}
                  title="Effacer les mesures"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <span className="text-sm font-bold">×</span>
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <Card className="p-2 bg-black/50 border-none">
          <div className="flex items-center gap-2 text-white text-xs">
            <Badge variant="outline" className="border-white/30 text-white">
              {pointCount.toLocaleString()} points
            </Badge>
            {isRealFile ? (
              <Badge variant="default" className="bg-green-600">
                Fichier réel
              </Badge>
            ) : (
              <Badge variant="outline" className="border-white/30 text-white">
                Démo
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Controls help */}
      <div className="absolute top-20 right-4 z-20">
        <Card className="p-2 text-xs bg-black/50 text-white border-none">
          <div className="flex items-center gap-2">
            <Move3D className="h-3 w-3" />
            <span>Glisser pour pivoter</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>Molette pour zoomer</span>
          </div>
        </Card>
      </div>

      {/* Measurement result panel */}
      {measureResult && (
        <div className="absolute bottom-20 right-4 z-20 pointer-events-auto">
          <Card className="bg-black/80 border-white/10 backdrop-blur text-white p-3 min-w-[200px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase text-white/50 tracking-wider mb-1">{measureResult.label}</p>
                <p className="text-xl font-bold font-mono text-green-400">{measureResult.value}</p>
                {measureResult.points.length > 1 && (
                  <p className="text-[10px] text-white/40 mt-1">{measureResult.points.length} point(s) placé(s)</p>
                )}
              </div>
              <button
                onClick={() => setMeasureResult(null)}
                className="text-white/40 hover:text-white mt-0.5 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function PotreeViewer(props: PointCloudViewerProps) {
  return <PotreeViewerComponent {...props} />
}
