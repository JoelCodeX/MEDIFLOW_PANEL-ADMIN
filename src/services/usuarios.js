import { apiGet, apiPost, apiPut } from './apiClient'

function getAdminId() {
  const envId = import.meta.env.VITE_ADMIN_ID
  let lsId = null
  try { lsId = localStorage.getItem('admin_id') } catch {}
  return envId || lsId || null
}

export function fetchUsuariosList({ page = 1, page_size = 50, q = '', rol = '', area = '', estado = '', sort = 'fecha_registro', order = 'desc' } = {}) {
  return apiGet('usuarios/list', { page, page_size, q, rol, area, estado, sort, order })
}

export function createUsuario(payload) {
  const id = getAdminId()
  const body = id ? { ...payload, id_admin: Number(id) } : payload
  return apiPost('usuarios/', body)
}

export function updateUsuario(id, payload) {
  const adminId = getAdminId()
  const body = adminId ? { ...payload, id_admin: Number(adminId) } : payload
  return apiPut(`usuarios/${id}`, body)
}

export function syncFirebaseUser(payload) {
  return apiPost('usuarios/sync-firebase', payload)
}