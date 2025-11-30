import { apiGet, apiPost } from './apiClient';

// Lista asignaciones de una encuesta y su estado/resumen
export const listarAsignaciones = (idEncuesta, fecha) => {
  const params = fecha ? { fecha } : undefined;
  return apiGet(`encuestas/${idEncuesta}/asignaciones`, params);
};

// Resumen general de resultados de una encuesta (participación, promedio, distribución, por área)
export const resultadosEncuesta = (idEncuesta, fecha) => {
  const params = fecha ? { fecha } : undefined;
  return apiGet(`encuestas/${idEncuesta}/resultados`, params);
};

// Respuestas detalladas por usuario
export const respuestasUsuario = (idEncuesta, idUsuario) => apiGet(`encuestas/${idEncuesta}/usuario/${idUsuario}`);

// Alias para responder encuesta desde app móvil / cliente
export const responderEncuesta = (idEncuesta, payload) => apiPost(`encuestas/${idEncuesta}/responder`, payload);

// Endpoint alternativo para resultados globales (equivalente al anterior, preparado para extensiones)
export const resultadosGlobal = (idEncuesta, fecha) => {
  const params = fecha ? { fecha } : undefined;
  return apiGet(`encuestas/resultados_encuesta/${idEncuesta}`, params);
};