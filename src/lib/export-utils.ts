/**
 * Utility library for exporting data in various formats
 * Supports: JSON, CSV, GeoJSON, TXT (report)
 */

// ─── Generic Helpers ─────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
}

// ─── JSON Export ─────────────────────────────────────────────────────────────

export function exportJSON(data: unknown, filename?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, filename ?? `geo_e_export_${timestamp()}.json`)
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

export function exportCSV(rows: Record<string, unknown>[], filename?: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(';'),
    ...rows.map(row =>
      headers.map(h => {
        const v = row[h]
        const s = v === null || v === undefined ? '' : String(v)
        // Escape cells that contain delimiter or quotes
        return s.includes(';') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      }).join(';')
    )
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename ?? `geo_e_export_${timestamp()}.csv`)
}

// ─── GeoJSON Export ───────────────────────────────────────────────────────────

export interface GeoPoint { lat: number; lng: number; [key: string]: unknown }

export function exportGeoJSON(
  points: GeoPoint[],
  geometryType: 'Point' | 'LineString' | 'Polygon' = 'Point',
  properties: Record<string, unknown> = {},
  filename?: string
) {
  let geometry: unknown

  if (geometryType === 'Point') {
    // Export each point as a Feature
    const features = points.map((p, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { index: i, ...properties, ...p },
    }))
    const geojson = { type: 'FeatureCollection', features }
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' })
    downloadBlob(blob, filename ?? `geo_e_points_${timestamp()}.geojson`)
    return
  }

  const coords = points.map(p => [p.lng, p.lat])

  if (geometryType === 'Polygon') {
    // Close the polygon
    if (coords.length > 0) coords.push(coords[0])
    geometry = { type: 'Polygon', coordinates: [coords] }
  } else {
    geometry = { type: 'LineString', coordinates: coords }
  }

  const geojson = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry,
      properties,
    }]
  }

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' })
  downloadBlob(blob, filename ?? `geo_e_${geometryType.toLowerCase()}_${timestamp()}.geojson`)
}

// ─── Text Report ──────────────────────────────────────────────────────────────

export function exportTextReport(sections: { title: string; lines: string[] }[], filename?: string) {
  const header = [
    '╔══════════════════════════════════════════════════╗',
    '║         GÉO-ENQUÊTEUR — RAPPORT D\'ANALYSE        ║',
    '╚══════════════════════════════════════════════════╝',
    `Généré le : ${new Date().toLocaleString('fr-FR')}`,
    '',
  ]

  const body = sections.flatMap(s => [
    `═══ ${s.title.toUpperCase()} ═══`,
    ...s.lines.map(l => `  ${l}`),
    '',
  ])

  const footer = [
    '──────────────────────────────────────────────────',
    '  Géo-Enquêteur Analyste — Rapport généré automatiquement',
    '  Système: WGS84 | Méthode: Géodésique | Précision: ±0.5%',
  ]

  const content = [...header, ...body, ...footer].join('\r\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  downloadBlob(blob, filename ?? `rapport_geo_e_${timestamp()}.txt`)
}

// ─── HTML Report ──────────────────────────────────────────────────────────────

export function exportHTMLReport(
  title: string,
  sections: { heading: string; rows: [string, string][] }[],
  filename?: string
) {
  const now = new Date().toLocaleString('fr-FR')
  const sectionsHTML = sections.map(s => `
    <section>
      <h2>${s.heading}</h2>
      <table>
        <tbody>
          ${s.rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${title} — Géo-Enquêteur</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 860px; margin: 40px auto; color: #1e293b; background: #f8fafc; }
    header { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: white; padding: 32px; border-radius: 12px; margin-bottom: 28px; }
    header h1 { margin: 0 0 6px; font-size: 1.8rem; }
    header p { margin: 0; opacity: 0.85; font-size: 0.9rem; }
    section { background: white; border-radius: 10px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.07); }
    h2 { margin: 0 0 16px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6366f1; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { text-align: left; padding: 8px 12px; background: #f1f5f9; color: #64748b; font-weight: 500; width: 40%; border-radius: 4px; }
    td { padding: 8px 12px; font-weight: 600; }
    tr + tr th, tr + tr td { border-top: 1px solid #f1f5f9; }
    footer { text-align: center; font-size: 0.8rem; color: #94a3b8; margin-top: 32px; }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p>Rapport généré le ${now} par Géo-Enquêteur Analyste</p>
  </header>
  ${sectionsHTML}
  <footer>
    Géo-Enquêteur Analyste &nbsp;|&nbsp; Système WGS84 &nbsp;|&nbsp; Méthode Géodésique &nbsp;|&nbsp; Précision ±0.5%
  </footer>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  downloadBlob(blob, filename ?? `rapport_${timestamp()}.html`)
}
