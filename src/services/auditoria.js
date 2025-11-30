import { apiGet } from './apiClient'

export function listarAuditoria({ page = 1, page_size = 20, admin_id = '', accion = '', q = '' } = {}) {
  const params = { page, page_size }
  if (admin_id) params.admin_id = admin_id
  if (accion) params.accion = accion
  if (q) params.q = q
  return apiGet('auditoria/', params)
}