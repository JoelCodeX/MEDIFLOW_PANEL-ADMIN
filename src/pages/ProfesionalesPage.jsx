import { useEffect, useMemo, useState } from 'react'
import Card from '@/components/Card'
import { CiRedo } from 'react-icons/ci'
import { FiEdit, FiTrash } from 'react-icons/fi'
import { listarProfesionales, crearProfesional, actualizarProfesional, eliminarProfesional } from '../services/profesionales'

export default function ProfesionalesPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, page_size: 10, total: 0 })
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', telefono: '', especialidad: '', area: '', estado: 'activo' })
  const [editId, setEditId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filterEspecialidad, setFilterEspecialidad] = useState('')

  const especialidades = useMemo(() => {
    const set = new Set((items || []).map(i => i.especialidad).filter(Boolean))
    return Array.from(set).sort()
  }, [items])
  const filteredItems = useMemo(() => {
    return (items || []).filter(i => !filterEspecialidad || i.especialidad === filterEspecialidad)
  }, [items, filterEspecialidad])

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await listarProfesionales({ page: meta.page, page_size: meta.page_size, q })
      setItems(res.items || [])
      setMeta(res.meta || { page: 1, page_size: 10, total: (res.items || []).length })
    } catch (e) {
      setError(e.message || 'Error al cargar profesionales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [meta.page, meta.page_size])

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    try {
      if (editId) {
        await actualizarProfesional(editId, form)
      } else {
        await crearProfesional(form)
      }
      setForm({ nombre: '', apellido: '', correo: '', telefono: '', especialidad: '', area: '', estado: 'activo' })
      setEditId(null)
      await load()
      setShowModal(false)
    } catch (err) {
      setError(err.message || 'Error al guardar')
    }
  }

  function startEdit(p) {
    setEditId(p.id)
    setForm({ nombre: p.nombre || '', apellido: p.apellido || '', correo: p.correo || '', telefono: p.telefono || '', especialidad: p.especialidad || '', area: p.area || '', estado: p.estado || 'activo' })
    setShowModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar profesional?')) return
    try {
      await eliminarProfesional(id)
      await load()
    } catch (err) {
      setError(err.message || 'Error al eliminar')
    }
  }

  return (
    <div className="p-4 grid gap-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm text-[var(--muted)]">
          Gestión de <span className="text-[var(--text)] font-semibold">profesionales</span>
        </h1>
      </div>

      <Card title="Búsqueda y filtros" compact>
        <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, apellido, especialidad, área"
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs w-64"
          />
          <select
            value={filterEspecialidad}
            onChange={e => setFilterEspecialidad(e.target.value)}
            className="border border-[var(--border)] rounded-full px-2.5 py-1.5 text-xs"
          >
            <option value="">Especialidad</option>
            {especialidades.map(es => (
              <option key={es} value={es}>{es}</option>
            ))}
          </select>
          <button
            className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs"
            onClick={load}
          >Buscar</button>
          <button
            className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs ml-auto"
            onClick={() => { setQ(''); setMeta(m => ({ ...m, page: 1 })); load() }}
          >Limpiar</button>
          <button
            className="px-3 py-1 rounded-full border text-white text-xs"
            style={{ backgroundColor: '#55AB44', borderColor: '#55AB44' }}
            onClick={() => { setEditId(null); setForm({ nombre: '', apellido: '', correo: '', telefono: '', especialidad: '', area: '', estado: 'activo' }); setShowModal(true) }}
          >Nuevo</button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Card
          title="Lista de profesionales"
          compact
          actionLabel={<CiRedo size={16} />}
          onAction={load}
          actionButtonClassName="w-8 h-8 flex items-center justify-center rounded-md border text-white transition-colors hover:bg-green-700 hover:border-green-700"
          actionButtonStyle={{ backgroundColor: '#55AB44', border: '1px solid #55AB44' }}
        >
          {loading ? <div className="text-xs">Cargando...</div> : (
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr className="text-[var(--muted)] font-semibold">
                  <th className="text-left px-3 py-2 border-b">Nombre</th>
                  <th className="text-left px-3 py-2 border-b">Especialidad</th>
                  <th className="text-left px-3 py-2 border-b">Área</th>
                  <th className="text-left px-3 py-2 border-b">Contacto</th>
                  <th className="text-left px-3 py-2 border-b">Estado</th>
                  <th className="text-left px-3 py-2 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(p => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 border-b">{p.nombre} {p.apellido}</td>
                    <td className="px-3 py-2 border-b">{p.especialidad || '-'}</td>
                    <td className="px-3 py-2 border-b">{p.area || '-'}</td>
                    <td className="px-3 py-2 border-b">{p.correo || ''}{p.telefono ? ` / ${p.telefono}` : ''}</td>
                    <td className="px-3 py-2 border-b">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: p.estado === 'activo' ? '#eaf7ea' : '#f3f4f6', color: p.estado === 'activo' ? '#55AB44' : '#6b7280' }}>
                        {p.estado || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-b">
                      <div className="flex items-center gap-2">
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:text-white hover:bg-[#3b82f6] hover:border-[#3b82f6] transition-colors"
                          onClick={() => startEdit(p)}
                          title="Editar"
                          aria-label="Editar"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:text-white hover:bg-red-600 hover:border-red-600 transition-colors"
                          onClick={() => handleDelete(p.id)}
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <FiTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr><td className="px-3 py-2 text-center text-[var(--muted)]" colSpan={6}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <button disabled={meta.page <= 1} onClick={() => setMeta(m => ({ ...m, page: Math.max(1, m.page - 1) }))} className="border px-3 py-1.5 rounded-full">Anterior</button>
            <span>Página {meta.page} de {Math.max(1, Math.ceil((meta.total || 1) / meta.page_size))}</span>
            <button disabled={meta.page >= Math.max(1, Math.ceil((meta.total || 1) / meta.page_size))} onClick={() => setMeta(m => ({ ...m, page: m.page + 1 }))} className="border px-3 py-1.5 rounded-full">Siguiente</button>
            <select value={meta.page_size} onChange={e => setMeta(m => ({ ...m, page_size: Number(e.target.value), page: 1 }))} className="border rounded-full px-3 py-1.5">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-[92%] max-w-[720px]">
            <Card title={editId ? 'Editar profesional' : 'Crear profesional'} compact>
              {error && <div className="text-red-600 mb-2 text-xs">{error}</div>}
              <form onSubmit={handleSubmit} className="grid gap-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" required className="border rounded-full px-3 py-1.5" />
                  <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} placeholder="Apellido" required className="border rounded-full px-3 py-1.5" />
                  <input value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} placeholder="Correo" className="border rounded-full px-3 py-1.5" />
                  <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" className="border rounded-full px-3 py-1.5" />
                  <input value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} placeholder="Especialidad" className="border rounded-full px-3 py-1.5" />
                  <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Área" className="border rounded-full px-3 py-1.5" />
                  <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="border rounded-full px-3 py-1.5">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
                <div className="mt-1 flex gap-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-1.5 rounded-full">{editId ? 'Actualizar' : 'Crear'}</button>
                  <button type="button" className="bg-gray-300 px-4 py-1.5 rounded-full" onClick={() => { setShowModal(false); setEditId(null); setForm({ nombre: '', apellido: '', correo: '', telefono: '', especialidad: '', area: '', estado: 'activo' }) }}>Cancelar</button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}