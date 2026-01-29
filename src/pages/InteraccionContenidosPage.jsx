import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import { Link } from 'react-router-dom'
import { listarContenidos, resumenInteraccionPorContenido } from '@/services/contenidos'

function InteraccionContenidosPage() {
  const [recursos, setRecursos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [pageTable, setPageTable] = useState(1)
  const pageSizeTable = 10
  const totalPagesTable = Math.max(1, Math.ceil(recursos.length / pageSizeTable))
  const recursosPag = recursos.slice((pageTable - 1) * pageSizeTable, (pageTable - 1) * pageSizeTable + pageSizeTable)

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
      setPageTable(1)
    } catch (err) {
      setError(err.message || 'Error al cargar contenidos')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarRecursos()
  }, [])

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm text-[var(--muted)]">
          Bienestar <span className="text-[var(--text)] font-semibold">interacción</span>
        </h1>
        <Link
          to="/bienestar"
          className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs hover:bg-[#3b82f6] hover:border-[#3b82f6] hover:text-white transition-colors"
        >
          Regresar
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-2 text-xs">{error}</div>
      )}
      {cargando && (
        <div className="text-xs text-[var(--muted)]">Cargando...</div>
      )}

      <Card title="Interacción por recurso" compact>
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[var(--text)] font-semibold text-xs">
                <th className="text-left px-3 py-2 border-b border-[var(--border)]">Título</th>
                <th className="text-left px-3 py-2 border-b border-[var(--border)]">Tipo</th>
                <th className="text-left px-3 py-2 border-b border-[var(--border)]">Descripción</th>
                <th className="text-left px-3 py-2 border-b border-[var(--border)]">Fecha</th>
                <th className="text-left px-3 py-2 border-b border-[var(--border)]">Vistos</th>
                <th className="text-left px-3 py-2 border-b border-[var(--border)]">Descargas</th>
                <th className="text-left px-3 py-2 border-b border-[var(--border)]">Completados</th>
              </tr>
            </thead>
            <tbody>
              {recursosPag.map(r => (
                <tr key={`row-${r.id}`} className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-xs">{r.titulo}</td>
                  <td className="px-3 py-2 text-xs">{String(r.tipo || '').toUpperCase()}</td>
                  <td className="px-3 py-2 text-xs">{r.descripcion || '-'}</td>
                  <td className="px-3 py-2 text-xs">{r.fecha_publicacion?.slice(0,10) || '-'}</td>
                  <td className="px-3 py-2 text-xs">{r.interaccion?.visto || 0}</td>
                  <td className="px-3 py-2 text-xs">{r.interaccion?.descargado || 0}</td>
                  <td className="px-3 py-2 text-xs">{r.interaccion?.completado || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="flex items-center justify-end gap-2">
        <button
          className="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs disabled:opacity-50"
          onClick={() => setPageTable(p => Math.max(1, p - 1))}
          disabled={pageTable === 1}
        >
          Anterior
        </button>
        <span className="text-xs text-[var(--muted)]">Página {pageTable} de {totalPagesTable}</span>
        <button
          className="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs disabled:opacity-50"
          onClick={() => setPageTable(p => Math.min(totalPagesTable, p + 1))}
          disabled={pageTable >= totalPagesTable}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export default InteraccionContenidosPage