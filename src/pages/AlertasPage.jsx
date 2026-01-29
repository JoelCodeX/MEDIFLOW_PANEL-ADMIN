import { useMemo, useState, useEffect } from 'react'
import Card from '@/components/Card'
import { fetchAlertasList, syncAlertasDesdeEncuestas } from '@/services/alertas'
import { fetchUsuariosList } from '@/services/usuarios'
import { listarProfesionales } from '@/services/profesionales'
import { crearCita, fetchCitasList } from '@/services/citas'
import { CiCalendar, CiRedo } from 'react-icons/ci'
import { FiEye, FiMessageSquare, FiCheckCircle } from 'react-icons/fi'

// Limpieza: remover constantes y mocks no usados

function AlertasPage() {
  const [alertas, setAlertas] = useState([])
  const [search, setSearch] = useState('')
  const [nivel, setNivel] = useState('')
  const [estado, setEstado] = useState('')
  const [area, setArea] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const [detalle, setDetalle] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [profesionales, setProfesionales] = useState([])
  // profesionalesLoading removido por no uso

  // Sincronización de alertas desde encuestas
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // Modales de acción rápida
  const [showCitaModal, setShowCitaModal] = useState(false)
  const [citaUser, setCitaUser] = useState(null)
  const [citaForm, setCitaForm] = useState({ tipo: 'psicologica', fecha_cita: '', id_profesional: '', observaciones: '' })
  const [creatingCita, setCreatingCita] = useState(false)
  const [citaError, setCitaError] = useState('')
  const [workerCitas, setWorkerCitas] = useState([])
  const [workerCitasLoading, setWorkerCitasLoading] = useState(false)

  // Flujo de creación de alerta manual removido; las alertas se generan automáticamente

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const data = await fetchUsuariosList({ page: 1, page_size: 500 })
        setUsuarios(data.items || [])
      } catch (e) { console.error('Error cargando usuarios para alertas:', e) }
    }
    const loadProfesionales = async () => {
      try {
        const data = await listarProfesionales({ page: 1, page_size: 500, sort: 'fecha_creacion', order: 'desc' })
        setProfesionales(data.items || [])
      } catch (e) { console.error('Error cargando profesionales:', e) }
    }
    loadUsuarios()
    loadProfesionales()
  }, [])

  const handleSyncAlertas = async () => {
    // Sincroniza el día actual para persistencia si es necesario
    const hoy = new Date().toISOString().slice(0, 10)
    setSyncLoading(true); setSyncMessage('')
    try {
      const res = await syncAlertasDesdeEncuestas({ fecha: hoy })
      setSyncMessage(`Actualizado: ${res.created} nuevas, ${res.updated} actualizadas`)
      const data = await fetchAlertasList({ page: 1, page_size: 50, q: search, nivel, estado, desde: fechaDesde, hasta: fechaHasta, sort: 'fecha_creacion', order: 'desc' })
      setAlertas(data.items || [])
    } catch (e) {
      setSyncMessage(e.message || 'Error al actualizar')
    } finally {
      setSyncLoading(false)
    }
  }

  useEffect(() => {
    const loadAlertas = async () => {
      try {
        const data = await fetchAlertasList({ page: 1, page_size: 50, q: search, nivel, estado, desde: fechaDesde, hasta: fechaHasta, sort: 'fecha_creacion', order: 'desc' })
        setAlertas(data.items || [])
      } catch (e) { console.error('Error cargando alertas:', e) }
    }
    loadAlertas()
  }, [search, nivel, estado, fechaDesde, fechaHasta])

  const usersMap = useMemo(() => Object.fromEntries((usuarios || []).map(u => [u.id, u])), [usuarios])
  const areas = useMemo(() => Array.from(new Set((usuarios || []).map((u) => u.area).filter(Boolean))), [usuarios])

  const filtered = useMemo(() => {
    return alertas.filter((a) => {
      const usuario = usersMap[a.id_usuario]
      const term = search.toLowerCase()
      const matchesSearch = term
        ? (usuario?.nombre || '').toLowerCase().includes(term) || a.tipo.toLowerCase().includes(term) || (a.descripcion || '').toLowerCase().includes(term)
        : true
      const matchesNivel = nivel ? a.nivel === nivel : true
      const matchesEstado = estado ? a.estado === estado : true
      const matchesArea = area ? usuario?.area === area : true
      const createdDate = new Date(a.fecha_creacion)
      const matchesDesde = fechaDesde ? createdDate >= new Date(fechaDesde) : true
      const matchesHasta = fechaHasta ? createdDate <= new Date(fechaHasta) : true
      return matchesSearch && matchesNivel && matchesEstado && matchesArea && matchesDesde && matchesHasta
    })
  }, [alertas, search, nivel, estado, area, fechaDesde, fechaHasta, usersMap])

  const handleAtender = (alertaId, observacion) => {
    setAlertas((prev) =>
      prev.map((a) =>
        a.id === alertaId
          ? {
              ...a,
              estado: 'atendida',
              observacion: observacion || a.observacion,
              fecha_atencion: new Date().toISOString(),
              id_responsable: 999,
            }
          : a
      )
    )
    console.log('Notificación enviada al usuario por cambio de estado de alerta', alertaId)
  }

  const handleEstado = (alertaId, nuevoEstado) => {
    setAlertas((prev) => prev.map((a) => (a.id === alertaId ? { ...a, estado: nuevoEstado } : a)))
  }

  // Funciones de exportación CSV/PDF removidas por no uso

  const areaHeat = useMemo(() => {
    const counts = {}
    for (const a of alertas) {
      if (a.estado !== 'atendida') {
        const area = usersMap[a.id_usuario]?.area || 'N/A'
        counts[area] = (counts[area] || 0) + 1
      }
    }
    const max = Math.max(1, ...Object.values(counts))
    return Object.entries(counts).map(([ar, cnt]) => ({ area: ar, count: cnt, intensity: cnt / max }))
  }, [alertas, usersMap])

  const loadCitasDeTrabajador = async (id) => {
    setWorkerCitasLoading(true)
    try {
      const data = await fetchCitasList({ page: 1, page_size: 200, id_trabajador: id, sort: 'fecha_cita', order: 'desc' })
      setWorkerCitas(data.items || [])
    } catch (e) {
      console.error('Error cargando citas del trabajador:', e)
      setWorkerCitas([])
    } finally {
      setWorkerCitasLoading(false)
    }
  }

  const handleOpenCita = (userId) => {
    setCitaUser(userId)
    setCitaForm({ tipo: 'psicologica', fecha_cita: '', id_profesional: '', observaciones: '' })
    setShowCitaModal(true)
    loadCitasDeTrabajador(userId)
  }

  const submitCita = async () => {
    setCreatingCita(true); setCitaError('')
    try {
      if (!citaForm.fecha_cita || !citaForm.id_profesional) {
        setCitaError('Fecha y profesional son requeridos'); setCreatingCita(false); return
      }
      // Validaciones: tipo duplicado y conflicto horario (< 2 horas)
      const tipoDuplicado = (workerCitas || []).some(c => (c.estado || 'programada') === 'programada' && c.tipo === citaForm.tipo)
      if (tipoDuplicado) {
        setCitaError('Ya existe una cita de este tipo para el trabajador')
        setCreatingCita(false); return
      }
      const sel = new Date(citaForm.fecha_cita)
      const conflictosTiempo = (workerCitas || []).filter(c => {
        if (!c.fecha_cita) return false
        const fc = new Date(c.fecha_cita)
        const diffMin = Math.abs((fc.getTime() - sel.getTime()) / (1000 * 60))
        return diffMin < 120 && (c.estado || 'programada') === 'programada'
      })
      if (conflictosTiempo.length > 0) {
        setCitaError('Conflicto de horario: se requieren al menos 2 horas entre citas')
        setCreatingCita(false); return
      }
      await crearCita({
        id_trabajador: citaUser,
        id_profesional: Number(citaForm.id_profesional),
        tipo: citaForm.tipo,
        fecha_cita: citaForm.fecha_cita,
        observaciones: citaForm.observaciones,
        estado: 'programada',
      })
      setShowCitaModal(false)
    } catch (e) {
      setCitaError(e.message || 'Error creando cita')
    } finally {
      setCreatingCita(false)
    }
  }

  const handleEnviarMensaje = (userId) => {
    // Placeholder para futura implementación de mensajería directa
    console.log('Enviar mensaje directo a usuario', userId)
    alert('Función de enviar mensaje directo se implementará próximamente.')
  }

  function RiskBadge({ riesgo }) {
    const map = {
      alto: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300',
      moderado: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    }
    const className = map[riesgo] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${className}`}>
        {riesgo === 'alto' ? 'Alto' : riesgo === 'moderado' ? 'Moderado' : riesgo}
      </span>
    )
  }

  function EstadoBadge({ estado }) {
    const map = {
      pendiente: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
      en_proceso: 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
      atendida: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
    }
    const className = map[estado] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
    const labelMap = { pendiente: 'Pendiente', en_proceso: 'En proceso', atendida: 'Atendida' }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${className}`}>
        {labelMap[estado] || estado}
      </span>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm text-[var(--muted)]">
          Alertas de <span className="text-[var(--text)] font-semibold">trabajadores</span>
        </h1>
      </div>
      {syncMessage && (
        <div className="text-xs text-[var(--muted)]">{syncMessage}</div>
      )}

      {/* Tarjeta de sincronización removida: ahora hay un botón pequeño de actualizar en el header */}

      {/* Filtro avanzado */}
      <Card title="Búsqueda y filtros" compact>
        <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
          <input
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-40 sm:w-64"
            placeholder="Buscar por usuario, tipo o descripción"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-28" value={nivel} onChange={(e) => setNivel(e.target.value)}>
            <option value="">Riesgo</option>
            <option value="moderado">Moderado</option>
            <option value="alto">Alto</option>
          </select>
          <select className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-32" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="atendida">Atendida</option>
          </select>
          <select className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-36" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Área</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input type="date" className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-36" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          <input type="date" className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-36" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          <button className="ml-auto px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs hover:bg-[var(--border)] transition-colors" onClick={() => { setSearch(''); setNivel(''); setEstado(''); setArea(''); setFechaDesde(''); setFechaHasta('') }}>Limpiar</button>
        </div>
      </Card>

      {/* Lista de alertas */}
      <Card title="Lista de alertas" compact minH={280}>
        <div className="relative">
          <button
            className={`absolute top-2 right-2 w-8 h-8 rounded-md border text-white flex items-center justify-center transition-colors ${syncLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700 hover:border-green-700'}`}
            onClick={handleSyncAlertas}
            disabled={syncLoading}
            title="Actualizar"
            style={{ backgroundColor: '#55AB44', border: '1px solid #55AB44' }}
            aria-label="Actualizar"
          >
            <CiRedo size={16} />
          </button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[var(--text)] font-semibold text-xs">
              <th className="text-left px-3 py-2 border-b border-[var(--border)]">Usuario</th>
              <th className="text-left px-3 py-2 border-b border-[var(--border)]">Área</th>
              <th className="text-left px-3 py-2 border-b border-[var(--border)]">Tipo</th>
              <th className="text-left px-3 py-2 border-b border-[var(--border)]">Riesgo</th>
              <th className="text-left px-3 py-2 border-b border-[var(--border)]">Estado</th>
              <th className="text-left px-3 py-2 border-b border-[var(--border)]">Fecha</th>
              <th className="text-left px-3 py-2 border-b border-[var(--border)]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const u = usersMap[a.id_usuario]
              return (
                <tr key={a.id}>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-xs">{u ? `${u.nombre} ${u.apellido}` : `ID ${a.id_usuario}`}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-xs">{u?.area || 'N/A'}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-xs">{a.tipo}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-xs"><RiskBadge riesgo={a.nivel} /></td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-xs"><EstadoBadge estado={a.estado} /></td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-xs">{a.fecha_creacion}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-white hover:bg-[#3b82f6] hover:border-[#3b82f6] transition-colors"
                        onClick={() => setDetalle(a)}
                        title="Ver detalle"
                        aria-label="Ver detalle"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-white hover:bg-[#55AB44] hover:border-[#55AB44] transition-colors"
                        onClick={() => handleOpenCita(a.id_usuario)}
                        title="Programar cita"
                        aria-label="Programar cita"
                      >
                        <CiCalendar size={16} />
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-white hover:bg-amber-500 hover:border-amber-500 transition-colors"
                        onClick={() => handleEnviarMensaje(a.id_usuario)}
                        title="Enviar mensaje"
                        aria-label="Enviar mensaje"
                      >
                        <FiMessageSquare size={16} />
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-white hover:bg-[#55AB44] hover:border-[#55AB44] transition-colors"
                        onClick={() => handleAtender(a.id, a.observacion)}
                        title="Marcar atendida"
                        aria-label="Marcar atendida"
                      >
                        <FiCheckCircle size={16} />
                      </button>
                      <select className="border border-[var(--border)] rounded-full px-2 py-1 text-xs bg-[var(--surface)] text-[var(--text)]" value={a.estado} onChange={(e) => handleEstado(a.id, e.target.value)}>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="atendida">Atendida</option>
                      </select>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-6 text-[var(--muted)] text-sm">Sin resultados</div>
        )}
      </Card>

      {/* Modal de detalle */}
      {detalle && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl w-full max-w-2xl overflow-hidden text-[var(--text)]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold">Detalle de alerta</h3>
              <button className="px-2 py-1 rounded-md border border-[var(--border)] hover:bg-[var(--muted)]/10" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
            <div className="p-3">
              <p><span className="text-[var(--muted)]">Usuario:</span> {usersMap[detalle.id_usuario]?.nombre || `ID ${detalle.id_usuario}`}</p>
              <p><span className="text-[var(--muted)]">Tipo:</span> {detalle.tipo}</p>
              <p><span className="text-[var(--muted)]">Nivel:</span> {detalle.nivel}</p>
              <p><span className="text-[var(--muted)]">Estado:</span> {detalle.estado}</p>
              <p><span className="text-[var(--muted)]">Fecha creación:</span> {detalle.fecha_creacion}</p>
              <p><span className="text-[var(--muted)]">Descripción:</span> {detalle.descripcion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap simple */}
      <Card title="Mapa de calor por área" compact>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {areaHeat.map((x) => (
            <div key={x.area} className="p-2 rounded-md border border-[var(--border)]" style={{ background: `rgba(59, 130, 246, ${x.intensity * 0.2})` }}>
              <p className="m-0 text-sm font-medium">{x.area}</p>
              <p className="m-0 text-xs text-[var(--muted)]">{x.count} alertas activas</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal: Generar Cita */}
      {showCitaModal && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl w-full max-w-md overflow-hidden text-[var(--text)]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold">Generar cita</h3>
              <button className="px-2 py-1 rounded-md border border-[var(--border)] hover:bg-[var(--muted)]/10" onClick={() => setShowCitaModal(false)}>Cerrar</button>
            </div>
            <div className="p-3 grid gap-2">
              <label className="text-sm">Tipo
                <select className="border border-[var(--border)] rounded-md px-2 py-1 w-full bg-[var(--surface)] text-[var(--text)]" value={citaForm.tipo} onChange={(e) => setCitaForm({ ...citaForm, tipo: e.target.value })}>
                  <option value="medica">Médica</option>
                  <option value="psicologica">Psicológica</option>
                  <option value="ergonomica">Ergonómica</option>
                </select>
              </label>
              {/* Validación: ya existe una cita del mismo tipo */}
              {workerCitasLoading ? (
                <div className="text-xs text-[var(--muted)]">Cargando citas existentes...</div>
              ) : (
                (workerCitas || []).some(c => (c.estado || 'programada') === 'programada' && c.tipo === citaForm.tipo) && (
                  <div className="text-xs text-red-600">Este trabajador ya tiene una cita de tipo "{citaForm.tipo}" programada.</div>
                )
              )}
              <label className="text-sm">Fecha y hora
                <input type="datetime-local" className="border rounded-md px-2 py-1 w-full" value={citaForm.fecha_cita} onChange={(e) => setCitaForm({ ...citaForm, fecha_cita: e.target.value })} />
              </label>
              {/* Validación: conflicto horario (< 2 horas) */}
              {(() => {
                const sel = citaForm.fecha_cita ? new Date(citaForm.fecha_cita) : null
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
              <label className="text-sm">Profesional
                <select className="border rounded-md px-2 py-1 w-full" value={citaForm.id_profesional} onChange={(e) => setCitaForm({ ...citaForm, id_profesional: e.target.value })}>
                  <option value="">Selecciona un profesional</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}{p.especialidad ? ` · ${p.especialidad}` : ''}{p.area ? ` · ${p.area}` : ''}
                    </option>
                  ))}
                </select>
                {/* Indicador de carga removido: profesionalesLoading ya no existe */}
              </label>
              <label className="text-sm">Observaciones
                <textarea className="border rounded-md px-2 py-1 w-full" rows={3} value={citaForm.observaciones} onChange={(e) => setCitaForm({ ...citaForm, observaciones: e.target.value })} />
              </label>
              {citaError && <div className="text-sm text-red-600">{citaError}</div>}
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1 rounded-md border" onClick={() => setShowCitaModal(false)}>Cancelar</button>
                {(() => {
                  const tipoDuplicado = (workerCitas || []).some(c => (c.estado || 'programada') === 'programada' && c.tipo === citaForm.tipo)
                  const sel = citaForm.fecha_cita ? new Date(citaForm.fecha_cita) : null
                  const conflictos = sel ? (workerCitas || []).filter(c => {
                    if (!c.fecha_cita) return false
                    const fc = new Date(c.fecha_cita)
                    const diffMin = Math.abs((fc.getTime() - sel.getTime()) / (1000 * 60))
                    return diffMin < 120 && (c.estado || 'programada') === 'programada'
                  }) : []
                  const disabled = creatingCita || tipoDuplicado || conflictos.length > 0
                  return (
                    <button className="px-3 py-1 rounded-md border bg-primary/10" onClick={submitCita} disabled={disabled}>
                      {creatingCita ? 'Creando...' : (disabled ? 'Resolver validaciones' : 'Crear cita')}
                    </button>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear alerta eliminado para flujo automático desde encuestas */}
    </div>
  )
}

export default AlertasPage