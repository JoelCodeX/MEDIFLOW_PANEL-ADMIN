import { useMemo, useState, useEffect } from 'react'
import Card from '@/components/Card'
import { fetchUsuariosList, createUsuario, updateUsuario } from '@/services/usuarios'
import { listarHorariosPorUsuario } from '@/services/horarios'
import { asignarHorario, asignarHorarioMultiple } from '@/services/horarios'
import { FaEye, FaRegEdit, FaStop, FaPlay  } from "react-icons/fa"

const initialUsers = []

// Lista estática de Roles
const ROLES_OPCIONES = [
  "Asistencial",
  "Administrativo",
  "Técnico",
  "Profesional de salud",
  "Directivo",
  "Operativo",
  "Apoyo diagnóstico",
  "Apoyo terapéutico",
  "Servicios generales",
  "Salud ocupacional",
  "Seguridad y salud en el trabajo",
  "Educador en salud",
  "Investigador",
  "Coordinador",
  "Supervisor"
]

// Lista estática de Áreas
const AREAS_OPCIONES = [
  "Medicina general",
  "Medicina especializada",
  "Enfermería",
  "Obstetricia",
  "Psicología",
  "Odontología",
  "Nutrición",
  "Terapia física y rehabilitación",
  "Laboratorio clínico",
  "Radiología e imagenología",
  "Farmacia",
  "Emergencias y urgencias",
  "Hospitalización",
  "Centro quirúrgico",
  "Centro obstétrico",
  "Banco de sangre",
  "Servicio de imágenes",
  "Farmacotecnia",
  "Rehabilitación física",
  "Dirección médica",
  "Dirección administrativa",
  "Recursos humanos",
  "Logística y almacén",
  "Contabilidad y finanzas",
  "Estadística e informática",
  "Archivo clínico",
  "Atención al usuario",
  "Mantenimiento",
  "Limpieza y desinfección",
  "Seguridad y vigilancia",
  "Alimentación y cocina",
  "Lavandería"
]

// Lista estática de Cargos
const CARGOS_OPCIONES = [
  "Médico general",
  "Médico especialista",
  "Enfermero/a",
  "Obstetra",
  "Psicólogo/a",
  "Odontólogo/a",
  "Nutricionista",
  "Técnico de laboratorio",
  "Técnico en radiología",
  "Químico farmacéutico",
  "Técnico en farmacia",
  "Cirujano",
  "Anestesiólogo",
  "Personal de limpieza",
  "Personal de vigilancia",
  "Cocinero/a",
  "Lavandero/a",
  "Administrador",
  "Contador",
  "Estadístico",
  "Archivador clínico",
  "Recepcionista",
  "Jefe de recursos humanos",
  "Coordinador de salud ocupacional",
  "Inspector de SST",
  "Ergónomo/a",
  "Higienista industrial",
  "Técnico en seguridad laboral",
  "Miembro del comité SST",
  "Director médico",
  "Director administrativo",
  "Educador en salud",
  "Promotor de salud",
  "Investigador clínico"
]

