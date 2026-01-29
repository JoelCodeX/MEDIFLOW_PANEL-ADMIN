import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

function LineChart({ data }) {
  // Datos por defecto si no se proporcionan
  const defaultData = [
    { name: 'Ene', alertas: 4, evaluaciones: 10 },
    { name: 'Feb', alertas: 3, evaluaciones: 12 },
    { name: 'Mar', alertas: 5, evaluaciones: 15 },
    { name: 'Abr', alertas: 2, evaluaciones: 8 },
    { name: 'May', alertas: 6, evaluaciones: 20 },
    { name: 'Jun', alertas: 4, evaluaciones: 18 },
  ]

  const chartData = data && data.length > 0 ? data : defaultData

  return (
    <div className="w-full h-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAlertas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#55AB44" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#55AB44" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEvaluaciones" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 10 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 10 }} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            itemStyle={{ fontSize: '12px' }}
            labelStyle={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="evaluaciones" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorEvaluaciones)" 
            name="Evaluaciones"
          />
          <Area 
            type="monotone" 
            dataKey="alertas" 
            stroke="#55AB44" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorAlertas)" 
            name="Alertas"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default LineChart
