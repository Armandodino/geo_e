'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Layers, 
  Map, 
  BarChart3, 
  Database, 
  Globe2, 
  Cube, 
  FileJson, 
  Ruler,
  ArrowRight,
  CheckCircle,
  Shield,
  Zap
} from 'lucide-react'

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

const features = [
  {
    icon: Cube,
    title: 'Visualisation 3D',
    description: 'Visualisez vos nuages de points en 3D avec Potree. Support des formats LAS, LAZ avec outils de mesure avancés.',
  },
  {
    icon: Map,
    title: 'Visualisation GIS',
    description: 'Importez et visualisez vos données géospatiales. Support complet des formats SHP, KML, GeoJSON et plus.',
  },
  {
    icon: BarChart3,
    title: 'Analyse Spatiale',
    description: 'Outils d\'analyse puissants pour mesurer distances, surfaces, volumes et effectuer des calculs complexes.',
  },
  {
    icon: Database,
    title: 'Gestion de Données',
    description: 'Organisez et gérez vos projets géospatiaux avec une interface intuitive et des fonctionnalités de collaboration.',
  },
]

const supportedFormats = [
  { name: 'LAS/LAZ', icon: Layers, desc: 'Nuages de points' },
  { name: 'SHP', icon: Map, desc: 'Shapefiles' },
  { name: 'GeoJSON', icon: FileJson, desc: 'Données vectorielles' },
  { name: 'KML', icon: Globe2, desc: 'Google Earth' },
  { name: 'GeoTIFF', icon: Database, desc: 'Images géoréférencées' },
  { name: 'PDF', icon: FileJson, desc: 'Documents' },
]

const stats = [
  { value: '10K+', label: 'Projets créés' },
  { value: '50+', label: 'Formats supportés' },
  { value: '99.9%', label: 'Disponibilité' },
  { value: '24/7', label: 'Support technique' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Geo E Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="font-bold text-xl">Geo E</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </Link>
            <Link href="#formats" className="text-muted-foreground hover:text-foreground transition-colors">
              Formats
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/login">
              <Button>Commencer</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <motion.div 
          className="container mx-auto px-4 relative z-10"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeInUp} className="mb-8">
              <Image
                src="/logo.png"
                alt="Geo E Logo"
                width={120}
                height={120}
                className="mx-auto h-24 w-auto md:h-32"
              />
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent"
            >
              Solutions Géospatiales
              <br />
              <span className="text-primary">pour la Côte d'Ivoire</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Plateforme avancée de visualisation 3D, d'analyse spatiale et de gestion de données GIS. 
              Transformez vos données géographiques en insights exploitables.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/login">
                <Button size="lg" className="gap-2 text-lg px-8">
                  Commencer gratuitement
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                  En savoir plus
                </Button>
              </Link>
            </motion.div>
          </div>
          
          {/* Stats */}
          <motion.div 
            variants={fadeInUp}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <motion.div 
          className="container mx-auto px-4"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Fonctionnalités Puissantes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d'outils pour tous vos besoins géospatiaux
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-border/50 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Supported Formats */}
      <section id="formats" className="py-20">
        <motion.div 
          className="container mx-auto px-4"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Formats Supportés
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Importez et exportez vos données dans les formats les plus courants
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {supportedFormats.map((format, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp}
                className="flex flex-col items-center p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors"
              >
                <format.icon className="h-8 w-8 text-primary mb-3" />
                <span className="font-semibold">{format.name}</span>
                <span className="text-sm text-muted-foreground">{format.desc}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Tools Section */}
      <section className="py-20 bg-muted/30">
        <motion.div 
          className="container mx-auto px-4"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Outils d'Analyse
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des outils professionnels pour vos analyses géospatiales
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div variants={fadeInUp}>
              <Card className="h-full">
                <CardHeader>
                  <Ruler className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Mesures Précises</CardTitle>
                  <CardDescription>
                    Distance, angle, hauteur, surface et volume avec une précision millimétrique
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Mesure de distance 3D
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Calcul de surface
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Estimation de volume
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <Card className="h-full">
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Données Sécurisées</CardTitle>
                  <CardDescription>
                    Vos données sont stockées en toute sécurité avec sauvegardes automatiques
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Chiffrement de bout en bout
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Sauvegardes automatiques
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Contrôle d'accès granulaire
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <Card className="h-full">
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Performance Optimale</CardTitle>
                  <CardDescription>
                    Visualisation fluide même avec des millions de points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Rendu GPU accéléré
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Niveaux de détail adaptatifs
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Chargement progressif
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20">
        <motion.div 
          className="container mx-auto px-4"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div 
            variants={fadeInUp}
            className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-3xl p-8 md:p-16 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à transformer vos données géospatiales ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez les professionnels qui font confiance à Geo E pour leurs projets de cartographie et d'analyse spatiale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="gap-2 text-lg px-8">
                  Démarrer maintenant
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Contacter l'équipe
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="Geo E Logo"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="font-bold text-xl">Geo E</span>
              </Link>
              <p className="text-muted-foreground text-sm">
                Plateforme géospatiale avancée pour la Côte d'Ivoire.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</Link></li>
                <li><Link href="#formats" className="hover:text-foreground transition-colors">Formats supportés</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Tarifs</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">À propos</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Carrières</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Conditions</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Geo E. Tous droits réservés.
            </p>
            <p className="text-sm text-muted-foreground">
              Fait avec ❤️ en Côte d'Ivoire
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
