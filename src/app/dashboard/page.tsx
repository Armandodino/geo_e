'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Cube, 
  Map, 
  FileImage, 
  Ruler, 
  Upload, 
  FolderOpen, 
  Clock,
  TrendingUp,
  HardDrive,
  FileText,
  Plus,
  ArrowRight
} from 'lucide-react'

const stats = [
  {
    title: 'Projets',
    value: '12',
    change: '+2 ce mois',
    icon: FolderOpen,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Fichiers',
    value: '156',
    change: '+23 cette semaine',
    icon: FileText,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Stockage',
    value: '4.2 GB',
    change: 'sur 10 GB',
    icon: HardDrive,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Analyses',
    value: '28',
    change: '+5 ce mois',
    icon: TrendingUp,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
]

const recentFiles = [
  {
    name: 'Abidjan_Centre.laz',
    type: 'Nuage de points',
    size: '1.2 GB',
    date: 'Il y a 2 heures',
    icon: Cube,
  },
  {
    name: 'Limites_Communes.shp',
    type: 'Shapefile',
    size: '45 MB',
    date: 'Il y a 5 heures',
    icon: Map,
  },
  {
    name: 'Orthophoto_2024.tif',
    type: 'GeoTIFF',
    size: '890 MB',
    date: 'Hier',
    icon: FileImage,
  },
  {
    name: 'Rapport_Analyse.pdf',
    type: 'Document PDF',
    size: '2.3 MB',
    date: 'Hier',
    icon: FileText,
  },
  {
    name: 'Zone_Etude.kml',
    type: 'KML',
    size: '1.8 MB',
    date: 'Il y a 3 jours',
    icon: Map,
  },
]

const quickActions = [
  {
    title: 'Importer des fichiers',
    description: 'Ajouter des données géospatiales',
    icon: Upload,
    href: '/dashboard/media',
    color: 'bg-primary',
  },
  {
    title: 'Nouveau projet',
    description: 'Créer un nouveau projet',
    icon: Plus,
    href: '/dashboard',
    color: 'bg-primary',
  },
  {
    title: 'Visualiser en 3D',
    description: 'Ouvrir le visualiseur 3D',
    icon: Cube,
    href: '/dashboard/point-cloud',
    color: 'bg-primary',
  },
  {
    title: 'Analyse spatiale',
    description: 'Outils de mesure',
    icon: Ruler,
    href: '/dashboard/analysis',
    color: 'bg-primary',
  },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function DashboardPage() {
  return (
    <motion.div 
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Welcome section */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold">Bienvenue sur Geo E</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos projets géospatiaux et analysez vos données
        </p>
      </motion.div>

      {/* Stats cards */}
      <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent files */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fichiers récents</CardTitle>
                <CardDescription>Vos derniers fichiers importés</CardDescription>
              </div>
              <Link href="/dashboard/media">
                <Button variant="ghost" size="sm" className="gap-1">
                  Voir tout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <file.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{file.size}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {file.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Accès rapide aux fonctionnalités</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                      <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center text-white`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {action.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity section */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Vos dernières actions sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">Import de <span className="font-medium">Abidjan_Centre.laz</span></p>
                  <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                </div>
                <Badge variant="secondary">Terminé</Badge>
              </div>
              <div className="flex gap-4 items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Ruler className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">Analyse de surface sur <span className="font-medium">Zone_Etude</span></p>
                  <p className="text-xs text-muted-foreground">Il y a 5 heures</p>
                </div>
                <Badge variant="secondary">Terminé</Badge>
              </div>
              <div className="flex gap-4 items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Map className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">Création du projet <span className="font-medium">Cartographie Abidjan</span></p>
                  <p className="text-xs text-muted-foreground">Hier</p>
                </div>
                <Badge variant="secondary">Terminé</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
