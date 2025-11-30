import { apiGet, apiPost, apiPut, apiDelete } from './apiClient'

export function listarEncuestas(params = {}) {
  // params: { estado: 'activas' | 'todas' }
  return apiGet('encuestas/', params)
}

export function crearEncuesta(payload) {
  // payload: { titulo, descripcion, tipo, repeticion, publico, id_creador, schedule, preguntas, audiencia? }
  return apiPost('encuestas/', payload)
}

export function obtenerEncuesta(id) {
  return apiGet(`encuestas/${id}`)
}

export function editarEncuesta(id, payload) {
  return apiPut(`encuestas/${id}`, payload)
}

export function eliminarEncuesta(id) {
  return apiDelete(`encuestas/${id}`)
}

export function agregarPregunta(idEncuesta, pregunta) {
  return apiPost(`encuestas/${idEncuesta}/preguntas`, pregunta)
}

export function editarPregunta(idEncuesta, idPregunta, payload) {
  return apiPut(`encuestas/${idEncuesta}/preguntas/${idPregunta}`, payload)
}

export function eliminarPregunta(idEncuesta, idPregunta) {
  return apiDelete(`encuestas/${idEncuesta}/preguntas/${idPregunta}`)
}

export function asignarEncuesta(idEncuesta, audiencia) {
  return apiPost(`encuestas/${idEncuesta}/asignar`, { audiencia })
}

export function encuestasPendientes(idUsuario) {
  return apiGet(`encuestas/pendientes/${idUsuario}`)
}

export function listarRespuestas(idEncuesta, fecha) {
  const params = fecha ? { fecha } : undefined
  return apiGet(`encuestas/respuestas/encuesta/${idEncuesta}`, params)
}