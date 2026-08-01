import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistoryRange, SensorReading } from '../../types'
import { formatAxisTick, formatFullDateTime } from '../../utils/format'

interface MoistureChartPoint {
  ts: number
  surface?: number
  middle?: number
  deep?: number
}

/**
 * Les mesures n'arrivent pas à intervalles réguliers (échantillonnage
 * adaptatif, voir cahier des charges §6) : l'axe X est donc numérique
 * (timestamp réel), jamais une simple série de catégories également
 * espacées, pour ne pas fausser visuellement la lecture des tendances.
 */
export function MoistureChart({ readings, range }: { readings: SensorReading[]; range: HistoryRange }) {
  if (readings.length === 0) {
    return <p className="py-10 text-center text-sm text-stone-400">Pas encore assez de mesures pour cette période.</p>
  }

  const data: MoistureChartPoint[] = readings.map((r) => ({
    ts: new Date(r.timestamp).getTime(),
    surface: r.moisture?.surface,
    middle: r.moisture?.middle,
    deep: r.moisture?.deep,
  }))
  const hasMiddle = data.some((d) => d.middle !== undefined)
  const hasDeep = data.some((d) => d.deep !== undefined)

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -18 }}>
          <CartesianGrid stroke="#eeeae3" vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9a948a' }}
            tickFormatter={(value: number) => formatAxisTick(new Date(value).toISOString(), range)}
            minTickGap={40}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9a948a' }} domain={[0, 100]} />
          <Tooltip
            labelFormatter={(label) => (typeof label === 'number' ? formatFullDateTime(new Date(label).toISOString()) : '')}
            formatter={(value, name) => [typeof value === 'number' ? `${Math.round(value)} %` : '—', String(name)]}
          />
          <Line name="Surface" type="monotone" dataKey="surface" stroke="#52764a" strokeWidth={3} dot={false} connectNulls />
          {hasMiddle && (
            <Line
              name="Milieu"
              type="monotone"
              dataKey="middle"
              stroke="#b98a3d"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
          )}
          {hasDeep && (
            <Line
              name="Profondeur"
              type="monotone"
              dataKey="deep"
              stroke="#b76553"
              strokeWidth={2.5}
              strokeDasharray="6 5"
              dot={false}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
