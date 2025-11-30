import { apiGet, apiPost, apiPut, apiDelete } from './apiClient'

export function listarProfesionales({ page = 1, page_size = 10, q = '', sort = 'fecha_creacion', order = 'desc' } = {}) {
  return apiGet('profesionales/', { page, page_size, q, sort, order })
}

export function obtenerProfesional(id) {
  return apiGet(`profesionales/${id}`)
}

export function crearProfesional(data) {
  return apiPost('profesionales/', data)
}

export function actualizarProfesional(id, data) {
  return apiPut(`profesionales/${id}`, data)
}

export function eliminarProfesional(id) {
  return apiDelete(`profesionales/${id}`)
}