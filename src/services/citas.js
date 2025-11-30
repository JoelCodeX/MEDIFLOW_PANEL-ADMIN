import { apiGet, apiPost } from './apiClient'

export function fetchCitasList({ page = 1, page_size = 50, estado = '', id_trabajador = '', id_profesional = '', desde = '', hasta = '', sort = 'fecha_cita', order = 'desc' } = {}) {
  return apiGet('citas/list', { page, page_size, estado, id_trabajador, id_profesional, desde, hasta, sort, order })
}

export function crearCita({ id_trabajador, id_profesional, tipo, fecha_cita, observaciones, estado = 'programada' }) {
  return apiPost('citas/', { id_trabajador, id_profesional, tipo, fecha_cita, observaciones, estado })
}