function PersonalPage() {
  const [usuarios, setUsuarios] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterRol, setFilterRol] = useState('')
  const [filterEstado, setFilterEstado] = useState('') // '', 'activo', 'inactivo'

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(null) // user or null
  const [showDetail, setShowDetail] = useState(null) // user or null
  const [showAssign, setShowAssign] = useState(null) // { id, nombre, apellido } or null
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchUsuariosList({ page, page_size: pageSize, q: search, area: filterArea, rol: filterRol, estado: filterEstado, sort: 'fecha_registro', order: 'desc' })
        const items = data.items || []
        setUsuarios(items)
        const total = (typeof data.total === 'number' ? data.total : (typeof data.count === 'number' ? data.count : items.length))
        const pages = (typeof data.pages === 'number' ? data.pages : Math.max(1, Math.ceil(total / pageSize)))
        setTotalItems(total)
        setTotalPages(pages)
      } catch (e) {
        console.error('Error cargando usuarios:', e)
      }
    }
    load()
  }, [search, filterArea, filterRol, filterEstado, page, pageSize])

  // Reiniciar a la primera página al cambiar filtros o búsqueda
  useEffect(() => {
    setPage(1)
  }, [search, filterArea, filterRol, filterEstado])

  const filtered = useMemo(() => {
    return usuarios.filter((u) => {
      const term = search.toLowerCase()
      const matchesSearch = term
        ? `${u.nombre} ${u.apellido}`.toLowerCase().includes(term) || (u.area || '').toLowerCase().includes(term) || (u.rol || '').toLowerCase().includes(term)
        : true
      const matchesArea = filterArea ? u.area === filterArea : true
      const matchesRol = filterRol ? u.rol === filterRol : true
      const matchesEstado = filterEstado ? u.estado === filterEstado : true
      return matchesSearch && matchesArea && matchesRol && matchesEstado
    })
  }, [usuarios, search, filterArea, filterRol, filterEstado])

  const handleSuspend = async (userId) => {
    try {
      const current = usuarios.find(u => u.id === userId)
      const nextEstado = current?.estado === 'activo' ? 'inactivo' : 'activo'
      await updateUsuario(userId, { estado: nextEstado })
      const refreshed = await fetchUsuariosList({ page, page_size: pageSize, q: search, area: filterArea, rol: filterRol, estado: filterEstado, sort: 'fecha_registro', order: 'desc' })
      setUsuarios(refreshed.items || [])
    } catch (e) {
      console.error('Error actualizando estado:', e)
      alert('No se pudo actualizar el estado')
    }
  }

  const handleEdit = async (id, data) => {
    try {
      await updateUsuario(id, data)
      const refreshed = await fetchUsuariosList({ page, page_size: pageSize, q: search, area: filterArea, rol: filterRol, estado: filterEstado, sort: 'fecha_registro', order: 'desc' })
      setUsuarios(refreshed.items || [])
      setShowEdit(null)
    } catch (e) {
      console.error('Error editando usuario:', e)
      alert('No se pudo guardar los cambios')
    }
  }

  const handleCreate = async (data) => {
    try {
      const resp = await createUsuario(data)
      const refreshed = await fetchUsuariosList({ page, page_size: pageSize, q: search, area: filterArea, rol: filterRol, estado: filterEstado, sort: 'fecha_registro', order: 'desc' })
      setUsuarios(refreshed.items || [])
      setShowCreate(false)
      
      // Manejar diferentes tipos de respuesta del backend
      if (resp?.temp_password && resp?.password_reset_link) {
        // Usuario creado con contraseña temporal y enlace de restablecimiento
        const message = `✅ Usuario creado exitosamente en Firebase y MySQL\n\n` +
                       `📧 Correo: ${resp.correo}\n` +
                       `🔑 Contraseña temporal (DNI): ${resp.temp_password}\n\n` +
                       `🔗 Enlace para cambiar contraseña:\n${resp.password_reset_link}\n\n` +
                       `${resp.email_sent ? '✉️ Se envió automáticamente al correo registrado.' : '💡 Comparte esta información con el trabajador para que pueda acceder a la aplicación móvil.'}`
        alert(message)
      } else if (resp?.password_reset_link) {
        // Solo enlace de restablecimiento (usuario ya existía en Firebase)
        alert(`✅ Usuario sincronizado exitosamente\n\n🔗 Enlace para establecer contraseña:\n${resp.password_reset_link}\n\n${resp.email_sent ? '✉️ Se envió automáticamente al correo registrado.' : ''}`)
      } else if (resp?.message) {
        // Mensaje personalizado del backend
        alert(`✅ ${resp.message}${resp.email_sent ? '\n\n✉️ Se envió automáticamente al correo registrado.' : ''}`)
      } else {
        // Creación exitosa sin información adicional
        alert('✅ Usuario creado exitosamente')
      }

      // Abrir modal para asignar horario si tenemos el ID del usuario
      if (resp && resp.id) {
        setShowAssign({ id: resp.id, nombre: resp.nombre, apellido: resp.apellido })
      }
    } catch (e) {
      console.error('Error creando usuario:', e)
      
      // Manejar diferentes tipos de error
      let errorMessage = 'No se pudo crear el usuario'
      if (e.response?.data?.message) {
        errorMessage = e.response.data.message
      } else if (e.message) {
        errorMessage = e.message
      }
      
      alert(`❌ Error: ${errorMessage}`)
    }
  }

  const areas = useMemo(() => AREAS_OPCIONES, [])
  const roles = useMemo(() => ROLES_OPCIONES, [])

  return (
    <div className="grid gap-4">
      <h2 className="text-sm text-[var(--muted)]">Personal</h2>

      {/* Sección: Búsqueda y filtros */}
      <Card title="Búsqueda y filtros" compact>
        <div className="flex items-center gap-2 mb-2 text-sm">
          <input
            className="border border-[var(--border)] rounded-full px-3 py-2 w-64 text-sm"
            placeholder="Buscar nombre, área o rol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-[var(--border)] rounded-full px-3 py-2 text-sm"
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
          >
            <option value="">Área</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            className="border border-[var(--border)] rounded-full px-3 py-2 text-sm"
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
          >
            <option value="">Rol</option>
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className="border border-[var(--border)] rounded-full px-3 py-2 text-sm"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Estado</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          <button className="ml-auto px-3 py-2.5 rounded-full border border-[var(--border)] bg-[var(--primary)] text-white text-xs" onClick={() => setShowCreate(true)}>Agregar nuevo usuario</button>
        </div>
      </Card>

      {/* Sección: Listado de trabajadores */}
      <Card title="Listado de trabajadores" compact minH={280}>
        {/* Contenedor scrollable para la tabla */}
        <div className="overflow-auto max-h-[50vh] min-h-[200px]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-[var(--muted)] font-semibold text-xs">
              <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">#</th>
              <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Nombre</th>
              <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Área</th>
              <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Rol</th>
              <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Estado</th>
              <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Fecha de registro</th>
              <th className="sticky top-0 bg-white z-10 text-left px-2 py-1 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="px-2 py-1 border-b">{u.id}</td>
                <td className="px-2 py-1 border-b">{u.nombre} {u.apellido}</td>
                <td className="px-2 py-1 border-b">{u.area}</td>
                <td className="px-2 py-1 border-b">{u.rol}</td>
                <td className="px-2 py-1 border-b">
                  <span className={`px-2 py-1 rounded text-xs ${u.estado === 'activo' ? 'bg-[var(--success)]/40' : 'bg-[#f97316]/20'}`}>{u.estado}</span>
                </td>
                <td className="px-2 py-1 border-b">{u.fecha_registro}</td>
                <td className="px-2 py-1 border-b">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--muted)]/10 text-blue-500" aria-label="Ver detalle" title="Ver detalle" onClick={() => setShowDetail(u)}>
                      <FaEye size={16} />
                    </button>
                    <button className="p-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--muted)]/10 text-orange-500" aria-label="Editar" title="Editar" onClick={() => setShowEdit(u)}>
                      <FaRegEdit size={16} />
                    </button>
                    <button className="p-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--muted)]/10"
                      aria-label={u.estado === 'activo' ? 'Suspender' : 'Activar'}
                      title={u.estado === 'activo' ? 'Suspender' : 'Activar'}
                      onClick={() => handleSuspend(u.id)}
                    >
                      {u.estado === 'activo' 
                        ? <FaStop size={16} className="text-red-500" />
                        : <FaPlay size={16} className="text-green-500" />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-6 text-[var(--muted)] text-sm">No hay resultados</div>
        )}
        </div>
        <div className="flex items-center justify-between px-3 py-2 mt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">Página {page} de {totalPages} • {totalItems} registros</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--muted)]">Por página:</span>
              <select
                className="px-2 py-1 rounded-full border text-xs"
                value={pageSize}
                onChange={(e) => { const val = Number(e.target.value); setPageSize(val); setPage(1); }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-full border text-xs"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >Anterior</button>
            <div className="flex items-center gap-1">
              {(() => {
                const range = 2
                const start = Math.max(1, page - range)
                const end = Math.min(totalPages, page + range)
                const pages = []
                if (start > 1) pages.push(1)
                if (start > 2) pages.push('...')
                for (let p = start; p <= end; p++) pages.push(p)
                if (end < totalPages - 1) pages.push('...')
                if (end < totalPages) pages.push(totalPages)
                return pages
              })().map((p, idx) => (
                typeof p === 'number' ? (
                  <button
                    key={`p-${p}`}
                    className={`px-2.5 py-1 rounded-full border text-xs ${p === page ? 'bg-primary text-white' : 'bg-white'}`}
                    onClick={() => setPage(p)}
                  >{p}</button>
                ) : (
                  <span key={`el-${idx}`} className="px-2 text-xs text-[var(--muted)]">...</span>
                )
              ))}
            </div>
            <button
              className="px-3 py-1.5 rounded-full border bg-primary text-white text-xs disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >Siguiente</button>
          </div>
        </div>
      </Card>

      {/* Modal: Crear nuevo usuario (compacto) */}
      {showCreate && (
        <Modal title="Registrar nuevo usuario" onClose={() => setShowCreate(false)} compact>
          <UserForm onSubmit={handleCreate} compact />
        </Modal>
      )}

      {/* Modal: Editar usuario (compacto) */}
      {showEdit && (
        <Modal title={`Editar usuario: ${showEdit.nombre} ${showEdit.apellido}`} onClose={() => setShowEdit(null)} compact>
          <EditForm user={showEdit} onSubmit={(data) => handleEdit(showEdit.id, data)} />
        </Modal>
      )}

      {/* Modal: Detalle del trabajador */}
      {showDetail && (
        <Modal title={`Detalle del trabajador`} onClose={() => setShowDetail(null)}>
          <DetailView 
            user={showDetail}
            onEditSchedule={(u) => {
              setShowDetail(null)
              setShowAssign({ id: u.id, nombre: u.nombre, apellido: u.apellido })
            }}
          />
        </Modal>
      )}

       {/* Modal: Asignar horario al usuario recién creado */}
       {showAssign && (
         <Modal title={`Asignar horarios a ${showAssign.nombre} ${showAssign.apellido}`} onClose={() => setShowAssign(null)}>
           <AssignScheduleForm
             userId={showAssign.id}
             userName={`${showAssign.nombre} ${showAssign.apellido}`}
             onClose={() => setShowAssign(null)}
             onSuccess={() => {
               // Refrescar la lista de usuarios si es necesario
               console.log('Horarios asignados exitosamente');
             }}
           />
         </Modal>
       )}
    </div>
  )
}

