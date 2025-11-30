import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '@/components/Card'
import { listarEncuestas, eliminarEncuesta } from '@/services/encuestas'
import { FaArrowLeft, FaEye, FaRegEdit, FaTrash } from 'react-icons/fa'

function EncuestasPublicadasPage() {
  const [encuestas, setEncuestas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('activas') // 'activas' | 'todas'

  const calcularEstado = (e) => {
    const ahora = new Date()
    const fi = e?.fecha_inicio ? new Date(e.fecha_inicio) : null
    const ff = e?.fecha_fin ? new Date(e.fecha_fin) : null
    if (fi && ahora < fi) return 'Programada'
    if (ff && ahora > ff) return 'Finalizada'
    return 'Activa'
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const res = await listarEncuestas({ estado: estadoFiltro })
        const items = Array.isArray(res) ? res : (res?.items || [])
        if (!mounted) return
        setEncuestas(items)
      } catch (err) {
        setError(err?.message || 'Error al cargar encuestas publicadas')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [estadoFiltro])

  const handleDelete = async (id) => {
    if (!id) return
    const ok = confirm(`¿Eliminar la encuesta ${id}? Esta acción no se puede deshacer.`)
    if (!ok) return
    try {
      await eliminarEncuesta(id)
      setEncuestas((prev) => prev.filter((e) => (e.id ?? e.ID) !== id))
      alert('Encuesta eliminada correctamente')
    } catch (err) {
      alert(err?.message || 'No se pudo eliminar la encuesta')
    }
  }

  return (
    <div className="px-2 pt-0 pb-0 h-full flex flex-col min-h-0">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm text-[var(--muted)]">
          Listado de <span className="text-[var(--text)] font-semibold">encuestas publicadas</span>
        </h1>
        <div className="flex gap-2">
          <Link to="/encuestas" className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs flex items-center gap-1" title="Ir a creación"><FaArrowLeft /> <span>Crear/gestionar</span></Link>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Card title="Encuestas publicadas" compact dense>
          <div className="overflow-auto">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-[var(--muted)]">Filtro:</label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-xs"
              >
                <option value="activas">Activas</option>
                <option value="todas">Todas</option>
              </select>
            </div>
            {loading && <div className="text-xs text-[var(--muted)]">Cargando…</div>}
            {error && <div className="text-xs text-red-600">{error}</div>}
            {!loading && !error && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-[var(--muted)] font-semibold">
                    <th className="px-3 py-2 border-b border-[var(--border)] text-left">ID</th>
                    <th className="px-3 py-2 border-b border-[var(--border)] text-left">Título</th>
                    <th className="px-3 py-2 border-b border-[var(--border)] text-left">Inicio</th>
                    <th className="px-3 py-2 border-b border-[var(--border)] text-left">Fin</th>
                    <th className="px-3 py-2 border-b border-[var(--border)] text-left">Estado</th>
                    <th className="px-3 py-2 border-b border-[var(--border)] text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {encuestas.length === 0 ? (
                    <tr>
                      <td className="px-3 py-2 border-b border-[var(--border)]" colSpan={6}>Sin encuestas publicadas</td>
                    </tr>
                  ) : encuestas.map((e) => (
                    <tr key={e.id || e.ID || JSON.stringify(e)}>
                      <td className="px-3 py-2 border-b border-[var(--border)]">{e.id ?? e.ID ?? '—'}</td>
                      <td className="px-3 py-2 border-b border-[var(--border)]">{e.titulo ?? e.title ?? '—'}</td>
                      <td className="px-3 py-2 border-b border-[var(--border)]">{e?.fecha_inicio ? new Date(e.fecha_inicio).toLocaleString() : '—'}</td>
                      <td className="px-3 py-2 border-b border-[var(--border)]">{e?.fecha_fin ? new Date(e.fecha_fin).toLocaleString() : '—'}</td>
                      <td className="px-3 py-2 border-b border-[var(--border)]">{calcularEstado(e)}</td>
                      <td className="px-3 py-2 border-b border-[var(--border)]">
                        {(e.id || e.ID) ? (
                          <div className="flex gap-2">
                            <Link to={`/encuestas/${e.id ?? e.ID}/resultados`} className="px-2 py-1 rounded-full border border-[var(--border)] bg-white text-xs inline-flex items-center justify-center" title="Ver resultados"><FaEye /></Link>
                            <Link to={`/encuestas/${e.id ?? e.ID}/editar`} className="px-2 py-1 rounded-full border border-[var(--border)] bg-white text-xs inline-flex items-center justify-center" title="Editar encuesta"><FaRegEdit /></Link>
                            <button onClick={() => handleDelete(e.id ?? e.ID)} className="px-2 py-1 rounded-full border border-red-300 bg-white text-xs inline-flex items-center justify-center text-red-600" title="Eliminar encuesta"><FaTrash /></button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)]">ID no disponible</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default EncuestasPublicadasPage