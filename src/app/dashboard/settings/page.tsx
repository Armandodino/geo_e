'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Moon, 
  Sun, 
  Monitor, 
  User, 
  Bell, 
  Globe, 
  Shield, 
  Database,
  Map,
  HardDrive,
  Save,
  Trash2,
  Download,
  Upload,
  Box,
  Ruler,
  Layers,
  Cpu,
  Palette,
  Settings2,
  Zap,
  Eye,
  Crosshair,
  FileOutput,
  Projector,
  Grid3X3,
  Camera,
  Maximize,
  Volume2,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  // User settings state
  const [userSettings, setUserSettings] = useState({
    name: '',
    email: '',
    organization: '',
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    fileUploads: true,
    analysisComplete: true,
    marketingEmails: false,
  })

  // Language and region settings
  const [languageSettings, setLanguageSettings] = useState({
    language: 'fr',
    timezone: 'Africa/Abidjan',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'fr-FR',
  })

  // Map preferences
  const [mapPreferences, setMapPreferences] = useState({
    defaultBasemap: 'satellite',
    showCoordinates: true,
    showScale: true,
    defaultZoom: 12,
    measurementUnit: 'metric',
    clusteringEnabled: true,
    clusterRadius: 50,
  })

  // Point Cloud (3D) preferences
  const [pointCloudSettings, setPointCloudSettings] = useState({
    pointSize: 2,
    pointBudget: 1500000,
    fov: 60,
    edlEnabled: true,
    edlStrength: 0.4,
    edlRadius: 1.4,
    defaultColorScheme: 'elevation',
    showGrid: true,
    showAxes: true,
    showStats: true,
    quality: 'high',
    antialiasing: true,
    shadows: false,
  })

  // Analysis preferences
  const [analysisSettings, setAnalysisSettings] = useState({
    defaultPrecision: 'high',
    autoCalculate: true,
    showIntermediateSteps: true,
    exportFormat: 'geojson',
    coordinateSystem: 'wgs84',
    distanceUnit: 'meters',
    areaUnit: 'hectares',
    volumeUnit: 'cubic_meters',
    decimalPlaces: 4,
  })

  // Export preferences
  const [exportSettings, setExportSettings] = useState({
    imageFormat: 'png',
    imageQuality: 95,
    imageWidth: 1920,
    imageHeight: 1080,
    includeMetadata: true,
    includeWatermark: false,
    pdfPageSize: 'a4',
    pdfOrientation: 'landscape',
    compressImages: true,
  })

  // Performance settings
  const [performanceSettings, setPerformanceSettings] = useState({
    gpuAcceleration: true,
    maxMemory: 4096,
    cacheSize: 512,
    lazyLoading: true,
    parallelProcessing: true,
    workerCount: 4,
    preloadThumbnails: true,
    autoSaveInterval: 5,
  })

  // Storage settings
  const [storageInfo] = useState({
    used: 4.2,
    total: 10,
    files: 156,
  })

  useEffect(() => {
    setMounted(true)
    // Load user data
    const stored = localStorage.getItem('geo_e_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        setUserSettings({
          name: user.name || '',
          email: user.email || '',
          organization: user.organization || '',
        })
      } catch {
        // Ignore parsing errors
      }
    }
    
    // Load saved settings
    const savedSettings = localStorage.getItem('geo_e_settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        if (settings.mapPreferences) setMapPreferences(settings.mapPreferences)
        if (settings.pointCloudSettings) setPointCloudSettings(settings.pointCloudSettings)
        if (settings.analysisSettings) setAnalysisSettings(settings.analysisSettings)
        if (settings.exportSettings) setExportSettings(settings.exportSettings)
        if (settings.performanceSettings) setPerformanceSettings(settings.performanceSettings)
      } catch {
        // Ignore parsing errors
      }
    }
  }, [])

  const saveAllSettings = () => {
    const allSettings = {
      mapPreferences,
      pointCloudSettings,
      analysisSettings,
      exportSettings,
      performanceSettings,
      notifications,
      languageSettings,
    }
    localStorage.setItem('geo_e_settings', JSON.stringify(allSettings))
  }

  const handleSaveProfile = () => {
    const stored = localStorage.getItem('geo_e_user')
    if (stored) {
      const user = JSON.parse(stored)
      localStorage.setItem('geo_e_user', JSON.stringify({
        ...user,
        ...userSettings
      }))
    }
    
    toast({
      title: 'Profil mis à jour',
      description: 'Vos informations ont été enregistrées avec succès.',
    })
  }

  const handleSaveAllSettings = () => {
    saveAllSettings()
    toast({
      title: 'Paramètres enregistrés',
      description: 'Toutes vos préférences ont été sauvegardées.',
    })
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6 max-w-5xl mx-auto"
      initial="initial"
      animate="animate"
      variants={fadeInUp}
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground mt-1">
            Configurez toutes les fonctionnalités de Geo E
          </p>
        </div>
        <Button onClick={handleSaveAllSettings} className="gap-2">
          <Save className="h-4 w-4" />
          Enregistrer tout
        </Button>
      </div>

      {/* Settings tabs */}
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1">
          <TabsTrigger value="appearance" className="gap-1 text-xs md:text-sm">
            <Palette className="h-4 w-4" />
            <span className="hidden lg:inline">Apparence</span>
          </TabsTrigger>
          <TabsTrigger value="3d" className="gap-1 text-xs md:text-sm">
            <Box className="h-4 w-4" />
            <span className="hidden lg:inline">3D / Nuages</span>
          </TabsTrigger>
          <TabsTrigger value="gis" className="gap-1 text-xs md:text-sm">
            <Map className="h-4 w-4" />
            <span className="hidden lg:inline">GIS / Cartes</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-1 text-xs md:text-sm">
            <Ruler className="h-4 w-4" />
            <span className="hidden lg:inline">Analyses</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1 text-xs md:text-sm">
            <FileOutput className="h-4 w-4" />
            <span className="hidden lg:inline">Exports</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1 text-xs md:text-sm">
            <Cpu className="h-4 w-4" />
            <span className="hidden lg:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1 text-xs md:text-sm">
            <Bell className="h-4 w-4" />
            <span className="hidden lg:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-1 text-xs md:text-sm">
            <Database className="h-4 w-4" />
            <span className="hidden lg:inline">Données</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* APPEARANCE TAB */}
        {/* ============================================ */}
        <TabsContent value="appearance">
          <div className="grid gap-6">
            {/* Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Thème de l'interface
                </CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de l'application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={theme} 
                  onValueChange={setTheme}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {[
                    { value: 'light', icon: Sun, label: 'Clair', desc: 'Interface lumineuse', color: 'text-yellow-500' },
                    { value: 'dark', icon: Moon, label: 'Sombre', desc: 'Interface sombre', color: 'text-blue-500' },
                    { value: 'system', icon: Monitor, label: 'Système', desc: 'Suivre le système', color: 'text-green-500' },
                  ].map((item) => (
                    <div key={item.value}>
                      <RadioGroupItem value={item.value} id={`theme-${item.value}`} className="peer sr-only" />
                      <Label 
                        htmlFor={`theme-${item.value}`}
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                      >
                        <item.icon className={`h-8 w-8 mb-3 ${item.color}`} />
                        <span className="font-medium">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Language */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Langue et région
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Langue de l'interface</Label>
                  <Select value={languageSettings.language} onValueChange={(v) => setLanguageSettings({...languageSettings, language: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Select value={languageSettings.timezone} onValueChange={(v) => setLanguageSettings({...languageSettings, timezone: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Abidjan">Abidjan (GMT+0)</SelectItem>
                      <SelectItem value="Africa/Lagos">Lagos (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Format de date</Label>
                  <Select value={languageSettings.dateFormat} onValueChange={(v) => setLanguageSettings({...languageSettings, dateFormat: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Format des nombres</Label>
                  <Select value={languageSettings.numberFormat} onValueChange={(v) => setLanguageSettings({...languageSettings, numberFormat: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr-FR">Français (1 234,56)</SelectItem>
                      <SelectItem value="en-US">Anglais (1,234.56)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* 3D / POINT CLOUD TAB */}
        {/* ============================================ */}
        <TabsContent value="3d">
          <div className="grid gap-6">
            {/* Rendering */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Rendu 3D
                </CardTitle>
                <CardDescription>
                  Configurez les paramètres de rendu des nuages de points
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Taille des points</Label>
                        <Badge variant="secondary">{pointCloudSettings.pointSize}</Badge>
                      </div>
                      <Slider 
                        value={[pointCloudSettings.pointSize]} 
                        onValueChange={([v]) => setPointCloudSettings({...pointCloudSettings, pointSize: v})}
                        min={1} max={10} step={0.5}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Budget de points</Label>
                        <Badge variant="secondary">{(pointCloudSettings.pointBudget / 1000000).toFixed(1)}M</Badge>
                      </div>
                      <Slider 
                        value={[pointCloudSettings.pointBudget]} 
                        onValueChange={([v]) => setPointCloudSettings({...pointCloudSettings, pointBudget: v})}
                        min={500000} max={5000000} step={100000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Nombre maximum de points affichés. Plus élevé = meilleure qualité mais plus lent.
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Champ de vision (FOV)</Label>
                        <Badge variant="secondary">{pointCloudSettings.fov}°</Badge>
                      </div>
                      <Slider 
                        value={[pointCloudSettings.fov]} 
                        onValueChange={([v]) => setPointCloudSettings({...pointCloudSettings, fov: v})}
                        min={30} max={120} step={5}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Qualité de rendu</Label>
                      <Select 
                        value={pointCloudSettings.quality} 
                        onValueChange={(v) => setPointCloudSettings({...pointCloudSettings, quality: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse (rapide)</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="ultra">Ultra (lent)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Schéma de couleur par défaut</Label>
                      <Select 
                        value={pointCloudSettings.defaultColorScheme} 
                        onValueChange={(v) => setPointCloudSettings({...pointCloudSettings, defaultColorScheme: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="elevation">Élévation</SelectItem>
                          <SelectItem value="intensity">Intensité</SelectItem>
                          <SelectItem value="classification">Classification</SelectItem>
                          <SelectItem value="rgb">Couleur RGB</SelectItem>
                          <SelectItem value="grayscale">Niveaux de gris</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EDL (Eye-Dome Lighting) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Éclairage EDL
                </CardTitle>
                <CardDescription>
                  Eye-Dome Lighting améliore la perception de profondeur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Activer EDL</Label>
                    <p className="text-sm text-muted-foreground">Améliore la perception des reliefs</p>
                  </div>
                  <Switch 
                    checked={pointCloudSettings.edlEnabled}
                    onCheckedChange={(checked) => setPointCloudSettings({...pointCloudSettings, edlEnabled: checked})}
                  />
                </div>

                {pointCloudSettings.edlEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Intensité EDL</Label>
                        <Badge variant="secondary">{pointCloudSettings.edlStrength}</Badge>
                      </div>
                      <Slider 
                        value={[pointCloudSettings.edlStrength]} 
                        onValueChange={([v]) => setPointCloudSettings({...pointCloudSettings, edlStrength: v})}
                        min={0} max={1} step={0.05}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Rayon EDL</Label>
                        <Badge variant="secondary">{pointCloudSettings.edlRadius}</Badge>
                      </div>
                      <Slider 
                        value={[pointCloudSettings.edlRadius]} 
                        onValueChange={([v]) => setPointCloudSettings({...pointCloudSettings, edlRadius: v})}
                        min={0.5} max={3} step={0.1}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Options d'affichage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'showGrid', label: 'Grille de référence', desc: 'Afficher une grille au sol', icon: Grid3X3 },
                    { key: 'showAxes', label: 'Axes XYZ', desc: 'Afficher les axes de coordonnées', icon: Crosshair },
                    { key: 'showStats', label: 'Statistiques', desc: 'Afficher FPS et infos de rendu', icon: Camera },
                    { key: 'antialiasing', label: 'Anticrénelage', desc: 'Lisser les bords (impact sur les performances)', icon: Maximize },
                    { key: 'shadows', label: 'Ombres', desc: 'Activer les ombres (expérimental)', icon: Layers },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label>{item.label}</Label>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={pointCloudSettings[item.key as keyof typeof pointCloudSettings] as boolean}
                        onCheckedChange={(checked) => setPointCloudSettings({...pointCloudSettings, [item.key]: checked})}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* GIS / MAPS TAB */}
        {/* ============================================ */}
        <TabsContent value="gis">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Carte de base
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fond de carte par défaut</Label>
                  <Select 
                    value={mapPreferences.defaultBasemap} 
                    onValueChange={(v) => setMapPreferences({...mapPreferences, defaultBasemap: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="satellite">Satellite</SelectItem>
                      <SelectItem value="streets">Rues</SelectItem>
                      <SelectItem value="terrain">Terrain</SelectItem>
                      <SelectItem value="hybrid">Hybride</SelectItem>
                      <SelectItem value="osm">OpenStreetMap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Niveau de zoom par défaut</Label>
                  <Select 
                    value={mapPreferences.defaultZoom.toString()} 
                    onValueChange={(v) => setMapPreferences({...mapPreferences, defaultZoom: parseInt(v)})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8 - Vue large</SelectItem>
                      <SelectItem value="10">10 - Vue région</SelectItem>
                      <SelectItem value="12">12 - Vue ville</SelectItem>
                      <SelectItem value="14">14 - Vue quartier</SelectItem>
                      <SelectItem value="16">16 - Vue détaillée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Affichage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'showCoordinates', label: 'Coordonnées', desc: 'Afficher les coordonnées du curseur' },
                    { key: 'showScale', label: 'Échelle', desc: 'Afficher l\'échelle graphique' },
                    { key: 'clusteringEnabled', label: 'Groupement de points', desc: 'Grouper les points proches' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <Label>{item.label}</Label>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch 
                        checked={mapPreferences[item.key as keyof typeof mapPreferences] as boolean}
                        onCheckedChange={(checked) => setMapPreferences({...mapPreferences, [item.key]: checked})}
                      />
                    </div>
                  ))}
                </div>
                
                {mapPreferences.clusteringEnabled && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <Label>Rayon de groupement</Label>
                      <Badge variant="secondary">{mapPreferences.clusterRadius}px</Badge>
                    </div>
                    <Slider 
                      value={[mapPreferences.clusterRadius]} 
                      onValueChange={([v]) => setMapPreferences({...mapPreferences, clusterRadius: v})}
                      min={20} max={150} step={10}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Unités de mesure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={mapPreferences.measurementUnit}
                  onValueChange={(v) => setMapPreferences({...mapPreferences, measurementUnit: v})}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="metric" id="metric" />
                    <Label htmlFor="metric">Métrique (m, km, ha)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="imperial" id="imperial" />
                    <Label htmlFor="imperial">Impérial (ft, mi, ac)</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* ANALYSIS TAB */}
        {/* ============================================ */}
        <TabsContent value="analysis">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Calculs et mesures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Précision par défaut</Label>
                    <Select 
                      value={analysisSettings.defaultPrecision} 
                      onValueChange={(v) => setAnalysisSettings({...analysisSettings, defaultPrecision: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse (rapide)</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="ultra">Ultra (précis)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Système de coordonnées</Label>
                    <Select 
                      value={analysisSettings.coordinateSystem} 
                      onValueChange={(v) => setAnalysisSettings({...analysisSettings, coordinateSystem: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wgs84">WGS 84 (GPS)</SelectItem>
                        <SelectItem value="utm30">UTM Zone 30N</SelectItem>
                        <SelectItem value="utm31">UTM Zone 31N</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Calcul automatique</Label>
                    <p className="text-sm text-muted-foreground">Calculer automatiquement les mesures lors de l'import</p>
                  </div>
                  <Switch 
                    checked={analysisSettings.autoCalculate}
                    onCheckedChange={(checked) => setAnalysisSettings({...analysisSettings, autoCalculate: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Afficher les étapes intermédiaires</Label>
                    <p className="text-sm text-muted-foreground">Montrer le détail des calculs</p>
                  </div>
                  <Switch 
                    checked={analysisSettings.showIntermediateSteps}
                    onCheckedChange={(checked) => setAnalysisSettings({...analysisSettings, showIntermediateSteps: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Unités de sortie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Distances</Label>
                    <Select 
                      value={analysisSettings.distanceUnit} 
                      onValueChange={(v) => setAnalysisSettings({...analysisSettings, distanceUnit: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meters">Mètres</SelectItem>
                        <SelectItem value="kilometers">Kilomètres</SelectItem>
                        <SelectItem value="feet">Pieds</SelectItem>
                        <SelectItem value="miles">Miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Surfaces</Label>
                    <Select 
                      value={analysisSettings.areaUnit} 
                      onValueChange={(v) => setAnalysisSettings({...analysisSettings, areaUnit: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square_meters">m²</SelectItem>
                        <SelectItem value="hectares">Hectares</SelectItem>
                        <SelectItem value="square_kilometers">km²</SelectItem>
                        <SelectItem value="acres">Acres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Volumes</Label>
                    <Select 
                      value={analysisSettings.volumeUnit} 
                      onValueChange={(v) => setAnalysisSettings({...analysisSettings, volumeUnit: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cubic_meters">m³</SelectItem>
                        <SelectItem value="cubic_feet">Pieds cubes</SelectItem>
                        <SelectItem value="liters">Litres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    <Label>Décimales</Label>
                    <Badge variant="secondary">{analysisSettings.decimalPlaces}</Badge>
                  </div>
                  <Slider 
                    value={[analysisSettings.decimalPlaces]} 
                    onValueChange={([v]) => setAnalysisSettings({...analysisSettings, decimalPlaces: v})}
                    min={0} max={8} step={1}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* EXPORT TAB */}
        {/* ============================================ */}
        <TabsContent value="export">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Export d'images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Format d'image</Label>
                    <Select 
                      value={exportSettings.imageFormat} 
                      onValueChange={(v) => setExportSettings({...exportSettings, imageFormat: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG (sans perte)</SelectItem>
                        <SelectItem value="jpeg">JPEG (compressé)</SelectItem>
                        <SelectItem value="webp">WebP (moderne)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Qualité</Label>
                    <div className="flex items-center gap-4">
                      <Slider 
                        value={[exportSettings.imageQuality]} 
                        onValueChange={([v]) => setExportSettings({...exportSettings, imageQuality: v})}
                        min={50} max={100} step={5}
                        className="flex-1"
                      />
                      <Badge variant="secondary">{exportSettings.imageQuality}%</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Largeur (px)</Label>
                    <Input 
                      type="number" 
                      value={exportSettings.imageWidth}
                      onChange={(e) => setExportSettings({...exportSettings, imageWidth: parseInt(e.target.value) || 1920})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hauteur (px)</Label>
                    <Input 
                      type="number" 
                      value={exportSettings.imageHeight}
                      onChange={(e) => setExportSettings({...exportSettings, imageHeight: parseInt(e.target.value) || 1080})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Inclure les métadonnées</Label>
                      <p className="text-sm text-muted-foreground">GPS, date, paramètres</p>
                    </div>
                    <Switch 
                      checked={exportSettings.includeMetadata}
                      onCheckedChange={(checked) => setExportSettings({...exportSettings, includeMetadata: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Filigrane</Label>
                      <p className="text-sm text-muted-foreground">Ajouter "Geo E"</p>
                    </div>
                    <Switch 
                      checked={exportSettings.includeWatermark}
                      onCheckedChange={(checked) => setExportSettings({...exportSettings, includeWatermark: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileOutput className="h-5 w-5" />
                  Export PDF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Format de page</Label>
                    <Select 
                      value={exportSettings.pdfPageSize} 
                      onValueChange={(v) => setExportSettings({...exportSettings, pdfPageSize: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="a3">A3</SelectItem>
                        <SelectItem value="letter">Lettre US</SelectItem>
                        <SelectItem value="legal">Legal US</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Select 
                      value={exportSettings.pdfOrientation} 
                      onValueChange={(v) => setExportSettings({...exportSettings, pdfOrientation: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape">Paysage</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* PERFORMANCE TAB */}
        {/* ============================================ */}
        <TabsContent value="performance">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Performances GPU
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Accélération GPU</Label>
                    <p className="text-sm text-muted-foreground">Utiliser la carte graphique pour le rendu 3D</p>
                  </div>
                  <Switch 
                    checked={performanceSettings.gpuAcceleration}
                    onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, gpuAcceleration: checked})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Mémoire maximale (MB)</Label>
                      <Badge variant="secondary">{performanceSettings.maxMemory}</Badge>
                    </div>
                    <Slider 
                      value={[performanceSettings.maxMemory]} 
                      onValueChange={([v]) => setPerformanceSettings({...performanceSettings, maxMemory: v})}
                      min={1024} max={16384} step={512}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Taille du cache (MB)</Label>
                      <Badge variant="secondary">{performanceSettings.cacheSize}</Badge>
                    </div>
                    <Slider 
                      value={[performanceSettings.cacheSize]} 
                      onValueChange={([v]) => setPerformanceSettings({...performanceSettings, cacheSize: v})}
                      min={128} max={2048} step={128}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Optimisations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'lazyLoading', label: 'Chargement différé', desc: 'Charger les données uniquement si nécessaire' },
                    { key: 'parallelProcessing', label: 'Traitement parallèle', desc: 'Utiliser plusieurs cœurs CPU' },
                    { key: 'preloadThumbnails', label: 'Précharger les miniatures', desc: 'Générer les aperçus à l\'avance' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <Label>{item.label}</Label>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch 
                        checked={performanceSettings[item.key as keyof typeof performanceSettings] as boolean}
                        onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, [item.key]: checked})}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre de workers</Label>
                    <Select 
                      value={performanceSettings.workerCount.toString()} 
                      onValueChange={(v) => setPerformanceSettings({...performanceSettings, workerCount: parseInt(v)})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 worker</SelectItem>
                        <SelectItem value="2">2 workers</SelectItem>
                        <SelectItem value="4">4 workers</SelectItem>
                        <SelectItem value="8">8 workers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sauvegarde auto (minutes)</Label>
                    <Select 
                      value={performanceSettings.autoSaveInterval.toString()} 
                      onValueChange={(v) => setPerformanceSettings({...performanceSettings, autoSaveInterval: parseInt(v)})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="0">Désactivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* NOTIFICATIONS TAB */}
        {/* ============================================ */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Gérez vos préférences de notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Notifications par email', desc: 'Recevoir les alertes par email' },
                  { key: 'pushNotifications', label: 'Notifications push', desc: 'Alertes dans le navigateur' },
                  { key: 'projectUpdates', label: 'Mises à jour de projets', desc: 'Changements sur vos projets' },
                  { key: 'fileUploads', label: 'Imports de fichiers', desc: 'Quand un fichier est importé' },
                  { key: 'analysisComplete', label: 'Analyses terminées', desc: 'Quand une analyse est finie' },
                  { key: 'marketingEmails', label: 'Emails marketing', desc: 'Offres et actualités' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={notifications[item.key as keyof typeof notifications] as boolean}
                      onCheckedChange={(checked) => setNotifications({...notifications, [item.key]: checked})}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* STORAGE TAB */}
        {/* ============================================ */}
        <TabsContent value="storage">
          <div className="grid gap-6">
            {/* User profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input 
                    value={userSettings.name}
                    onChange={(e) => setUserSettings({...userSettings, name: e.target.value})}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => setUserSettings({...userSettings, email: e.target.value})}
                    placeholder="votre@email.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Organisation</Label>
                  <Input 
                    value={userSettings.organization}
                    onChange={(e) => setUserSettings({...userSettings, organization: e.target.value})}
                    placeholder="Nom de votre organisation"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Storage info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Espace de stockage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Database className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-medium">Stockage utilisé</h3>
                        <p className="text-sm text-muted-foreground">
                          {storageInfo.used} GB sur {storageInfo.total} GB
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {Math.round((storageInfo.used / storageInfo.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${(storageInfo.used / storageInfo.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {storageInfo.files} fichiers stockés
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Download className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium">Exporter les données</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Télécharger toutes vos données
                        </p>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Exporter
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Upload className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium">Importer des données</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Restaurer depuis une sauvegarde
                        </p>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Upload className="h-4 w-4" />
                          Importer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Zone de danger
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-destructive">Supprimer toutes les données</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Cette action est irréversible
                      </p>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Supprimer tout
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
