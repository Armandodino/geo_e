'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Dynamic import for 3D viewer to avoid SSR
const PotreeViewer = dynamic(
  () => import('@/components/potree-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] bg-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement du visualiseur 3D...</p>
        </div>
      </div>
    ),
  }
)

export default function PointCloudPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Nuages de Points 3D</h1>
        <p className="text-muted-foreground">
          Visualisation 3D de nuages de points avec outils de mesure
        </p>
      </div>
      
      <Card className="flex-1 min-h-0">
        <CardContent className="p-0 h-full">
          <Suspense
            fallback={
              <div className="w-full h-full min-h-[500px] bg-slate-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Initialisation du visualiseur 3D...</p>
                </div>
              </div>
            }
          >
            <PotreeViewer className="h-full min-h-[500px] rounded-lg" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
