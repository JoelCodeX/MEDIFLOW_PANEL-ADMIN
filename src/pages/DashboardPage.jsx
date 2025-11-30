import Card from '@/components/Card'
import LineChart from '@/components/LineChart'
import StatWidget from '@/components/StatWidget'
import user from '../assets/user.svg'

const rows = [
  { desc: 'John Doe', date: '17/04/2023' },
  { desc: 'Mesque Café', date: '17/04/2023' },
  { desc: 'Tania Herrera', date: '16/04/2023' },
]

function DashboardPage() {
  return (
    <div className="px-2 pt-0 pb-0 h-full overflow-hidden flex flex-col min-h-0">
      {/* Saludo y filtros (arriba) */}
      <div className="flex items-center justify-between mb-2 ">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white grid place-items-center">
            <img src={user} alt="Administrador" className="w-7 h-7 rounded-full" />
          </div>
          <h1 className="text-sm text-[var(--muted)]">
            Buenos días, <span className="text-[var(--text)] font-semibold">Administrador</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs">Semanal</button>
          <button className="px-3 py-1 rounded-full bg-primary text-white text-xs">Mensual</button>
          <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs">Anual</button>
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
                <div className="text-sm font-bold text-[#55AB44]">35</div>
                <div className="text-[10px] text-[var(--muted)]">Registrados</div>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-[#eaf7ea] text-[#55AB44] text-[9px] font-semibold">+2</span>
              <span className="text-[10px] text-[var(--muted)]">Este mes</span>
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
                <div className="text-sm font-bold text-[#10b981]">15</div>
                <div className="text-[10px] text-[var(--muted)]">Activas</div>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-[#eaf7ea] text-[#55AB44] text-[9px] font-semibold">-3%</span>
              <span className="text-[10px] text-[var(--muted)]">Este mes</span>
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
                <div className="text-sm font-bold text-[#3b82f6]">22</div>
                <div className="text-[10px] text-[var(--muted)]">Completadas</div>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-[#eaf7ea] text-[#55AB44] text-[9px] font-semibold">+5</span>
              <span className="text-[10px] text-[var(--muted)]">Este mes</span>
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
                <div className="text-sm font-bold text-[#f59e0b]">68%</div>
                <div className="text-[10px] text-[var(--muted)]">Programas</div>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-[#fff3e6] text-[#f59e0b] text-[9px] font-semibold">+1.2%</span>
              <span className="text-[10px] text-[var(--muted)]">Este mes</span>
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
            value="35"
            delta="+2.6%"
            items={[
              { label: 'Ergonómicas', color: '#55AB44' },
              { label: 'Psicosociales', color: '#8884d8' },
              { label: 'Biológicas', color: '#aa66cc' },
            ]}
          />
        </Card>
      </div>

      {/* Panel 6: Indicadores de bienestar (fila inferior, ahora ocupa col 1-8) */}
      <div className="col-span-8 row-start-3 col-start-1 min-h-0">
        <Card title="Indicadores de bienestar" actionLabel="Ver más" compact dense className="h-full">
          <LineChart />
        </Card>
      </div>

      {/* Panel 7: Participación en actividades (columna derecha, arriba, ahora 4 columnas) */}
      <div className="col-span-4 row-start-1 col-start-9 min-h-0">
        <Card title="Participación en actividades" actionLabel="Editar" compact dense className="h-full">
          <div>
            <div className="flex items-center justify-between text-xs">
              <strong className="text-sm">68%</strong>
              <span>de 100%</span>
            </div>
            <div className="mt-2 h-[6px] rounded-full bg-[#eaeaea]">
              <div className="h-full w-[68%] rounded-full bg-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Panel 8: Actividad reciente (derecha, ocupa filas 2 y 3 con altura completa, ahora 4 columnas) */}
      <div className="col-span-4 row-span-2 row-start-2 col-start-9 min-h-0">
        <Card title="Actividad reciente" actionLabel="Ver historial" compact dense className="h-full">
          <ul className="list-none grid gap-1">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center justify-between border-b border-[#eaeaea] pb-1">
                <span className="text-xs">{r.desc}</span>
                <span className="text-xs text-[var(--muted)]">{r.date}</span>
              </li>
            ))}
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