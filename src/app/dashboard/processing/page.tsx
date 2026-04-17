'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { 
  Upload, 
  Layers, 
  Image as ImageIcon, 
  Settings2,
  Play,
  Server,
  Zap,
  CheckCircle2,
  Clock,
  Cpu,
  MapPin,
  Check,
  XCircle,
  Archive
} from 'lucide-react'

// Simulated Stages of OpenDroneMap
const ODM_STAGES = [
  { id: 'upload', name: 'Transfert vers le serveur Cloud', weight: 5, timeMins: 0.1 },
  { id: 'dataset', name: 'Analyse du jeu de données', weight: 5, timeMins: 0.2 },
  { id: 'sfm', name: 'Structure from Motion (SfM) - Alignement SIFT', weight: 25, timeMins: 2.5 },
  { id: 'mvs', name: 'Multi-View Stereo (MVS) - Nuage Dense', weight: 30, timeMins: 4.0 },
  { id: 'meshing', name: 'Génération du Maillage 3D', weight: 15, timeMins: 1.5 },
  { id: 'texturing', name: 'Texturalisation Haute-Définition', weight: 10, timeMins: 1.0 },
  { id: 'orthophoto', name: 'Génération Orthophoto et MNS', weight: 10, timeMins: 1.5 },
]

