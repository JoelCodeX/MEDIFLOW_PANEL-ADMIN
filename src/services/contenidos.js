import { apiGet, apiPost, apiPut, apiDelete, apiPostForm } from './apiClient'

// ===== Contenidos Educativos =====
export function listarContenidos({ q = '', tipo = '', sort = 'fecha_publicacion', order = 'desc', page = 1, page_size = 50 } = {}) {
  return apiGet('contenidos/list', { q, tipo, sort, order, page, page_size })
}

export function crearContenido(payload) {
  // payload: { titulo, descripcion?, tipo, url_archivo?, publicado_por? }
  return apiPost('contenidos/', payload)
}

export function obtenerContenido(id) {
  return apiGet(`contenidos/${id}`)
}

export function editarContenido(id, payload) {
  return apiPut(`contenidos/${id}`, payload)
}

export function eliminarContenido(id) {
  return apiDelete(`contenidos/${id}`)
}

// ===== Interacciones =====
export function registrarInteraccion({ id_usuario, id_contenido, tipo_interaccion }) {
  return apiPost('contenidos/interaccion', { id_usuario, id_contenido, tipo_interaccion })
}

export function resumenInteraccionPorContenido(id_contenido) {
  return apiGet('contenidos/interaccion/resumen', { id_contenido })
}

export function interaccionPorUsuario(id_usuario, params = {}) {
  return apiGet(`contenidos/interaccion/usuario/${id_usuario}`, params)
}

// ===== Upload (Firebase Storage) =====
// Recibe un FormData con: file, tipo, titulo?, descripcion?, folder?
export function uploadContenido(formData) {
  return apiPostForm('contenidos/upload', formData)
}