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
  Eye,
  EyeOff
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
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
  }, [])

  const handleSaveProfile = () => {
    // Save to localStorage
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

  const handleSaveNotifications = () => {
    toast({
      title: 'Préférences de notifications enregistrées',
      description: 'Vos préférences de notifications ont été mises à jour.',
    })
  }

  const handleSaveLanguage = () => {
    toast({
      title: 'Préférences linguistiques enregistrées',
      description: 'Vos préférences de langue et de région ont été mises à jour.',
    })
  }

  const handleSaveMapPreferences = () => {
    toast({
      title: 'Préférences de carte enregistrées',
      description: 'Vos préférences de carte ont été mises à jour.',
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
      className="space-y-6 max-w-4xl mx-auto"
      initial="initial"
      animate="animate"
      variants={fadeInUp}
    >
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos préférences et paramètres de compte
        </p>
      </div>

      {/* Settings tabs */}
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1">
          <TabsTrigger value="appearance" className="gap-2">
            <Sun className="h-4 w-4" />
            <span className="hidden sm:inline">Apparence</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Compte</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Langue</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Données</span>
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Thème de l'interface</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choisissez entre le mode clair, sombre ou suivez les préférences système
                  </p>
                </div>
                
                <RadioGroup 
                  value={theme} 
                  onValueChange={setTheme}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem 
                      value="light" 
                      id="theme-light" 
                      className="peer sr-only"
                    />
                    <Label 
                      htmlFor="theme-light" 
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                    >
                      <Sun className="h-8 w-8 mb-3 text-yellow-500" />
                      <span className="font-medium">Clair</span>
                      <span className="text-xs text-muted-foreground">Interface lumineuse</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem 
                      value="dark" 
                      id="theme-dark" 
                      className="peer sr-only"
                    />
                    <Label 
                      htmlFor="theme-dark" 
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                    >
                      <Moon className="h-8 w-8 mb-3 text-blue-500" />
                      <span className="font-medium">Sombre</span>
                      <span className="text-xs text-muted-foreground">Interface sombre</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem 
                      value="system" 
                      id="theme-system" 
                      className="peer sr-only"
                    />
                    <Label 
                      htmlFor="theme-system" 
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                    >
                      <Monitor className="h-8 w-8 mb-3 text-green-500" />
                      <span className="font-medium">Système</span>
                      <span className="text-xs text-muted-foreground">Suivre le système</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Map preferences */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Préférences de carte
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basemap">Fond de carte par défaut</Label>
                    <Select 
                      value={mapPreferences.defaultBasemap} 
                      onValueChange={(value) => setMapPreferences({...mapPreferences, defaultBasemap: value})}
                    >
                      <SelectTrigger id="basemap">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="satellite">Satellite</SelectItem>
                        <SelectItem value="streets">Rues</SelectItem>
                        <SelectItem value="terrain">Terrain</SelectItem>
                        <SelectItem value="hybrid">Hybride</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zoom">Niveau de zoom par défaut</Label>
                    <Select 
                      value={mapPreferences.defaultZoom.toString()} 
                      onValueChange={(value) => setMapPreferences({...mapPreferences, defaultZoom: parseInt(value)})}
                    >
                      <SelectTrigger id="zoom">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8 - Vue large</SelectItem>
                        <SelectItem value="10">10 - Vue région</SelectItem>
                        <SelectItem value="12">12 - Vue ville</SelectItem>
                        <SelectItem value="14">14 - Vue quartier</SelectItem>
                        <SelectItem value="16">16 - Vue détaillée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Afficher les coordonnées</Label>
                      <p className="text-sm text-muted-foreground">Afficher les coordonnées sur la carte</p>
                    </div>
                    <Switch 
                      checked={mapPreferences.showCoordinates}
                      onCheckedChange={(checked) => setMapPreferences({...mapPreferences, showCoordinates: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Afficher l'échelle</Label>
                      <p className="text-sm text-muted-foreground">Afficher l'échelle sur la carte</p>
                    </div>
                    <Switch 
                      checked={mapPreferences.showScale}
                      onCheckedChange={(checked) => setMapPreferences({...mapPreferences, showScale: checked})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Unités de mesure</Label>
                  <RadioGroup 
                    value={mapPreferences.measurementUnit}
                    onValueChange={(value) => setMapPreferences({...mapPreferences, measurementUnit: value})}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="metric" id="metric" />
                      <Label htmlFor="metric">Métrique (m, km)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="imperial" id="imperial" />
                      <Label htmlFor="imperial">Impérial (ft, mi)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveMapPreferences} className="gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer les préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations du compte
              </CardTitle>
              <CardDescription>
                Gérez vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input 
                    id="name" 
                    value={userSettings.name}
                    onChange={(e) => setUserSettings({...userSettings, name: e.target.value})}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => setUserSettings({...userSettings, email: e.target.value})}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organisation</Label>
                <Input 
                  id="organization" 
                  value={userSettings.organization}
                  onChange={(e) => setUserSettings({...userSettings, organization: e.target.value})}
                  placeholder="Nom de votre organisation"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Sécurité
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <Input id="current-password" type="password" placeholder="••••••••" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input id="new-password" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <Input id="confirm-password" type="password" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer le profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
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
            <CardContent className="space-y-6">
              {/* Email notifications */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez des notifications par email pour les activités importantes
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Notifications par email</Label>
                      <p className="text-sm text-muted-foreground">Activer les notifications par email</p>
                    </div>
                    <Switch 
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Mises à jour de projets</Label>
                      <p className="text-sm text-muted-foreground">Être notifié des modifications sur vos projets</p>
                    </div>
                    <Switch 
                      checked={notifications.projectUpdates}
                      onCheckedChange={(checked) => setNotifications({...notifications, projectUpdates: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Import de fichiers</Label>
                      <p className="text-sm text-muted-foreground">Être notifié quand un fichier est importé</p>
                    </div>
                    <Switch 
                      checked={notifications.fileUploads}
                      onCheckedChange={(checked) => setNotifications({...notifications, fileUploads: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Analyses terminées</Label>
                      <p className="text-sm text-muted-foreground">Être notifié quand une analyse est terminée</p>
                    </div>
                    <Switch 
                      checked={notifications.analysisComplete}
                      onCheckedChange={(checked) => setNotifications({...notifications, analysisComplete: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Emails marketing</Label>
                      <p className="text-sm text-muted-foreground">Recevoir des offres et des actualités</p>
                    </div>
                    <Switch 
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => setNotifications({...notifications, marketingEmails: checked})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Push notifications */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Notifications push</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez des notifications directement dans le navigateur
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Notifications push</Label>
                    <p className="text-sm text-muted-foreground">Activer les notifications push dans le navigateur</p>
                  </div>
                  <Switch 
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} className="gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer les préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Langue et région
              </CardTitle>
              <CardDescription>
                Configurez vos préférences linguistiques et régionales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue de l'interface</Label>
                  <Select 
                    value={languageSettings.language}
                    onValueChange={(value) => setLanguageSettings({...languageSettings, language: value})}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select 
                    value={languageSettings.timezone}
                    onValueChange={(value) => setLanguageSettings({...languageSettings, timezone: value})}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Abidjan">Abidjan (GMT+0)</SelectItem>
                      <SelectItem value="Africa/Lagos">Lagos (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format de date</Label>
                  <Select 
                    value={languageSettings.dateFormat}
                    onValueChange={(value) => setLanguageSettings({...languageSettings, dateFormat: value})}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberFormat">Format des nombres</Label>
                  <Select 
                    value={languageSettings.numberFormat}
                    onValueChange={(value) => setLanguageSettings({...languageSettings, numberFormat: value})}
                  >
                    <SelectTrigger id="numberFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr-FR">Français (1 234,56)</SelectItem>
                      <SelectItem value="en-US">Anglais (1,234.56)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveLanguage} className="gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer les préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Stockage et données
              </CardTitle>
              <CardDescription>
                Gérez vos données et votre espace de stockage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Storage info */}
              <div className="p-6 rounded-lg border bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-medium">Espace de stockage</h3>
                      <p className="text-sm text-muted-foreground">
                        {storageInfo.used} GB utilisés sur {storageInfo.total} GB
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {Math.round((storageInfo.used / storageInfo.total) * 100)}%
                    </span>
                  </div>
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

              <Separator />

              {/* Data actions */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Actions sur les données</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Download className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium">Exporter les données</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Téléchargez toutes vos données au format ZIP
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
                          Importez des données depuis un fichier ZIP
                        </p>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Upload className="h-4 w-4" />
                          Importer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Danger zone */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium text-destructive">Zone de danger</Label>
                  <p className="text-sm text-muted-foreground">
                    Ces actions sont irréversibles
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-destructive">Supprimer toutes les données</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Cette action supprimera définitivement tous vos fichiers et projets
                      </p>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Supprimer tout
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