export default function ProcessingPage() {
  const [images, setImages] = useState<File[]>([])
  const [projectName, setProjectName] = useState('Nouveau_Projet_Drone')
  const [quality, setQuality] = useState('high') // fast, default, high
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [currentStageIndex, setCurrentStageIndex] = useState(-1)
  const [timeLeft, setTimeLeft] = useState('')
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const consoleRef = useRef<HTMLDivElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const addLog = (msg: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].substring(0,8)}] ${msg}`])
  }

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleLogs])

  const startProcessing = () => {
    if (images.length < 3) {
      toast.error('Veuillez importer au moins 3 images pour la photogrammétrie')
      return
    }
    
    setIsProcessing(true)
    setIsDone(false)
    setOverallProgress(0)
    setConsoleLogs([])
    setCurrentStageIndex(0)
    
    addLog(`Démarrage du conteneur NodeODM pour le projet ${projectName}...`)

    // This is the simulation engine
    // Since we don't want the user to literally wait 2 hours, we speed it up 
    // to complete in roughly 20 seconds.
    let currentVProgress = 0
    let stageId = 0
    let stageProgressLocal = 0

    const interval = setInterval(() => {
      // Advance progress
      // We advance global progress a bit faster
      currentVProgress += 0.5 // 0.5% per tick (100 ticks = 200 * 100ms = 20 seconds)
      
      if (currentVProgress >= 100) {
        clearInterval(interval)
        setIsProcessing(false)
        setIsDone(true)
        setOverallProgress(100)
        setCurrentStageIndex(ODM_STAGES.length)
        addLog(`>> Tâche terminée avec succès. Données prêtes pour l'export.`)
        
        // Let's create a fake entry in the user's DB via fetch POST /api/files (using JSON)
        saveSimulatedResultToDatabase()
        
        return
      }

      setOverallProgress(currentVProgress)

      // Calculate which stage we are based on cumulative weights
      let accumulatedWeight = 0;
      for (let i = 0; i < ODM_STAGES.length; i++) {
        accumulatedWeight += ODM_STAGES[i].weight
        if (currentVProgress <= accumulatedWeight) {
          if (stageId !== i) {
            stageId = i
            setCurrentStageIndex(i)
            addLog(`=== Début de la phase : ${ODM_STAGES[i].name} ===`)
          }
          break
        }
      }

      // Add random logs depending on the stage
      if (Math.random() > 0.85) {
        if (stageId === 0) addLog(`Upload: ${(Math.random() * 100).toFixed(1)}%`)
        if (stageId === 2) addLog(`Sift: Trouvé ${Math.floor(Math.random() * 5000) + 1000} points clés (feature_points)`)
        if (stageId === 3) addLog(`MVS: Reconstruction depthmap ${Math.floor(Math.random() * 100)}%`)
        if (stageId === 4) addLog(`Meshing: Fusionnement des sommets... (Vertices = ${Math.floor(Math.random() * 1000000)})`)
        if (stageId === 5) addLog(`Texturing: Emballage UV et fusion des textures...`)
        if (stageId === 6) addLog(`Ortho: Rendu Geotiff avec projection EPSG:4326`)
      }

      // Simulate time left
      const totalTicks = 200; // 20s
      const ticksLeft = totalTicks - (currentVProgress * 2)
      const secs = Math.floor((ticksLeft * 100) / 1000)
      setTimeLeft(`~ 00:00:${secs.toString().padStart(2,'0')}`)

    }, 80)
  }

  const saveSimulatedResultToDatabase = async () => {
    try {
      // Simulating a Point Cloud result
      const geoId = uuidv4()
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: geoId,
          name: `${projectName}_Pointcloud.laz`,
          type: 'las',
          size: 154000000, // 154 MB fake
          url: null, // Would be a real potree link if we processed it
          metadata: {
            source: 'WebODM Simulation',
            imagesCount: images.length
          },
          analysis: {
            status: 'completed',
            pointCloud: {
              pointCount: 3500200,
              avgDensity: 42.5
            }
          }
        })
      })

      // Simulating an Orthophoto result
      const imgId = uuidv4()
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: imgId,
          name: `${projectName}_Orthophoto.tif`,
          type: 'geotiff',
          size: 45000000, // 45 MB
          metadata: {
            source: 'WebODM Simulation',
            width: 8000,
            height: 8000
          },
          analysis: {
            status: 'completed',
            image: {
               width: 8000,
               height: 8000,
               hasGps: true
            }
          }
        })
      })
      toast.success('Fichiers enregistrés dans la Base de Données !')
    } catch(err) {
      console.error(err)
    }
  }

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1 pb-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Module Expert</Badge>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Photogrammétrie 3D</Badge>
        </div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          Moteur de Traitement (OpenDroneMap)
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Convertissez automatiquement vos relevés photographiques aériens (Drone) en modèles 3D texturés, nuages de points denses, 
          modèles numériques de surface (MNS) et ortho-mosaïques prêtes pour les SIG.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Config */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Configuration du Job
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom du projet</label>
                <Input 
                  value={projectName} 
                  onChange={e => setProjectName(e.target.value)} 
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  Images du drone (JPG)
                  <Badge variant="secondary">{images.length} fichiers</Badge>
                </label>
                <label className="flex items-center justify-center gap-2 w-full p-6 py-10 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors text-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <div className="flex flex-col items-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="font-medium">Importer des images</span>
                    <span className="text-xs text-muted-foreground mt-1">Sélectionnez multiples fichiers</span>
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Qualité du traitement</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={quality === 'fast' ? 'default' : 'outline'} 
                    size="sm"
                    className="text-xs"
                    onClick={() => setQuality('fast')}
                    disabled={isProcessing}
                  >
                    <Zap className="h-3 w-3 mr-1" /> Rapide
                  </Button>
                  <Button 
                    variant={quality === 'default' ? 'default' : 'outline'} 
                    size="sm"
                    className="text-xs"
                    onClick={() => setQuality('default')}
                    disabled={isProcessing}
                  >
                    Standard
                  </Button>
                  <Button 
                    variant={quality === 'high' ? 'default' : 'outline'} 
                    size="sm"
                    className="text-xs"
                    onClick={() => setQuality('high')}
                    disabled={isProcessing}
                  >
                    <MapPin className="h-3 w-3 mr-1" /> Haute Rép.
                  </Button>
                </div>
              </div>

            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12"
                onClick={startProcessing}
                disabled={isProcessing || images.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Server className="h-4 w-4 mr-2 animate-pulse" />
                    Calcul en cours sur le cluster...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Lancer l'extraction 3D
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Processing Pipeline */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Progression du Pipeline Cloud</CardTitle>
                {isProcessing && (
                  <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-500 border-green-500/20">
                    Calcul Actif
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  {isDone ? <span className="text-primary">Terminé à 100%</span> : <span>Overall Progress</span>}
                  <span>{overallProgress.toFixed(1)}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
                {isProcessing && (
                  <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">
                    <Clock className="h-3 w-3" /> Temps restant estimé : {timeLeft}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium uppercase text-muted-foreground">Étapes OpenDroneMap</h4>
                  {ODM_STAGES.map((stage, i) => {
                    let statusColor = "text-muted-foreground border-muted"
                    let Icon = Server
                    let label = "En attente"

                    if (i < currentStageIndex) {
                      statusColor = "text-green-500 border-green-500/30 bg-green-500/5"
                      Icon = CheckCircle2
                      label = "Terminé"
                    } else if (i === currentStageIndex) {
                      statusColor = "text-primary border-primary bg-primary/10 shadow-sm"
                      Icon = Cpu
                      label = "En cours..."
                    }

                    return (
                      <div key={stage.id} className={`flex items-start gap-3 p-3 rounded-md border ${statusColor} transition-colors`}>
                        <Icon className={`h-5 w-5 mt-0.5 ${i === currentStageIndex ? 'animate-pulse' : ''}`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm leading-none">{stage.name}</p>
                          <p className="text-xs opacity-70 mt-1">{label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden font-mono text-xs">
                  <div className="bg-slate-900 border-b border-slate-800 p-2 text-slate-400 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="ml-2">Console ODM Server</span>
                  </div>
                  <div 
                    ref={consoleRef}
                    className="flex-1 p-3 overflow-y-auto text-green-400 space-y-1 h-[300px] md:h-auto scrollbar-thin scrollbar-thumb-gray-800"
                  >
                    {!isProcessing && !isDone && (
                      <p className="opacity-50">En attente de soumission...</p>
                    )}
                    {consoleLogs.map((log, i) => (
                      <p key={i} className={log.includes('===') ? 'text-white font-bold my-2' : ''}>
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Action */}
          <AnimatePresence>
            {isDone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-green-500 flex items-center gap-2">
                        <Check className="h-6 w-6" /> Traitement Réussi !
                      </h3>
                      <p className="text-sm mt-1">Vos données ont été sauvegardées dans la base de données. Vous pouvez y accéder dans la visionneuse Média et 3D.</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="gap-2">
                        <Archive className="h-4 w-4" /> Sauvegardes brutes
                      </Button>
                      <Button onClick={() => window.location.href = '/dashboard/point-cloud'} className="bg-green-600 hover:bg-green-700">
                        Aller à la visionneuse 3D
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
