import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistoryRange, SensorReading } from '../../types'
import { formatAxisTick, formatFullDateTime } from '../../utils/format'

export function BatteryChart({ readings, range }: { readings: SensorReading[]; range: HistoryRange }) {
  const data = readings
    .filter((r) => r.battery?.level !== undefined)
    .map((r) => ({ ts: new Date(r.timestamp).getTime(), level: r.battery?.level }))

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-stone-400">Pas encore d’historique de batterie.</p>
  }

  return (
    <div className="h-56">
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
            formatter={(value) => [typeof value === 'number' ? `${Math.round(value)} %` : '—', 'Batterie']}
          />
          <Line type="monotone" dataKey="level" stroke="#6b7280" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
