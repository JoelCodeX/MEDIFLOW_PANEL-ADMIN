import { useMemo, useState, useEffect } from 'react'
import Card from '@/components/Card'
import { CiCalendar, CiRedo } from 'react-icons/ci'

// Listas estáticas para filtros (reutilizadas de PersonalPage)
const ROLES_OPCIONES = [
  "Asistencial","Administrativo","Técnico","Profesional de salud","Directivo","Operativo","Apoyo diagnóstico","Apoyo terapéutico","Servicios generales","Salud ocupacional","Seguridad y salud en el trabajo","Educador en salud","Investigador","Coordinador","Supervisor"
]
const AREAS_OPCIONES = [
  "Medicina general","Medicina especializada","Enfermería","Obstetricia","Psicología","Odontología","Nutrición","Terapia física y rehabilitación","Laboratorio clínico","Radiología e imagenología","Farmacia","Emergencias y urgencias","Hospitalización","Centro quirúrgico","Centro obstétrico","Banco de sangre","Servicio de imágenes","Farmacotecnia","Rehabilitación física","Dirección médica","Dirección administrativa","Recursos humanos","Logística y almacén","Contabilidad y finanzas","Estadística e informática","Archivo clínico","Atención al usuario","Mantenimiento","Limpieza y desinfección","Seguridad y vigilancia","Alimentación y cocina","Lavandería"
]
const CARGOS_OPCIONES = [
  "Médico general","Médico especialista","Enfermero/a","Obstetra","Psicólogo/a","Odontólogo/a","Nutricionista","Técnico de laboratorio","Técnico en radiología","Químico farmacéutico","Técnico en farmacia","Cirujano","Anestesiólogo","Personal de limpieza","Personal de vigilancia","Cocinero/a","Lavandero/a","Administrador","Contador","Estadístico","Archivador clínico","Recepcionista","Jefe de recursos humanos","Coordinador de salud ocupacional","Inspector de SST","Ergónomo/a","Higienista industrial","Técnico en seguridad laboral","Miembro del comité SST","Director médico","Director administrativo","Educador en salud","Promotor de salud","Investigador clínico"
]

// Utilidades: parseo local de fecha y nombre del día en español (evita desfases por zona horaria)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date()
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0)
}
const diaSemanaEs = (fechaStr) => {
  const d = parseLocalDate(fechaStr)
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  return dias[d.getDay()]
}

// Datos cargados desde backend con fallback para "Día libre"
const fetchAsistencias = async ({ search, status, startDate, endDate, rol, area, cargo }) => {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status && status !== 'Todos') params.set('status', status.toLowerCase())
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)
  if (rol) params.set('rol', rol)
  if (area) params.set('area', area)
  if (cargo) params.set('cargo', cargo)
  const res = await fetch(`/api/asistencia/list?${params.toString()}&_=${Date.now()}` , { cache: 'no-store' })
  if (!res.ok) throw new Error('Error cargando asistencias')
  const data = await res.json()
  if (Array.isArray(data) && data.length > 0) return data

  // Fallback: construir "Día libre" para usuarios activos cuando el backend devuelve vacío
  const fechaObjetivo = startDate || endDate || new Date().toLocaleDateString('en-CA')
  const dia = diaSemanaEs(fechaObjetivo)
  const uRes = await fetch(`/api/usuarios/list?page=1&page_size=1000&estado=activo&_=${Date.now()}`, { cache: 'no-store' })
  if (!uRes.ok) return []
  const uJson = await uRes.json()
  const usuarios = uJson.items || []

  // Para cada usuario, consultar sus horarios y decidir si es día libre
  const rows = await Promise.all(usuarios.map(async (u) => {
    try {
      const hRes = await fetch(`/api/horarios/${u.id}?_=${Date.now()}`, { cache: 'no-store' })
      const horarios = hRes.ok ? await hRes.json() : []
      const vigenteTrue = (v) => {
        if (typeof v === 'boolean') return v
        if (typeof v === 'number') return v === 1
        if (typeof v === 'string') return v.toLowerCase() !== 'false' && v !== '0'
        return !!v
      }
      const tieneHorarioDia = Array.isArray(horarios) && horarios.some(h => h.dia_semana === dia && vigenteTrue(h.vigente))
      const schedule = Array.isArray(horarios) ? horarios.find(h => h.dia_semana === dia && vigenteTrue(h.vigente)) : null
      return {
        id_usuario: u.id,
        name: `${u.nombre} ${u.apellido}`.trim(),
        status: tieneHorarioDia ? 'Sin marcar' : 'Día libre',
        date: fechaObjetivo,
        in: '-',
        out: '-',
        note: tieneHorarioDia ? 'No ha marcado asistencia' : 'Sin horario asignado para el día',
        rol: u.rol,
        area: u.area,
        cargo: u.cargo,
        schedule_in: schedule ? schedule.hora_entrada : '-',
        schedule_out: schedule ? schedule.hora_salida : '-',
      }
    } catch {
      return {
        id_usuario: u.id,
        name: `${u.nombre} ${u.apellido}`.trim(),
        status: 'Día libre',
        date: fechaObjetivo,
        in: '-',
        out: '-',
        note: 'Sin horario asignado para el día',
        rol: u.rol,
        area: u.area,
        cargo: u.cargo,
        schedule_in: '-',
        schedule_out: '-',
      }
    }
  }))

  // Orden: Día libre -> Sin marcar -> otros; luego por nombre
  const ordenEstado = (s) => {
    const v = (s || '').toLowerCase()
    if (v === 'día libre') return 0
    if (v === 'sin marcar') return 1
    return 2
  }
  rows.sort((a, b) => {
    const byEstado = ordenEstado(a.status) - ordenEstado(b.status)
    if (byEstado !== 0) return byEstado
    return a.name.localeCompare(b.name)
  })
  return rows
}

