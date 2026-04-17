'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
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
  FileDown,
  FileText,
  Table,
  FileCode2,
  BarChart3,
  HardDrive,
  Grid,
  Globe,
  Maximize2,
  AlertCircle,
  RotateCcw,
  Eye,
  X,
  Camera,
  Wifi,
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { exportJSON, exportCSV, exportHTMLReport } from '@/lib/export-utils'

// ─── ODM Pipeline stages ──────────────────────────────────────────────────────
const ODM_STAGES = [
  { id: 'upload',     name: 'Transfert vers le serveur Cloud',          weight: 5,  icon: Wifi,         color: 'text-sky-400' },
  { id: 'dataset',   name: 'Analyse du jeu de données',                 weight: 5,  icon: Camera,       color: 'text-blue-400' },
  { id: 'sfm',       name: 'Structure from Motion (SfM) — SIFT',        weight: 25, icon: Grid,         color: 'text-indigo-400' },
  { id: 'mvs',       name: 'Multi-View Stereo (MVS) — Nuage Dense',     weight: 30, icon: Layers,       color: 'text-violet-400' },
  { id: 'meshing',   name: 'Génération du Maillage 3D',                  weight: 15, icon: Maximize2,    color: 'text-purple-400' },
  { id: 'texturing', name: 'Texturalisation Haute-Définition',           weight: 10, icon: Globe,        color: 'text-fuchsia-400' },
  { id: 'orthophoto',name: 'Génération Orthophoto et MNS',               weight: 10, icon: MapPin,       color: 'text-pink-400' },
]

// ─── Quality presets ──────────────────────────────────────────────────────────
const QUALITY_PRESETS = [
  { id: 'fast',    label: 'Rapide',       desc: '~30 min | Résolution basse | Test rapide',        icon: Zap },
  { id: 'default', label: 'Standard',     desc: '~2h    | Bonne résolution | Usage courant',        icon: Server },
  { id: 'high',    label: 'Haute Rép.',   desc: '~6h    | Résolution max    | Production finale',   icon: MapPin },
]

// ─── Mock job history ─────────────────────────────────────────────────────────
const INITIAL_HISTORY = [
  { id: 'job-001', name: 'Site_Cocody_A', date: '2024-03-10', images: 142, quality: 'high',    status: 'completed', points: '4.2M', ortho: '12 800 px' },
  { id: 'job-002', name: 'Chantier_B2',   date: '2024-02-25', images: 89,  quality: 'default', status: 'completed', points: '2.8M', ortho: '8 000 px'  },
  { id: 'job-003', name: 'Foret_Zone3',   date: '2024-01-18', images: 210, quality: 'high',    status: 'failed',    points: '—',    ortho: '—'           },
]

