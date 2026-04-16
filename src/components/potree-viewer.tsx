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
} from 'lucide-react'
import { toast } from 'sonner'

// Three.js imports
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { LASLoader } from 'three/examples/jsm/loaders/LASLoader.js'

interface PointCloudViewerProps {
  className?: string
  height?: string
  onPointCloudLoad?: (pointcloud: unknown) => void
  onMeasurement?: (type: string, value: number) => void
}

// Generate random point cloud data for demo
function generateDemoPointCloud(count: number = 50000): Float32Array {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    // Create a 3D terrain-like shape
    const x = (Math.random() - 0.5) * 100
    const z = (Math.random() - 0.5) * 100
    const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 10 + Math.random() * 5
    
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    
    // Color based on height
    const normalizedY = (y + 10) / 20
    colors[i * 3] = normalizedY * 0.2 + 0.1     // R
    colors[i * 3 + 1] = 0.6 - normalizedY * 0.3 // G
    colors[i * 3 + 2] = normalizedY * 0.5 + 0.3  // B
  }
  
  return { positions, colors } as unknown as Float32Array
}

// Demo scenes
const DEMO_SCENES = [
  { id: 'terrain', name: 'Terrain 3D', description: 'Terrain synthétique' },
  { id: 'building', name: 'Bâtiment', description: 'Scan de bâtiment' },
  { id: 'forest', name: 'Forêt', description: 'Scan forestier' },
]

export function PotreeViewerComponent({
  className = '',
  height = '100%',
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
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pointSize, setPointSize] = useState(2)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [currentScene, setCurrentScene] = useState('terrain')
  const [pointCount, setPointCount] = useState(0)
  const [measurementValue, setMeasurementValue] = useState<string | null>(null)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    try {
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
      })
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setClearColor(0x1a1a2e, 1)
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Create scene
      const scene = new THREE.Scene()
      scene.fog = new THREE.Fog(0x1a1a2e, 50, 200)
      sceneRef.current = scene

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      )
      camera.position.set(50, 50, 50)
      cameraRef.current = camera

      // Create controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.screenSpacePanning = true
      controls.minDistance = 10
      controls.maxDistance = 500
      controlsRef.current = controls

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
      directionalLight.position.set(50, 100, 50)
      scene.add(directionalLight)

      // Add grid
      const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x333333)
      scene.add(gridHelper)

      // Add axes
      const axesHelper = new THREE.AxesHelper(20)
      scene.add(axesHelper)

      // Handle resize
      const handleResize = () => {
        if (!containerRef.current) return
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }
      window.addEventListener('resize', handleResize)

      // Animation loop
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

  // Load demo point cloud
  const loadDemoPointCloud = useCallback((sceneType: string) => {
    if (!sceneRef.current) return

    // Remove existing point cloud
    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current)
      pointCloudRef.current.geometry.dispose()
      ;(pointCloudRef.current.material as THREE.Material).dispose()
    }

    setIsLoading(true)
    
    // Generate points based on scene type
    const count = sceneType === 'building' ? 80000 : sceneType === 'forest' ? 60000 : 50000
    const data = generateDemoPointCloud(count)
    
    // Create geometry
    const geometry = new THREE.BufferGeometry()
    
    if (sceneType === 'building') {
      // Building-like structure
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      
      for (let i = 0; i < count; i++) {
        const isWall = Math.random() > 0.3
        if (isWall) {
          // Walls
          const side = Math.floor(Math.random() * 4)
          const x = side === 0 ? -20 : side === 1 ? 20 : (Math.random() - 0.5) * 40
          const z = side === 2 ? -20 : side === 3 ? 20 : (Math.random() - 0.5) * 40
          const y = Math.random() * 30
          
          positions[i * 3] = x
          positions[i * 3 + 1] = y
          positions[i * 3 + 2] = z
        } else {
          // Roof
          positions[i * 3] = (Math.random() - 0.5) * 40
          positions[i * 3 + 1] = 30 + Math.random() * 5
          positions[i * 3 + 2] = (Math.random() - 0.5) * 40
        }
        
        colors[i * 3] = 0.7 + Math.random() * 0.3
        colors[i * 3 + 1] = 0.6 + Math.random() * 0.2
        colors[i * 3 + 2] = 0.5 + Math.random() * 0.2
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    } else if (sceneType === 'forest') {
      // Forest-like structure with trees
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      
      for (let i = 0; i < count; i++) {
        const treeX = Math.floor(Math.random() * 20) * 5 - 50
        const treeZ = Math.floor(Math.random() * 20) * 5 - 50
        const isTree = Math.random() > 0.2
        
        if (isTree) {
          // Tree trunk/crown
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * 2
          positions[i * 3] = treeX + Math.cos(angle) * radius
          positions[i * 3 + 1] = Math.random() * 15
          positions[i * 3 + 2] = treeZ + Math.sin(angle) * radius
          
          // Green colors
          colors[i * 3] = 0.1 + Math.random() * 0.2
          colors[i * 3 + 1] = 0.4 + Math.random() * 0.4
          colors[i * 3 + 2] = 0.1 + Math.random() * 0.2
        } else {
          // Ground
          positions[i * 3] = (Math.random() - 0.5) * 100
          positions[i * 3 + 1] = Math.random() * 0.5
          positions[i * 3 + 2] = (Math.random() - 0.5) * 100
          
          colors[i * 3] = 0.3 + Math.random() * 0.2
          colors[i * 3 + 1] = 0.2 + Math.random() * 0.1
          colors[i * 3 + 2] = 0.1
        }
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    } else {
      // Terrain
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      
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
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }

    // Create material
    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: true,
    })

    // Create point cloud
    const pointCloud = new THREE.Points(geometry, material)
    sceneRef.current.add(pointCloud)
    pointCloudRef.current = pointCloud
    
    setPointCount(count)
    setCurrentScene(sceneType)
    setIsLoading(false)
    toast.success(`Nuage de points chargé: ${count.toLocaleString()} points`)
    
    // Fit camera
    if (cameraRef.current && controlsRef.current) {
      controlsRef.current.reset()
      cameraRef.current.position.set(60, 40, 60)
    }
  }, [pointSize])

  // Load initial point cloud
  useEffect(() => {
    if (!isLoading && sceneRef.current) {
      loadDemoPointCloud('terrain')
    }
  }, [isLoading, loadDemoPointCloud])

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
      toast.info(`Outil ${tool} activé - Cliquez sur les points pour mesurer`)
    }
  }, [activeTool])

  if (error) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
          <div className="text-center text-white">
            <Box className="h-16 w-16 mx-auto mb-4 opacity-50" />
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
      {/* Three.js container */}
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-lg overflow-hidden"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-lg z-10">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Chargement du nuage de points...</p>
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

      {/* Demo scenes selector */}
      <div className="absolute bottom-4 left-4 pointer-events-auto z-20">
        <Card className="p-2 bg-black/50 border-none">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white">Scènes:</span>
            {DEMO_SCENES.map((scene) => (
              <Button
                key={scene.id}
                variant={currentScene === scene.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => loadDemoPointCloud(scene.id)}
                title={scene.description}
                className={currentScene === scene.id ? '' : 'text-white hover:text-white hover:bg-white/20'}
              >
                {scene.name}
              </Button>
            ))}
          </div>
        </Card>
      </div>

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
            <Badge variant="outline" className="border-white/30 text-white">
              {currentScene}
            </Badge>
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
