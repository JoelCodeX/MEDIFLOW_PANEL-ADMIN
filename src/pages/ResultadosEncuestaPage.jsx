import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Card from '@/components/Card'
import { listarAsignaciones, resultadosEncuesta, respuestasUsuario } from '@/services/encuestasResultados'
import { obtenerEncuesta, listarRespuestas } from '@/services/encuestas'

function ResultadosEncuestaPage() {
  const { id } = useParams()
  const encuestaId = useMemo(() => Number(id), [id])
  // Utilidad para obtener YYYY-MM-DD en hora local
  const toLocalYMD = (d) => {
    const tzOffsetMs = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10)
  }
  const hoyStr = useMemo(() => toLocalYMD(new Date()), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resumen, setResumen] = useState(null)
  const [asignaciones, setAsignaciones] = useState([])
  const [filtroArea, setFiltroArea] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showResps, setShowResps] = useState(false)
  const [respsData, setRespsData] = useState(null)
  const [userInView, setUserInView] = useState(null)
  const [loadingResps, setLoadingResps] = useState(false)
  const [errorResps, setErrorResps] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState(hoyStr)
  const [encuesta, setEncuesta] = useState(null)
  const [respuestasDia, setRespuestasDia] = useState([])

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [res, asigs, enc, respsDia] = await Promise.all([
        resultadosEncuesta(encuestaId, fechaFiltro || undefined),
        listarAsignaciones(encuestaId, fechaFiltro || undefined),
        obtenerEncuesta(encuestaId),
        listarRespuestas(encuestaId, fechaFiltro || undefined),
      ])
      setResumen(res)
      setAsignaciones(asigs || [])
      setEncuesta(enc || null)
      setRespuestasDia(Array.isArray(respsDia) ? respsDia : [])
    } catch (e) {
      console.error('Error cargando resultados:', e)
      setError(e?.message || 'No se pudieron cargar los resultados')
    } finally {
      setLoading(false)
    }
  }, [encuestaId, fechaFiltro])

  useEffect(() => {
    let mounted = true
    if (encuestaId) {
      reload()
    }
    return () => { mounted = false }
  }, [encuestaId, reload])

  const porAreaRows = useMemo(() => {
    const dic = resumen?.por_area || {}
    return Object.entries(dic).map(([area, agg]) => ({ area, respondidos: agg.respondidos, promedio: agg.promedio }))
  }, [resumen])

  const dist = resumen?.distribucion || { bajo: 0, medio: 0, alto: 0 }

  // Estados de fecha para mensajes diarios
  const esFuturo = useMemo(() => {
    if (!fechaFiltro) return false
    return fechaFiltro > hoyStr
  }, [fechaFiltro, hoyStr])
  const antesDeInicio = useMemo(() => {
    if (!fechaFiltro || !encuesta?.fecha_inicio) return false
    const fi = String(encuesta.fecha_inicio).slice(0, 10)
    return fechaFiltro < fi
  }, [fechaFiltro, encuesta])
  const despuesDeFin = useMemo(() => {
    if (!fechaFiltro || !encuesta?.fecha_fin) return false
    const ff = String(encuesta.fecha_fin).slice(0, 10)
    return fechaFiltro > ff
  }, [fechaFiltro, encuesta])
  const mensajeDia = useMemo(() => {
    if (esFuturo) return 'Aún no se evaluan las respuestas'
    if (antesDeInicio || despuesDeFin) return 'No tuviste encuesta programada'
    return ''
  }, [esFuturo, antesDeInicio, despuesDeFin])

  // Usuarios que respondieron en el día seleccionado
  const respondieronHoySet = useMemo(() => {
    const s = new Set();
    (respuestasDia || []).forEach(r => {
      if (r?.id_usuario != null) s.add(r.id_usuario)
    })
    return s
  }, [respuestasDia])

  // Fecha de respuesta del día por usuario (para la columna "Fecha respuesta")
  const fechaRespuestaPorUsuario = useMemo(() => {
    const m = new Map();
    (respuestasDia || []).forEach(r => {
      if (r?.id_usuario != null && r?.fecha_respuesta && !m.has(r.id_usuario)) {
        m.set(r.id_usuario, r.fecha_respuesta)
      }
    })
    return m
  }, [respuestasDia])

  // Asignaciones filtradas
  const areasDisponibles = useMemo(() => {
    const set = new Set()
    asignaciones.forEach(a => set.add(a.area || 'Sin área'))
    return Array.from(set)
  }, [asignaciones])
  const asignacionesFiltradas = useMemo(() => {
    return asignaciones.filter(a => {
      const okArea = !filtroArea || (a.area || 'Sin área') === filtroArea
      // Estado del día en función de respuestas del día
      const estadoDia = respondieronHoySet.has(a.id_usuario) ? 'respondida' : 'pendiente'
      const okEstado = !filtroEstado || estadoDia === filtroEstado
      return okArea && okEstado
    })
  }, [asignaciones, filtroArea, filtroEstado, respondieronHoySet])

  // Gráfico pie con conic-gradient
  const totalDist = dist.bajo + dist.medio + dist.alto
  const pctBajo = totalDist ? (dist.bajo / totalDist) * 100 : 0
  const pctMedio = totalDist ? (dist.medio / totalDist) * 100 : 0
  const pctAlto = totalDist ? (dist.alto / totalDist) * 100 : 0

  const fmtPct = (v) => `${(v ?? 0).toFixed(2)}%`
  const fmtNum = (v) => Number.isFinite(v) ? v.toFixed(2) : '—'
  const fmtDate = (iso) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }
  const openResps = async (a) => {
    setUserInView({ id: a.id_usuario, nombre: a.usuario_nombre })
    setShowResps(true)
    setErrorResps('')
    setRespsData(null)
    // Si no respondió en la fecha seleccionada, mostrar mensaje y no llamar API
    if (!respondieronHoySet.has(a.id_usuario)) {
      setLoadingResps(false)
      setErrorResps('Aún no ha respondido en esta fecha.')
      setRespsData([])
      return
    }
    setLoadingResps(true)
    try {
      const data = await respuestasUsuario(encuestaId, a.id_usuario)
      setRespsData(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error cargando respuestas del usuario:', e)
      setErrorResps(e?.message || 'No se pudieron cargar las respuestas')
      setRespsData([])
    } finally {
      setLoadingResps(false)
    }
  }
  const closeResps = () => { setShowResps(false); setRespsData(null); setUserInView(null); setErrorResps('') }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text)]">Resultados de encuesta</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">Fecha:</label>
            <input
              type="date"
              className="px-2 py-1 rounded-full border text-[11px] bg-white"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
            />
            <button
              type="button"
              className="px-2 py-1 rounded-full border text-[11px] bg-white hover:bg-gray-50"
              onClick={() => setFechaFiltro(hoyStr)}
              title="Volver a hoy"
            >Hoy</button>
          </div>
          <button
            type="button"
            onClick={reload}
            className="px-3 py-1 rounded-full border text-[11px] bg-white hover:bg-gray-50"
            aria-label="Recargar resultados"
            disabled={loading}
          >{loading ? 'Cargando…' : 'Recargar'}</button>
          <Link className="px-3 py-1 rounded-full border text-[11px] bg-white hover:bg-gray-50" to="/encuestas">Volver</Link>
        </div>
      </div>

      {!loading && !error && mensajeDia && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3">
          <p className="m-0 text-sm">{mensajeDia} para {fechaFiltro}.</p>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-[var(--border)] rounded-xl p-4">
          <p className="m-0 text-sm">Cargando resultados...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-white border border-[var(--border)] rounded-xl p-4">
          <p className="m-0 text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-[var(--border)] rounded-xl p-3">
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
                  <div className="text-sm font-bold text-[#3b82f6]">{resumen?.asignados ?? 0}</div>
                  <div className="text-[10px] text-[var(--muted)]">Asignados</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-xl p-3">
              <div className="flex items-center gap-1.5">
                <span className="w-7 h-7 rounded-full bg-[#55AB44]/15 grid place-items-center">
                  <svg className="w-3 h-3 text-[#55AB44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-bold text-[#55AB44]">{resumen?.respondidos ?? 0}</div>
                  <div className="text-[10px] text-[var(--muted)]">Respondidos{fechaFiltro ? ` (${fechaFiltro})` : ''}</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-xl p-3">
              <div className="flex items-center gap-1.5">
                <span className="w-7 h-7 rounded-full bg-[#f59e0b]/15 grid place-items-center">
                  <svg className="w-3 h-3 text-[#f59e0b]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 21s-6-4.35-9-7.35C1.17 12.76 1 10.5 2.54 8.96a5.5 5.5 0 0 1 7.78 0L12 10.64l1.68-1.68a5.5 5.5 0 0 1 7.78 0c1.54 1.54 1.37 3.8-.46 4.69C18 16.65 12 21 12 21z" />
                  </svg>
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-bold text-[#f59e0b]">{fmtPct(resumen?.participacion_pct)}</div>
                  <div className="text-[10px] text-[var(--muted)]">Participación</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-xl p-3">
              <div className="flex items-center gap-1.5">
                <span className="w-7 h-7 rounded-full bg-[#10b981]/15 grid place-items-center">
                  <svg className="w-3 h-3 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="4" y1="19" x2="20" y2="19" />
                    <rect x="6" y="14" width="3" height="5" />
                    <rect x="11" y="10" width="3" height="9" />
                    <rect x="16" y="6" width="3" height="13" />
                  </svg>
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-bold text-[#10b981]">{fmtNum(resumen?.promedio_general)}</div>
                  <div className="text-[10px] text-[var(--muted)]">Promedio general</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
            {/* Distribución de riesgo */}
            <Card title="Distribución por nivel de riesgo" compact dense className="h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-center">
                <div className="flex items-center justify-center">
                  <div
                    className="w-32 h-32 rounded-full"
                    style={{
                      background: `conic-gradient(#16a34a 0% ${pctBajo}%, #f59e0b ${pctBajo}% ${pctBajo + pctMedio}%, #dc2626 ${pctBajo + pctMedio}% 100%)`,
                      boxShadow: 'inset 0 0 0 18px #fff',
                    }}
                    aria-label="Gráfico de pastel por nivel de riesgo"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-xs"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#16a34a' }}></span> Bajo: {dist.bajo}</div>
                  <div className="flex items-center gap-2 text-xs"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#f59e0b' }}></span> Medio: {dist.medio}</div>
                  <div className="flex items-center gap-2 text-xs"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#dc2626' }}></span> Alto: {dist.alto}</div>
                </div>
              </div>
            </Card>

            {/* Promedio por área */}
            <Card title="Promedio por área" compact dense className="h-full">
              <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-[var(--muted)] font-semibold">
                      <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Área</th>
                      <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Respondidos</th>
                      <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Promedio</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {porAreaRows.length === 0 ? (
                      <tr>
                        <td className="px-2 py-1.5 border-b border-[var(--border)]" colSpan={3}>Sin datos por área</td>
                      </tr>
                    ) : porAreaRows.map((r, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1.5 border-b border-[var(--border)]">{r.area}</td>
                        <td className="px-2 py-1.5 border-b border-[var(--border)]">{r.respondidos}</td>
                        <td className="px-2 py-1.5 border-b border-[var(--border)]">{fmtNum(r.promedio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Gráfico de barras por área (promedio 0..5) */}
              <div className="mt-2 grid gap-2">
                {porAreaRows.map((r, idx) => (
                  <div key={`bar-${idx}`} className="grid gap-1">
                    <div className="text-[11px] text-[var(--muted)]">{r.area}</div>
                    <div className="h-[6px] bg-[#f3f4f6] rounded-full overflow-hidden">
                      <div className="h-[6px] bg-primary" style={{ width: `${Math.min(100, Math.max(0, (r.promedio || 0) / 5 * 100))}%` }} />
                    </div>
                    <div className="text-[10px]">Promedio: {fmtNum(r.promedio)} / 5</div>
                  </div>
                ))}
                {porAreaRows.length === 0 && (
                  <div className="text-xs text-[var(--muted)]">No hay datos para graficar.</div>
                )}
              </div>
            </Card>
          </div>

          {/* (Se removió la tarjeta de "Respuestas del día"; usamos estado diario solo para la tabla) */}

          {/* Asignaciones y respuestas */}
          <Card title="Asignaciones" compact dense>
            <div className="overflow-auto">
              {/* Filtros */}
              <div className="flex flex-wrap gap-2 mb-2">
                <select className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-[11px]" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
                  <option value="">Área: Todas</option>
                  {areasDisponibles.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <select className="px-3 py-1 rounded-full border border-[var(--border)] bg-white text-[11px]" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                  <option value="">Estado: Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="respondida">Respondida</option>
                </select>
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-[var(--muted)] font-semibold">
                    <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Trabajador</th>
                    <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Área</th>
                    <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Estado</th>
                    <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Fecha respuesta</th>
                    <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Promedio</th>
                    <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Riesgo</th>
                    <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Respuestas</th>
                  </tr>
                </thead>
                <tbody>
                  {asignacionesFiltradas.length === 0 ? (
                    <tr>
                      <td className="px-2 py-1.5 border-b border-[var(--border)]" colSpan={7}>Sin asignaciones</td>
                    </tr>
                  ) : asignacionesFiltradas.map((a) => (
                    <tr key={a.id}>
                      <td className="px-2 py-1.5 border-b border-[var(--border)]">{a.usuario_nombre || a.id_usuario}</td>
                      <td className="px-2 py-1.5 border-b border-[var(--border)]">{a.area || 'Sin área'}</td>
                      <td className="px-2 py-1.5 border-b border-[var(--border)]">
                        {respondieronHoySet.has(a.id_usuario) ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-green-100 text-green-700 border border-green-200">Respondida</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-700 border border-amber-200">Pendiente</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 border-b border-[var(--border)]">{respondieronHoySet.has(a.id_usuario) ? fmtDate(fechaRespuestaPorUsuario.get(a.id_usuario)) : '—'}</td>
                      <td className="px-2 py-1.5 border-b border-[var(--border)]">{fmtNum(a.puntaje_total)}</td>
                      <td className="px-2 py-1.5 border-b border-[var(--border)]">{a.nivel_riesgo || '—'}</td>
                      <td className="px-2 py-1.5 border-b border-[var(--border)]">
                        <button
                          className={`px-2 py-0.5 rounded-full border ${respondieronHoySet.has(a.id_usuario) ? 'bg-white hover:bg-primary/10' : 'bg-gray-50 text-[var(--muted)]'} text-[11px]`}
                          onClick={() => openResps(a)}
                          aria-label="Ver respuestas del usuario"
                          title={respondieronHoySet.has(a.id_usuario) ? 'Ver respuestas' : 'Aún no ha respondido'}
                        >Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {showResps && (
            <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
              <div className="bg-white border border-[var(--border)] rounded-xl w-[90vw] max-w-[720px] max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
                  <div className="text-sm font-semibold">Respuestas de {userInView?.nombre || userInView?.id}</div>
                  <button className="text-xs px-2 py-0.5 rounded-full border bg-white hover:bg-primary/10" onClick={closeResps}>Cerrar</button>
                </div>
                <div className="p-3 overflow-auto">
                  {loadingResps ? (
                    <div className="text-xs text-[var(--muted)]">Cargando respuestas...</div>
                  ) : errorResps ? (
                    <div className="text-xs text-red-600">{errorResps}</div>
                  ) : Array.isArray(respsData) && respsData.length > 0 ? (
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="text-[var(--muted)] font-semibold">
                          <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Pregunta</th>
                          <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Respuesta</th>
                          <th className="px-2 py-1.5 border-b border-[var(--border)] text-left">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {respsData.map((r, idx) => (
                          <tr key={idx}>
                            <td className="px-2 py-1.5 border-b border-[var(--border)]">{r.pregunta || r.texto_pregunta || `#${r.id_pregunta}`}</td>
                            <td className="px-2 py-1.5 border-b border-[var(--border)]">{r.respuesta}</td>
                            <td className="px-2 py-1.5 border-b border-[var(--border)]">{fmtDate(r.fecha_respuesta)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-xs text-[var(--muted)]">Sin respuestas registradas.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ResultadosEncuestaPage