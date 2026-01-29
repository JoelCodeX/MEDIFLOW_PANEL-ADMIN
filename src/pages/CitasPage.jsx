import { useEffect, useMemo, useState } from 'react'
import Card from '@/components/Card'
import { fetchCitasList, crearCita } from '@/services/citas'
import { fetchUsuariosList } from '@/services/usuarios'
import { listarProfesionales } from '@/services/profesionales'

function CitasPage() {
  const [citas, setCitas] = useState([])
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')
  const [searchUsuario, setSearchUsuario] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ id_trabajador: '', id_profesional: '', tipo: 'psicologica', fecha_cita: '', observaciones: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [workerCitas, setWorkerCitas] = useState([])
  const [workerCitasLoading, setWorkerCitasLoading] = useState(false)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const data = await fetchUsuariosList({ page: 1, page_size: 500 })
        setUsuarios(data.items || [])
      } catch (e) { console.error('Error cargando usuarios para citas:', e) }
    }
    const loadProfesionales = async () => {
      try {
        const data = await listarProfesionales({ page: 1, page_size: 500 })
        setProfesionales(data.items || [])
      } catch (e) { console.error('Error cargando profesionales para citas:', e) }
    }
    loadUsuarios()
    loadProfesionales()
  }, [])

  useEffect(() => {
    const loadCitas = async () => {
      try {
        const data = await fetchCitasList({ page: 1, page_size: 50, estado, desde, hasta, sort: 'fecha_cita', order: 'desc' })
        setCitas(data.items || [])
      } catch (e) { console.error('Error cargando citas:', e) }
    }
    loadCitas()
  }, [estado, desde, hasta])

  const usersMap = useMemo(() => Object.fromEntries((usuarios || []).map(u => [u.id, u])), [usuarios])
  const profesionalesMap = useMemo(() => Object.fromEntries((profesionales || []).map(p => [p.id, p])), [profesionales])

  const filtered = useMemo(() => {
    const term = searchUsuario.toLowerCase()
    return citas.filter((c) => {
      const u = usersMap[c.id_trabajador]
      const matchesSearch = term ? (u?.nombre || '').toLowerCase().includes(term) || (u?.apellido || '').toLowerCase().includes(term) : true
      const matchesTipo = tipo ? c.tipo === tipo : true
      return matchesSearch && matchesTipo
    })
  }, [citas, searchUsuario, tipo, usersMap])

  // Totales y paginación similares a AsistenciaPage
  useEffect(() => {
    const total = filtered.length
    setTotalItems(total)
    const pages = Math.max(1, Math.ceil(total / pageSize))
    setTotalPages(pages)
    if (page > pages) setPage(pages)
  }, [filtered, pageSize])

  useEffect(() => { setPage(1) }, [searchUsuario, estado, tipo, desde, hasta])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function EstadoBadge({ estado }) {
    const map = {
      programada: { bg: '#e7f5ff', color: '#3b82f6', label: 'Programada' },
      completada: { bg: '#eaf7ea', color: '#55AB44', label: 'Completada' },
      cancelada: { bg: '#ffeaea', color: '#ef4444', label: 'Cancelada' },
    }
    const s = map[estado] || { bg: '#f3f4f6', color: '#6b7280', label: estado || '-' }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
        {s.label}
      </span>
    )
  }

  function DateBadge({ value }) {
    if (!value) return <span className="text-[var(--muted)] text-xs">-</span>
    const d = new Date(value)
    const label = d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1" style={{ backgroundColor: '#f4f6f8', color: 'var(--text)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        {label}
      </span>
    )
  }

  function TimeBadge({ value }) {
    if (!value) return <span className="text-[var(--muted)] text-xs">-</span>
    const d = new Date(value)
    const label = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1" style={{ backgroundColor: '#eef2ff', color: '#3b82f6' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        {label}
      </span>
    )
  }

  const openModal = () => { setForm({ id_trabajador: '', id_profesional: '', tipo: 'psicologica', fecha_cita: '', observaciones: '' }); setError(''); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setCreating(false); setError('') }

  const loadWorkerCitas = async (idTrabajador) => {
    if (!idTrabajador) { setWorkerCitas([]); return }
    setWorkerCitasLoading(true)
    try {
      const data = await fetchCitasList({ page: 1, page_size: 200, id_trabajador: idTrabajador, sort: 'fecha_cita', order: 'desc' })
      setWorkerCitas(data.items || [])
    } catch (e) {
      console.error('Error cargando citas del trabajador:', e)
      setWorkerCitas([])
    } finally {
      setWorkerCitasLoading(false)
    }
  }

  const submit = async () => {
    setCreating(true); setError('')
    try {
      if (!form.id_trabajador || !form.id_profesional || !form.fecha_cita) {
        setError('Trabajador, profesional y fecha son requeridos'); setCreating(false); return
      }
      // Validaciones: tipo duplicado y ventana 2 horas
      const tipoDuplicado = (workerCitas || []).some(c => (c.estado || 'programada') === 'programada' && c.tipo === form.tipo)
      if (tipoDuplicado) { setError('Ya existe una cita de este tipo para el trabajador'); setCreating(false); return }
      const sel = new Date(form.fecha_cita)
      const conflictos = (workerCitas || []).filter(c => {
        if (!c.fecha_cita) return false
        const fc = new Date(c.fecha_cita)
        const diffMin = Math.abs((fc.getTime() - sel.getTime()) / (1000 * 60))
        return diffMin < 120 && (c.estado || 'programada') === 'programada'
      })
      if (conflictos.length > 0) { setError('Conflicto de horario: se requieren al menos 2 horas entre citas'); setCreating(false); return }

      await crearCita({
        id_trabajador: Number(form.id_trabajador),
        id_profesional: Number(form.id_profesional),
        tipo: form.tipo,
        fecha_cita: form.fecha_cita,
        observaciones: form.observaciones,
        estado: 'programada',
      })
      closeModal()
      // Refrescar listado
      const data = await fetchCitasList({ page: 1, page_size: 50, estado, desde, hasta, sort: 'fecha_cita', order: 'desc' })
      setCitas(data.items || [])
    } catch (e) {
      setError(e.message || 'Error creando cita')
    } finally { setCreating(false) }
  }

  return (
    <div className="px-2 pt-0 pb-0 h-full overflow-hidden flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm text-[var(--muted)]">
          Gestión de <span className="text-[var(--text)] font-semibold">citas</span>
        </h1>
      </div>

      {/* Filtros */}
      <Card title="Búsqueda y filtros" compact>
        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
          <input
            type="text"
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-40 sm:w-56 bg-[var(--surface)] text-[var(--text)]"
            placeholder="Buscar por trabajador"
            value={searchUsuario}
            onChange={(e) => setSearchUsuario(e.target.value)}
          />
          <select className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-34 bg-[var(--surface)] text-[var(--text)]" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Estado</option>
            <option value="programada">Programada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-34 bg-[var(--surface)] text-[var(--text)]" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Tipo</option>
            <option value="medica">Médica</option>
            <option value="psicologica">Psicológica</option>
            <option value="ergonomica">Ergonómica</option>
          </select>
          <input type="date" className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-36 bg-[var(--surface)] text-[var(--text)]" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <span className="text-[var(--muted)] text-xs">a</span>
          <input type="date" className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-36 bg-[var(--surface)] text-[var(--text)]" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <button className="ml-auto px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" onClick={() => { setSearchUsuario(''); setEstado(''); setTipo(''); setDesde(''); setHasta('') }}>Limpiar</button>
          <button className="px-3 py-1.5 rounded-full border bg-primary text-white text-xs" onClick={openModal}>Nueva cita</button>
        </div>
      </Card>

      {/* Lista */}
      <Card title="Lista de citas" compact minH={280}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[var(--text)] font-semibold">
              <th className="text-left px-3 py-2 border-b">Trabajador</th>
              <th className="text-left px-3 py-2 border-b">Profesional</th>
              <th className="text-left px-3 py-2 border-b">Tipo</th>
              <th className="text-left px-3 py-2 border-b">Estado</th>
              <th className="text-left px-3 py-2 border-b">Fecha</th>
              <th className="text-left px-3 py-2 border-b">Hora</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((c) => {
              const trabajador = usersMap[c.id_trabajador]
              const profesional = profesionalesMap[c.id_profesional]
              return (
                <tr key={c.id}>
                  <td className="px-3 py-2 border-b">{trabajador ? `${trabajador.nombre} ${trabajador.apellido}` : `ID ${c.id_trabajador}`}</td>
                  <td className="px-3 py-2 border-b">{profesional ? `${profesional.nombre} ${profesional.apellido}` : `ID ${c.id_profesional}`}</td>
                  <td className="px-3 py-2 border-b">{c.tipo}</td>
                  <td className="px-3 py-2 border-b"><EstadoBadge estado={c.estado || 'programada'} /></td>
                  <td className="px-3 py-2 border-b"><DateBadge value={c.fecha_cita} /></td>
                  <td className="px-3 py-2 border-b"><TimeBadge value={c.fecha_cita} /></td>
                </tr>
              )
            })}
         </tbody>
       </table>
       {paginated.length === 0 && (
          <div className="text-center py-6 text-[var(--muted)] text-sm">Sin resultados</div>
       )}

       {/* Paginación */}
       <div className="flex items-center justify-between px-3 py-2 mt-2 border-t border-[var(--border)]">
         <div className="flex items-center gap-3">
           <span className="text-xs text-[var(--muted)]">Página {page} de {totalPages} • {totalItems} registros</span>
           <select
             className="border border-[var(--border)] rounded-full px-2.5 py-1 text-xs"
             value={pageSize}
             onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
           >
             <option value={10}>10</option>
             <option value={20}>20</option>
             <option value={50}>50</option>
           </select>
         </div>
         <div className="flex items-center gap-2">
           <button
             className="px-3 py-1.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-xs disabled:opacity-50"
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page <= 1}
           >Anterior</button>
           <div className="flex items-center gap-1">
             {(() => {
               const pages = []
               const max = totalPages
               const current = page
               const push = (v) => pages.push(v)
               const range = (a, b) => { for (let i = a; i <= b; i++) push(i) }
               if (max <= 7) {
                 range(1, max)
               } else {
                 push(1)
                 if (current > 4) push('...')
                 const start = Math.max(2, current - 1)
                 const end = Math.min(max - 1, current + 1)
                 range(start, end)
                 if (current < max - 3) push('...')
                 push(max)
               }
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

      {/* Modal: Nueva cita */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl w-full max-w-md overflow-hidden text-[var(--text)]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold">Nueva cita</h3>
              <button className="px-2 py-1 rounded-md border border-[var(--border)] text-[var(--text)]" onClick={closeModal}>Cerrar</button>
            </div>
            <div className="p-3 grid gap-2">
              <label className="text-sm">Trabajador
                <select className="border rounded-full px-2.5 py-1.5 text-xs w-full" value={form.id_trabajador} onChange={(e) => { const v = e.target.value; setForm({ ...form, id_trabajador: v }); loadWorkerCitas(v) }}>
                  <option value="">Selecciona un trabajador</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre} {u.apellido}{u.area ? ` · ${u.area}` : ''}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">Profesional
                <select className="border rounded-full px-2.5 py-1.5 text-xs w-full" value={form.id_profesional} onChange={(e) => setForm({ ...form, id_profesional: e.target.value })}>
                  <option value="">Selecciona un profesional</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}{p.especialidad ? ` · ${p.especialidad}` : ''}{p.area ? ` · ${p.area}` : ''}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">Tipo
                <select className="border rounded-full px-2.5 py-1.5 text-xs w-full" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="medica">Médica</option>
                  <option value="psicologica">Psicológica</option>
                  <option value="ergonomica">Ergonómica</option>
                </select>
              </label>
              {/* Validación: tipo duplicado */}
              {workerCitasLoading ? (
                <div className="text-xs text-[var(--muted)]">Cargando citas existentes...</div>
              ) : (
                (workerCitas || []).some(c => (c.estado || 'programada') === 'programada' && c.tipo === form.tipo) && (
                  <div className="text-xs text-red-600">Este trabajador ya tiene una cita de tipo "{form.tipo}" programada.</div>
                )
              )}
              <label className="text-sm">Fecha y hora
                <input type="datetime-local" className="border rounded-full px-2.5 py-1.5 text-xs w-full" value={form.fecha_cita} onChange={(e) => setForm({ ...form, fecha_cita: e.target.value })} />
              </label>
              {/* Validación: conflicto horario (<2h) */}
              {(() => {
                const sel = form.fecha_cita ? new Date(form.fecha_cita) : null
                if (!sel || workerCitasLoading) return null
                const conflictos = (workerCitas || []).filter(c => {
                  if (!c.fecha_cita) return false
                  const fc = new Date(c.fecha_cita)
                  const diffMin = Math.abs((fc.getTime() - sel.getTime()) / (1000 * 60))
                  return diffMin < 120 && (c.estado || 'programada') === 'programada'
                })
                return conflictos.length > 0 ? (
                  <div className="text-xs text-red-600">Conflicto de horario: se requieren al menos 2 horas entre citas.</div>
                ) : null
              })()}
              <label className="text-sm">Observaciones
                <textarea className="border border-[var(--border)] rounded-md px-2 py-1 w-full text-xs bg-[var(--surface)] text-[var(--text)]" rows={3} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
              </label>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" onClick={closeModal}>Cancelar</button>
                {(() => {
                  const tipoDuplicado = (workerCitas || []).some(c => (c.estado || 'programada') === 'programada' && c.tipo === form.tipo)
                  const sel = form.fecha_cita ? new Date(form.fecha_cita) : null
                  const conflictos = sel ? (workerCitas || []).filter(c => {
                    if (!c.fecha_cita) return false
                    const fc = new Date(c.fecha_cita)
                    const diffMin = Math.abs((fc.getTime() - sel.getTime()) / (1000 * 60))
                    return diffMin < 120 && (c.estado || 'programada') === 'programada'
                  }) : []
                  const disabled = creating || tipoDuplicado || conflictos.length > 0
                  return (
                    <button className="px-3 py-1.5 rounded-full border bg-primary text-white text-xs disabled:opacity-50" onClick={submit} disabled={disabled}>{creating ? 'Creando...' : (disabled ? 'Resolver validaciones' : 'Crear cita')}</button>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CitasPage