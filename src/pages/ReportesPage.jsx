import { useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Card from '@/components/Card'
import { listarEncuestas, listarRespuestas } from '@/services/encuestas'
import { listarAsignaciones, resultadosEncuesta } from '@/services/encuestasResultados'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, LabelList } from 'recharts'

// Áreas se derivan de asignaciones reales
// usersById ya no es necesario; usamos campos de asignaciones

function ReportesPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [areasSel, setAreasSel] = useState([]) // múltiples áreas
  const [riesgosSel, setRiesgosSel] = useState([]) // múltiples: 'bajo','medio','alto'

  const [generadoPor, setGeneradoPor] = useState('Admin MediFlow')
  const [firma, setFirma] = useState('')

  // Estado de datos reales
  const [encuestas, setEncuestas] = useState([])
  const [encuestaIds, setEncuestaIds] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [respuestas, setRespuestas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loadingData, setLoadingData] = useState(false)

  // Cargar encuestas al inicio y seleccionar la primera activa
  useEffect(() => {
    let mounted = true
    listarEncuestas({ estado: 'activas' }).then((resp) => {
      if (!mounted) return
      const arr = Array.isArray(resp) ? resp : (resp?.items || [])
      setEncuestas(arr)
      // Seleccionar todas por defecto
      setEncuestaIds(arr.map((e) => e.id))
    }).catch(() => {
      setEncuestas([])
    })
    return () => { mounted = false }
  }, [])

  // Cargar asignaciones, respuestas y resumen al cambiar encuesta
  useEffect(() => {
    let mounted = true
    if (!encuestaIds || encuestaIds.length === 0) {
      setAsignaciones([])
      setRespuestas([])
      setResumen(null)
      return () => { mounted = false }
    }
    setLoadingData(true)
    Promise.all([
      Promise.all(encuestaIds.map((id) => listarAsignaciones(id).catch(() => []))),
      Promise.all(encuestaIds.map((id) => listarRespuestas(id).catch(() => []))),
      Promise.all(encuestaIds.map((id) => resultadosEncuesta(id).catch(() => null))),
    ]).then(([asigsList, respList, resumenList]) => {
      if (!mounted) return
      const asigs = asigsList.flat()
      const rs = respList.flat()
      const mergedResumen = mergeResumen(resumenList.filter(Boolean))
      setAsignaciones(asigs)
      setRespuestas(rs)
      setResumen(mergedResumen)
      setLoadingData(false)
    }).catch(() => {
      if (!mounted) return
      setAsignaciones([])
      setRespuestas([])
      setResumen(null)
      setLoadingData(false)
    })
    return () => { mounted = false }
  }, [encuestaIds])

  // Derivar áreas desde asignaciones
  const areas = useMemo(() => {
    const set = new Set((asignaciones || []).map((a) => a.area).filter(Boolean))
    // Fallback: intentar derivar áreas desde el resumen si existe estructura por área
    const fromResumen = (() => {
      const pr = resumen?.por_area
      if (!pr) return []
      if (Array.isArray(pr)) {
        return pr.map((x) => x?.area).filter(Boolean)
      }
      if (typeof pr === 'object') {
        return Object.keys(pr)
      }
      return []
    })()
    for (const a of fromResumen) set.add(a)
    return Array.from(set)
  }, [asignaciones, resumen])

  // Usuarios agrupados por área para filtros rápidos
  const usersByArea = useMemo(() => {
    const out = {}
    for (const a of asignaciones || []) {
      const ar = a.area || ''
      if (!out[ar]) out[ar] = new Set()
      if (a.id_usuario != null) out[ar].add(a.id_usuario)
    }
    return out
  }, [asignaciones])

  // Respuestas filtradas por fecha y área (solo valores numéricos)
  const respuestasFiltradas = useMemo(() => {
    const dDesde = desde ? new Date(desde) : null
    const dHasta = hasta ? new Date(hasta) : null
    const usersInAreas = (areasSel && areasSel.length > 0)
      ? new Set((asignaciones || []).filter((a) => areasSel.includes(a.area)).map((a) => a.id_usuario))
      : null
    const usersInRisk = (riesgosSel && riesgosSel.length > 0)
      ? new Set((asignaciones || []).filter((a) => riesgosSel.includes(a.nivel_riesgo)).map((a) => a.id_usuario))
      : null
    return (respuestas || []).filter((r) => {
      if (!r.fecha_respuesta) return false
      const fd = new Date(r.fecha_respuesta)
      const okDesde = dDesde ? fd >= dDesde : true
      const okHasta = dHasta ? fd <= dHasta : true
      const okArea = usersInAreas ? usersInAreas.has(r.id_usuario) : true
      const okRisk = usersInRisk ? usersInRisk.has(r.id_usuario) : true
      const vnum = toNumber(r.respuesta)
      return okDesde && okHasta && okArea && okRisk && vnum != null
    })
  }, [respuestas, desde, hasta, areasSel, riesgosSel, asignaciones])

  // Serie diaria de promedio usando puntaje_total de asignaciones (aplica filtros locales)
  const timeSeries = useMemo(() => {
    const dDesde = desde ? new Date(desde) : null
    const dHasta = hasta ? new Date(hasta) : null
    const byDate = {}
    for (const a of asignaciones || []) {
      if (areasSel && areasSel.length > 0 && !areasSel.includes(a.area)) continue
      if (riesgosSel && riesgosSel.length > 0 && !riesgosSel.includes(a.nivel_riesgo)) continue
      if (!a.fecha_respuesta) continue
      const fd = new Date(a.fecha_respuesta)
      if (dDesde && fd < dDesde) continue
      if (dHasta && fd > dHasta) continue
      const dateKey = String(a.fecha_respuesta).slice(0, 10)
      const vnum = toNumber(a.puntaje_total)
      if (vnum == null) continue
      if (!byDate[dateKey]) byDate[dateKey] = []
      byDate[dateKey].push(vnum)
    }
    const dates = Object.keys(byDate).sort()
    return dates.map((d) => ({ fecha: d, promedio: avg(byDate[d]) }))
  }, [asignaciones, desde, hasta, areasSel, riesgosSel])

  // Serie semanal (7 días): promedio por día dentro de la semana seleccionada
  const weeklySeries = useMemo(() => {
    // Semana base: si hay "desde", se toma su semana; sino si hay "hasta"; de lo contrario semana actual
    const base = desde ? new Date(desde) : (hasta ? new Date(hasta) : new Date())
    base.setHours(0, 0, 0, 0)
    const dayNr = (base.getDay() + 6) % 7 // lunes=0
    const monday = new Date(base.valueOf())
    monday.setDate(monday.getDate() - dayNr)
    const sunday = new Date(monday.valueOf())
    sunday.setDate(sunday.getDate() + 6)

    const buckets = Array(7).fill(0).map(() => [])
    for (const a of asignaciones || []) {
      if (areasSel && areasSel.length > 0 && !areasSel.includes(a.area)) continue
      if (riesgosSel && riesgosSel.length > 0 && !riesgosSel.includes(a.nivel_riesgo)) continue
      if (!a.fecha_respuesta) continue
      const fd = new Date(a.fecha_respuesta)
      fd.setHours(0, 0, 0, 0)
      if (fd < monday || fd > sunday) continue
      const diffDays = Math.floor((fd - monday) / (24 * 60 * 60 * 1000))
      const vnum = toNumber(a.puntaje_total)
      if (vnum == null) continue
      if (diffDays >= 0 && diffDays <= 6) buckets[diffDays].push(vnum)
    }
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    return labels.map((dia, idx) => ({ dia, promedio: buckets[idx].length ? +avg(buckets[idx]).toFixed(2) : null }))
  }, [asignaciones, areasSel, riesgosSel, desde, hasta])

  // Detectar rango seleccionado: semana (misma semana) vs mes (mismo año-mes)
  const isWeekRange = useMemo(() => {
    if (!desde || !hasta) return false
    const wk1 = getWeekKey(String(desde).slice(0, 10))
    const wk2 = getWeekKey(String(hasta).slice(0, 10))
    const d1 = new Date(`${String(desde).slice(0, 10)}T00:00:00`)
    const d2 = new Date(`${String(hasta).slice(0, 10)}T00:00:00`)
    const diffDays = Math.abs(Math.floor((d2 - d1) / (24 * 60 * 60 * 1000))) + 1
    return wk1 === wk2 && diffDays <= 7
  }, [desde, hasta])

  const isMonthRange = useMemo(() => {
    if (!desde || !hasta) return false
    const d1 = new Date(`${String(desde).slice(0, 10)}T00:00:00`)
    const d2 = new Date(`${String(hasta).slice(0, 10)}T00:00:00`)
    const diffDays = Math.abs(Math.floor((d2 - d1) / (24 * 60 * 60 * 1000))) + 1
    const ym1 = String(desde).slice(0, 7)
    const ym2 = String(hasta).slice(0, 7)
    // Prioriza semanal si aplica; considera mensual si mismo año-mes o ~1 mes de duración
    if (isWeekRange) return false
    return (ym1 === ym2) || diffDays >= 28
  }, [desde, hasta, isWeekRange])

  // Si el rango está en el mismo mes calendario, desglosar por semanas dentro de ese mes
  const isSingleCalendarMonth = useMemo(() => {
    if (!desde || !hasta) return false
    const ym1 = String(desde).slice(0, 7)
    const ym2 = String(hasta).slice(0, 7)
    return ym1 === ym2
  }, [desde, hasta])

  const weeksInRangeSeries = useMemo(() => {
    if (!desde || !hasta || !isSingleCalendarMonth) return []
    const dStart = new Date(`${String(desde).slice(0, 10)}T00:00:00`)
    const dEnd = new Date(`${String(hasta).slice(0, 10)}T00:00:00`)
    const month = dStart.getMonth()
    const year = dStart.getFullYear()
    const mondayOfStart = new Date(dStart.valueOf())
    const dayNr = (mondayOfStart.getDay() + 6) % 7
    mondayOfStart.setDate(mondayOfStart.getDate() - dayNr)
    const series = []
    let weekIdx = 1
    let weekStart = new Date(mondayOfStart.valueOf())
    while (weekStart <= dEnd && weekIdx <= 6) {
      const weekEnd = new Date(weekStart.valueOf())
      weekEnd.setDate(weekEnd.getDate() + 6)
      const bucket = []
      for (const a of asignaciones || []) {
        if (areasSel && areasSel.length > 0 && !areasSel.includes(a.area)) continue
        if (riesgosSel && riesgosSel.length > 0 && !riesgosSel.includes(a.nivel_riesgo)) continue
        if (!a.fecha_respuesta) continue
        const fd = new Date(a.fecha_respuesta)
        fd.setHours(0, 0, 0, 0)
        // Limitar al mismo mes calendario
        if (fd.getMonth() !== month || fd.getFullYear() !== year) continue
        if (fd < weekStart || fd > weekEnd) continue
        const vnum = toNumber(a.puntaje_total)
        if (vnum == null) continue
        bucket.push(vnum)
      }
      series.push({ semana: `Semana ${weekIdx}`, promedio: bucket.length ? +avg(bucket).toFixed(2) : null })
      weekStart.setDate(weekStart.getDate() + 7)
      // Si nos salimos del mes, terminar
      if (weekStart.getMonth() !== month || weekStart.getFullYear() !== year) break
      weekIdx++
    }
    return series
  }, [asignaciones, areasSel, riesgosSel, desde, hasta, isSingleCalendarMonth])

  // Promedios generales por mes (desde respuestas), solo una columna "Promedio"
  const promediosPorMes = useMemo(() => {
    const byMonth = {}
    for (const r of respuestasFiltradas) {
      const vnum = toNumber(r.respuesta)
      if (vnum == null) continue
      const month = (r.fecha_respuesta || '').slice(0, 7)
      if (!byMonth[month]) byMonth[month] = []
      byMonth[month].push(vnum)
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, vals]) => ({ mes: month, promedio: +avg(vals).toFixed(2) }))
  }, [respuestasFiltradas])

  // Meses seleccionados para la tabla de "Promedios generales por mes"
  const selectedMonths = useMemo(() => {
    // Si no hay rango, usar el mes actual
    if (!desde && !hasta) {
      const now = new Date()
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return [ym]
    }
    const dDesde = desde ? new Date(`${String(desde).slice(0, 10)}T00:00:00`) : (hasta ? new Date(`${String(hasta).slice(0, 10)}T00:00:00`) : null)
    const dHasta = hasta ? new Date(`${String(hasta).slice(0, 10)}T00:00:00`) : dDesde
    if (!dDesde || !dHasta) return []
    const start = new Date(dDesde.valueOf())
    start.setDate(1)
    const end = new Date(dHasta.valueOf())
    end.setDate(1)
    const months = []
    const cur = new Date(start.valueOf())
    while (cur <= end) {
      months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
      cur.setMonth(cur.getMonth() + 1)
    }
    return months
  }, [desde, hasta])

  // Promedios por mes limitados a los meses seleccionados (incluye meses sin datos como promedio null)
  const promediosMesSeleccionado = useMemo(() => {
    const map = new Map(promediosPorMes.map((m) => [m.mes, m.promedio]))
    return selectedMonths.map((m) => ({ mes: m, promedio: map.has(m) ? map.get(m) : null }))
  }, [promediosPorMes, selectedMonths])

  // Paginación para "Promedios por mes"
  const [promPage, setPromPage] = useState(1)
  const [promPageSize, setPromPageSize] = useState(5)

  // Asignaciones filtradas (para export y participación semanal)
  const asignacionesFiltradas = useMemo(() => {
    const dDesde = desde ? new Date(desde) : null
    const dHasta = hasta ? new Date(hasta) : null
    return (asignaciones || []).filter((a) => {
      const okArea = (areasSel && areasSel.length > 0) ? areasSel.includes(a.area) : true
      const okRiesgo = (riesgosSel && riesgosSel.length > 0) ? riesgosSel.includes(a.nivel_riesgo) : true
      const fecha = a.fecha_respuesta ? new Date(a.fecha_respuesta) : null
      const okDesde = dDesde ? (fecha ? fecha >= dDesde : false) : true
      const okHasta = dHasta ? (fecha ? fecha <= dHasta : false) : true
      return okArea && okRiesgo && okDesde && okHasta
    })
  }, [asignaciones, desde, hasta, areasSel, riesgosSel])

  // Gráfico ahora usa Recharts con serie de "promedio" diario

  // (Recalculado arriba desde respuestasFiltradas)

  const promTotalItems = promediosMesSeleccionado.length
  const promTotalPages = useMemo(() => Math.max(1, Math.ceil(promTotalItems / promPageSize)), [promTotalItems, promPageSize])
  const paginatedPromedios = useMemo(() => {
    const start = (promPage - 1) * promPageSize
    return promediosMesSeleccionado.slice(start, start + promPageSize)
  }, [promediosMesSeleccionado, promPage, promPageSize])
  useEffect(() => {
    if (promPage > promTotalPages) setPromPage(promTotalPages)
  }, [promTotalPages, promPage])

  // Participación semanal: porcentaje de usuarios con registro por semana (usando asignaciones reales)
  const participationWeekly = useMemo(() => {
    const dDesde = desde ? new Date(desde) : null
    const dHasta = hasta ? new Date(hasta) : null
    const byWeek = {}
    for (const a of asignaciones || []) {
      if (areasSel && areasSel.length > 0 && !areasSel.includes(a.area)) continue
      if (riesgosSel && riesgosSel.length > 0 && !riesgosSel.includes(a.nivel_riesgo)) continue
      if (!a.fecha_respuesta) continue
      const fd = new Date(a.fecha_respuesta)
      if (dDesde && fd < dDesde) continue
      if (dHasta && fd > dHasta) continue
      const weekKey = getWeekKey((a.fecha_respuesta || '').slice(0, 10))
      if (!byWeek[weekKey]) byWeek[weekKey] = new Set()
      byWeek[weekKey].add(a.id_usuario)
    }
    const totalUsuariosAsignados = new Set((asignaciones || []).filter((a) => {
      const okArea = (areasSel && areasSel.length > 0) ? areasSel.includes(a.area) : true
      const okRiesgo = (riesgosSel && riesgosSel.length > 0) ? riesgosSel.includes(a.nivel_riesgo) : true
      return okArea && okRiesgo
    }).map((a) => a.id_usuario)).size
    const denom = Math.max(1, totalUsuariosAsignados)
    return Object.entries(byWeek)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([week, set]) => ({ week, porcentaje: Math.round((set.size / denom) * 100) }))
  }, [asignaciones, desde, hasta, areasSel, riesgosSel])
  // Paginación para participación semanal
  const [partPage, setPartPage] = useState(1)
  const [partPageSize, setPartPageSize] = useState(8)
  const partTotalItems = participationWeekly.length
  const partTotalPages = useMemo(() => Math.max(1, Math.ceil(partTotalItems / partPageSize)), [partTotalItems, partPageSize])
  const paginatedParticipation = useMemo(() => {
    const start = (partPage - 1) * partPageSize
    return participationWeekly.slice(start, start + partPageSize)
  }, [participationWeekly, partPage, partPageSize])
  useEffect(() => {
    if (partPage > partTotalPages) setPartPage(partTotalPages)
  }, [partTotalPages, partPage])

  // Mes mostrado en el resumen: derivado de "desde" o mes actual
  const resumenMes = useMemo(() => {
    const ref = desde ? `${desde}`.slice(0, 7) : new Date().toISOString().slice(0, 7)
    return ref
  }, [desde])

  // Ref del gráfico visible para exportar su SVG en el imprimible
  const chartRef = useRef(null)

  const exportCSV = () => {
    const esc = (s) => '"' + String(s ?? '—').replace(/"/g, '""') + '"'
    const csvRows = []
    const push = (row) => csvRows.push(row)
    const pushBlank = () => csvRows.push([])
    const pushSection = (title, headers, rows) => {
      push([title]);
      if (headers && headers.length) push(headers)
      for (const r of rows || []) push(r)
      pushBlank()
    }

    // Encabezado y metadatos
    pushSection('Reporte de Bienestar', ['Generado por', 'Firma'], [[generadoPor, firma || '—']])
    pushSection('Filtros aplicados', ['Rango', 'Encuestas', 'Áreas', 'Riesgos'], [[
      `${desde || '—'} a ${hasta || '—'}`,
      (encuestaIds || []).length || (encuestas || []).length,
      areasSel.length > 0 ? areasSel.join(', ') : 'Todas',
      riesgosSel.length > 0 ? riesgosSel.join(', ') : 'Todos',
    ]])

    // Valores de gráficas según rango
    // Serie diaria (siempre disponible)
    pushSection('Serie diaria (promedio por fecha)', ['Fecha', 'Promedio'], (timeSeries || []).map(ts => [ts.fecha, ts.promedio ?? '—']))

    if (isWeekRange) {
      // Semana seleccionada: promedio por día
      pushSection('Serie semanal (promedio por día)', ['Día', 'Promedio'], (weeklySeries || []).map(ws => [ws.dia, ws.promedio ?? '—']))
    } else if (isSingleCalendarMonth) {
      // Mismo mes calendario: desglosar por semanas del mes
      pushSection('Promedios por semanas del mes', ['Semana', 'Promedio'], (weeksInRangeSeries || []).map(w => [w.semana, w.promedio ?? '—']))
      // Además incluir promedios por mes del rango (esto será solo un mes)
      pushSection('Promedios por mes (rango)', ['Mes', 'Promedio'], (promediosMesSeleccionado || []).map(m => [formatMonth(m.mes), m.promedio ?? '—']))
    } else if (isMonthRange) {
      // Rango mensual: promedios por mes
      pushSection('Promedios por mes (rango)', ['Mes', 'Promedio'], (promediosMesSeleccionado || []).map(m => [formatMonth(m.mes), m.promedio ?? '—']))
    }

    // Participación semanal
    pushSection('Participación semanal (%)', ['Semana', 'Participación'], (participationWeekly || []).map(p => [p.week, p.porcentaje]))

    // Respuestas detalladas (asignaciones)
    pushSection('Respuestas detalladas', ['Fecha', 'Usuario', 'Área', 'Puntaje', 'Riesgo'], (asignacionesFiltradas || []).map(a => [
      a.fecha_respuesta || '—',
      a.usuario_nombre || '—',
      a.area || '—',
      a.puntaje_total ?? '—',
      a.nivel_riesgo || '—',
    ]))

    const csv = csvRows.map((row) => row.map(esc).join(',')).join('\n')
    // BOM para UTF-8 (mejor compatibilidad con Excel)
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const nameRange = `${(desde || '').slice(0,10)}_${(hasta || '').slice(0,10)}`.replace(/[^0-9_-]/g, '')
    a.download = `reporte_bienestar_${nameRange || 'rango'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const encuestaOptions = useMemo(() => encuestas.map((en) => ({ value: en.id, label: en.titulo || `#${en.id}` })), [encuestas])
  const areaOptions = useMemo(() => areas.map((a) => ({ value: a, label: a })), [areas])
  const riesgoOptions = useMemo(() => ([
    { value: 'bajo', label: 'Bajo' },
    { value: 'medio', label: 'Medio' },
    { value: 'alto', label: 'Alto' },
  ]), [])

  const exportPDF = () => {
    const chartSvg = chartRef.current?.querySelector('svg')?.outerHTML || ''
    const promRowsHtml = (promediosMesSeleccionado || [])
      .map((m) => `<tr><td style="padding:6px;border:1px solid #ddd;">${formatMonth(m.mes)}</td><td style="padding:6px;border:1px solid #ddd;">${m.promedio ?? '—'}</td></tr>`)
      .join('')
    const partRowsHtml = (participationWeekly || [])
      .map((p) => `<tr><td style="padding:6px;border:1px solid #ddd;">${p.week}</td><td style="padding:6px;border:1px solid #ddd;">${p.porcentaje}%</td></tr>`)
      .join('')
    const asignRowsHtml = (asignacionesFiltradas || [])
      .map((a) => `<tr>
        <td style="padding:6px;border:1px solid #ddd;">${a.fecha_respuesta || '—'}</td>
        <td style="padding:6px;border:1px solid #ddd;">${a.usuario_nombre || '—'}</td>
        <td style="padding:6px;border:1px solid #ddd;">${a.area || '—'}</td>
        <td style="padding:6px;border:1px solid #ddd;">${a.puntaje_total ?? '—'}</td>
        <td style="padding:6px;border:1px solid #ddd;">${a.nivel_riesgo || '—'}</td>
      </tr>`)
      .join('')

    const html = `
      <html>
        <head>
          <title>Reporte de Bienestar</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #222; padding: 18px; }
            header { display:flex; align-items:center; gap:14px; margin-bottom: 12px; }
            header .title { font-size: 18px; font-weight: 600; }
            img.logo { height: 40px; }
            .meta { margin: 8px 0 14px; font-size: 12px; color: #555; }
            h3 { margin: 16px 0 8px; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th { text-align:left; background:#f7f7f7; }
            th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
            .chart { border: 1px solid #ddd; padding: 8px; border-radius: 8px; }
            .small { font-size: 11px; color: #777; }
            .flex { display:flex; gap:10px; }
            .col { flex:1; }
            @media print { .page-break { page-break-before: always; } }
          </style>
        </head>
        <body>
          <header>
            <img class="logo" src="/imagotipo_2.svg" alt="Logo" onerror="this.style.display='none'" />
            <div class="title">Reporte de bienestar — ${resumenMes}</div>
          </header>
          <div class="meta">
            Rango: ${desde || '—'} a ${hasta || '—'} • Encuestas: ${(encuestaIds || []).length || (encuestas || []).length} • Áreas: ${areasSel.length > 0 ? areasSel.join(', ') : 'Todas'} • Riesgos: ${riesgosSel.length > 0 ? riesgosSel.join(', ') : 'Todos'}<br/>
            Generado por: ${generadoPor} • Firma: ${firma || '—'}
          </div>

          <h3>Gráfico del rango seleccionado</h3>
          <div class="chart">
            ${chartSvg || '<div class="small">No se pudo capturar el gráfico actual. Asegúrate de que está visible antes de exportar.</div>'}
          </div>
          <div class="small">Valores mostrados respetan filtros activos y rango seleccionado.</div>

          <div class="flex page-break">
            <div class="col">
              <h3>Promedios generales por mes</h3>
              <table>
                <thead>
                  <tr><th>Mes</th><th>Promedio</th></tr>
                </thead>
                <tbody>
                  ${promRowsHtml || '<tr><td colspan="2" style="padding:6px;border:1px solid #ddd;">Sin datos en el rango seleccionado</td></tr>'}
                </tbody>
              </table>
            </div>
            <div class="col">
              <h3>Participación semanal</h3>
              <table>
                <thead>
                  <tr><th>Semana</th><th>Participación</th></tr>
                </thead>
                <tbody>
                  ${partRowsHtml || '<tr><td colspan="2" style="padding:6px;border:1px solid #ddd;">Sin datos</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <h3 class="page-break">Detalle de respuestas</h3>
          <table>
            <thead>
              <tr><th>Fecha</th><th>Usuario</th><th>Área</th><th>Puntaje</th><th>Riesgo</th></tr>
            </thead>
            <tbody>
              ${asignRowsHtml || '<tr><td colspan="5" style="padding:6px;border:1px solid #ddd;">Sin datos en el rango seleccionado</td></tr>'}
            </tbody>
          </table>

          <div class="small" style="margin-top:10px;">Resumen: Participación ${(resumen?.participacion_pct ?? 0)}% • Alertas altas ${(resumen?.distribucion?.alto ?? 0)} • Promedio general ${(resumen?.promedio_general ?? 0)}</div>
        </body>
      </html>`
    let win = window.open('', '_blank')
    if (!win) {
      try {
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
        const w2 = window.open(url, '_blank')
        if (!w2) {
          // Fallback: descargar como archivo HTML si los popups están bloqueados
          const a = document.createElement('a')
          a.href = url
          a.download = `reporte_bienestar_${resumenMes}.html`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          alert('No se pudo abrir una nueva ventana. Se descargó el reporte como HTML.')
          return
        }
        win = w2
      } catch (e) {
        alert('El navegador bloqueó la ventana del PDF. Habilita los popups para esta página.')
        return
      }
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    try { win.print() } catch {}
  }

  const clearFilters = () => {
    setDesde('')
    setHasta('')
    setAreasSel([])
    setRiesgosSel([])
    setEncuestaIds(encuestas.map((en) => en.id))
    setGeneradoPor('')
    setFirma('')
  }

  return (
    <div className="grid gap-4 min-h-screen overflow-y-auto pb-8">
      <h2 className="text-xl font-semibold">Reportes</h2>

      {/* Filtros en 2 filas para mejor despliegue de desplegables */}
      <Card title="Filtros" compact>
        <div className="space-y-2">
          {/* Fila 1: multiselects */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-[220px] shrink-0 relative z-20">
              <MultiSelect
                placeholder="Encuestas"
                options={encuestaOptions}
                selected={encuestaIds}
                onChange={setEncuestaIds}
                disabled={encuestaOptions.length === 0}
              />
            </div>
            <div className="w-[160px] shrink-0 relative z-20">
              <MultiSelect
                placeholder="Áreas"
                options={areaOptions}
                selected={areasSel}
                onChange={setAreasSel}
                disabled={areaOptions.length === 0}
              />
            </div>
            <div className="w-[150px] shrink-0 relative z-20">
              <MultiSelect
                placeholder="Riesgos"
                options={riesgoOptions}
                selected={riesgosSel}
                onChange={setRiesgosSel}
                disabled={false}
              />
            </div>
          </div>

          {/* Fila 2: fechas, textos y acciones */}
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" className="border border-[var(--border)] rounded-full px-2 py-1 text-xs w-[140px] shrink-0" value={desde} onChange={(e) => setDesde(e.target.value)} />
            <input type="date" className="border border-[var(--border)] rounded-full px-2 py-1 text-xs w-[140px] shrink-0" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            <input className="border border-[var(--border)] rounded-full px-2 py-1 text-xs w-[180px] shrink-0" placeholder="Generado por" value={generadoPor} onChange={(e) => setGeneradoPor(e.target.value)} />
            <input className="border border-[var(--border)] rounded-full px-2 py-1 text-xs w-[160px] shrink-0" placeholder="Firma" value={firma} onChange={(e) => setFirma(e.target.value)} />
            <div className="flex items-center gap-2 ml-auto">
              {loadingData && (
                <div className="text-xs text-[var(--muted)] flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2v4" />
                  </svg>
                  <span>Cargando…</span>
                </div>
              )}
              <button className="px-2 py-1 rounded-full border border-[var(--border)] bg-white text-xs" onClick={clearFilters}>Limpiar</button>
              <button className="px-2 py-1 rounded-full border border-[var(--border)] bg-white text-xs flex items-center gap-1" onClick={exportPDF}><IconFileText /> <span>PDF</span></button>
              <button className="px-2 py-1 rounded-full border border-[var(--border)] bg-white text-xs flex items-center gap-1" onClick={exportCSV}><IconDownload /> <span>CSV</span></button>
            </div>
          </div>
        </div>
        {encuestas.length === 0 && (
          <p className="m-0 mt-2 text-[var(--muted)] text-xs">Sin encuestas activas. Verifica que el backend esté disponible o configura <code>VITE_API_URL</code>.</p>
        )}
      </Card>

      {/* Gráfica dinámica: semanal (días) si rango es semana; mensual (meses) si rango es mes */}
      {isMonthRange ? (
        isSingleCalendarMonth ? (
          <Card title="Bienestar mensual (semanas)" compact minH={260}>
            <div className="bg-white border border-[var(--border)] rounded-xl p-3" ref={chartRef}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeksInRangeSeries} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="promedio" fill="#2a9d8f">
                    <LabelList dataKey="promedio" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-[var(--muted)] text-xs mt-1">0–5 puntos promedio por semana (mes seleccionado)</div>
              {weeksInRangeSeries.length === 0 && (
                <div className="text-[var(--muted)] text-xs mt-2">Sin datos para graficar en el mes seleccionado</div>
              )}
            </div>
          </Card>
        ) : (
          <Card title="Bienestar mensual (promedio)" compact minH={260}>
            <div className="bg-white border border-[var(--border)] rounded-xl p-3" ref={chartRef}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={promediosMesSeleccionado} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickFormatter={formatMonth} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="promedio" fill="#2a9d8f">
                    <LabelList dataKey="promedio" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-[var(--muted)] text-xs mt-1">0–5 puntos promedio por mes (rango seleccionado)</div>
              {promediosMesSeleccionado.length === 0 && (
                <div className="text-[var(--muted)] text-xs mt-2">Sin datos para graficar en el rango seleccionado</div>
              )}
            </div>
          </Card>
        )
      ) : (
        <Card title="Bienestar semanal (promedio)" compact minH={260}>
          <div className="bg-white border border-[var(--border)] rounded-xl p-3" ref={chartRef}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklySeries} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="promedio"
                  stroke="#2a9d8f"
                  strokeWidth={2}
                  dot={{ r: 3, stroke: '#2a9d8f', fill: '#2a9d8f' }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList dataKey="promedio" position="top" />
                </Line>
              </LineChart>
            </ResponsiveContainer>
            <div className="text-[var(--muted)] text-xs mt-1">0–5 puntos promedio por día (semana seleccionada)</div>
            {weeklySeries.every((p) => p.promedio == null) && (
              <div className="text-[var(--muted)] text-xs mt-2">Sin datos para graficar en la semana seleccionada</div>
            )}
          </div>
        </Card>
      )}

      {/* Promedios generales por mes */}
      <Card title="Promedios generales por mes" compact>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[var(--muted)] font-semibold text-sm">
              <th className="text-left px-3 py-2 border-b">Mes</th>
              <th className="text-left px-3 py-2 border-b">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPromedios.map((m) => (
              <tr key={m.mes}>
                <td className="px-3 py-2 border-b"><MonthBadge ym={m.mes} /></td>
                <td className="px-3 py-2 border-b">{m.promedio ?? '—'}</td>
              </tr>
            ))}
            {promediosMesSeleccionado.length === 0 && (
              <tr><td className="px-3 py-2 text-[var(--muted)]" colSpan={2}>Sin datos en el rango seleccionado</td></tr>
            )}
          </tbody>
        </table>
        {/* Paginación */}
        {promediosMesSeleccionado.length > 0 && (
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-[var(--muted)]">
              Mostrando {(promPage - 1) * promPageSize + 1}–{Math.min(promTotalItems, promPage * promPageSize)} de {promTotalItems}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted)]">Filas por página</span>
                <select className="border border-[var(--border)] rounded-full px-2 py-1 text-sm" value={promPageSize} onChange={(e) => { setPromPageSize(Number(e.target.value)); setPromPage(1) }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-white text-sm disabled:opacity-50" onClick={() => setPromPage((p) => Math.max(1, p - 1))} disabled={promPage === 1}>Anterior</button>
                <span className="text-sm text-[var(--muted)]">Página {promPage} de {promTotalPages}</span>
                <button className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-white text-sm disabled:opacity-50" onClick={() => setPromPage((p) => Math.min(promTotalPages, p + 1))} disabled={promPage === promTotalPages}>Siguiente</button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Reporte de participación semanal */}
      <Card title="Participación semanal" compact>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {paginatedParticipation.map((w) => (
            <div key={w.week} className="bg-white border border-[var(--border)] rounded-xl p-3">
              <div className="m-0"><WeekBadge week={w.week} /></div>
              <div className="mt-2 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-2 bg-primary" style={{ width: `${w.porcentaje}%` }} />
              </div>
              <span className="text-sm text-[var(--muted)]">{w.porcentaje}% participación</span>
            </div>
          ))}
          {participationWeekly.length === 0 && <span className="text-sm text-[var(--muted)]">Sin participación en el rango</span>}
        </div>
        {/* Paginación */}
        {participationWeekly.length > 0 && (
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-[var(--muted)]">
              Mostrando {(partPage - 1) * partPageSize + 1}–{Math.min(partTotalItems, partPage * partPageSize)} de {partTotalItems}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted)]">Items por página</span>
                <select className="border border-[var(--border)] rounded-full px-2 py-1 text-sm" value={partPageSize} onChange={(e) => { setPartPageSize(Number(e.target.value)); setPartPage(1) }}>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={16}>16</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-white text-sm disabled:opacity-50" onClick={() => setPartPage((p) => Math.max(1, p - 1))} disabled={partPage === 1}>Anterior</button>
                <span className="text-sm text-[var(--muted)]">Página {partPage} de {partTotalPages}</span>
                <button className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-white text-sm disabled:opacity-50" onClick={() => setPartPage((p) => Math.min(partTotalPages, p + 1))} disabled={partPage === partTotalPages}>Siguiente</button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Resumen del reporte */}
      <Card title={`Reporte de bienestar — ${resumenMes}`} compact>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Stat label="Participación" value={`${resumen?.participacion_pct ?? 0}%`} />
          <Stat label="Alertas altas" value={resumen?.distribucion?.alto ?? 0} />
          <Stat label="Promedio general" value={resumen?.promedio_general ?? 0} />
          <Stat label="Respondidos" value={resumen?.respondidos ?? 0} />
          <Stat label="Asignados" value={resumen?.asignados ?? 0} />
        </div>
      </Card>


    </div>
  )
}

function avg(arr) {
  if (!arr || arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

// Fusiona múltiples resúmenes de encuestas en uno solo
function mergeResumen(list) {
  if (!Array.isArray(list) || list.length === 0) return null
  let asignados = 0
  let respondidos = 0
  let weightedSum = 0
  const distribucion = { bajo: 0, medio: 0, alto: 0 }
  const areaAccum = {}

  for (const r of list) {
    const a = Number(r?.asignados || 0)
    const resp = Number(r?.respondidos || 0)
    asignados += a
    respondidos += resp
    const promGen = Number(r?.promedio_general || 0)
    if (resp > 0 && Number.isFinite(promGen)) weightedSum += promGen * resp
    const dist = r?.distribucion || {}
    distribucion.bajo += Number(dist?.bajo || 0)
    distribucion.medio += Number(dist?.medio || 0)
    distribucion.alto += Number(dist?.alto || 0)

    const pa = r?.por_area
    if (Array.isArray(pa)) {
      for (const item of pa) {
        const area = item?.area
        if (!area) continue
        const prom = Number(item?.promedio || item?.promedio_general || 0)
        if (!areaAccum[area]) areaAccum[area] = { sum: 0, count: 0 }
        if (Number.isFinite(prom)) {
          areaAccum[area].sum += prom
          areaAccum[area].count += 1
        }
      }
    } else if (pa && typeof pa === 'object') {
      for (const [area, prom] of Object.entries(pa)) {
        if (!areaAccum[area]) areaAccum[area] = { sum: 0, count: 0 }
        const n = Number(prom)
        if (Number.isFinite(n)) {
          areaAccum[area].sum += n
          areaAccum[area].count += 1
        }
      }
    }
  }

  const promedio_general = respondidos > 0 ? +(weightedSum / respondidos).toFixed(2) : 0
  const participacion_pct = asignados > 0 ? Math.round((respondidos / asignados) * 100) : 0
  const por_area = Object.entries(areaAccum).map(([area, obj]) => ({ area, promedio: +(obj.sum / Math.max(1, obj.count)).toFixed(2) }))

  return { asignados, respondidos, promedio_general, participacion_pct, distribucion, por_area }
}

function toNumber(val) {
  if (val === null || val === undefined) return null
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) ? n : null
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const diff = target - firstThursday
  const week = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000))
  const month = dateStr.slice(0, 7)
  return `${month} • sem ${week}`
}

// (ChartBlock anterior reemplazado por Recharts)

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-3">
      <p className="m-0 text-[var(--muted)] text-sm">{label}</p>
      <p className="m-0 text-lg font-semibold">{value}</p>
    </div>
  )
}

