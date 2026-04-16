'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Lock, ArrowLeft, User } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Logique stricte d'authentification demandée
    if (email !== 'konin' || password !== 'test2026') {
      toast({
        variant: "destructive",
        title: 'Erreur',
        description: 'Identifiants incorrects',
      })
      setIsLoading(false)
      return
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    // Store user session in localStorage (demo)
    localStorage.setItem('geo_e_user', JSON.stringify({
      email: 'konin',
      name: 'Konin',
      loggedIn: true
    }))

    toast({
      title: 'Connexion réussie',
      description: 'Bienvenue sur Geo E !',
    })

    setIsLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 relative overflow-hidden p-4">
      
      {/* Top Navigation */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="Geo E Logo"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
          <span className="font-bold text-xl drop-shadow-sm">Geo E</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Back button */}
      <div className="absolute top-20 left-6 z-20">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit bg-background/50 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Retour</span>
        </Link>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Centered Login Card */}
      <motion.div 
        className="w-full max-w-md z-10 mx-auto"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Bienvenue sur Geo E</h1>
          <p className="text-muted-foreground">La plateforme géolocalisée de référence.</p>
        </div>

        <Card className="w-full border-border/50 shadow-2xl backdrop-blur-xl bg-background/80">
          <CardHeader className="space-y-1 pb-4 text-center border-b border-border/10 mb-4">
            <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
            <CardDescription>
              Veuillez utiliser vos accès sécurisés
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="font-semibold">Identifiant (ID)</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Votre identifiant"
                    className="pl-10 h-12 bg-background/50 focus:bg-background transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-semibold">Mot de passe</Label>
                  <Link 
                    href="#" 
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-background/50 focus:bg-background transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* Authenticity notice */}
              <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                <Lock className="h-3 w-3 text-primary" />
                <span>Espace sécurisé - Accès réservé aux employés</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8">
              <Button 
                type="submit" 
                className="w-full h-12 text-md font-semibold text-white shadow-lg md:hover:scale-[1.02] transition-transform" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authentification...
                  </>
                ) : (
                  'Accéder au Dashboard'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
