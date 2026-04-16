'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Dynamic import to avoid SSR issues with Leaflet
const MapViewer = dynamic(
  () => import('@/components/map-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
)

export default function GISPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Visualisation GIS</h1>
        <p className="text-muted-foreground">
          Carte interactive avec vues satellite, terrain et outils de dessin
        </p>
      </div>

      <Card className="flex-1 min-h-[500px]">
        <CardContent className="p-0 h-full">
          <Suspense
            fallback={
              <div className="w-full h-full min-h-[500px] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Chargement de la carte...</p>
                </div>
              </div>
            }
          >
            <MapViewer className="h-full rounded-lg" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
