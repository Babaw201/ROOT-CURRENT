import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SensorReading } from '../../types'

interface DailyLight {
  date: string
  dli: number
}

/** Regroupe les mesures de lumière par jour civil (moyenne), pour une lecture « journalière » plutôt qu'un nuage de points bruts. */
function aggregateDailyLight(readings: SensorReading[]): DailyLight[] {
  const byDay = new Map<string, number[]>()
  for (const reading of readings) {
    if (reading.light?.dli === undefined) continue
    const day = reading.timestamp.slice(0, 10)
    const values = byDay.get(day) ?? []
    values.push(reading.light.dli)
    byDay.set(day, values)
  }
  return Array.from(byDay.entries())
    .map(([date, values]) => ({ date, dli: values.reduce((a, b) => a + b, 0) / values.length }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function LightChart({ readings }: { readings: SensorReading[] }) {
  const data = aggregateDailyLight(readings)
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-stone-400">Pas encore assez de mesures de lumière.</p>
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -18 }}>
          <CartesianGrid stroke="#eeeae3" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9a948a' }}
            tickFormatter={(value: string) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            minTickGap={30}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9a948a' }} />
          <Tooltip
            labelFormatter={(label) =>
              typeof label === 'string' ? new Date(label).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' }) : ''
            }
            formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)} DLI` : '—', 'Lumière']}
          />
          <Bar dataKey="dli" fill="#dcae5a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
