'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move3D,
  RotateCw,
  Square,
  Ruler,
  Mountain,
  Eye,
  Upload,
  Box,
  Crosshair,
  MapPin,
  Layers,
  Sun,
  Moon,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

// Potree types
interface PotreeViewer {
  scene: {
    pointclouds: unknown[]
    addPointCloud: (pointcloud: unknown) => void
    removePointCloud: (pointcloud: unknown) => void
    view: {
      position: number[]
      yaw: number
      pitch: number
      radius: number
    }
  }
  renderer: unknown
  update: () => void
  fitToScreen: () => void
  setEDLEnabled: (enabled: boolean) => void
  setEDLStrength: (strength: number) => void
  setEDLRadius: (radius: number) => void
  setFOV: (fov: number) => void
  setPointBudget: (budget: number) => void
  loadPOC: (url: string) => Promise<unknown>
  toggleNavigationView: () => void
  toggleEarthView: () => void
  toggleDistanceTool: () => void
  toggleAngleTool: () => void
  toggleAreaTool: () => void
  toggleHeightTool: () => void
  toggleVolumeTool: () => void
  clearMeasurements: () => void
}

interface PotreeViewerProps {
  className?: string
  height?: string
  onPointCloudLoad?: (pointcloud: unknown) => void
  onMeasurement?: (type: string, value: number) => void
}

// Demo point cloud URLs from Potree
const DEMO_POINT_CLOUDS = [
  {
    name: 'Lion Takanawa',
    url: 'https://potree.github.io/lion_takanaya/cloud.js',
    description: 'Lion statue in Tokyo',
  },
  {
    name: 'Heidentor',
    url: 'https://www.potree.org/data/test/Heidentor/cloud.js',
    description: 'Roman triumphal arch',
  },
  {
    name: 'CA13',
    url: 'https://www.potree.org/data/test/CA13/cloud.js',
    description: 'Aerial scan',
  },
]