// ─── Simulated output files ───────────────────────────────────────────────────
function buildOutputFiles(projectName: string) {
  return [
    { name: `${projectName}_Pointcloud.laz`,    type: 'LAS/LAZ',  size: '154 Mo', points: '3 500 200', icon: Layers,  color: 'text-violet-500', desc: 'Nuage de points dense haute résolution' },
    { name: `${projectName}_Orthophoto.tif`,    type: 'GeoTIFF',  size: '45 Mo',  points: '—',          icon: Globe,   color: 'text-sky-500',    desc: 'Orthophoto 8 000×8 000 px | EPSG:4326' },
    { name: `${projectName}_Maillage.obj`,      type: 'OBJ/MTL',  size: '210 Mo', points: '—',          icon: Grid,    color: 'text-amber-500',  desc: 'Maillage 3D texturé haute résolution' },
    { name: `${projectName}_MNS.tif`,           type: 'GeoTIFF',  size: '28 Mo',  points: '—',          icon: BarChart3, color: 'text-green-500', desc: 'Modèle numérique de surface (DSM)' },
    { name: `${projectName}_Rapport.pdf`,       type: 'PDF',      size: '3.2 Mo', points: '—',          icon: FileText, color: 'text-red-400',   desc: 'Rapport qualité ODM complet' },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProcessingPage() {
  const [activeTab, setActiveTab] = useState('traitement')
  const [images, setImages] = useState<File[]>([])
  const [projectName, setProjectName] = useState('Nouveau_Projet_Drone')
  const [quality, setQuality] = useState('high')
  const [enableOrtho, setEnableOrtho] = useState(true)
  const [enableMesh, setEnableMesh] = useState(true)
  const [enableReport, setEnableReport] = useState(true)

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [currentStageIndex, setCurrentStageIndex] = useState(-1)
  const [timeLeft, setTimeLeft] = useState('')
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [jobHistory, setJobHistory] = useState(INITIAL_HISTORY)
  const consoleRef = useRef<HTMLDivElement>(null)

  const outputFiles = buildOutputFiles(projectName)

  const addLog = (msg: string) =>
    setConsoleLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].substring(0, 8)}] ${msg}`])

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight
  }, [consoleLogs])

  const startProcessing = () => {
    if (images.length < 3) { toast.error('Veuillez importer au moins 3 images'); return }
    setIsProcessing(true); setIsDone(false); setOverallProgress(0)
    setConsoleLogs([]); setCurrentStageIndex(0)
    addLog(`Démarrage du conteneur NodeODM pour le projet "${projectName}"...`)
    addLog(`Qualité : ${quality} | Options : ortho=${enableOrtho} mesh=${enableMesh} report=${enableReport}`)

    let progress = 0; let stageId = 0

    const interval = setInterval(() => {
      progress += 0.5
      if (progress >= 100) {
        clearInterval(interval); setIsProcessing(false); setIsDone(true)
        setOverallProgress(100); setCurrentStageIndex(ODM_STAGES.length)
        addLog(`>> Tâche terminée avec succès. Données prêtes pour l'export.`)
        saveSimulatedResultToDatabase()
        // Add to history
        setJobHistory(prev => [{
          id: `job-${Date.now()}`, name: projectName, date: new Date().toLocaleDateString('fr-FR'),
          images: images.length, quality, status: 'completed', points: '3.5M', ortho: '8 000 px'
        }, ...prev])
        setActiveTab('resultats')
        return
      }
      setOverallProgress(progress)

      let acc = 0
      for (let i = 0; i < ODM_STAGES.length; i++) {
        acc += ODM_STAGES[i].weight
        if (progress <= acc) {
          if (stageId !== i) { stageId = i; setCurrentStageIndex(i); addLog(`=== Phase : ${ODM_STAGES[i].name} ===`) }
          break
        }
      }
      if (Math.random() > 0.82) {
        if (stageId === 0) addLog(`Upload: ${(Math.random() * 100).toFixed(1)}%`)
        if (stageId === 2) addLog(`SfM: Trouvé ${Math.floor(Math.random() * 5000) + 1000} keypoints`)
        if (stageId === 3) addLog(`MVS: Depthmap ${Math.floor(Math.random() * 100)}% (cam_${Math.floor(Math.random() * images.length)})`)
        if (stageId === 4) addLog(`Meshing: Vertices = ${Math.floor(Math.random() * 1_000_000).toLocaleString()}`)
        if (stageId === 5) addLog(`Texturing: UV packing, atlas ${Math.floor(Math.random() * 4) + 1}/4`)
        if (stageId === 6) addLog(`Ortho: GeoTIFF @ EPSG:4326 — ${(Math.random() * 100).toFixed(1)}%`)
      }

      const secs = Math.floor(((200 - progress * 2) * 80) / 1000)
      setTimeLeft(`~ 00:00:${secs.toString().padStart(2, '0')}`)
    }, 80)
  }

  const saveSimulatedResultToDatabase = async () => {
    try {
      await fetch('/api/files', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uuidv4(), name: `${projectName}_Pointcloud.laz`, type: 'las', size: 154000000,
          url: null, metadata: { source: 'WebODM Simulation', imagesCount: images.length },
          analysis: { status: 'completed', pointCloud: { pointCount: 3500200, avgDensity: 42.5 } } })
      })
      await fetch('/api/files', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uuidv4(), name: `${projectName}_Orthophoto.tif`, type: 'geotiff', size: 45000000,
          metadata: { source: 'WebODM Simulation', width: 8000, height: 8000 },
          analysis: { status: 'completed', image: { width: 8000, height: 8000, hasGps: true } } })
      })
      toast.success('Fichiers enregistrés dans la base de données !')
    } catch (err) { console.error(err) }
  }

  const exportJobReport = (format: 'html' | 'json' | 'csv') => {
    const jobData = {
      project: projectName, quality, imagesCount: images.length,
      imageNames: images.map(i => i.name),
      stages: ODM_STAGES.map((s, idx) => ({
        name: s.name,
        status: idx < currentStageIndex ? 'completed' : idx === currentStageIndex ? 'in_progress' : 'pending',
      })),
      logsCount: consoleLogs.length, completedAt: new Date().toISOString(),
      outputs: outputFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
    }
    if (format === 'html') {
      exportHTMLReport(`Rapport — ${projectName}`, [
        { heading: 'Configuration', rows: [['Projet', projectName], ['Qualité', quality], ['Images', String(images.length)], ['Date', new Date().toLocaleString('fr-FR')]] },
        { heading: 'Fichiers générés', rows: outputFiles.map(f => [f.name, `${f.size} | ${f.desc}`] as [string, string]) },
        { heading: 'Pipeline ODM', rows: ODM_STAGES.map(s => [s.name, 'Complété ✅'] as [string, string]) },
      ], `rapport_job_${projectName}_${Date.now()}.html`)
    } else if (format === 'json') {
      exportJSON(jobData, `rapport_job_${projectName}_${Date.now()}.json`)
    } else if (format === 'csv') {
      exportCSV(consoleLogs.map((log, i) => ({ Index: i + 1, Log: log })), `logs_job_${projectName}_${Date.now()}.csv`)
    }
    toast.success(`Rapport ${format.toUpperCase()} téléchargé`)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-1 pt-1 pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Module Expert</Badge>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Photogrammétrie 3D</Badge>
          {isProcessing && <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-500 border-green-500/20">● Calcul en cours</Badge>}
          {isDone && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">✓ Terminé</Badge>}
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Moteur de Traitement — OpenDroneMap
          </h1>
          {isDone && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" /> Exporter rapport
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportJobReport('html')} className="gap-2 cursor-pointer"><FileText className="h-4 w-4 text-blue-500" /> Rapport HTML</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportJobReport('json')} className="gap-2 cursor-pointer"><FileCode2 className="h-4 w-4 text-green-500" /> JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportJobReport('csv')} className="gap-2 cursor-pointer"><Table className="h-4 w-4 text-orange-500" /> Logs CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Global progress bar ─────────────────────────────────────────────── */}
      {(isProcessing || isDone) && (
        <div className="flex-shrink-0 px-1 pb-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{isDone ? 'Pipeline terminé' : `Phase ${currentStageIndex + 1}/${ODM_STAGES.length} — ${ODM_STAGES[currentStageIndex]?.name ?? '…'}`}</span>
            <span className="font-mono font-medium">{overallProgress.toFixed(1)}%{isProcessing && ` · ${timeLeft}`}</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* ── Two-tab layout ──────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 w-fit mb-4">
          <TabsTrigger value="traitement" className="gap-2">
            <Cpu className="h-4 w-4" /> Traitement
          </TabsTrigger>
          <TabsTrigger value="resultats" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Résultats &amp; Rapport
            {isDone && <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />}
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════
            TAB 1  —  TRAITEMENT
        ════════════════════════════════════════════════════════════ */}
        <TabsContent value="traitement" className="flex-1 overflow-y-auto custom-scrollbar m-0 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ── Left: Configuration ──────────────────────────── */}
            <div className="lg:col-span-4 space-y-4">

              {/* Project config */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4" /> Configuration du Job</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nom du projet</label>
                    <Input value={projectName} onChange={e => setProjectName(e.target.value)} disabled={isProcessing} placeholder="ex: Site_Abidjan_2024" />
                  </div>

                  {/* Image drop zone */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Images drone (JPG / PNG)
                      <Badge variant={images.length >= 3 ? 'default' : 'secondary'}>{images.length} fichier(s)</Badge>
                    </label>
                    <label className={`flex flex-col items-center justify-center gap-2 w-full p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all text-center
                      ${images.length > 0 ? 'border-green-500/40 bg-green-500/5 hover:bg-green-500/10' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                      <input type="file" accept="image/jpeg,image/png" multiple onChange={e => e.target.files && setImages(Array.from(e.target.files))} className="hidden" disabled={isProcessing} />
                      {images.length > 0 ? (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                          <span className="font-medium text-green-600">{images.length} images sélectionnées</span>
                          <span className="text-xs text-muted-foreground">{images.slice(0,3).map(f=>f.name).join(', ')}{images.length > 3 ? ` +${images.length-3}` : ''}</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          <span className="font-medium">Glissez vos photos ici</span>
                          <span className="text-xs text-muted-foreground">JPG, PNG · Min. 3 images</span>
                        </>
                      )}
                    </label>
                    {images.length > 0 && (
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground gap-1"
                        onClick={() => setImages([])} disabled={isProcessing}>
                        <X className="h-3 w-3" /> Effacer la sélection
                      </Button>
                    )}
                  </div>

                  {/* Quality */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Qualité de traitement</label>
                    <div className="space-y-2">
                      {QUALITY_PRESETS.map(q => (
                        <button key={q.id} onClick={() => !isProcessing && setQuality(q.id)} disabled={isProcessing}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${quality === q.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'}`}>
                          <div className="flex items-center gap-2">
                            <q.icon className="h-4 w-4 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium leading-none">{q.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{q.desc}</p>
                            </div>
                            {quality === q.id && <Check className="h-4 w-4 text-primary ml-auto" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Sorties activées</label>
                    <div className="space-y-2">
                      {[
                        { id: 'ortho',  label: 'Orthophoto + MNS',    state: enableOrtho,  set: setEnableOrtho  },
                        { id: 'mesh',   label: 'Maillage 3D (OBJ)',    state: enableMesh,   set: setEnableMesh   },
                        { id: 'report', label: 'Rapport qualité PDF',  state: enableReport, set: setEnableReport },
                      ].map(opt => (
                        <label key={opt.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                          <input type="checkbox" checked={opt.state} onChange={e => opt.set(e.target.checked)} disabled={isProcessing} className="accent-primary" />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full h-12 text-base" onClick={startProcessing} disabled={isProcessing || images.length === 0}>
                    {isProcessing ? <><Server className="h-4 w-4 mr-2 animate-pulse" /> Calcul en cours...</> : <><Play className="h-4 w-4 mr-2" /> Lancer l'extraction 3D</>}
                  </Button>
                </CardFooter>
              </Card>

              {/* Info card */}
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> À propos du pipeline ODM</p>
                  <p>Ce module simule le traitement <strong>OpenDroneMap</strong> (NodeODM). En production, les calculs sont réalisés sur un cluster GPU dédié et peuvent durer de 30 min à plusieurs heures selon la qualité et le volume des images.</p>
                  <p>Les fichiers générés (LAS, GeoTIFF, OBJ) sont automatiquement stockés dans votre bibliothèque média.</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Right: Pipeline + Console ────────────────────── */}
            <div className="lg:col-span-8 flex flex-col gap-5">

              {/* Pipeline stages */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> Pipeline OpenDroneMap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ODM_STAGES.map((stage, i) => {
                      const done = i < currentStageIndex
                      const active = i === currentStageIndex
                      const Icon = active ? Cpu : done ? CheckCircle2 : stage.icon
                      return (
                        <div key={stage.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all
                          ${done ? 'border-green-500/25 bg-green-500/5'
                            : active ? 'border-primary/40 bg-primary/8 shadow-sm'
                            : 'border-border opacity-50'}`}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${done ? 'bg-green-500/15' : active ? 'bg-primary/15' : 'bg-muted'}`}>
                            <Icon className={`h-4 w-4 ${done ? 'text-green-500' : active ? `text-primary ${active ? 'animate-spin' : ''}` : stage.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">{stage.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {done ? '✓ Terminé' : active ? 'En cours…' : 'En attente'}
                              {' · '}
                              <span className="text-[10px]">{stage.weight}% pipeline</span>
                            </p>
                          </div>
                          {active && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Console */}
              <Card className="flex flex-col">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" /> Console ODM</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground" onClick={() => setConsoleLogs([])}>
                    <RotateCcw className="h-3 w-3" /> Effacer
                  </Button>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  <div className="bg-slate-950 rounded-b-lg overflow-hidden">
                    <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      <span className="ml-2 text-xs text-slate-400 font-mono">NodeODM · {projectName}</span>
                      <span className="ml-auto text-[10px] text-slate-500">{consoleLogs.length} lignes</span>
                    </div>
                    <div ref={consoleRef} className="h-64 p-3 overflow-y-auto font-mono text-xs text-green-400 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
                      {consoleLogs.length === 0
                        ? <p className="text-slate-600">En attente de soumission…</p>
                        : consoleLogs.map((log, i) => (
                          <p key={i} className={log.includes('===') ? 'text-white font-semibold mt-2' : log.includes('>>') ? 'text-green-300 font-semibold mt-1' : 'text-green-500'}>{log}</p>
                        ))
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════
            TAB 2  —  RÉSULTATS & RAPPORT
        ════════════════════════════════════════════════════════════ */}
        <TabsContent value="resultats" className="flex-1 overflow-y-auto custom-scrollbar m-0 pb-6 space-y-6">

          {/* ── Status banner ───────────────────────────────────── */}
          <AnimatePresence>
            {isDone && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/15 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold text-green-500">Traitement Réussi — {projectName}</p>
                        <p className="text-sm text-muted-foreground">{images.length} images · Qualité {quality} · Terminé à {new Date().toLocaleTimeString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => window.location.href = '/dashboard/media'} className="gap-2">
                        <Eye className="h-4 w-4" /> Voir dans Média
                      </Button>
                      <Button onClick={() => window.location.href = '/dashboard/point-cloud'} className="bg-green-600 hover:bg-green-700">
                        Ouvrir en 3D
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!isDone && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
              <Server className="h-16 w-16 opacity-20" />
              <p className="text-lg font-medium">Aucun job terminé pour l'instant</p>
              <p className="text-sm">Lancez un traitement depuis l'onglet «Traitement» pour voir les résultats ici.</p>
              <Button variant="outline" onClick={() => setActiveTab('traitement')}>Aller au traitement</Button>
            </div>
          )}

          {isDone && (
            <>
              {/* ── Stats summary ─── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Points générés',   value: '3 500 200', sub: 'LAS dense',    icon: Layers,    color: 'bg-violet-500/10 text-violet-500' },
                  { label: 'Densité',          value: '42.5 pts/m²', sub: 'Haute résol.', icon: BarChart3, color: 'bg-sky-500/10 text-sky-500'     },
                  { label: 'Orthophoto',       value: '8 000 px',  sub: 'EPSG:4326',    icon: Globe,     color: 'bg-green-500/10 text-green-500'  },
                  { label: 'Fichiers sortants',value: '5',         sub: 'tous validés', icon: HardDrive, color: 'bg-amber-500/10 text-amber-500'  },
                ].map(stat => (
                  <Card key={stat.label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="font-bold text-lg leading-tight">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ── Output files ──── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Fichiers générés</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2"><FileDown className="h-3.5 w-3.5" /> Exporter</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => exportJobReport('html')} className="gap-2 cursor-pointer"><FileText className="h-4 w-4 text-blue-500" /> Rapport HTML</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportJobReport('json')} className="gap-2 cursor-pointer"><FileCode2 className="h-4 w-4 text-green-500" /> JSON</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportJobReport('csv')} className="gap-2 cursor-pointer"><Table className="h-4 w-4 text-orange-500" /> Logs CSV</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {outputFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                        <div className={`h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0 bg-muted`}>
                          <f.icon className={`h-4 w-4 ${f.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge variant="secondary" className="text-xs">{f.type}</Badge>
                          <span className="text-xs text-muted-foreground w-14 text-right">{f.size}</span>
                          <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/5 text-xs">✓</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ── Pipeline recap ─── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Récapitulatif du pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ODM_STAGES.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-green-500/5 border border-green-500/15">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{s.name}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/20">
                          {s.weight}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── Job History ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Historique des jobs</CardTitle>
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground"
                  onClick={() => exportCSV(jobHistory.map(j => ({ ID: j.id, Projet: j.name, Date: j.date, Images: j.images, Qualité: j.quality, Statut: j.status, Points: j.points, Ortho: j.ortho })), 'historique_jobs.csv')}>
                  <Table className="h-3.5 w-3.5" /> Exporter CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {jobHistory.map(job => (
                  <div key={job.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 
                      ${job.status === 'completed' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                      {job.status === 'completed'
                        ? <Check className="h-4 w-4 text-green-500" />
                        : <X className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{job.name}</p>
                      <p className="text-xs text-muted-foreground">{job.date} · {job.images} images · Qualité {job.quality}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{job.points} pts</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span>{job.ortho}</span>
                    </div>
                    <Badge variant={job.status === 'completed' ? 'outline' : 'destructive'}
                      className={job.status === 'completed' ? 'text-green-600 border-green-500/30 bg-green-500/5' : ''}>
                      {job.status === 'completed' ? 'Réussi' : 'Échoué'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  )
}
