import { apiPost, apiGet } from '@/services/apiClient'

// Asignar un horario de trabajo a un usuario
export async function asignarHorario(body) {
  // body: { id_usuario, dia_semana, hora_entrada, hora_salida, turno?, vigente? }
  return apiPost('horarios/asignar', body)
}

// Asignar múltiples horarios a un usuario
export async function asignarHorarioMultiple(idUsuario, horariosArray) {
  return apiPost('horarios/asignar', {
    id_usuario: idUsuario,
    horarios: horariosArray
  })
}

// Listar horarios por usuario
export async function listarHorariosPorUsuario(id_usuario, params = {}) {
  return apiGet(`horarios/${id_usuario}`, params)
}