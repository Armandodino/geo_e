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
} from 'lucide-react'
import { toast } from 'sonner'

// Three.js imports
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Loaders.gl for LAZ/LAS support
import { parse } from '@loaders.gl/core'
import { LASLoader } from '@loaders.gl/las'

interface PointCloudViewerProps {
  className?: string
  height?: string
  fileUrl?: string | null
  fileName?: string
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
  fileName,
  onPointCloudLoad,
  onMeasurement,
}: PointCloudViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const pointCloudRef = useRef<THREE.Points | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const loadedUrlRef = useRef<string | null | undefined>('__initial__')
  
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pointSize, setPointSize] = useState(2)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [currentScene, setCurrentScene] = useState('terrain')
  const [pointCount, setPointCount] = useState(0)
  const [isRealFile, setIsRealFile] = useState(false)
  const [measurementValue, setMeasurementValue] = useState<string | null>(null)

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
  }, [pointSize, onPointCloudLoad])

  // Load file when URL changes
  useEffect(() => {
    if (isLoading || !sceneRef.current) return;
    
    if (loadedUrlRef.current !== fileUrl) {
      loadedUrlRef.current = fileUrl;
      if (fileUrl) {
        loadPointCloud(fileUrl);
      } else {
        loadPointCloud(null, 'terrain');
      }
    }
  }, [isLoading, fileUrl, loadPointCloud])

  // Update point size
  useEffect(() => {
    if (pointCloudRef.current) {
      (pointCloudRef.current.material as THREE.PointsMaterial).size = pointSize
    }
  }, [pointSize])

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

  // Measurement tools
  const activateTool = useCallback((tool: string) => {
    setActiveTool(activeTool === tool ? null : tool)
    setMeasurementValue(null)
    
    if (tool !== activeTool) {
      toast.info(`Outil ${tool} activé`)
    }
  }, [activeTool])

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

  // Inject IFRAME here if the URL is an official Potree HTML page generated by the backend
  if (fileUrl && (fileUrl.includes('.html') || fileUrl.includes('/potree/'))) {
    return (
      <div className={`relative w-full overflow-hidden rounded-lg ${className}`} style={{ height }}>
        <iframe
          src={fileUrl}
          className="absolute inset-0 w-full h-full border-0 z-10"
          title="Potree Web Desktop"
          allowFullScreen
        />
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
          <Badge variant="default" className="bg-slate-900/80 text-primary border border-primary/20 shadow-xl backdrop-blur">
             ⚡ Moteur Potree Intégré
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Three.js container */}
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
          </div>
        </Card>

        <Card className="p-1 bg-black/50 border-none pointer-events-auto">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={setTopView} className="text-white hover:text-white hover:bg-white/20">Dessus</Button>
            <Button variant="ghost" size="sm" onClick={setFrontView} className="text-white hover:text-white hover:bg-white/20">Avant</Button>
            <Button variant="ghost" size="sm" onClick={setSideView} className="text-white hover:text-white hover:bg-white/20">Côté</Button>
            <Button variant="ghost" size="sm" onClick={setIsoView} className="text-white hover:text-white hover:bg-white/20">ISO</Button>
          </div>
        </Card>
      </div>

      {/* Point size control */}
      <div className="absolute top-20 left-4 z-20">
        <Card className="p-2 bg-black/50 border-none">
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
            <span className="text-xs text-white">{pointSize}</span>
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
        <Card className="p-2 bg-black/50 border-none">
          <div className="flex items-center gap-1">
            <Button
              variant={activeTool === 'distance' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => activateTool('distance')}
              title="Mesure distance"
              className={activeTool === 'distance' ? '' : 'text-white hover:text-white hover:bg-white/20'}
            >
              <Ruler className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'height' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => activateTool('height')}
              title="Mesure hauteur"
              className={activeTool === 'height' ? '' : 'text-white hover:text-white hover:bg-white/20'}
            >
              <Mountain className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'area' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => activateTool('area')}
              title="Mesure surface"
              className={activeTool === 'area' ? '' : 'text-white hover:text-white hover:bg-white/20'}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'angle' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => activateTool('angle')}
              title="Mesure angle"
              className={activeTool === 'angle' ? '' : 'text-white hover:text-white hover:bg-white/20'}
            >
              <Crosshair className="h-4 w-4" />
            </Button>
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

      {/* Active tool indicator */}
      {activeTool && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <Card className="p-2 bg-primary text-primary-foreground">
            <Badge className="gap-2">
              <Ruler className="h-3 w-3" />
              Mode: {activeTool}
              {measurementValue && <span className="ml-2">{measurementValue}</span>}
            </Badge>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function PotreeViewer(props: PointCloudViewerProps) {
  return <PotreeViewerComponent {...props} />
}