function StatusBadge({ status }) {
  const map = {
    Presente: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Ausente: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    Tarde: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'Sin marcar': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'Día libre': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  }
  const className = map[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${className}`}>
      {status}
    </span>
  )
}

function CalendarOverlay({ userId, name, onClose }) {
  const [viewDate, setViewDate] = useState(new Date())
  const [startFrom, setStartFrom] = useState(null)
  const [monthData, setMonthData] = useState([])
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const classFor = (status) => {
    if (status === 'Presente') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    if (status === 'Tarde') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    if (status === 'Ausente') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    if (status === 'Sin marcar') return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    if (status === 'Día libre') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  // Obtener fecha inicial desde horarios (fecha_creacion mínima)
  useEffect(() => {
    let mounted = true
    const loadStart = async () => {
      try {
        const res = await fetch(`/api/horarios/${userId}?_=${Date.now()}`, { cache: 'no-store' })
        const horarios = res.ok ? await res.json() : []
        const fechas = horarios.map(h => h.fecha_creacion).filter(Boolean)
        const min = fechas.length ? new Date(fechas.sort()[0]) : null
        if (mounted) setStartFrom(min)
      } catch {
        if (mounted) setStartFrom(null)
      }
    }
    loadStart()
    return () => { mounted = false }
  }, [userId])

  // Cargar estados reales del mes actual
  useEffect(() => {
    let mounted = true
    const toYMD = (d) => d.toLocaleDateString('en-CA')
    const first = new Date(year, month, 1)
    const tasks = []
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      const ymd = toYMD(d)
      // Si antes del inicio de horarios, marcar no disponible
      if (startFrom && d < startFrom) {
        tasks.push(Promise.resolve({ day, status: 'No disponible' }))
        continue
      }
      const p = fetch(`/api/asistencia/list?start_date=${ymd}&id_usuario=${userId}&_=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : [])
        .then(arr => {
          const item = Array.isArray(arr) && arr.find(x => x.id_usuario === userId)
          const status = item ? item.status : '-' // Backend capitaliza
          return { day, status }
        })
        .catch(() => ({ day, status: '-' }))
      tasks.push(p)
    }
    Promise.all(tasks).then(res => {
      if (mounted) setMonthData(res)
    })
    return () => { mounted = false }
  }, [userId, year, month, startFrom])

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1)
    setViewDate(d)
  }
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1)
    setViewDate(d)
  }

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
      <div className="w-[760px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--text)]">Calendario de asistencia — {name}</h3>
          <button className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 text-xs" onClick={onClose}>Cerrar</button>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--muted)]">{viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Presente</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Tarde</span>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Ausente</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Sin marcar</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Día libre</span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <button className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 text-xs" onClick={prevMonth}>Mes anterior</button>
            <button className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 text-xs" onClick={nextMonth}>Mes siguiente</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const item = monthData.find(x => x.day === d)
              const st = item ? item.status : '-'
              const cls = classFor(st)
              return (
                <div key={d} className="border border-[var(--border)] rounded-md p-2 text-center">
                  <div className="text-xs font-medium mb-1 text-[var(--text)]">{d}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${cls}`}>{st}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function AsistenciaPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Todos')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rol, setRol] = useState('')
  const [area, setArea] = useState('')
  const [cargo, setCargo] = useState('')
  const [calendarUser, setCalendarUser] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAsistencias({ search, status, startDate, endDate, rol, area, cargo })
        setRows(data)
      } catch (e) {
        setError('No se pudo cargar asistencia')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [search, status, startDate, endDate, rol, area, cargo])

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAsistencias({ search, status, startDate, endDate, rol, area, cargo })
      setRows(data)
    } catch (e) {
      setError('No se pudo cargar asistencia')
    } finally {
      setLoading(false)
    }
  }

  // Rango rápido: Hoy, Semana actual (lun-dom) y Mes actual
  const formatLocalYMD = (dateObj) => dateObj.toLocaleDateString('en-CA')
  const setToday = () => {
    const d = new Date()
    setStartDate(formatLocalYMD(d))
    setEndDate('')
  }
  const setCurrentWeek = () => {
    const now = new Date()
    const day = now.getDay() // 0=Dom..6=Sáb
    const mondayOffset = (day + 6) % 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - mondayOffset)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    setStartDate(formatLocalYMD(monday))
    setEndDate(formatLocalYMD(sunday))
  }
  const setCurrentMonth = () => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setStartDate(formatLocalYMD(first))
    setEndDate(formatLocalYMD(last))
  }

  // Reiniciar a la primera página al cambiar filtros o búsqueda
  useEffect(() => {
    setPage(1)
  }, [search, status, startDate, endDate, rol, area, cargo])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'Todos' ? true : r.status === status
      const inRange = (() => {
        if (!startDate && !endDate) return true
        const d = new Date(r.date)
        const s = startDate ? new Date(startDate) : null
        const e = endDate ? new Date(endDate) : null
        if (s && e) return d >= s && d <= e
        if (s && !e) return d >= s
        if (!s && e) return d <= e
        return true
      })()
      return matchesSearch && matchesStatus && inRange
    })
  }, [rows, search, status, startDate, endDate])

  // Actualizar totales y páginas cuando cambian los datos filtrados o el tamaño de página
  useEffect(() => {
    const total = filtered.length
    setTotalItems(total)
    const pages = Math.max(1, Math.ceil(total / pageSize))
    setTotalPages(pages)
    if (page > pages) setPage(pages)
  }, [filtered, pageSize])

  // Filas paginadas
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  return (
    <div className="px-2 pt-0 pb-0 h-full overflow-hidden flex flex-col min-h-0">
      {/* Encabezado y periodo rápido */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm text-[var(--muted)]">
          Asistencia de <span className="text-[var(--text)] font-semibold">trabajadores</span>
        </h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" onClick={setToday}>Hoy</button>
          <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" onClick={setCurrentWeek}>Semana</button>
          <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" onClick={setCurrentMonth}>Mes</button>
        </div>
      </div>

      {/* KPIs arriba */}
      <div className="grid grid-cols-12 gap-3 mb-2">
        <div className="col-span-3">
          <Card title="Presentes" compact dense minH={50}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-[#55AB44]">26</div>
              <span className="px-2 py-0.5 rounded-full bg-[#eaf7ea] text-[#55AB44] text-[9px] font-semibold">+2</span>
            </div>
          </Card>
        </div>
        <div className="col-span-3">
          <Card title="Ausentes" compact dense minH={50}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-[#ef4444]">3</div>
              <span className="px-2 py-0.5 rounded-full bg-[#ffeaea] text-[#ef4444] text-[9px] font-semibold">-1</span>
            </div>
          </Card>
        </div>
        <div className="col-span-3">
          <Card title="Tardanzas" compact dense minH={50}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-[#f59e0b]">6</div>
              <span className="px-2 py-0.5 rounded-full bg-[#fff3e6] text-[#f59e0b] text-[9px] font-semibold">+1</span>
            </div>
          </Card>
        </div>
        <div className="col-span-3">
          <Card title="Horas trabajadas" compact dense minH={50}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-[#3b82f6]">212h</div>
              <span className="text-[10px] text-[var(--muted)]">Semana actual</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <Card title="Búsqueda y filtros" compact>
        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, área o rol"
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs bg-[var(--surface)] text-[var(--text)] w-30 sm:w-45"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs bg-[var(--surface)] text-[var(--text)] w-32 sm:w-34"
          >
            <option>Todos</option>
            <option>Presente</option>
            <option>Tarde</option>
            <option>Ausente</option>
            <option>Sin marcar</option>
            <option>Día libre</option>
          </select>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs bg-[var(--surface)] text-[var(--text)] w-32 sm:w-30"
          >
            <option value="">Rol</option>
            {ROLES_OPCIONES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs bg-[var(--surface)] text-[var(--text)] w-32 sm:w-36"
          >
            <option value="">Área</option>
            {AREAS_OPCIONES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs bg-[var(--surface)] text-[var(--text)] w-32 sm:w-36"
          >
            <option value="">Cargo</option>
            {CARGOS_OPCIONES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs bg-[var(--surface)] text-[var(--text)] w-36"
          />
          <span className="text-[var(--muted)] text-xs">a</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs bg-[var(--surface)] text-[var(--text)] w-36"
          />
        </div>
      </Card>

      {/* Estado de carga y errores */}
      {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
      {loading && <div className="text-xs text-[var(--muted)] mb-2">Cargando asistencia...</div>}

      {/* Tabla de asistencia */}
      <div className="min-h-0 flex-1">
      <Card
        title="Registro de asistencia"
        actionLabel={<CiRedo size={16} />}
        compact
        dense
        className="h-full"
        onAction={reload}
        actionButtonClassName={`w-7 h-7 flex items-center justify-center rounded-md border text-white transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700 hover:border-green-700'}`}
        actionButtonStyle={{ borderColor: '#55AB44', backgroundColor: '#55AB44' }}
      >
          {/* Contenedor scrollable para la tabla */}
          <div className="overflow-auto max-h-[50vh] min-h-[200px]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-[var(--text)] font-semibold text-xs">
                  <th className="sticky top-0 bg-[var(--surface)] z-10 text-left px-2 py-1 border-b">#</th>
                  <th className="sticky top-0 bg-[var(--surface)] z-10 text-left px-2 py-1 border-b">Trabajador</th>
                  <th className="sticky top-0 bg-[var(--surface)] z-10 text-left px-2 py-1 border-b">Estado</th>
                  <th className="sticky top-0 bg-[var(--surface)] z-10 text-left px-2 py-1 border-b">Fecha</th>
                  <th className="sticky top-0 bg-[var(--surface)] z-10 text-left px-2 py-1 border-b">Horario</th>
                  <th className="sticky top-0 bg-[var(--surface)] z-10 text-left px-2 py-1 border-b">Entrada</th>
                  <th className="sticky top-0 bg-[var(--surface)] z-10 text-left px-2 py-1 border-b">Salida</th>
                  <th className="sticky top-0 bg-[var(--surface)] z-10 text-left px-2 py-1 border-b">Observación</th>
                  <th className="sticky top-0 bg-[var(--surface)] z-10 text-left px-2 py-1 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={`${r.id || r.id_usuario || i}-${i}`}>
                    <td className="px-2 py-1 border-b">{r.id || r.id_usuario || '-'}</td>
                    <td className="px-2 py-1 border-b">{r.name}</td>
                    <td className="px-2 py-1 border-b"><StatusBadge status={r.status} /></td>
                    <td className="px-2 py-1 border-b">{r.date}</td>
                    <td className="px-2 py-1 border-b">{r.schedule_in && r.schedule_out ? `${r.schedule_in} - ${r.schedule_out}` : '-'}</td>
                    <td className="px-2 py-1 border-b">{r.in}</td>
                    <td className="px-2 py-1 border-b">{r.out}</td>
                    <td className="px-2 py-1 border-b text-[var(--muted)]">{r.note || '-'}</td>
                    <td className="px-2 py-1 border-b">
                      <button
                        className="p-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--muted)]/10 text-xs flex items-center gap-1"
                        onClick={() => setCalendarUser({ id: r.id_usuario, name: r.name })}
                      >
                        <CiCalendar size={16} className="text-[var(--text)]" />
                        Ver calendario
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginated.length === 0 && (
              <div className="text-center py-6 text-[var(--muted)] text-sm">No hay resultados</div>
            )}
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between px-3 py-2 mt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--muted)]">Página {page} de {totalPages} • {totalItems} registros</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--muted)]">Por página:</span>
                <select
                  className="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs"
                  value={pageSize}
                  onChange={(e) => { const val = Number(e.target.value); setPageSize(val); setPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >Anterior</button>
              <div className="flex items-center gap-1">
                {(() => {
                  const range = 2
                  const start = Math.max(1, page - range)
                  const end = Math.min(totalPages, page + range)
                  const pages = []
                  if (start > 1) pages.push(1)
                  if (start > 2) pages.push('...')
                  for (let p = start; p <= end; p++) pages.push(p)
                  if (end < totalPages - 1) pages.push('...')
                  if (end < totalPages) pages.push(totalPages)
                  return pages
                })().map((p, idx) => (
                  typeof p === 'number' ? (
                    <button
                      key={`p-${p}`}
                      className={`px-2.5 py-1 rounded-full border text-xs ${p === page ? 'bg-primary text-white' : 'bg-[var(--surface)] text-[var(--text)]'}`}
                      onClick={() => setPage(p)}
                    >{p}</button>
                  ) : (
                    <span key={`el-${idx}`} className="px-2 text-xs text-[var(--muted)]">...</span>
                  )
                ))}
              </div>
              <button
                className="px-3 py-1.5 rounded-full border bg-primary text-white text-xs disabled:opacity-50"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >Siguiente</button>
            </div>
          </div>
        </Card>
      </div>

      {calendarUser && <CalendarOverlay userId={calendarUser.id} name={calendarUser.name} onClose={() => setCalendarUser(null)} />}
    </div>
  )
}

export default AsistenciaPage