'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Ruler,
  Square,
  Mountain,
  Box,
  Compass,
  Circle,
  Crosshair,
  TrendingUp,
} from 'lucide-react'
import {
  formatDistance,
  formatArea,
  formatVolume,
  calculateDistance,
  calculateArea,
  calculateAngle,
  calculateVolume,
} from '@/lib/geo-utils'

export interface MeasurementResult {
  type: 'distance' | 'area' | 'angle' | 'height' | 'volume' | 'radius'
  value: number
  formatted: string
  unit: string
  timestamp: Date
}

interface MeasurementToolsProps {
  activeTool: string | null
  onToolChange: (tool: string | null) => void
  onMeasurement?: (result: MeasurementResult) => void
  points?: Array<{ lat: number; lng: number }>
  measurements?: {
    baseArea?: number
    height?: number
  }
  className?: string
}

export const measurementTools = [
  {
    id: 'distance',
    name: 'Distance',
    icon: Ruler,
    description: 'Mesurer la distance entre deux points',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'angle',
    name: 'Angle',
    icon: Compass,
    description: 'Mesurer un angle',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'height',
    name: 'Hauteur',
    icon: Mountain,
    description: 'Mesurer une hauteur',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'area',
    name: 'Surface',
    icon: Square,
    description: 'Calculer une surface',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'volume',
    name: 'Volume',
    icon: Box,
    description: 'Calculer un volume',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    id: 'radius',
    name: 'Rayon',
    icon: Circle,
    description: 'Mesurer un rayon',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    id: 'profile',
    name: 'Profil',
    icon: TrendingUp,
    description: 'Profil topographique',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
]

export function MeasurementTools({
  activeTool,
  onToolChange,
  onMeasurement,
  points = [],
  measurements = {},
  className = '',
}: MeasurementToolsProps) {
  const [lastResult, setLastResult] = useState<MeasurementResult | null>(null)

  const handleCalculate = () => {
    if (!activeTool) return

    let result: MeasurementResult | null = null

    switch (activeTool) {
      case 'distance':
        if (points.length >= 2) {
          const dist = calculateDistance(
            points[0].lat,
            points[0].lng,
            points[points.length - 1].lat,
            points[points.length - 1].lng
          )
          result = {
            type: 'distance',
            value: dist,
            formatted: formatDistance(dist),
            unit: dist < 1000 ? 'm' : 'km',
            timestamp: new Date(),
          }
        }
        break

      case 'area':
        if (points.length >= 3) {
          const area = calculateArea(points)
          result = {
            type: 'area',
            value: area,
            formatted: formatArea(area),
            unit: area < 10000 ? 'm²' : 'ha',
            timestamp: new Date(),
          }
        }
        break

      case 'angle':
        if (points.length >= 3) {
          const angle = calculateAngle(points[0], points[1], points[2])
          result = {
            type: 'angle',
            value: angle,
            formatted: `${angle.toFixed(2)}°`,
            unit: '°',
            timestamp: new Date(),
          }
        }
        break

      case 'volume':
        if (measurements.baseArea && measurements.height) {
          const vol = calculateVolume(measurements.baseArea, measurements.height)
          result = {
            type: 'volume',
            value: vol,
            formatted: formatVolume(vol),
            unit: 'm³',
            timestamp: new Date(),
          }
        }
        break

      case 'height':
        if (measurements.height) {
          result = {
            type: 'height',
            value: measurements.height,
            formatted: `${measurements.height.toFixed(2)} m`,
            unit: 'm',
            timestamp: new Date(),
          }
        }
        break

      case 'radius':
        if (points.length >= 2) {
          const dist = calculateDistance(
            points[0].lat,
            points[0].lng,
            points[1].lat,
            points[1].lng
          )
          result = {
            type: 'radius',
            value: dist,
            formatted: formatDistance(dist),
            unit: dist < 1000 ? 'm' : 'km',
            timestamp: new Date(),
          }
        }
        break
    }

    if (result) {
      setLastResult(result)
      onMeasurement?.(result)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Outils de mesure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {measurementTools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? 'default' : 'outline'}
              size="sm"
              className="justify-start gap-2 h-auto py-2"
              onClick={() => onToolChange(activeTool === tool.id ? null : tool.id)}
            >
              <div className={`p-1 rounded ${tool.bgColor}`}>
                <tool.icon className={`h-4 w-4 ${tool.color}`} />
              </div>
              <span className="text-xs">{tool.name}</span>
            </Button>
          ))}
        </div>

        {lastResult && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dernier résultat</span>
                <Badge variant="secondary">{lastResult.type}</Badge>
              </div>
              <div className="text-2xl font-bold text-primary">
                {lastResult.formatted}
              </div>
            </div>
          </>
        )}

        {activeTool && points.length > 0 && (
          <>
            <Separator />
            <Button onClick={handleCalculate} className="w-full">
              <Crosshair className="h-4 w-4 mr-2" />
              Calculer
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
