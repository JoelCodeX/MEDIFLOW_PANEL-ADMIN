import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/Card'
import { crearEncuesta, asignarEncuesta, agregarPregunta, obtenerEncuesta, editarEncuesta, editarPregunta, eliminarPregunta, eliminarEncuesta } from '@/services/encuestas'
import { fetchUsuariosList } from '@/services/usuarios'
import { FaRegQuestionCircle, FaRegFileAlt, FaListUl, FaChartBar, FaCalendarAlt, FaCalendarCheck, FaTrash, FaFolderOpen, FaExclamationTriangle, FaCheckCircle, FaCalendar, FaDumbbell, FaBrain, FaBuilding, FaPen } from 'react-icons/fa'

// Escalas Likert predefinidas y estilos
const LIKERT_STYLES = {
  acuerdo: {
    '5': ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo'],
    '7': ['Totalmente en desacuerdo', 'Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo', 'Totalmente de acuerdo'],
  },
  frecuencia: {
    '5': ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'],
  },
}

const isFrequencyLabels = (labels) => {
  if (!Array.isArray(labels)) return false
  const norm = labels.map((s) => String(s).toLowerCase().trim())
  const freq = LIKERT_STYLES.frecuencia['5'].map((s) => s.toLowerCase())
  if (norm.length !== freq.length) return false
  return norm.every((s, i) => s === freq[i])
}

// Plantillas de salud para ejemplo rápido
const SALUD_TEMPLATES = [
  'Calidad de sueño en la última semana',
  'Nivel de estrés percibido',
  'Dolor de espalda durante la jornada',
  'Energía y vitalidad diaria',
  'Satisfacción con el entorno laboral',
]

const categorias = ['General', 'Seguridad', 'Bienestar', 'Ergonomía']
// Clasificación visible por tipo de contenido
const CLASSIFICATIONS = ['Físico', 'Psicosocial', 'Clima laboral', 'Respuesta corta']
const trabajadores = ['Juan Pérez', 'María López', 'Carlos Díaz', 'Lucía Gómez']

function EncuestasPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const params = useParams()
  const navigate = useNavigate()
  const [encuestaId, setEncuestaId] = useState(params?.id ? Number(params.id) : null)
  // Estado de listado movido a página dedicada de "Encuestas publicadas"

  // Audiencia
  const [audienceType, setAudienceType] = useState('Todos') // 'Todos' | 'Área' | 'Trabajador'
  const [areas, setAreas] = useState([])
  const [audienceCategory, setAudienceCategory] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [audienceWorkerId, setAudienceWorkerId] = useState('')

  // Programación
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('18:00')

  // Constructor de preguntas
  const [questions, setQuestions] = useState([])
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState('Texto') // 'Texto' | 'Opción múltiple' | 'Likert'
  const [questionCategory, setQuestionCategory] = useState('Físico') // 'Físico' | 'Psicosocial' | 'Clima laboral' | 'Respuesta corta'
  const [optionDraft, setOptionDraft] = useState('')
  const [optionPool, setOptionPool] = useState([])
  const [likertScalePoints, setLikertScalePoints] = useState('5') // '5' | '7'
  const [likertStyle, setLikertStyle] = useState('acuerdo') // 'acuerdo' | 'frecuencia'
  const [selectedTemplate, setSelectedTemplate] = useState(SALUD_TEMPLATES[0])
  const [templateCategory, setTemplateCategory] = useState('Clima laboral')
  const [expandedQuestions, setExpandedQuestions] = useState({})
  const [editingQuestionId, setEditingQuestionId] = useState(null)

  // Estado de programación calculado y validación
  const scheduleStatus = useMemo(() => {
    if (!startDate || !endDate) return { label: 'Sin programación', emoji: '⏳', valid: true }
    const start = new Date(`${startDate}T${startTime || '00:00'}`)
    const end = new Date(`${endDate}T${endTime || '23:59'}`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { label: 'Programación inválida', emoji: '⚠️', valid: false, reason: 'Fechas u horas inválidas' }
    }
    if (start >= end) {
      return { label: 'Programación inválida', emoji: '⚠️', valid: false, reason: 'Inicio debe ser antes que fin' }
    }
    const now = new Date()
    if (now < start) return { label: 'Programada', emoji: '🗓️', valid: true }
    if (now >= start && now <= end) return { label: 'Activa', emoji: '✅', valid: true }
    return { label: 'Finalizada', emoji: '✔️', valid: true }
  }, [startDate, startTime, endDate, endTime])

  const canPublish = useMemo(() => {
    return Boolean(title && startDate && endDate && questions.length > 0 && scheduleStatus.valid)
  }, [title, startDate, endDate, questions.length, scheduleStatus.valid])

  const scheduleIcon = useMemo(() => {
    switch (scheduleStatus.label) {
      case 'Sin programación':
        return <FaCalendar className="inline mr-1" />
      case 'Programación inválida':
        return <FaExclamationTriangle className="inline mr-1 text-red-600" />
      case 'Programada':
        return <FaCalendarAlt className="inline mr-1" />
      case 'Activa':
        return <FaCheckCircle className="inline mr-1 text-green-600" />
      case 'Finalizada':
        return <FaCalendarCheck className="inline mr-1" />
      default:
        return <FaCalendar className="inline mr-1" />
    }
  }, [scheduleStatus.label])

  const addOptionToPool = () => {
    if (!optionDraft.trim()) return
    setOptionPool((prev) => [...prev, optionDraft.trim()])
    setOptionDraft('')
  }

  const removeOptionFromPool = (idx) => {
    setOptionPool((prev) => prev.filter((_, i) => i !== idx))
  }

  const beginEditQuestion = (q) => {
    setEditingQuestionId(q.id)
    setQuestionText(q.text || '')
    setQuestionType(q.type || 'Texto')
    setQuestionCategory(q.category || 'Físico')
    setOptionPool(Array.isArray(q.options) ? q.options : [])
    setLikertScalePoints(q?.likert?.points ? String(q.likert.points) : (q?.likert?.labels?.length ? String(q.likert.labels.length) : '5'))
    if (q?.likert?.style) {
      setLikertStyle(q.likert.style)
    } else if (isFrequencyLabels(q?.likert?.labels || [])) {
      setLikertStyle('frecuencia')
    } else {
      setLikertStyle('acuerdo')
    }
  }

  const addQuestion = async () => {
    const text = questionText.trim()
    // Validaciones básicas
    if (!text) {
      setErrorMsg('Escribe el texto de la pregunta')
      return
    }
    if (!CLASSIFICATIONS.includes(questionCategory)) {
      setErrorMsg('Selecciona una clasificación válida (Físico, Psicosocial, etc.)')
      return
    }
    if (questionType === 'Opción múltiple' && optionPool.length < 2) {
      setErrorMsg('Añade al menos 2 opciones para la pregunta de opción múltiple')
      return
    }
    const q = {
      id: crypto.randomUUID(),
      text,
      type: questionType,
      category: questionCategory,
      options: questionType === 'Opción múltiple' ? [...optionPool] : [],
      likert: questionType === 'Likert' ? { style: likertStyle, points: Number(likertScalePoints), labels: [...LIKERT_STYLES[likertStyle][likertScalePoints]] } : null,
    }
    if (editingQuestionId) {
      // Actualizar en memoria
      setQuestions((prev) => prev.map((pq) => (pq.id === editingQuestionId ? { ...pq, ...q, id: editingQuestionId } : pq)))
    } else {
      setQuestions((prev) => [...prev, q])
    }
    // Intentar persistir inmediatamente (auto-guardado)
    try {
      if (editingQuestionId && encuestaId) {
        // Editar pregunta existente
        const payload = {
          texto_pregunta: q.text,
          tipo_respuesta: q.type,
          opciones: q.options,
          labels: q?.likert?.labels || [],
        }
        await editarPregunta(encuestaId, editingQuestionId, payload)
      } else if (encuestaId) {
        // Si ya existe encuesta, agregar la pregunta directamente
        const backendPregunta = {
          texto_pregunta: q.text,
          tipo_respuesta: q.type,
          opciones: q.options,
          categoria: q.category,
          labels: q?.likert?.labels || [],
        }
        const resp = await agregarPregunta(encuestaId, backendPregunta)
        const saved = resp?.pregunta
        if (saved?.id) {
          // Sustituir ID temporal por ID real
          setQuestions((prev) => prev.map((pq) => (pq.id === q.id ? { ...pq, id: saved.id } : pq)))
        }
      } else {
        // Crear borrador de encuesta con la primera pregunta
        const payload = {
          titulo: title || 'Bloque sin título',
          descripcion: description || '',
          publico: mapAudienceTypeToBackend(audienceType),
          schedule: { startDate, startTime, endDate, endTime },
          preguntas: [q],
        }
        const creada = await crearEncuesta(payload)
        const idNueva = creada?.id
        if (idNueva) setEncuestaId(idNueva)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error auto‑guardando pregunta:', err)
      setErrorMsg(err?.message || 'Error auto‑guardando')
    } finally {
      // Limpiar error y restaurar valores por defecto seguros
      setErrorMsg('')
      setQuestionText('')
      setQuestionType('Texto')
      setQuestionCategory('Físico')
      setOptionPool([])
      setLikertScalePoints('5')
      setLikertStyle('acuerdo')
      setEditingQuestionId(null)
    }
  }

  const removeQuestion = async (id) => {
    const isBackendId = typeof id === 'number' || (typeof id === 'string' && /^[0-9]+$/.test(id))
    const idStr = String(id)
    if (encuestaId && isBackendId) {
      try {
        await eliminarPregunta(encuestaId, Number(id))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error eliminando pregunta en backend:', err)
        alert(err?.message || 'No se pudo eliminar en backend')
      }
    }
    // Normalizar comparación por ID para evitar discrepancias número vs cadena
    setQuestions((prev) => prev.filter((q) => String(q.id) !== idStr))
    setExpandedQuestions((prev) => {
      const n = { ...prev }
      delete n[idStr]
      return n
    })
  }

  const summary = useMemo(() => {
    const total = questions.length
    const multi = questions.filter((q) => q.type === 'Opción múltiple').length
    const likert = questions.filter((q) => q.type === 'Likert').length
    const text = total - multi - likert
    const byCat = CLASSIFICATIONS.reduce((acc, c) => {
      acc[c] = questions.filter((q) => q.category === c).length
      return acc
    }, {})
    return { total, multi, text, likert, byCat }
  }, [questions])

  const addTemplateQuestion = () => {
    if (!selectedTemplate) return
    const q = {
      id: crypto.randomUUID(),
      text: selectedTemplate,
      type: 'Likert',
      category: templateCategory,
      options: [],
      likert: { style: likertStyle, points: Number(likertScalePoints), labels: [...LIKERT_STYLES[likertStyle][likertScalePoints]] },
    }
    setQuestions((prev) => [...prev, q])
  }

  // Cargar usuarios y derivar áreas únicas
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetchUsuariosList({ page_size: 200 })
        const items = res?.items || []
        if (!mounted) return
        const usuariosFmt = items.map(u => ({ id: u.id, nombre: `${u.nombres || u.nombre || ''} ${u.apellidos || u.apellido || ''}`.trim(), area: u.area || '' }))
        setUsuarios(usuariosFmt)
        const uniqueAreas = Array.from(new Set(items.map(u => u.area).filter(Boolean)))
        setAreas(uniqueAreas)
        if (uniqueAreas.length && !audienceCategory) setAudienceCategory(uniqueAreas[0])
        if (usuariosFmt.length && !audienceWorkerId) setAudienceWorkerId(String(usuariosFmt[0].id))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error cargando usuarios:', err?.message || err)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Cargar encuesta existente si viene ID en la ruta
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!encuestaId) return
      try {
        const data = await obtenerEncuesta(encuestaId)
        if (!mounted || !data) return
        setTitle(data.titulo || '')
        setDescription(data.descripcion || '')
        const fi = data?.fecha_inicio ? new Date(data.fecha_inicio) : null
        const ff = data?.fecha_fin ? new Date(data.fecha_fin) : null
        setStartDate(fi ? fi.toISOString().slice(0, 10) : '')
        setStartTime(fi ? fi.toTimeString().slice(0, 5) : '')
        setEndDate(ff ? ff.toISOString().slice(0, 10) : '')
        setEndTime(ff ? ff.toTimeString().slice(0, 5) : '')
        const mapped = (data.preguntas || []).map((p) => {
          let type
          if (p.tipo_respuesta === 'texto_libre') type = 'Texto'
          else if (p.tipo_respuesta === 'opcion_multiple') type = 'Opción múltiple'
          else type = 'Likert'
          let optionsArr = []
          try {
            optionsArr = p.opciones ? JSON.parse(p.opciones) : []
          } catch (_) {
            optionsArr = Array.isArray(p.opciones) ? p.opciones : []
          }
          const points = Array.isArray(optionsArr) && optionsArr.length ? optionsArr.length : 5
          const style = isFrequencyLabels(optionsArr) ? 'frecuencia' : 'acuerdo'
          const lik = type === 'Likert' ? { style, points, labels: optionsArr } : null
          // Normalizar categoría para la vista previa: usar la del backend si existe
          let cat = p.categoria || p.category || ''
          if (!CLASSIFICATIONS.includes(cat)) {
            cat = type === 'Texto' ? 'Respuesta corta' : 'Clima laboral'
          }
          return {
            id: p.id,
            text: p.texto_pregunta,
            type,
            category: cat,
            options: type === 'Opción múltiple' ? optionsArr : [],
            likert: lik,
          }
        })
        setQuestions(mapped)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error cargando encuesta:', err)
      }
    })()
    return () => { mounted = false }
  }, [encuestaId])

  // Listado de encuestas publicadas se gestiona ahora en /encuestas/publicadas

  const mapAudienceTypeToBackend = (t) => {
    if (t === 'Todos') return 'todos'
    if (t === 'Área') return 'por_area'
    if (t === 'Trabajador') return 'por_usuario'
    return 'todos'
  }

  const handleSave = async () => {
    setErrorMsg('')
    setSaving(true)
    try {
      const payload = {
        titulo: title,
        descripcion: description,
        publico: mapAudienceTypeToBackend(audienceType),
        schedule: { startDate, startTime, endDate, endTime },
        preguntas: questions,
      }
      const res = await crearEncuesta(payload)
      const id = res?.id
      alert(`Encuesta guardada como borrador${id ? ` (ID ${id})` : ''}`)
    } catch (err) {
      const msg = err?.message || 'Error al guardar'
      setErrorMsg(msg)
      alert(msg)
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    setErrorMsg('')
    if (!title || !startDate || !endDate || questions.length === 0) {
      alert('Completa título, fechas y al menos una pregunta')
      return
    }
    if (!scheduleStatus.valid) {
      alert(`La programación no es válida: ${scheduleStatus.reason || 'revisa las fechas y horas'}`)
      return
    }
    // Validar audiencia
    const tipoAud = mapAudienceTypeToBackend(audienceType)
    if (tipoAud === 'por_area' && !audienceCategory) {
      alert('Selecciona un Área para asignar la encuesta')
      return
    }
    if (tipoAud === 'por_usuario' && !audienceWorkerId) {
      alert('Selecciona un Trabajador para asignar la encuesta')
      return
    }
    setPublishing(true)
    try {
      const payload = {
        titulo: title,
        descripcion: description,
        publico: mapAudienceTypeToBackend(audienceType),
        schedule: { startDate, startTime, endDate, endTime },
        preguntas: questions,
      }
      // Crear o editar según si estamos editando una existente
      let idEncuesta = encuestaId
      if (idEncuesta) {
        await editarEncuesta(idEncuesta, payload)
      } else {
        const creada = await crearEncuesta(payload)
        idEncuesta = creada?.id
      }
      if (!idEncuesta) throw new Error('No se pudo crear/editar la encuesta')

      const audiencia = { type: mapAudienceTypeToBackend(audienceType) }
      if (audiencia.type === 'por_area' && audienceCategory) audiencia.area = audienceCategory
      if (audiencia.type === 'por_usuario' && audienceWorkerId) audiencia.ids_usuarios = [Number(audienceWorkerId)]

      const asignacion = await asignarEncuesta(idEncuesta, audiencia)
      const creados = asignacion?.creados ?? 0
      alert(`Encuesta publicada y asignada (ID ${idEncuesta}). Asignaciones: ${creados}`)
      setEncuestaId(idEncuesta)
    } catch (err) {
      const msg = err?.message || 'Error al publicar'
      setErrorMsg(msg)
      alert(msg)
    } finally {
      setPublishing(false)
    }
  }

  const handleDeleteSurvey = async () => {
    if (!encuestaId) {
      alert('No hay una encuesta creada aún')
      return
    }
    const ok = confirm(`¿Eliminar la encuesta ${encuestaId}? Esta acción no se puede deshacer.`)
    if (!ok) return
    try {
      await eliminarEncuesta(encuestaId)
      alert('Encuesta eliminada')
      // Resetear estado del editor
      setEncuestaId(null)
      setTitle('')
      setDescription('')
      setQuestions([])
      setEditingQuestionId(null)
      // Navegar a listado de publicadas
      navigate('/encuestas/publicadas')
    } catch (err) {
      alert(err?.message || 'No se pudo eliminar la encuesta')
    }
  }

  return (
    <div className="px-2 pt-0 pb-0 h-full flex flex-col min-h-0">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-sm text-[var(--muted)]">
          Gestión de <span className="text-[var(--text)] font-semibold">encuestas</span>
        </h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded-full bg-primary text-white text-xs disabled:opacity-60" onClick={handlePublish} disabled={publishing || saving || !canPublish}>{publishing ? 'Publicando…' : 'Publicar'}</button>
          <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs disabled:opacity-60" onClick={handleSave} disabled={saving || publishing}>{saving ? 'Guardando…' : 'Guardar borrador'}</button>
          <Link to="/encuestas/publicadas" className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs flex items-center gap-1" title="Ir a encuestas publicadas"><FaFolderOpen /> <span>Publicadas</span></Link>
          {encuestaId && (
            <button className="px-3 py-1 rounded-full border border-red-300 bg-[var(--surface)] text-xs text-red-600 flex items-center gap-1" onClick={handleDeleteSurvey} title="Eliminar encuesta"><FaTrash /> <span>Eliminar</span></button>
          )}
        </div>
      </div>
      {/* Contenido desplazable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Bloque superior: Programación y Público objetivo */}
        <div className="grid grid-cols-12 gap-3 items-stretch">
          <div className="col-span-6 min-h-0">
            <Card title="Programación" compact dense>
              <div className="grid gap-2">
                <div className="grid grid-cols-4 gap-2">
                  <div className="grid gap-1">
                    <label className="sr-only">Fecha inicio</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" />
                  </div>
                  <div className="grid gap-1">
                    <label className="sr-only">Hora inicio</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" />
                  </div>
                  <div className="grid gap-1">
                    <label className="sr-only">Fecha fin</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" />
                  </div>
                  <div className="grid gap-1">
                    <label className="sr-only">Hora fin</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" />
                  </div>
                </div>
                <div className="text-[11px] mt-1">
                  <span className={`${!scheduleStatus.valid ? 'text-red-600' : 'text-[var(--muted)]'}`}>
                    Estado: {scheduleIcon} {scheduleStatus.label}{scheduleStatus.reason ? ` — ${scheduleStatus.reason}` : ''}
                  </span>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-span-6 min-h-0">
            <Card title="Público objetivo" compact dense>
              <div className="grid gap-2">
                <div className="flex items-center gap-3">
                  {['Todos', 'Área', 'Trabajador'].map((t) => (
                    <label key={t} className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="audience"
                        value={t}
                        checked={audienceType === t}
                        onChange={(e) => setAudienceType(e.target.value)}
                      />
                      {t}
                    </label>
                  ))}
                </div>
                {audienceType === 'Área' && (
                  <select
                    value={audienceCategory}
                    onChange={(e) => setAudienceCategory(e.target.value)}
                    className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs w-full"
                  >
                    {areas.length === 0 && <option value="">(Sin áreas)</option>}
                    {areas.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
                {audienceType === 'Trabajador' && (
                  <select
                    value={audienceWorkerId}
                    onChange={(e) => setAudienceWorkerId(e.target.value)}
                    className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs w-full"
                  >
                    {usuarios.length === 0 && <option value="">(Sin usuarios)</option>}
                    {usuarios.map((u) => (
                      <option key={u.id} value={String(u.id)}>{u.nombre || `Usuario ${u.id}`}</option>
                    ))}
                  </select>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Debajo: dos columnas (izquierda información+resumen+constructor, derecha vista previa) */}
        <div className="grid grid-cols-12 gap-3 items-start mt-4">
          {/* Columna izquierda (más estrecha) */}
          <div className="col-span-6 min-h-0">
            <Card title="Información de la encuesta" compact dense>
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <label className="sr-only">Título</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="📝 Título de la encuesta"
                    className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="sr-only">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="🧾 Breve descripción, objetivos y alcance"
                    className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs min-h-[80px]"
                  />
                </div>
              </div>
            </Card>

            <Card title="Resumen" compact dense className="mt-2">
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px]" title="Título">📝 {title || '-'}</span>
            <span className="px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px]" title="Audiencia">👥 {audienceType}{audienceType === 'Área' ? ` (${audienceCategory || '-'})` : audienceType === 'Trabajador' ? ` (${usuarios.find(u => String(u.id) === String(audienceWorkerId))?.nombre || '-'})` : ''}</span>
                <span className="px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px] flex items-center gap-1" title="Preguntas"><FaRegQuestionCircle /> <span>Preguntas:</span> <span className="font-semibold">{summary.total}</span></span>
                <span className="px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px] flex items-center gap-1" title="Texto"><FaRegFileAlt /> <span>Texto:</span> <span className="font-semibold">{summary.text}</span></span>
                <span className="px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px] flex items-center gap-1" title="Opción múltiple"><FaListUl /> <span>Opción múltiple:</span> <span className="font-semibold">{summary.multi}</span></span>
                <span className="px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px] flex items-center gap-1" title="Likert"><FaChartBar /> <span>Likert:</span> <span className="font-semibold">{summary.likert}</span></span>
                <span className="px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px] flex items-center gap-1" title="Inicio"><FaCalendarAlt /> <span>Inicio:</span> <span className="font-semibold">{startDate || '-'}</span> <span>{startTime || ''}</span></span>
                <span className="px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px] flex items-center gap-1" title="Fin"><FaCalendarCheck /> <span>Fin:</span> <span className="font-semibold">{endDate || '-'}</span> <span>{endTime || ''}</span></span>
                <span className={`px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px] flex items-center gap-1 ${!scheduleStatus.valid ? 'border-red-500 text-red-600' : ''}`} title="Estado programación">{scheduleIcon} <span>Estado:</span> <span className="font-semibold">{scheduleStatus.label}</span></span>
                {/* Conteos por clasificación */}
                {CLASSIFICATIONS.map((c) => (
                  <span key={`sum-${c}`} className="px-2 py-0.5 rounded-full border bg-[var(--surface)] text-[var(--text)] text-[11px] flex items-center gap-1" title={c}>
                    {c === 'Físico' ? <FaDumbbell /> : c === 'Psicosocial' ? <FaBrain /> : c === 'Clima laboral' ? <FaBuilding /> : <FaPen />}
                    <span>{c}:</span>
                    <span className="font-semibold">{summary.byCat?.[c] || 0}</span>
                  </span>
                ))}
              </div>
            </Card>

            <Card title="Constructor de preguntas" compact dense className="mt-2">
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <label className="sr-only">Tipo de pregunta</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs"
                  >
                    <option>Texto</option>
                    <option>Opción múltiple</option>
                    <option>Likert</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="sr-only">Clasificación</label>
                  <select
                    value={questionCategory}
                    onChange={(e) => setQuestionCategory(e.target.value)}
                    className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs"
                  >
                    {CLASSIFICATIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="sr-only">Pregunta</label>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="❓ Escribe la pregunta"
                    className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs"
                  />
                </div>

                {questionType === 'Opción múltiple' && (
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={optionDraft}
                        onChange={(e) => setOptionDraft(e.target.value)}
                        placeholder="Nueva opción"
                        className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs flex-1"
                      />
                      <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" onClick={addOptionToPool}>Añadir</button>
                    </div>
                    <ul className="grid gap-1 list-none p-0 m-0">
                      {optionPool.map((opt, i) => (
                        <li key={`${opt}-${i}`} className="flex items-center justify-between border border-[var(--border)] rounded-md px-3 py-1 text-xs">
                          <span>{opt}</span>
                          <button className="px-2 py-0.5 rounded-md border text-[11px]" onClick={() => removeOptionFromPool(i)}>Eliminar</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {questionType === 'Likert' && (
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3">
                      {[
                        { key: 'acuerdo', label: 'Acuerdo' },
                        { key: 'frecuencia', label: 'Frecuencia' },
                      ].map((s) => (
                        <label key={s.key} className="flex items-center gap-1 text-xs">
                          <input
                            type="radio"
                            name="likertStyle"
                            value={s.key}
                            checked={likertStyle === s.key}
                            onChange={(e) => {
                              const val = e.target.value
                              setLikertStyle(val)
                              if (val === 'frecuencia') setLikertScalePoints('5')
                            }}
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                    <div className="grid gap-1">
                      <label className="sr-only">Escala Likert</label>
                      <select
                        value={likertScalePoints}
                        onChange={(e) => setLikertScalePoints(e.target.value)}
                        className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs w-full"
                      >
                        <option value="5">5 puntos</option>
                        {likertStyle === 'acuerdo' && <option value="7">7 puntos</option>}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <label className="sr-only">Etiquetas</label>
                      <div className="flex flex-wrap gap-1">
                        {LIKERT_STYLES[likertStyle][likertScalePoints].map((lab, i) => (
                          <span key={`lab-${i}`} className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px]">{lab}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-full bg-primary text-white text-xs" onClick={addQuestion}>{editingQuestionId ? 'Guardar cambios' : 'Agregar pregunta'}</button>
                  <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs" onClick={() => { setQuestionText(''); setQuestionType('Texto'); setOptionPool([]); setLikertScalePoints('5'); setQuestionCategory('Físico'); setEditingQuestionId(null) }}>Limpiar</button>
                </div>

                <div className="border-t border-[var(--border)] pt-2">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-8">
                      <label className="text-xs text-[var(--muted)]">Plantillas de salud</label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs w-full"
                      >
                        {SALUD_TEMPLATES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <div className="grid gap-1">
                        <select
                          value={templateCategory}
                          onChange={(e) => setTemplateCategory(e.target.value)}
                          className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs w-full"
                        >
                          {CLASSIFICATIONS.map((c) => (
                            <option key={`tpl-${c}`} value={c}>{c}</option>
                          ))}
                        </select>
                        <button className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs w-full" onClick={addTemplateQuestion}>Añadir plantilla</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-2">
                  <h4 className="text-xs font-semibold mb-1">Preguntas añadidas</h4>
                  <ul className="grid gap-1 list-none p-0 m-0">
                    {questions.map((q) => (
                      <li key={q.id} className="border border-[var(--border)] rounded-md px-3 py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px]">{q.type === 'Texto' ? '📝' : q.type === 'Opción múltiple' ? '🔘' : '📊'}</span>
                            <div className="text-xs font-medium truncate max-w-[240px]" title={q.text}>{q.text}</div>
                            <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[10px]" title="Clasificación">{q.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="px-2 py-0.5 rounded-md border text-[11px]" onClick={() => setExpandedQuestions(prev => ({...prev, [q.id]: !prev[q.id]}))} title="Detalle">{expandedQuestions[q.id] ? '▾' : '▸'}</button>
                            <button className="px-2 py-0.5 rounded-md border text-[11px]" onClick={() => beginEditQuestion(q)} title="Editar">✏️</button>
                            <button className="px-2 py-0.5 rounded-md border text-[11px]" onClick={() => removeQuestion(q.id)} title="Eliminar">🗑️</button>
                          </div>
                        </div>
                        {expandedQuestions[q.id] && (
                          <div className="mt-2">
                            <div className="text-[10px] text-[var(--muted)]">Tipo: {q.type === 'Texto' ? 'Respuesta corta' : q.type}{q.type === 'Opción múltiple' && ` · ${q.options.length} opciones`}{q.type === 'Likert' && ` · ${q?.likert?.points || 0} puntos`}</div>
                            {q.type === 'Likert' && q?.likert?.labels?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {q.likert.labels.map((lab, i) => (
                                  <span key={`${q.id}-lab-${i}`} className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px]">{lab}</span>
                                ))}
                              </div>
                            )}
                            {q.type === 'Opción múltiple' && q.options.length > 0 && (
                              <ul className="grid gap-1 mt-1 list-none p-0 m-0">
                                {q.options.map((o, i) => (
                                  <li key={`${q.id}-opt-${i}`} className="text-[11px]">• {o}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Columna derecha: vista previa (más ancha) */}
          <div className="col-span-6 min-h-0 sticky top-0">
            <Card title="Vista previa de la encuesta" compact dense>
              <div className="grid gap-3 max-h-[420px] overflow-y-auto">
                <div className="text-[12px] text-[var(--muted)]" title="Vista previa">👁️ Vista previa de respuestas</div>
                {questions.length === 0 && (
                  <div className="text-xs text-[var(--muted)]">No hay preguntas aún. Añade preguntas para ver la vista previa.</div>
                )}
                {/* Agrupación por clasificación */}
                {CLASSIFICATIONS.map((c) => {
                  const items = questions.filter((q) => q.category === c)
                  if (items.length === 0) return null
                  return (
                    <div key={`grp-${c}`} className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold">{c}</h4>
                        <span className="text-[11px] text-[var(--muted)]">{items.length} pregunta(s)</span>
                      </div>
                      {items.map((q) => (
                        <div key={`preview-${q.id}`} className="border border-[var(--border)] rounded-md px-3 py-2">
                          <div className="text-xs font-medium mb-1">{q.text}</div>
                          <div className="text-[11px] text-[var(--muted)] mb-1">Tipo: {q.type === 'Texto' ? 'Respuesta corta' : q.type}{q.type === 'Opción múltiple' && ` · ${q.options.length} opciones`}{q.type === 'Likert' && ` · ${q?.likert?.points || 0} puntos`}</div>
                          {q.type === 'Texto' && (
                            <input type="text" placeholder="Tu respuesta" className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs w-full" />
                          )}
                          {q.type === 'Opción múltiple' && (
                            <div className="grid gap-1">
                              {q.options.map((o, i) => (
                                <label key={`prev-${q.id}-opt-${i}`} className="flex items-center gap-2 text-[12px]">
                                  <input type="radio" name={`prev-${q.id}`} />
                                  {o}
                                </label>
                              ))}
                            </div>
                          )}
                          {q.type === 'Likert' && (
                            <div className="grid grid-cols-5 gap-1">
                              {Array.from({ length: q?.likert?.points || 5 }).map((_, i) => (
                                <label key={`prev-${q.id}-lik-${i}`} className="flex items-center gap-2 text-[12px]">
                                  <input type="radio" name={`prev-lik-${q.id}`} />
                                  {q?.likert?.labels?.[i] || i + 1}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EncuestasPage