export default ReportesPage

// Helpers y UI pequeñas
function MultiSelect({ placeholder, options, selected, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const rootRef = useRef(null)
  const [menuStyle, setMenuStyle] = useState({})
  const toggle = () => { if (!disabled) setOpen((o) => !o) }
  const allValues = options.map((o) => o.value)
  const isAllSelected = selected && selected.length === allValues.length && allValues.length > 0
  const selectAll = () => onChange(allValues)
  const clearAll = () => onChange([])
  const onToggle = (val) => {
    const set = new Set(selected || [])
    if (set.has(val)) set.delete(val)
    else set.add(val)
    onChange(Array.from(set))
  }
  useEffect(() => {
    if (!open) return
    const recompute = () => {
      if (!rootRef.current) return
      const rect = rootRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const MENU_ESTIMATED = 220 // px aprox: encabezado + opciones con scroll
      const shouldOpenUp = spaceBelow < MENU_ESTIMATED && spaceAbove > spaceBelow
      setOpenUp(shouldOpenUp)
      setMenuStyle({
        position: 'fixed',
        top: shouldOpenUp ? rect.top : rect.bottom,
        left: rect.left,
        width: rect.width,
        zIndex: 1000,
        transform: shouldOpenUp ? 'translateY(-100%) translateY(-8px)' : 'translateY(8px)'
      })
    }
    recompute()
    // Reposicionar si hay scroll/resize (incluye scroll de contenedores)
    window.addEventListener('scroll', recompute, true)
    window.addEventListener('resize', recompute)
    return () => {
      window.removeEventListener('scroll', recompute, true)
      window.removeEventListener('resize', recompute)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button type="button" className="w-full border border-[var(--border)] rounded-full px-2 py-1 text-xs bg-white text-left" onClick={toggle} disabled={disabled}>
        <span className="text-[var(--muted)]">{placeholder}</span>
        <span className="ml-1">{selected?.length || 0}</span>
      </button>
      {open && createPortal(
        <div style={menuStyle} className="fixed bg-white border border-[var(--border)] rounded-xl p-2 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <button type="button" className="px-2 py-1 rounded-full border border-[var(--border)] bg-white text-xs" onClick={selectAll} disabled={disabled}>Seleccionar todo</button>
            <button type="button" className="px-2 py-1 rounded-full border border-[var(--border)] bg-white text-xs" onClick={clearAll} disabled={disabled}>Vaciar</button>
          </div>
          <div className="max-h-48 overflow-auto">
            {options.length === 0 && (
              <div className="text-[var(--muted)] text-xs">Sin opciones</div>
            )}
            {options.map((opt) => {
              const checked = (selected || []).includes(opt.value)
              return (
                <label key={opt.value} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={() => onToggle(opt.value)} />
                  <span className="text-xs">{opt.label}</span>
                </label>
              )
            })}
          </div>
          <div className="text-[var(--muted)] text-[10px] mt-1">{isAllSelected ? 'Todos seleccionados' : ''}</div>
        </div>,
        document.body
      )}
    </div>
  )
}
function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )
}

function MonthBadge({ ym }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--bg-soft)] border border-[var(--border)]">
      <IconCalendar />
      <span className="capitalize">{formatMonth(ym)}</span>
    </span>
  )
}

function formatMonth(ym) {
  if (!ym) return '—'
  const d = new Date(`${ym}-01T00:00:00`)
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function IconDownload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconFileText() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}

function WeekBadge({ week }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--bg-soft)] border border-[var(--border)]">
      <IconCalendar />
      <span>{week}</span>
    </span>
  )
}