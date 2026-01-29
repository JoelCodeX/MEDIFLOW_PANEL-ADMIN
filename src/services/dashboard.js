import { apiGet } from './apiClient'

export async function getDashboardStats(period = 'mensual') {
  return apiGet(`meta/dashboard?period=${period}`)
}
