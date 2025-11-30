import { apiGet, apiPost, apiPut } from './apiClient'

export function fetchAlertasList({ page = 1, page_size = 50, q = '', nivel = '', estado = '', id_usuario = '', desde = '', hasta = '', sort = 'fecha_creacion', order = 'desc' } = {}) {
  return apiGet('alertas/list', { page, page_size, q, nivel, estado, id_usuario, desde, hasta, sort, order })
}

export function crearAlerta({ id_usuario, tipo = 'otros', nivel = 'moderado', estado = 'pendiente', descripcion }) {
  // Normaliza valores admitidos por la BD
  const tiposValidos = ['estres', 'fatiga', 'burnout', 'riesgo_biologico', 'otros']
  const nivelesValidos = ['bajo', 'moderado', 'alto']
  const estadosValidos = ['pendiente', 'en_proceso', 'atendida']
  const t = tiposValidos.includes(tipo) ? tipo : 'otros'
  const n = nivel === 'medio' ? 'moderado' : (nivelesValidos.includes(nivel) ? nivel : 'moderado')
  const e = estadosValidos.includes(estado) ? estado : 'pendiente'
  return apiPost('alertas/', { id_usuario, tipo: t, nivel: n, estado: e, descripcion })
}

export function actualizarAlerta(id, payload = {}) {
  // Permite actualizar nivel, estado, descripcion, observacion, fecha_atencion
  return apiPut(`alertas/${id}`, payload)
}

export function syncAlertasDesdeEncuestas({ fecha, id_encuesta }) {
  // Genera/actualiza alertas automáticamente a partir de resultados diarios
  return apiPost('alertas/sync', { fecha, id_encuesta })
}