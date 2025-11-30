import { useMemo, useState } from 'react'
import pkg from '../../package.json'

function ConfiguracionPage() {
  // Gestión de roles
  const rolesIniciales = [
    { rol: 'admin', permisos: { personal: true, alertas: true, reportes: true, bienestar: true, citas: true, configuracion: true } },
    { rol: 'rrhh', permisos: { personal: true, alertas: true, reportes: true, bienestar: true, citas: false, configuracion: false } },
    { rol: 'psicologo', permisos: { personal: false, alertas: true, reportes: true, bienestar: true, citas: true, configuracion: false } },
    { rol: 'trabajador', permisos: { personal: false, alertas: false, reportes: false, bienestar: true, citas: true, configuracion: false } },
  ]
  const [roles, setRoles] = useState(rolesIniciales)
  const togglePermiso = (rolIdx, key) => {
    setRoles(prev => prev.map((r, i) => i !== rolIdx ? r : ({ ...r, permisos: { ...r.permisos, [key]: !r.permisos[key] } })))
  }
  const guardarRoles = () => alert('Roles y permisos guardados')

  // Preferencias del sistema
  const [preferencias, setPreferencias] = useState({
    nombreInstitucion: 'MediFlow Corp',
    colorPrimario: '#55AB44',
    logoUrl: '/logotipo.svg',
  })
  const guardarPreferencias = () => alert('Preferencias del sistema guardadas')

  // Seguridad y autenticación
  const [emailReset, setEmailReset] = useState('')
  const resetearContrasena = () => {
    if (!emailReset) return alert('Ingrese el correo del usuario')
    alert(`Se envió enlace de reset a: ${emailReset}`)
  }
  const cerrarSesiones = () => alert('Sesiones activas cerradas en todos los usuarios seleccionados')

  // Integraciones externas
  const [integraciones, setIntegraciones] = useState({
    supabaseUrl: '', supabaseKey: '', fcmKey: '', apiBase: ''
  })
  const guardarIntegraciones = () => alert('Integraciones guardadas')

  // Respaldo de datos (CSV de roles y parámetros)
  const exportCSV = (nombre, headers, rows) => {
    const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"'
    const csv = [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = nombre; a.click(); URL.revokeObjectURL(url)
  }
  const exportarRoles = () => {
    const headers = ['rol','personal','alertas','reportes','bienestar','citas','configuracion']
    const rows = roles.map(r => [r.rol, r.permisos.personal, r.permisos.alertas, r.permisos.reportes, r.permisos.bienestar, r.permisos.citas, r.permisos.configuracion])
    exportCSV('roles.csv', headers, rows)
  }
  const exportarParametros = () => {
    const headers = ['nombreInstitucion','colorPrimario','logoUrl']
    const rows = [[preferencias.nombreInstitucion, preferencias.colorPrimario, preferencias.logoUrl]]
    exportCSV('parametros.csv', headers, rows)
  }

  const version = useMemo(() => pkg.version || '0.0.0', [])

  return (
    <div className="grid gap-3">
      <h1 className="text-base font-semibold">Configuración del Sistema</h1>

      {/* Gestión de roles */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="m-0 text-sm font-medium">Gestión de roles</p>
          <button className="px-3 py-1 rounded-full border text-sm" onClick={guardarRoles}>Guardar roles</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[var(--muted)] text-xs">
                <th className="text-left px-2 py-1 border-b">Rol</th>
                {['personal','alertas','reportes','bienestar','citas','configuracion'].map(k => (
                  <th key={`h-${k}`} className="text-left px-2 py-1 border-b capitalize">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((r, i) => (
                <tr key={r.rol} className="text-sm">
                  <td className="px-2 py-1 border-b font-medium">{r.rol}</td>
                  {Object.keys(r.permisos).map((k) => (
                    <td key={`${r.rol}-${k}`} className="px-2 py-1 border-b">
                      <input type="checkbox" checked={r.permisos[k]} onChange={() => togglePermiso(i, k)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preferencias del sistema */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="m-0 text-sm font-medium">Preferencias del sistema</p>
          <button className="px-3 py-1 rounded-full border text-sm" onClick={guardarPreferencias}>Guardar preferencias</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Nombre institucional</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={preferencias.nombreInstitucion} onChange={e => setPreferencias(s => ({ ...s, nombreInstitucion: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Color primario</label>
            <input type="color" className="w-full border rounded-md h-[36px]" value={preferencias.colorPrimario} onChange={e => setPreferencias(s => ({ ...s, colorPrimario: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Logo (URL)</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={preferencias.logoUrl} onChange={e => setPreferencias(s => ({ ...s, logoUrl: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Seguridad y autenticación */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-3">
        <p className="m-0 mb-2 text-sm font-medium">Seguridad y autenticación</p>
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted)] mb-1">Correo del usuario para reset</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="usuario@dominio.com" value={emailReset} onChange={e => setEmailReset(e.target.value)} />
          </div>
          <button className="px-3 py-2 rounded-md border" onClick={resetearContrasena}>Resetear contraseña</button>
          <div className="col-span-3">
            <button className="px-3 py-2 rounded-md border" onClick={cerrarSesiones}>Cerrar sesiones activas</button>
          </div>
        </div>
      </div>

      {/* Integraciones externas */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="m-0 text-sm font-medium">Integraciones externas</p>
          <button className="px-3 py-1 rounded-full border text-sm" onClick={guardarIntegraciones}>Guardar integraciones</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Supabase URL</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={integraciones.supabaseUrl} onChange={e => setIntegraciones(s => ({ ...s, supabaseUrl: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Supabase Key</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={integraciones.supabaseKey} onChange={e => setIntegraciones(s => ({ ...s, supabaseKey: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">FCM Server Key</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={integraciones.fcmKey} onChange={e => setIntegraciones(s => ({ ...s, fcmKey: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">API Base URL</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={integraciones.apiBase} onChange={e => setIntegraciones(s => ({ ...s, apiBase: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Respaldo de datos */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-3">
        <p className="m-0 mb-2 text-sm font-medium">Respaldo de datos</p>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 rounded-full border text-sm" onClick={exportarRoles}>Exportar roles (CSV)</button>
          <button className="px-3 py-1.5 rounded-full border text-sm" onClick={exportarParametros}>Exportar parámetros (CSV)</button>
        </div>
      </div>

      {/* Acerca de / versión */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-3">
        <p className="m-0 mb-1 text-sm font-medium">Acerca de</p>
        <div className="text-sm">
          <p className="m-0">MediFlow — Plataforma de salud ocupacional.</p>
          <p className="m-0">Versión: <span className="font-semibold">v{version}</span></p>
          <p className="m-0">Institución: {preferencias.nombreInstitucion}</p>
          <p className="m-0 text-[var(--muted)]">Créditos: Equipo de Investigación XI-CICLO</p>
        </div>
      </div>
    </div>
  )
}

export default ConfiguracionPage