export function PotreeViewerComponent({
  className = '',
  height = '100%',
  onPointCloudLoad,
  onMeasurement,
}: PotreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<PotreeViewer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPotreeLoaded, setIsPotreeLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pointSize, setPointSize] = useState(1.5)
  const [pointBudget, setPointBudget] = useState(1.5)
  const [fov, setFov] = useState(75)
  const [edlEnabled, setEdlEnabled] = useState(true)
  const [edlStrength, setEdlStrength] = useState(1.0)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [loadedCloud, setLoadedCloud] = useState<string | null>(null)

  // Load Potree from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadPotree = async () => {
      try {
        // Load Potree CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/potree@1.8.0/build/potree/potree.css'
        document.head.appendChild(link)

        // Load Potree JS
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/potree@1.8.0/build/potree/potree.js'
        script.async = true
        
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })

        setIsPotreeLoaded(true)
      } catch (err) {
        console.error('Failed to load Potree:', err)
        setError('Impossible de charger Potree. Vérifiez votre connexion internet.')
      }
    }

    loadPotree()

    return () => {
      // Cleanup
      const potreeLinks = document.querySelectorAll('link[href*="potree"]')
      potreeLinks.forEach(link => link.remove())
      const potreeScripts = document.querySelectorAll('script[src*="potree"]')
      potreeScripts.forEach(script => script.remove())
    }
  }, [])

  // Initialize Potree viewer
  useEffect(() => {
    if (!containerRef.current || !isPotreeLoaded) return

    const Potree = (window as unknown as { Potree: { 
      Viewer: new (element: HTMLElement) => PotreeViewer 
    } }).Potree
    
    if (!Potree) {
      setError('Potree non disponible')
      return
    }

    try {
      const viewer = new Potree.Viewer(containerRef.current)
      viewerRef.current = viewer

      // Set initial settings
      viewer.setEDLEnabled(edlEnabled)
      viewer.setEDLStrength(edlStrength)
      viewer.setFOV(fov)
      viewer.setPointBudget(pointBudget * 1000000)

      // Load default point cloud
      loadPointCloud(DEMO_POINT_CLOUDS[0].url)

      setIsLoading(false)
    } catch (err) {
      console.error('Failed to initialize Potree:', err)
      setError('Erreur lors de l\'initialisation du visualiseur 3D')
    }

    return () => {
      viewerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPotreeLoaded])

  // Update viewer settings
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    viewer.setFOV(fov)
    viewer.setPointBudget(pointBudget * 1000000)
    viewer.setEDLEnabled(edlEnabled)
    viewer.setEDLStrength(edlStrength)
  }, [fov, pointBudget, edlEnabled, edlStrength])

  // Load point cloud
  const loadPointCloud = useCallback(async (url: string) => {
    const viewer = viewerRef.current
    const Potree = (window as unknown as { Potree: { loadPOC: (url: string) => Promise<unknown> } }).Potree
    
    if (!viewer || !Potree) {
      toast.error('Visualiseur non initialisé')
      return
    }

    setIsLoading(true)
    try {
      const pointcloud = await Potree.loadPOC(url)
      viewer.scene.addPointCloud(pointcloud)
      viewer.fitToScreen()
      
      setLoadedCloud(url)
      onPointCloudLoad?.(pointcloud)
      toast.success('Nuage de points chargé')
    } catch (err) {
      console.error('Failed to load point cloud:', err)
      toast.error('Erreur lors du chargement du nuage de points')
    } finally {
      setIsLoading(false)
    }
  }, [onPointCloudLoad])

  // View controls
  const zoomIn = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.scene.view.radius *= 0.9
    viewer.update()
  }, [])

  const zoomOut = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.scene.view.radius *= 1.1
    viewer.update()
  }, [])

  const resetView = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.fitToScreen()
  }, [])

  // View presets
  const setTopView = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.scene.view.pitch = -Math.PI / 2
    viewer.update()
  }, [])

  const setFrontView = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.scene.view.pitch = 0
    viewer.scene.view.yaw = 0
    viewer.update()
  }, [])

  const setSideView = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.scene.view.pitch = 0
    viewer.scene.view.yaw = Math.PI / 2
    viewer.update()
  }, [])

  const setIsoView = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.scene.view.pitch = -Math.PI / 4
    viewer.scene.view.yaw = Math.PI / 4
    viewer.update()
  }, [])

  // Measurement tools
  const toggleTool = useCallback((tool: string) => {
    const viewer = viewerRef.current
    if (!viewer) return

    // Clear previous tool
    if (activeTool && activeTool !== tool) {
      viewer.clearMeasurements()
    }

    setActiveTool(tool === activeTool ? null : tool)

    switch (tool) {
      case 'distance':
        viewer.toggleDistanceTool()
        break
      case 'angle':
        viewer.toggleAngleTool()
        break
      case 'area':
        viewer.toggleAreaTool()
        break
      case 'height':
        viewer.toggleHeightTool()
        break
      case 'volume':
        viewer.toggleVolumeTool()
        break
    }
  }, [activeTool])

  const clearMeasurements = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.clearMeasurements()
    setActiveTool(null)
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    if (ext !== 'las' && ext !== 'laz') {
      toast.error('Format non supporté. Utilisez .las ou .laz')
      return
    }

    // Note: Real LAS/LAZ loading requires server-side conversion to Potree format
    // For now, show a message about this limitation
    toast.info('Le chargement de fichiers LAS/LAZ nécessite une conversion côté serveur. Cette fonctionnalité sera bientôt disponible.')
  }, [])

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
      {/* Potree container */}
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-lg bg-slate-900"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-lg">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Chargement du visualiseur 3D...</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <Card className="p-1">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom avant">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom arrière">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={resetView} title="Réinitialiser">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <Card className="p-1">
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={setTopView}>Dessus</Button>
              <Button variant="ghost" size="sm" onClick={setFrontView}>Avant</Button>
              <Button variant="ghost" size="sm" onClick={setSideView}>Côté</Button>
              <Button variant="ghost" size="sm" onClick={setIsoView}>ISO</Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Demo point clouds selector */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Démos:</span>
            {DEMO_POINT_CLOUDS.map((cloud) => (
              <Button
                key={cloud.name}
                variant={loadedCloud === cloud.url ? 'default' : 'ghost'}
                size="sm"
                onClick={() => loadPointCloud(cloud.url)}
                title={cloud.description}
              >
                {cloud.name}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Info overlay */}
      <div className="absolute top-4 left-4 mt-16">
        <Card className="p-2 text-xs bg-black/50 text-white border-none">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary" />
            <span>Glissez pour faire pivoter</span>
          </div>
          <div className="flex items-center gap-2">
            <Move3D className="h-3 w-3 text-primary" />
            <span>Mollette pour zoomer</span>
          </div>
        </Card>
      </div>

      {/* Active tool indicator */}
      {activeTool && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <Card className="p-2">
            <Badge variant="default" className="gap-2">
              <Ruler className="h-3 w-3" />
              Mode: {activeTool}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 px-1"
                onClick={clearMeasurements}
              >
                Annuler
              </Button>
            </Badge>
          </Card>
        </div>
      )}
    </div>
  )
}

// Export with dynamic import to avoid SSR
export default function PotreeViewer(props: PotreeViewerProps) {
  return <PotreeViewerComponent {...props} />
}
