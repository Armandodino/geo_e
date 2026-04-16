import * as turf from '@turf/turf'

// Earth radius in meters
const EARTH_RADIUS = 6371000

/**
 * Calculate distance between two points using Haversine formula
 * @returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const from = turf.point([lng1, lat1])
  const to = turf.point([lng2, lat2])
  return turf.distance(from, to, { units: 'meters' })
}

/**
 * Calculate total distance for multiple points
 * @returns distance in meters
 */
export function calculateTotalDistance(
  coordinates: Array<{ lat: number; lng: number }>
): number {
  if (coordinates.length < 2) return 0
  
  let totalDistance = 0
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(
      coordinates[i].lat,
      coordinates[i].lng,
      coordinates[i + 1].lat,
      coordinates[i + 1].lng
    )
  }
  return totalDistance
}

/**
 * Calculate area of a polygon
 * @returns area in square meters
 */
export function calculateArea(
  coordinates: Array<{ lat: number; lng: number }>
): number {
  if (coordinates.length < 3) return 0
  
  // Close the polygon if not already closed
  const coords = [...coordinates]
  if (coords[0].lat !== coords[coords.length - 1].lat || 
      coords[0].lng !== coords[coords.length - 1].lng) {
    coords.push(coords[0])
  }
  
  const positions = coords.map(c => [c.lng, c.lat])
  const polygon = turf.polygon([positions])
  return turf.area(polygon)
}

/**
 * Calculate the bearing from one point to another
 * @returns bearing in degrees (0-360)
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const from = turf.point([lng1, lat1])
  const to = turf.point([lng2, lat2])
  const bearing = turf.bearing(from, to)
  return bearing < 0 ? bearing + 360 : bearing
}

/**
 * Calculate midpoint between two coordinates
 */
export function calculateMidpoint(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): { lat: number; lng: number } {
  const from = turf.point([lng1, lat1])
  const to = turf.point([lng2, lat2])
  const midpoint = turf.midpoint(from, to)
  return {
    lat: midpoint.geometry.coordinates[1],
    lng: midpoint.geometry.coordinates[0],
  }
}

/**
 * Create a buffer around a point or line
 * @returns GeoJSON Polygon
 */
export function createBuffer(
  coordinates: Array<{ lat: number; lng: number }>,
  radiusMeters: number,
  type: 'point' | 'line' = 'point'
): turf.Feature<turf.Polygon> | null {
  if (type === 'point' && coordinates.length === 1) {
    const point = turf.point([coordinates[0].lng, coordinates[0].lat])
    return turf.buffer(point, radiusMeters, { units: 'meters' }) as turf.Feature<turf.Polygon>
  } else if (type === 'line' && coordinates.length >= 2) {
    const positions = coordinates.map(c => [c.lng, c.lat])
    const line = turf.lineString(positions)
    return turf.buffer(line, radiusMeters, { units: 'meters' }) as turf.Feature<turf.Polygon>
  }
  return null
}

/**
 * Calculate the centroid of a polygon
 */
export function calculateCentroid(
  coordinates: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } {
  const positions = coordinates.map(c => [c.lng, c.lat])
  // Close the polygon if needed
  if (positions[0][0] !== positions[positions.length - 1][0] ||
      positions[0][1] !== positions[positions.length - 1][1]) {
    positions.push(positions[0])
  }
  
  const polygon = turf.polygon([positions])
  const centroid = turf.centroid(polygon)
  return {
    lat: centroid.geometry.coordinates[1],
    lng: centroid.geometry.coordinates[0],
  }
}

/**
 * Calculate the perimeter of a polygon
 * @returns perimeter in meters
 */
export function calculatePerimeter(
  coordinates: Array<{ lat: number; lng: number }>
): number {
  if (coordinates.length < 2) return 0
  
  let perimeter = 0
  for (let i = 0; i < coordinates.length; i++) {
    const next = (i + 1) % coordinates.length
    perimeter += calculateDistance(
      coordinates[i].lat,
      coordinates[i].lng,
      coordinates[next].lat,
      coordinates[next].lng
    )
  }
  return perimeter
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}

/**
 * Calculate destination point given start, bearing and distance
 */