function Modal({ title, children, onClose, compact = false }) {
  const containerBase = "bg-white border border-[var(--border)] shadow-xl w-full overflow-hidden"
  const containerSize = compact ? "max-w-xl" : "max-w-2xl"
  const containerRadius = compact ? "rounded-2xl" : "rounded-xl"
  const bodyPadding = compact ? "p-2" : "p-3"

  return (
    <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
      <div className={`${containerBase} ${containerSize} ${containerRadius}`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button className="px-2 py-1 rounded-full border text-xs" onClick={onClose}>Cerrar</button>
        </div>
        <div className={bodyPadding}>{children}</div>
      </div>
    </div>
  )
}

function UserForm({ onSubmit, compact = false }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    rol: 'trabajador',
    dni: '',
    area: '',
    cargo: '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!form.apellido.trim()) newErrors.apellido = 'El apellido es requerido'
    if (!form.correo.trim()) {
      newErrors.correo = 'El correo es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      newErrors.correo = 'Formato de correo inválido'
    }
    // Validación de DNI: requerido y 8 dígitos numéricos
    if (!form.dni.trim()) {
      newErrors.dni = 'El DNI es requerido'
    } else if (!/^\d{8}$/.test(form.dni.trim())) {
      newErrors.dni = 'El DNI debe tener 8 dígitos'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return
    onSubmit(form)
  }

  const areas = AREAS_OPCIONES
  const cargos = CARGOS_OPCIONES

  return (
    <div className={compact ? "space-y-3 text-sm" : "space-y-4"}>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2">
        <h4 className="font-medium text-blue-800 mb-1 text-sm">💡 Información importante</h4>
        <p className="text-xs text-blue-700">
          • La contraseña temporal será el <strong>DNI</strong> del trabajador (8 dígitos)<br/>
          • Se generará un enlace para que el trabajador cambie su contraseña
        </p>
      </div>

      <form className="grid grid-cols-2 gap-2" onSubmit={handleSubmit}>

        <div>
          <label className="block text-xs font-medium mb-1">Nombre *</label>
          <input 
            className={`w-full border rounded-lg px-2 py-1.5 text-sm ${errors.nombre ? 'border-red-500' : ''}`}
            placeholder="Nombre del trabajador" 
            name="nombre" 
            value={form.nombre} 
            onChange={handleChange} 
            required 
          />
          {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Apellido *</label>
          <input 
            className={`w-full border rounded-lg px-2 py-1.5 text-sm ${errors.apellido ? 'border-red-500' : ''}`}
            placeholder="Apellido del trabajador" 
            name="apellido" 
            value={form.apellido} 
            onChange={handleChange} 
            required 
          />
          {errors.apellido && <p className="text-xs text-red-500 mt-1">{errors.apellido}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Correo electrónico *</label>
          <input 
            className={`w-full border rounded-lg px-2 py-1.5 text-sm ${errors.correo ? 'border-red-500' : ''}`}
            placeholder="correo@hospital.com" 
            name="correo" 
            type="email"
            value={form.correo} 
            onChange={handleChange} 
            required 
          />
          {errors.correo && <p className="text-xs text-red-500 mt-1">{errors.correo}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">DNI *</label>
          <input 
            className={`w-full border rounded-lg px-2 py-1.5 text-sm ${errors.dni ? 'border-red-500' : ''}`} 
            placeholder="12345678" 
            name="dni" 
            value={form.dni} 
            onChange={handleChange} 
            required
          />
          {errors.dni && <p className="text-xs text-red-500 mt-1">{errors.dni}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Rol</label>
          <select 
            className="w-full border rounded-lg px-2 py-1.5 text-sm" 
            name="rol" 
            value={form.rol} 
            onChange={handleChange}
          >
            <option value="">Seleccionar rol</option>
            {ROLES_OPCIONES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Área</label>
          <select 
            className="w-full border rounded-lg px-2 py-1.5 text-sm" 
            name="area" 
            value={form.area} 
            onChange={handleChange}
          >
            <option value="">Seleccionar área</option>
            {areas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Cargo</label>
          <select 
            className="w-full border rounded-lg px-2 py-1.5 text-sm" 
            name="cargo" 
            value={form.cargo} 
            onChange={handleChange}
          >
            <option value="">Seleccionar cargo</option>
            {cargos.map((cargo) => (
              <option key={cargo} value={cargo}>{cargo}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 flex justify-end gap-2 mt-3">
          <button 
            type="submit" 
            className="px-4 py-1.5 rounded-full bg-primary text-white text-xs hover:bg-primary/90 transition-colors"
          >
            Crear Usuario
          </button>
        </div>
      </form>
    </div>
  )
}


function EditForm({ user, onSubmit }) {
  const [form, setForm] = useState({
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    correo: user.correo || '',
    rol: user.rol || '',
    area: user.area || '',
    cargo: user.cargo || '',
    estado: user.estado || 'activo',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form className="grid grid-cols-2 gap-2 text-sm" onSubmit={handleSubmit}>
      <div>
        <label className="block text-xs font-medium mb-1">Nombre</label>
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Apellido</label>
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="Apellido" name="apellido" value={form.apellido} onChange={handleChange} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">DNI (solo lectura)</label>
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm bg-gray-100" value={user.dni || ''} readOnly />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Correo</label>
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="correo@hospital.com" name="correo" value={form.correo} onChange={handleChange} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Rol</label>
        <select className="w-full border rounded-lg px-2 py-1.5 text-sm" name="rol" value={form.rol} onChange={handleChange}>
          <option value="">Seleccionar rol</option>
          {ROLES_OPCIONES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Área</label>
        <select className="w-full border rounded-lg px-2 py-1.5 text-sm" name="area" value={form.area} onChange={handleChange}>
          <option value="">Seleccionar área</option>
          {AREAS_OPCIONES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Cargo</label>
        <select className="w-full border rounded-lg px-2 py-1.5 text-sm" name="cargo" value={form.cargo} onChange={handleChange}>
          <option value="">Seleccionar cargo</option>
          {CARGOS_OPCIONES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Estado</label>
        <select className="w-full border rounded-lg px-2 py-1.5 text-sm" name="estado" value={form.estado} onChange={handleChange}>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
      <div className="col-span-2 flex justify-end gap-2 mt-3">
        <button type="submit" className="px-4 py-1.5 rounded-full bg-primary text-white text-xs">Guardar cambios</button>
      </div>
    </form>
  )
}

function DetailView({ user, onEditSchedule }) {
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await listarHorariosPorUsuario(user.id)
        setHorarios(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.message || 'No se pudieron cargar los horarios')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[var(--border)] rounded-xl p-3 text-sm">
          <p className="font-medium">Información del trabajador</p>
          <ul className="text-xs m-0">
            <li><span className="text-[var(--muted)]">Nombre: </span>{user.nombre} {user.apellido}</li>
            <li><span className="text-[var(--muted)]">Correo: </span>{user.correo}</li>
            <li><span className="text-[var(--muted)]">Rol: </span>{user.rol}</li>
            <li><span className="text-[var(--muted)]">DNI: </span>{user.dni}</li>
            <li><span className="text-[var(--muted)]">Área: </span>{user.area}</li>
            <li><span className="text-[var(--muted)]">Cargo: </span>{user.cargo}</li>
            <li><span className="text-[var(--muted)]">Fecha de registro: </span>{user.fecha_registro}</li>
            <li><span className="text-[var(--muted)]">Estado: </span>{user.estado}</li>
          </ul>
        </div>
        <div className="bg-white border border-[var(--border)] rounded-xl p-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">Horarios asignados</p>
            <button className="px-3 py-1 rounded-full bg-primary text-white text-xs" onClick={() => onEditSchedule?.(user)}>
              Editar horarios
            </button>
          </div>
          {loading ? (
            <p className="text-xs text-[var(--muted)] mt-2">Cargando horarios...</p>
          ) : error ? (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          ) : horarios.length === 0 ? (
            <p className="text-xs text-[var(--muted)] mt-2">Sin horarios asignados</p>
          ) : (
            <ul className="text-xs m-0 mt-2">
              {horarios.map((h) => (
                <li key={h.id} className="py-1 border-b last:border-0 border-[var(--border)]">
                  <span className="font-medium">{h.dia_semana}:</span> {h.hora_entrada}–{h.hora_salida}
                  {h.hora_refrigerio ? ` · Refrigerio ${h.hora_refrigerio} (${h.duracion_refrigerio}m)` : ''}
                  {` · Turno ${h.turno}`} {h.vigente ? '' : '· No vigente'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// export default handled at end of file

// Componente para asignar horarios múltiples
const AssignScheduleForm = ({ userId, userName, onClose, onSuccess }) => {
  // Preselección de días laborables (L–V)
  const [selectedDays, setSelectedDays] = useState(['Lunes','Martes','Miércoles','Jueves','Viernes']);
  const [scheduleData, setScheduleData] = useState({
    hora_entrada: '08:00',
    hora_salida: '17:00',
    hora_refrigerio: '13:00',
    duracion_refrigerio: 60,
    turno: 'mañana'
  });
  // Guardar estado original para validar si existen cambios
  const [originalSelectedDays, setOriginalSelectedDays] = useState(null);
  const [originalScheduleData, setOriginalScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const diasSemana = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ];

  // Al abrir para editar, precargar horarios existentes del usuario
  useEffect(() => {
    let mounted = true;
    const loadExisting = async () => {
      setLoading(true);
      try {
        const existing = await listarHorariosPorUsuario(userId, { vigente: true });
        const arr = Array.isArray(existing) ? existing : [];
        if (arr.length > 0) {
          // Preseleccionar días con horario vigente
          const days = arr.map(h => h.dia_semana);
          // Calcular valores comunes (si todos comparten el mismo valor)
          const common = (key) => {
            const vals = arr.map(h => h[key]).filter(v => v != null);
            return vals.length > 0 && vals.every(v => v === vals[0]) ? vals[0] : null;
          };
          const commonEntrada = common('hora_entrada') || scheduleData.hora_entrada;
          const commonSalida = common('hora_salida') || scheduleData.hora_salida;
          const commonRefr = common('hora_refrigerio');
          const commonDur = common('duracion_refrigerio');
          const commonTurno = common('turno') || scheduleData.turno;

          if (mounted) {
            setSelectedDays(days.length ? days : selectedDays);
            setScheduleData(prev => ({
              ...prev,
              hora_entrada: commonEntrada,
              hora_salida: commonSalida,
              hora_refrigerio: commonRefr != null ? commonRefr : prev.hora_refrigerio,
              duracion_refrigerio: Number.isFinite(commonDur) ? commonDur : prev.duracion_refrigerio,
              turno: commonTurno,
            }));
            // Guardar originales para validación de cambios
            setOriginalSelectedDays(days);
            setOriginalScheduleData({
              hora_entrada: commonEntrada,
              hora_salida: commonSalida,
              hora_refrigerio: commonRefr != null ? commonRefr : null,
              duracion_refrigerio: Number.isFinite(commonDur) ? commonDur : null,
              turno: commonTurno,
            });
          }
        } else {
          // No existen horarios previos, tratar como creación
          setOriginalSelectedDays(null);
          setOriginalScheduleData(null);
        }
      } catch (e) {
        console.warn('No se pudo precargar horarios existentes:', e);
      } finally {
        setLoading(false);
      }
    };
    loadExisting();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleDayToggle = (dia) => {
    setSelectedDays(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const toMinutes = (hhmm) => {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedDays.length === 0) {
      alert('Debe seleccionar al menos un día');
      return;
    }

    const ent = toMinutes(scheduleData.hora_entrada);
    const sal = toMinutes(scheduleData.hora_salida);
    const ref = toMinutes(scheduleData.hora_refrigerio);
    const dur = Number(scheduleData.duracion_refrigerio || 0);

    if (ent == null || sal == null) {
      alert('Debe completar las horas de entrada y salida');
      return;
    }
    if (ent >= sal) {
      alert('La hora de entrada debe ser menor que la hora de salida');
      return;
    }
    if (ref != null) {
      if (ref < ent || ref >= sal) {
        alert('El refrigerio debe estar dentro del rango de trabajo');
        return;
      }
      if (ref + dur > sal) {
        alert('El fin del refrigerio no puede exceder la hora de salida');
        return;
      }
    }

    // Validar que haya cambios respecto al estado original (solo si había horarios previos)
    const arraysIguales = (a, b) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      const sa = [...a].sort();
      const sb = [...b].sort();
      return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
    };
    const iguales = (a, b) => String(a || '') === String(b || '');
    if (originalSelectedDays && originalScheduleData) {
      const noCambioDias = arraysIguales(selectedDays, originalSelectedDays);
      const noCambioHoras = iguales(scheduleData.hora_entrada, originalScheduleData.hora_entrada)
        && iguales(scheduleData.hora_salida, originalScheduleData.hora_salida);
      const noCambioRefr = iguales(scheduleData.hora_refrigerio || null, originalScheduleData.hora_refrigerio || null)
        && (Number(scheduleData.duracion_refrigerio || 0) === Number(originalScheduleData.duracion_refrigerio || 0));
      const noCambioTurno = iguales(scheduleData.turno, originalScheduleData.turno);
      if (noCambioDias && noCambioHoras && noCambioRefr && noCambioTurno) {
        alert('No se detectaron cambios. Modifique al menos días, horas o turno.');
        return;
      }
    }

    setLoading(true);
    try {
      // Crear array de horarios para cada día seleccionado
      const horariosArray = selectedDays.map(dia => ({
        dia_semana: dia,
        hora_entrada: scheduleData.hora_entrada,
        hora_salida: scheduleData.hora_salida,
        hora_refrigerio: scheduleData.hora_refrigerio || null,
        duracion_refrigerio: scheduleData.hora_refrigerio ? dur : 60,
        turno: scheduleData.turno,
        vigente: true
      }));

      await asignarHorarioMultiple(userId, horariosArray);
      alert(`Horarios ${originalSelectedDays ? 'actualizados' : 'asignados'} exitosamente para ${selectedDays.length} día(s)`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al asignar horarios:', error);
      alert('Error al asignar horarios: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="text-center mb-4">
        <h3 className="text-sm font-semibold">Asignar horarios</h3>
        <p className="text-xs text-[var(--muted)]">Usuario: {userName}</p>
      </div>

      {/* Selección de días */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Días de la semana
        </label>
        <div className="grid grid-cols-2 gap-2">
          {diasSemana.map(dia => (
            <label key={dia} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedDays.includes(dia)}
                onChange={() => handleDayToggle(dia)}
                className="rounded-lg border-gray-300"
              />
              <span className="text-xs">{dia}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded-full border"
            onClick={() => setSelectedDays(['Lunes','Martes','Miércoles','Jueves','Viernes'])}
            disabled={loading}
          >
            Preseleccionar L–V
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded-full border"
            onClick={() => setNotice('Horario copiado a todos los días seleccionados')}
            disabled={loading}
          >
            Copiar horario a todos
          </button>
        </div>
      </div>

      {/* Horarios */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Hora de Entrada
          </label>
          <input
            type="time"
            value={scheduleData.hora_entrada}
            onChange={(e) => setScheduleData(prev => ({...prev, hora_entrada: e.target.value}))}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Hora de Salida
          </label>
          <input
            type="time"
            value={scheduleData.hora_salida}
            onChange={(e) => setScheduleData(prev => ({...prev, hora_salida: e.target.value}))}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            required
          />
        </div>
      </div>

      {/* Hora de refrigerio */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Hora de Refrigerio (opcional)
          </label>
          <input
            type="time"
            value={scheduleData.hora_refrigerio}
            onChange={(e) => setScheduleData(prev => ({...prev, hora_refrigerio: e.target.value}))}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Duración Refrigerio (minutos)
          </label>
          <input
            type="number"
            min="15"
            max="120"
            step="15"
            value={scheduleData.duracion_refrigerio}
            onChange={(e) => setScheduleData(prev => ({...prev, duracion_refrigerio: parseInt(e.target.value)}))}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Turno */}
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Turno
        </label>
        <select
          value={scheduleData.turno}
          onChange={(e) => setScheduleData(prev => ({...prev, turno: e.target.value}))}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
        >
          <option value="mañana">Mañana</option>
          <option value="tarde">Tarde</option>
          <option value="noche">Noche</option>
        </select>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-[var(--border)] rounded-full hover:bg-gray-50"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 text-xs font-medium text-white bg-primary border border-transparent rounded-full hover:bg-primary/90 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Asignando...' : 'Asignar Horarios'}
        </button>
      </div>
      {notice && (
        <p className="text-xs text-[var(--muted)] mt-2">{notice}</p>
      )}
    </form>
  );
};

export default PersonalPage;