import { useEffect, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import Card from '@/components/Card'
import LineChart from '@/components/LineChart'
import StatWidget from '@/components/StatWidget'
import user from '../assets/user.svg'
import { getDashboardStats } from '@/services/dashboard'

function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('mensual')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      try {
        const data = await getDashboardStats(period)
        setStats(data)
      } catch (error) {
        console.error("Error cargando dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [period])

  if (loading) {
    return <div className="h-full grid place-items-center text-[var(--muted)]">Cargando indicadores...</div>
  }

  // Valores por defecto seguros si falla la carga o vienen nulos
  const { usuarios, alertas, evaluaciones, participacion, actividad_reciente } = stats || {
    usuarios: { total: 0, nuevos_mes: 0 },
    alertas: { total: 0, activas_periodo: 0, detalle: {} },
    evaluaciones: { total: 0, nuevas_mes: 0 },
    participacion: { porcentaje: 0, variacion: 0 },
    actividad_reciente: []
  }

  const getPeriodLabel = () => {
    switch(period) {
      case 'semanal': return 'Esta semana'
      case 'anual': return 'Este año'
      case 'total': return 'Total histórico'
      default: return 'Este mes'
    }
  }
  const periodLabel = getPeriodLabel()

  // Transformar detalle de alertas para el widget
  const alertasItems = Object.entries(alertas.detalle || {}).map(([tipo, count], idx) => ({
    label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    color: ['#55AB44', '#8884d8', '#aa66cc', '#f59e0b'][idx % 4] // Colores cíclicos
  }))

  return (
    <div className="px-2 pt-0 pb-0 h-full overflow-hidden flex flex-col min-h-0">
      {/* Saludo y filtros (arriba) */}
      <div className="flex items-center justify-between mb-2 ">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--surface)] grid place-items-center">
            <img src={user} alt="Administrador" className="w-7 h-7 rounded-full" />
          </div>
          <h1 className="text-sm text-[var(--muted)]">
            Buenos días, <span className="text-[var(--text)] font-semibold">Administrador</span>
          </h1>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--text)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span>{period.charAt(0).toUpperCase() + period.slice(1)}</span>
            <FiChevronDown className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--surface)] rounded-lg shadow-lg border border-[var(--border)] py-1 z-50">
              {['total', 'anual', 'mensual', 'semanal'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p)
                    setIsFilterOpen(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 ${period === p ? 'text-primary font-semibold bg-primary/5' : 'text-[var(--text)]'}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grilla de contenido */}
      <div className="grid grid-cols-12 grid-rows-[auto_auto_1fr] gap-x-3 gap-y-3 items-stretch flex-1 min-h-0">

      {/* Bloque KPIs (izquierda): grilla anidada 2x2 pegada verticalmente */}
      <div className="col-span-4 col-start-1 row-span-2 grid grid-cols-2 gap-x-3 gap-y-3 items-start">
        <div>
          <Card title="Total de trabajadores" compact dense minH={50}>
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-[#55AB44]/15 grid place-items-center">
                <svg className="w-3 h-3 text-[#55AB44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <div className="leading-tight">
                <div className="text-sm font-bold text-[#55AB44]">{usuarios.total}</div>
                <div className="text-[10px] text-[var(--muted)]">Registrados</div>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-[#55AB44] text-[9px] font-semibold">+{usuarios.nuevos_mes}</span>
              <span className="text-[10px] text-[var(--muted)]">{periodLabel}</span>
            </div>
          </Card>
        </div>
        <div>
          <Card title="Alertas" compact dense minH={50}>
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-[#10b981]/15 grid place-items-center">
                <svg className="w-3 h-3 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
              <div className="leading-tight">
                <div className="text-sm font-bold text-[#10b981]">{alertas.total}</div>
                <div className="text-[10px] text-[var(--muted)]">Generadas</div>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              {/* TODO: Calcular delta real */}
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-[#55AB44] text-[9px] font-semibold">Info</span>
              <span className="text-[10px] text-[var(--muted)]">{periodLabel}</span>
            </div>
          </Card>
        </div>
        <div>
          <Card title="Evaluaciones" compact dense minH={50}>
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-[#3b82f6]/15 grid place-items-center">
                <svg className="w-3 h-3 text-[#3b82f6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="16" x2="13" y2="16" />
                </svg>
              </span>
              <div className="leading-tight">
                <div className="text-sm font-bold text-[#3b82f6]">{evaluaciones.total}</div>
                <div className="text-[10px] text-[var(--muted)]">Completadas</div>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-[#55AB44] text-[9px] font-semibold">+{evaluaciones.nuevas_mes}</span>
              <span className="text-[10px] text-[var(--muted)]">{periodLabel}</span>
            </div>
          </Card>
        </div>
        <div>
          <Card title="Participación" compact dense minH={50}>
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-[#f59e0b]/15 grid place-items-center">
                <svg className="w-3 h-3 text-[#f59e0b]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 21s-6-4.35-9-7.35C1.17 12.76 1 10.5 2.54 8.96a5.5 5.5 0 0 1 7.78 0L12 10.64l1.68-1.68a5.5 5.5 0 0 1 7.78 0c1.54 1.54 1.37 3.8-.46 4.69C18 16.65 12 21 12 21z" />
                </svg>
              </span>
              <div className="leading-tight">
                <div className="text-sm font-bold text-[#f59e0b]">{participacion.porcentaje}%</div>
                <div className="text-[10px] text-[var(--muted)]">Programas</div>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-[#f59e0b] text-[9px] font-semibold">+{participacion.variacion}%</span>
              <span className="text-[10px] text-[var(--muted)]">{periodLabel}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Panel 5: Alertas activas (centrado y pegado a KPIs izquierdos) */}
      <div className="col-span-4 row-span-2 row-start-1 col-start-5 min-h-0">
        <Card title="Alertas activas" actionLabel="Ver más" compact dense className="h-full">
          <StatWidget
            compact
            dense
            label="Alertas"
            value={String(alertas.activas_periodo || 0)}
            delta="Activas"
            items={alertasItems.length > 0 ? alertasItems : [{ label: 'Sin alertas', color: '#e5e7eb' }]}
          />
        </Card>
      </div>

      {/* Panel 6: Indicadores de bienestar (fila inferior, ahora ocupa col 1-8) */}
      <div className="col-span-8 row-start-3 col-start-1 min-h-0">
        <Card title="Indicadores de bienestar" actionLabel="Ver más" compact dense className="h-full">
          <LineChart data={stats ? stats.chart_data : []} />
        </Card>
      </div>

      {/* Panel 7: Participación en actividades (columna derecha, arriba, ahora 4 columnas) */}
      <div className="col-span-4 row-start-1 col-start-9 min-h-0">
        <Card title="Participación en actividades" actionLabel="Editar" compact dense className="h-full">
          <div>
            <div className="flex items-center justify-between text-xs">
              <strong className="text-sm">{participacion.porcentaje}%</strong>
              <span>de 100%</span>
            </div>
            <div className="mt-2 h-[6px] rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full rounded-full bg-primary" style={{ width: `${participacion.porcentaje}%` }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Panel 8: Actividad reciente (derecha, ocupa filas 2 y 3 con altura completa, ahora 4 columnas) */}
      <div className="col-span-4 row-span-2 row-start-2 col-start-9 min-h-0">
        <Card title="Actividad reciente" actionLabel="Ver historial" compact dense className="h-full">
          <ul className="list-none grid gap-1">
            {actividad_reciente.length > 0 ? actividad_reciente.map((r, i) => (
              <li key={i} className="flex items-center justify-between border-b border-[var(--border)] pb-1 last:border-0">
                <span className="text-xs truncate max-w-[180px]" title={r.desc}>{r.desc}</span>
                <span className="text-xs text-[var(--muted)] shrink-0 ml-2">{r.date}</span>
              </li>
            )) : (
              <li className="text-xs text-[var(--muted)] text-center py-2">Sin actividad reciente</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Botón flotante */}
      <button className="fixed bottom-6 right-6 px-4 py-2 rounded-full bg-primary text-white shadow-lg text-sm">
        Generar reporte rápido
      </button>
      </div>
    </div>
  )
}

export default DashboardPage