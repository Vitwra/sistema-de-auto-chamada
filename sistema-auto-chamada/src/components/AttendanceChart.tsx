import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

export interface AttendanceChartData {
  present: number
  absent: number
  justified: number
}

const PIE_COLORS = {
  present: '#059669', // emerald-600
  absent: '#e11d48',  // rose-600
  justified: '#d97706', // amber-600
}

const PIE_LABELS = {
  present: 'Presentes',
  absent: 'Ausentes',
  justified: 'Justificadas',
}

function buildPieData(data: AttendanceChartData) {
  return [
    { name: PIE_LABELS.present, value: data.present, color: PIE_COLORS.present },
    { name: PIE_LABELS.absent, value: data.absent, color: PIE_COLORS.absent },
    { name: PIE_LABELS.justified, value: data.justified, color: PIE_COLORS.justified },
  ].filter((d) => d.value > 0)
}

function buildBarData(data: AttendanceChartData) {
  return [
    { name: PIE_LABELS.present, total: data.present, fill: PIE_COLORS.present },
    { name: PIE_LABELS.absent, total: data.absent, fill: PIE_COLORS.absent },
    { name: PIE_LABELS.justified, total: data.justified, fill: PIE_COLORS.justified },
  ]
}

interface AttendanceChartProps {
  data: AttendanceChartData
  variant?: 'pie' | 'bar'
  height?: number
  /** Legenda só com Compareceu (verde) e Não compareceu (vermelho), sem etiquetas nas fatias. */
  simplifiedLegend?: boolean
}

function buildSimplifiedPieData(data: AttendanceChartData) {
  const compareceu = data.present
  const naoCompareceu = data.absent + data.justified
  return [
    { name: 'Compareceu', value: compareceu, color: PIE_COLORS.present },
    { name: 'Não compareceu', value: naoCompareceu, color: PIE_COLORS.absent },
  ].filter((d) => d.value > 0)
}

export function AttendanceChart({
  data,
  variant = 'bar',
  height = 220,
  simplifiedLegend = false,
}: AttendanceChartProps) {
  const total = data.present + data.absent + data.justified
  const pieData = simplifiedLegend ? buildSimplifiedPieData(data) : buildPieData(data)
  const barData = buildBarData(data)

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-slate-50 text-xs text-slate-500"
        style={{ height }}
      >
        Nenhum registro de presença ainda
      </div>
    )
  }

  if (variant === 'pie') {
    return (
      <div>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              label={simplifiedLegend ? false : ({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {!simplifiedLegend && (
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => value}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        {simplifiedLegend && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden />
              Compareceu {total > 0 ? `${Math.round((data.present / total) * 100)}%` : '0%'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-600" aria-hidden />
              Não compareceu {total > 0 ? `${Math.round((data.absent + data.justified) / total * 100)}%` : '0%'}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} name="Quantidade" />
      </BarChart>
    </ResponsiveContainer>
  )
}
