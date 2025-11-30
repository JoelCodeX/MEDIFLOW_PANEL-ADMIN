import { useEffect, useMemo, useState } from 'react'
import { listarAuditoria } from '../services/auditoria'

function AuditoriaPage() {
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [searchText, setSearchText] = useState('')
  const [registros, setRegistros] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await listarAuditoria({ page, page_size: pageSize, admin_id: filtroUsuario, accion: filtroAccion, q: searchText })
        const items = Array.isArray(res) ? res : (res.items || [])
        setRegistros(items.map(it => ({
          id: it.id,
          id_admin: it.id_admin,
          accion: it.accion,
          descripcion: it.descripcion || '',
          fecha: it.fecha,
          admin_nombre: it.admin_nombre,
          admin_apellido: it.admin_apellido,
        })))
        const total = (res?.meta?.total ?? res?.total ?? res?.count ?? items.length)
        const pages = (res?.meta?.pages ?? res?.pages ?? Math.max(1, Math.ceil(total / pageSize)))
        setTotalItems(total)
        setTotalPages(pages)
      } catch (e) {
        setError(String(e?.message || e))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [page, pageSize, filtroUsuario, filtroAccion, searchText])

  // Reiniciar a la primera página al cambiar filtros o búsqueda
  useEffect(() => {
    setPage(1)
  }, [filtroUsuario, filtroAccion, searchText])

  const accionesUnicas = useMemo(() => {
    const set = new Set(registros.map(r => r.accion).filter(Boolean))
    return Array.from(set)
  }, [registros])

  const adminsUnicos = useMemo(() => {
    const map = new Map()
    registros.forEach(r => {
      if (!r.id_admin) return
      const label = (r.admin_nombre || r.admin_apellido)
        ? `${r.admin_nombre || ''} ${r.admin_apellido || ''}`.trim() + ` (#${r.id_admin})`
        : `Admin #${r.id_admin}`
      if (!map.has(r.id_admin)) map.set(r.id_admin, label)
    })
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [registros])

  const registrosFiltrados = registros

  // Exportaciones eliminadas por requerimiento

  const badgeForAccion = (accion) => {
    const a = (accion || '').toLowerCase()
    // Crítico: cualquier acción que incluya "eliminar"
    if (a.includes('eliminar')) {
      return {
        label: 'CRÍTICO',
        className: 'px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#b91c1c] text-[10px] font-semibold'
      }
    }
    // Advertencia: actualizar/editar/cambio
    if (a.includes('actualizar') || a.includes('editar') || a.includes('cambio')) {
      return {
        label: 'Advertencia',
        className: 'px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[10px] font-semibold'
      }
    }
    // Éxito: publicar/activar
    if (a.includes('publicar') || a.includes('activar')) {
      return {
        label: 'Éxito',
        className: 'px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#065f46] text-[10px] font-semibold'
      }
    }
    // Normal: crear/registro/login/sync y otros
    if (a.includes('crear') || a.includes('registro') || a.includes('login') || a.includes('sync')) {
      return {
        label: 'Normal',
        className: 'px-2 py-0.5 rounded-full bg-[#e5e7eb] text-[#374151] text-[10px]'
      }
    }
    // Por defecto: Normal
    return {
      label: 'Normal',
      className: 'px-2 py-0.5 rounded-full bg-[#e5e7eb] text-[#374151] text-[10px]'
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Auditoría del Sistema</h1>
        {/* Botones de exportación eliminados */}
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-3">
        <div className="grid grid-cols-4 gap-2 items-end">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Usuario</label>
            <select className="w-full border rounded-full px-3 py-2 text-sm" value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)}>
              <option value="">Todos</option>
              {adminsUnicos.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Acción</label>
            <select className="w-full border rounded-full px-3 py-2 text-sm" value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)}>
              <option value="">Todas</option>
              {accionesUnicas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted)] mb-1">Buscar</label>
            <input className="w-full border rounded-full px-3 py-2 text-sm" placeholder="Texto o fecha" value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabla cronológica + alertas críticas visuales */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-3">
        <p className="m-0 mb-2 text-sm font-medium">Historial de acciones</p>
        {error && <p className="text-sm text-red-600 m-0 mb-2">{error}</p>}
        {loading && <p className="text-sm text-[var(--muted)] m-0 mb-2">Cargando...</p>}
        <div className="overflow-auto max-h-[50vh] min-h-[200px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[var(--muted)] font-semibold text-xs">
                <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">ID</th>
                <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Usuario</th>
                <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Acción</th>
                <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Descripción</th>
                <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Fecha</th>
                <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Alerta</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map(r => {
                const badge = badgeForAccion(r.accion)
                const isCriticoRow = badge.label === 'CRÍTICO'
                return (
                <tr key={r.id} className={`text-sm ${isCriticoRow ? 'bg-[#fff4f4]' : ''}`}>
                  <td className="border-b border-[var(--border)] px-2 py-1">{r.id}</td>
                  <td className="border-b border-[var(--border)] px-2 py-1">
                    {r.admin_nombre || r.admin_apellido ? (
                      <span>{r.admin_nombre} {r.admin_apellido} <span className="text-[var(--muted)]">(#{r.id_admin})</span></span>
                    ) : (
                      r.id_admin ? `Admin #${r.id_admin}` : '—'
                    )}
                  </td>
                  <td className="border-b border-[var(--border)] px-2 py-1">{r.accion}</td>
                  <td className="border-b border-[var(--border)] px-2 py-1">{r.descripcion || ''}</td>
                  <td className="border-b border-[var(--border)] px-2 py-1">{r.fecha}</td>
                  <td className="border-b border-[var(--border)] px-2 py-1">
                    <span className={badge.className}>{badge.label}</span>
                  </td>
                </tr>
              )})}
              {registrosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-sm text-[var(--muted)] py-3">Sin registros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Paginación (igual a PersonalPage) */}
      <div className="bg-white border border-[var(--border)] rounded-xl flex items-center justify-between px-3 py-2 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted)]">Página {page} de {totalPages} • {totalItems} registros</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--muted)]">Por página:</span>
            <select
              className="px-2 py-1 rounded-full border text-xs"
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
            className="px-3 py-1.5 rounded-full border text-xs"
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
                  className={`px-2.5 py-1 rounded-full border text-xs ${p === page ? 'bg-primary text-white' : 'bg-white'}`}
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
    </div>
  )
}

export default AuditoriaPage