export function destinationPoint(
  lat: number,
  lng: number,
  bearing: number,
  distanceMeters: number
): { lat: number; lng: number } {
  const from = turf.point([lng, lat])
  const destination = turf.destination(from, distanceMeters, bearing, { units: 'meters' })
  return {
    lat: destination.geometry.coordinates[1],
    lng: destination.geometry.coordinates[0],
  }
}

/**
 * Check if a point is inside a polygon
 */
export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  const positions = polygon.map(c => [c.lng, c.lat])
  // Close the polygon
  if (positions[0][0] !== positions[positions.length - 1][0] ||
      positions[0][1] !== positions[positions.length - 1][1]) {
    positions.push(positions[0])
  }
  
  const pt = turf.point([point.lng, point.lat])
  const poly = turf.polygon([positions])
  return turf.booleanPointInPolygon(pt, poly)
}

/**
 * Calculate volume using prismoidal formula
 * @param baseArea in square meters
 * @param height in meters
 * @returns volume in cubic meters
 */
export function calculateVolume(baseArea: number, height: number): number {
  return baseArea * height
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(1)} m`
  }
  return `${(meters / 1000).toFixed(2)} km`
}

/**
 * Format area for display
 */
export function formatArea(squareMeters: number): string {
  if (squareMeters < 10000) {
    return `${squareMeters.toFixed(1)} m²`
  }
  if (squareMeters < 1000000) {
    return `${(squareMeters / 10000).toFixed(2)} ha`
  }
  return `${(squareMeters / 1000000).toFixed(2)} km²`
}

/**
 * Format volume for display
 */
export function formatVolume(cubicMeters: number): string {
  if (cubicMeters < 1000) {
    return `${cubicMeters.toFixed(1)} m³`
  }
  return `${cubicMeters.toLocaleString()} m³`
}

/**
 * Calculate angle between three points
 * @returns angle in degrees
 */
export function calculateAngle(
  point1: { lat: number; lng: number },
  vertex: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const bearing1 = calculateBearing(vertex.lat, vertex.lng, point1.lat, point1.lng)
  const bearing2 = calculateBearing(vertex.lat, vertex.lng, point2.lat, point2.lng)
  
  let angle = Math.abs(bearing2 - bearing1)
  if (angle > 180) {
    angle = 360 - angle
  }
  return angle
}

/**
 * Convert UTM to Lat/Lng (simplified - for more accuracy use proj4js)
 */
export function utmToLatLng(
  easting: number,
  northing: number,
  zone: number,
  northernHemisphere: boolean = true
): { lat: number; lng: number } {
  // This is a simplified conversion - for production use a proper library
  const k0 = 0.9996
  const a = 6378137.0
  const eccSquared = 0.00669438
  const e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared))
  
  const x = easting - 500000.0
  const y = northernHemisphere ? northing : northing - 10000000.0
  
  const zoneCentralMeridian = (zone - 1) * 6 - 180 + 3
  
  const eccPrimeSquared = (eccSquared) / (1 - eccSquared)
  const M = y / k0
  const mu = M / (a * (1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared * eccSquared * eccSquared / 256))
  
  const phi1Rad = mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu)
    + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu)
    + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu)
  
  const N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad))
  const T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad)
  const C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad)
  const R1 = a * (1 - eccSquared) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5)
  const D = x / (N1 * k0)
  
  const lat = phi1Rad - (N1 * Math.tan(phi1Rad) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * D * D * D * D / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * D * D * D * D * D * D / 720)
  
  const lng = (D - (1 + 2 * T1 + C1) * D * D * D / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * D * D * D * D * D / 120) / Math.cos(phi1Rad)
  
  return {
    lat: toDegrees(lat),
    lng: zoneCentralMeridian + toDegrees(lng),
  }
}

/**
 * Get bounding box from coordinates
 */
export function getBounds(
  coordinates: Array<{ lat: number; lng: number }>
): [[number, number], [number, number]] {
  if (coordinates.length === 0) {
    return [[0, 0], [0, 0]]
  }
  
  let minLat = coordinates[0].lat
  let maxLat = coordinates[0].lat
  let minLng = coordinates[0].lng
  let maxLng = coordinates[0].lng
  
  for (const coord of coordinates) {
    minLat = Math.min(minLat, coord.lat)
    maxLat = Math.max(maxLat, coord.lat)
    minLng = Math.min(minLng, coord.lng)
    maxLng = Math.max(maxLng, coord.lng)
  }
  
  return [[minLat, minLng], [maxLat, maxLng]]
}
