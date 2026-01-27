import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '@/components/Card'
import { FiEye, FiEdit2, FiTrash2, FiBell } from 'react-icons/fi'
import { listarContenidos, crearContenido, editarContenido, eliminarContenido, resumenInteraccionPorContenido, uploadContenido } from '@/services/contenidos'

function BienestarPage() {
  // Estado cargado desde backend
  const [recursos, setRecursos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ nuevoTitulo: '', archivo: '', nuevoTipo: '' })
  const [agregando, setAgregando] = useState(false)

  const [nuevo, setNuevo] = useState({ titulo: '', tipo: 'video', url_archivo: '', categoria: '' })
  const [archivo, setArchivo] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [edicion, setEdicion] = useState({ titulo: '', tipo: 'video', url_archivo: '', categoria: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [pageList, setPageList] = useState(1)
  const [pageSizeList, setPageSizeList] = useState(10)
  const totalItemsList = recursos.length
  const totalPagesList = useMemo(() => Math.max(1, Math.ceil(totalItemsList / pageSizeList)), [totalItemsList, pageSizeList])
  const recursosPaginados = useMemo(() => {
    const start = (pageList - 1) * pageSizeList
    return recursos.slice(start, start + pageSizeList)
  }, [recursos, pageList])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const handleAgregar = async (e) => {
    e.preventDefault()
    try {
      // Si hay archivo, usar endpoint de subida (crea contenido si viene título)
      if (archivo) {
        // Validar título para evitar subir a Storage sin crear contenido visible
        if (!nuevo.titulo || !nuevo.titulo.trim()) {
          setFieldErrors(s => ({ ...s, nuevoTitulo: 'El título es obligatorio', archivo: 'El título es obligatorio para subir archivo' }))
          return false
        }
        if (!nuevo.tipo) {
          setFieldErrors(s => ({ ...s, nuevoTipo: 'Selecciona un tipo de contenido' }))
          return false
        }
        setAgregando(true)
        const fd = new FormData()
        fd.append('file', archivo)
        // Mapear tipos UI a tipos backend (enum): imagen/audio -> documento
        const tipoBackend = nuevo.tipo
        fd.append('tipo', tipoBackend)
        if (nuevo.titulo) fd.append('titulo', nuevo.titulo)
        if (nuevo.categoria) fd.append('descripcion', nuevo.categoria)
        // Opcional: carpeta base
        // fd.append('folder', 'contenidos')
        try {
          const res = await uploadContenido(fd)
          // Si el backend creó el contenido, refrescar
          setNuevo({ titulo: '', tipo: 'video', url_archivo: '', categoria: '' })
          setArchivo(null)
          setFieldErrors({ nuevoTitulo: '', archivo: '', nuevoTipo: '' })
          await cargarRecursos()
          setToast('Archivo subido correctamente')
          return true
        } finally {
          setAgregando(false)
        }
      }
      // Sin archivo: crear contenido con URL manual
      if (!nuevo.titulo || !nuevo.tipo) {
        if (!nuevo.titulo || !nuevo.titulo.trim()) {
          setFieldErrors(s => ({ ...s, nuevoTitulo: 'El título es obligatorio' }))
        }
        if (!nuevo.tipo) {
          setFieldErrors(s => ({ ...s, nuevoTipo: 'Selecciona un tipo de contenido' }))
        }
        return false
      }
      // Mapear tipos UI a tipos backend
      setAgregando(true)
      const tipoBackend = (nuevo.tipo === 'imagen' || nuevo.tipo === 'audio') ? 'documento' : nuevo.tipo
      try {
        await crearContenido({
          titulo: nuevo.titulo,
          tipo: tipoBackend,
          url_archivo: nuevo.url_archivo || undefined,
          descripcion: nuevo.categoria || undefined,
        })
        setNuevo({ titulo: '', tipo: 'video', url_archivo: '', categoria: '' })
        setFieldErrors({ nuevoTitulo: '', archivo: '', nuevoTipo: '' })
        await cargarRecursos()
        setToast('Recurso creado correctamente')
        return true
      } finally {
        setAgregando(false)
      }
    } catch (err) {
      setError(err.message || 'Error al crear/subir contenido')
      return false
    }
  }

  const iniciarEdicion = (r) => {
    setEditandoId(r.id)
    setEdicion({ titulo: r.titulo, tipo: r.tipo, url_archivo: r.url_archivo, categoria: r.descripcion || '' })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setEdicion({ titulo: '', tipo: 'video', url_archivo: '', categoria: '' })
  }

  const guardarEdicion = async (id) => {
    try {
      const tipoBackend = edicion.tipo
      await editarContenido(id, { titulo: edicion.titulo, tipo: tipoBackend, url_archivo: edicion.url_archivo, descripcion: edicion.categoria })
      cancelarEdicion()
      await cargarRecursos()
    } catch (err) {
      setError(err.message || 'Error al actualizar contenido')
    }
  }

  const eliminarRecurso = async (id) => {
    if (!confirm('¿Eliminar este recurso?')) return
    try {
      await eliminarContenido(id)
      await cargarRecursos()
    } catch (err) {
      setError(err.message || 'Error al eliminar contenido')
    }
  }

  const notificarRecurso = (r) => {
    // Simula envío de notificación (tabla notificaciones)
    alert(`Notificación enviada: "${r.titulo}" para destino: todos`)
  }

  const notificarTodos = () => {
    alert('Notificación enviada para todos los recursos nuevos')
  }

  // Las interacciones serán registradas por la app móvil; aquí solo se visualizan

  const totalVistos = useMemo(() => recursos.reduce((acc, r) => acc + (r.interaccion?.visto || 0), 0), [recursos])
  const totalDescargas = useMemo(() => recursos.reduce((acc, r) => acc + (r.interaccion?.descargado || 0), 0), [recursos])
  const totalCompletados = useMemo(() => recursos.reduce((acc, r) => acc + (r.interaccion?.completado || 0), 0), [recursos])

  async function cargarRecursos() {
    setCargando(true)
    setError('')
    try {
      const data = await listarContenidos()
      const items = data.items || []
      const withResumen = await Promise.all(items.map(async (c) => {
        try {
          const r = await resumenInteraccionPorContenido(c.id)
          return { ...c, interaccion: r.interacciones || { visto: 0, descargado: 0, completado: 0 } }
        } catch {
          return { ...c, interaccion: { visto: 0, descargado: 0, completado: 0 } }
        }
      }))
      setRecursos(withResumen)
      setPageList(1)
    } catch (err) {
      setError(err.message || 'Error al cargar contenidos')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarRecursos()
  }, [])

  const iconSrcForTipo = (tipo) => {
    const t = String(tipo || '').toLowerCase()
    switch (t) {
      case 'video': return '/video.png'
      case 'imagen': return '/imagen.png'
      case 'audio': return '/audio.png'
      case 'pdf': return '/pdf.png'
      case 'documento': return '/documento.png'
      case 'tip': return '/tip.png'
      default: return '/documento.png'
    }
  }

  const cardBgStyleForTipo = (tipo) => {
    const t = String(tipo || '').toLowerCase()
    const palettes = {
      video: { start: '#e0f2fe', end: '#bfdbfe', b1: '#dbeafe', b2: '#93c5fd' }, // azules
      imagen: { start: '#f5d0fe', end: '#fbcfe8', b1: '#fce7f3', b2: '#f0abfc' }, // lila/rosa
      audio: { start: '#fef3c7', end: '#fde68a', b1: '#fef9c3', b2: '#f59e0b' }, // amarillos
      pdf: { start: '#fee2e2', end: '#fecaca', b1: '#fecaca', b2: '#ef4444' }, // rojos
      documento: { start: '#f1f5f9', end: '#e2e8f0', b1: '#e5e7eb', b2: '#94a3b8' }, // grises
      tip: { start: '#dcfce7', end: '#bbf7d0', b1: '#d1fae5', b2: '#10b981' }, // verdes
      default: { start: '#f1f5f9', end: '#e2e8f0', b1: '#e5e7eb', b2: '#94a3b8' },
    }
    const { start, end, b1, b2 } = palettes[t] || palettes.default
    return {
      backgroundImage: `radial-gradient(24px 24px at 20% 30%, ${b1} 0%, transparent 60%), radial-gradient(32px 32px at 80% 70%, ${b2} 0%, transparent 60%), linear-gradient(135deg, ${start}, ${end})`,
      backgroundRepeat: 'no-repeat',
    }
  }

  return (
    <div className="grid gap-4">
      {toast && (
        <div className="fixed top-3 right-3 z-50 px-3 py-2 rounded-md border border-green-200 bg-green-50 text-green-700 text-xs shadow">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm text-[var(--muted)]">
          Bienestar <span className="text-[var(--text)] font-semibold">contenidos</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs hover:bg-[#55AB44] hover:border-[#55AB44] hover:text-white transition-colors"
            onClick={() => setShowAddModal(true)}
            title="Agregar recurso"
            aria-label="Agregar recurso"
          >
            Agregar recurso
          </button>
          <Link
            to="/bienestar/interaccion"
            className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs hover:bg-[#3b82f6] hover:border-[#3b82f6] hover:text-white transition-colors"
            title="Ver interacción"
            aria-label="Ver interacción"
          >
            Ver interacción
          </Link>
          <button
            className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs hover:bg-[#55AB44] hover:border-[#55AB44] hover:text-white transition-colors"
            onClick={notificarTodos}
            title="Notificar nuevo contenido"
            aria-label="Notificar nuevo contenido"
          >
            Notificar nuevo contenido
          </button>
        </div>
      </div>

      {/* Visualización de interacción (resumen) */}
      <Card title="Resumen de interacción" compact>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-[var(--border)] p-2">
            <p className="m-0 text-xs text-[var(--muted)]">Vistos</p>
            <p className="text-xl font-semibold text-[#3b82f6]">{totalVistos}</p>
          </div>
          <div className="rounded-md border border-[var(--border)] p-2">
            <p className="m-0 text-xs text-[var(--muted)]">Descargas</p>
            <p className="text-xl font-semibold text-[#3b82f6]">{totalDescargas}</p>
          </div>
          <div className="rounded-md border border-[var(--border)] p-2">
            <p className="m-0 text-xs text-[var(--muted)]">Completados</p>
            <p className="text-xl font-semibold text-[#3b82f6]">{totalCompletados}</p>
          </div>
        </div>
       </Card>
      

      {/* Listado de recursos */}
      <Card title="Listado de recursos" compact>
        {/* Contenedor scrollable para el listado */}
        <div className="overflow-auto max-h-[50vh] min-h-[200px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {recursosPaginados.map((r) => (
            <div key={r.id} className="rounded-md border border-[var(--border)] p-2 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-transform" style={cardBgStyleForTipo(r.tipo)}>
              {editandoId === r.id ? (
                <div className="grid gap-2">
                  <input className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs" placeholder="Título" value={edicion.titulo} onChange={e => setEdicion(s => ({ ...s, titulo: e.target.value }))} />
                  <select className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs" value={edicion.tipo} onChange={e => setEdicion(s => ({ ...s, tipo: e.target.value }))}>
                    <option value="video">Video</option>
                    <option value="imagen">Imagen</option>
                    <option value="audio">Audio</option>
                    <option value="pdf">PDF</option>
                    <option value="documento">Documento</option>
                    <option value="tip">Tip</option>
                  </select>
                  {edicion.tipo !== 'tip' ? (
                    <>
                      <input className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs" placeholder="URL del archivo" value={edicion.url_archivo} onChange={e => setEdicion(s => ({ ...s, url_archivo: e.target.value }))} />
                      <input className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs" placeholder="Categoría/Descripción" value={edicion.categoria} onChange={e => setEdicion(s => ({ ...s, categoria: e.target.value }))} />
                    </>
                  ) : (
                    <div className="grid gap-1">
                      <label className="text-[11px] text-[var(--muted)]">Texto del tip</label>
                      <textarea
                        className="border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs min-h-[100px]"
                        placeholder="Escribe el tip aquí"
                        value={edicion.categoria}
                        onChange={e => setEdicion(s => ({ ...s, categoria: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs" onClick={cancelarEdicion}>Cancelar</button>
                    <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs hover:bg-[#55AB44] hover:border-[#55AB44] hover:text-white transition-colors" onClick={() => guardarEdicion(r.id)}>Guardar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  {/* Columna izquierda: información y acciones */}
                  <div className="grid gap-1 flex-1 min-w-0">
                    <p className="m-0 font-semibold text-sm truncate" title={r.titulo}>{r.titulo}</p>
                    <p className="m-0 text-[12px] text-[var(--muted)]">Tipo: {String(r.tipo || '').toUpperCase()} • Fecha: {r.fecha_publicacion?.slice(0,10) || '-'}</p>
                    <div className="flex items-center gap-2 text-[12px] mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#eef2ff] text-[#3b82f6]">Vistos: {r.interaccion.visto}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#fff7ed] text-[#f59e0b]">Descargas: {r.interaccion.descargado}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#10b981]">Completados: {r.interaccion.completado}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <a
                        href={r.url_archivo}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border)] bg-white text-gray-600 hover:text-white hover:bg-[#3b82f6] hover:border-[#3b82f6] transition-colors"
                        title="Ver"
                        aria-label="Ver"
                      >
                        <FiEye size={16} />
                      </a>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border)] bg-white text-gray-600 hover:text-white hover:bg-amber-500 hover:border-amber-500 transition-colors"
                        onClick={() => iniciarEdicion(r)}
                        title="Editar"
                        aria-label="Editar"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border)] bg-white text-gray-600 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors"
                        onClick={() => eliminarRecurso(r.id)}
                        title="Eliminar"
                        aria-label="Eliminar"
                      >
                        <FiTrash2 size={16} />
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border)] bg-white text-gray-600 hover:text-white hover:bg-[#55AB44] hover:border-[#55AB44] transition-colors"
                        onClick={() => notificarRecurso(r)}
                        title="Notificar"
                        aria-label="Notificar"
                      >
                        <FiBell size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Columna derecha: imagen del tipo */}
                  <div className="shrink-0 self-center">
                    <img
                      src={iconSrcForTipo(r.tipo)}
                      alt={`Tipo ${r.tipo || ''}`}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-md border border-[var(--border)] bg-white object-contain opacity-90"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          {recursosPaginados.length === 0 && (
            <div className="text-center py-6 text-[var(--muted)] text-sm">No hay resultados</div>
          )}
        </div>
        </div>
        {/* Paginación al final, igual a PersonalPage */}
        <div className="flex items-center justify-between px-3 py-2 mt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">Página {pageList} de {totalPagesList} • {totalItemsList} registros</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--muted)]">Por página:</span>
              <select
                className="px-2 py-1 rounded-full border text-xs"
                value={pageSizeList}
                onChange={(e) => { const val = Number(e.target.value); setPageSizeList(val); setPageList(1); }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-full border text-xs"
              onClick={() => setPageList(p => Math.max(1, p - 1))}
              disabled={pageList <= 1}
            >Anterior</button>
            <div className="flex items-center gap-1">
              {(() => {
                const range = 2
                const start = Math.max(1, pageList - range)
                const end = Math.min(totalPagesList, pageList + range)
                const pages = []
                if (start > 1) pages.push(1)
                if (start > 2) pages.push('...')
                for (let p = start; p <= end; p++) pages.push(p)
                if (end < totalPagesList - 1) pages.push('...')
                if (end < totalPagesList) pages.push(totalPagesList)
                return pages
              })().map((p, idx) => (
                typeof p === 'number' ? (
                  <button
                    key={`p-${p}`}
                    className={`px-2.5 py-1 rounded-full border text-xs ${p === pageList ? 'bg-primary text-white' : 'bg-white'}`}
                    onClick={() => setPageList(p)}
                  >{p}</button>
                ) : (
                  <span key={`el-${idx}`} className="px-2 text-xs text-[var(--muted)]">...</span>
                )
              ))}
            </div>
            <button
              className="px-3 py-1.5 rounded-full border bg-primary text-white text-xs disabled:opacity-50"
              onClick={() => setPageList(p => Math.min(totalPagesList, p + 1))}
              disabled={pageList >= totalPagesList}
            >Siguiente</button>
          </div>
        </div>
      </Card>

      {/* Modal: Subir nuevo recurso */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <div className="bg-white rounded-xl border border-[var(--border)] shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold">Subir nuevo recurso</h3>
              <button className="px-2 py-1 rounded-md border" onClick={() => setShowAddModal(false)}>Cerrar</button>
            </div>
            <div className="p-3">
              <form
                className="grid grid-cols-4 gap-2"
                onSubmit={async (e) => {
                  const ok = await handleAgregar(e)
                  if (ok) setShowAddModal(false)
                }}
              >
                {agregando && (
                  <div className="col-span-4 flex items-center gap-2 text-[12px] text-[var(--muted)]">
                    <span className="inline-block w-4 h-4 border-2 border-[#55AB44] border-t-transparent rounded-full animate-spin" />
                    <span>Agregando recurso...</span>
                  </div>
                )}
                <input
                  className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs col-span-4"
                  placeholder="Título"
                  value={nuevo.titulo}
                  disabled={agregando}
                  onChange={e => {
                    const val = e.target.value
                    setNuevo(s => ({ ...s, titulo: val }))
                    if (fieldErrors.nuevoTitulo) {
                      setFieldErrors(s => ({ ...s, nuevoTitulo: val.trim() ? '' : s.nuevoTitulo }))
                    }
                  }}
                />
                {fieldErrors.nuevoTitulo && (
                  <p className="col-span-4 text-xs text-red-600">{fieldErrors.nuevoTitulo}</p>
                )}
                <select
                  className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs col-span-2"
                  value={nuevo.tipo}
                  disabled={agregando}
                  onChange={e => {
                    const tipo = e.target.value
                    setNuevo(s => ({ ...s, tipo }))
                    if (tipo === 'tip') setArchivo(null)
                    if (fieldErrors.nuevoTipo) {
                      setFieldErrors(s => ({ ...s, nuevoTipo: '' }))
                    }
                  }}
                >
                  <option value="video">Video</option>
                  <option value="imagen">Imagen</option>
                  <option value="audio">Audio</option>
                  <option value="pdf">PDF</option>
                  <option value="documento">Documento</option>
                  <option value="tip">Tip</option>
                </select>
                {fieldErrors.nuevoTipo && (
                  <p className="col-span-4 text-xs text-red-600">{fieldErrors.nuevoTipo}</p>
                )}
                {nuevo.tipo !== 'tip' ? (
                  <>
                    <div className="col-span-4 grid gap-1">
                      <label className="text-[11px] text-[var(--muted)]">Archivo (opcional): si seleccionas uno se subirá a Storage</label>
                      <input
                        type="file"
                        className="border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs"
                        disabled={agregando}
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null
                          setArchivo(f)
                          if (fieldErrors.archivo) {
                            setFieldErrors(s => ({ ...s, archivo: '' }))
                          }
                        }}
                        accept={
                          nuevo.tipo === 'video' ? 'video/*'
                            : nuevo.tipo === 'imagen' ? 'image/*'
                            : nuevo.tipo === 'audio' ? 'audio/*'
                            : nuevo.tipo === 'pdf' ? '.pdf,application/pdf'
                            : nuevo.tipo === 'documento' ? '.pdf,application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,text/plain'
                            : 'image/*,text/plain'
                        }
                      />
                      {fieldErrors.archivo && (
                        <p className="text-xs text-red-600">{fieldErrors.archivo}</p>
                      )}
                    </div>
                    <input className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs col-span-4" placeholder="URL del archivo (opcional si subes archivo)" value={nuevo.url_archivo} onChange={e => setNuevo(s => ({ ...s, url_archivo: e.target.value }))} disabled={agregando} />
                    <input className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs col-span-4" placeholder="Categoría/Descripción (opcional)" value={nuevo.categoria} onChange={e => setNuevo(s => ({ ...s, categoria: e.target.value }))} disabled={agregando} />
                  </>
                ) : (
                  <div className="col-span-4 grid gap-1">
                    <label className="text-[11px] text-[var(--muted)]">Texto del tip</label>
                    <textarea
                      className="border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs min-h-[100px]"
                      placeholder="Escribe el tip aquí"
                      value={nuevo.categoria}
                      disabled={agregando}
                      onChange={e => setNuevo(s => ({ ...s, categoria: e.target.value }))}
                    />
                  </div>
                )}
                <div className="col-span-4 flex justify-end mt-1">
                  <button type="submit" disabled={agregando} className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs hover:bg-[#55AB44] hover:border-[#55AB44] hover:text-white transition-colors disabled:opacity-60">
                    {agregando ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Cargando...
                      </span>
                    ) : 'Agregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Interacción movida a página aparte: botón en header */}
      {error && (
        <div className="p-2 rounded-md bg-[#fff7ed] text-[#9a3412] border border-[#fde68a] text-xs">{error}</div>
      )}
      {cargando && (
        <div className="text-xs text-[var(--muted)]">Cargando contenidos...</div>
      )}
    </div>
  )
}

export default BienestarPage