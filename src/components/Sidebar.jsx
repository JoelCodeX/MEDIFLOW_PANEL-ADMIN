import { NavLink } from 'react-router-dom'
import { CiGrid41, CiUser, CiWarning, CiViewList, CiHeart, CiSettings, CiCalendar, CiChat1, CiCalendarDate, CiCircleQuestion, CiClock1 } from 'react-icons/ci'
import pkg from '../../package.json'
import Logo from '../assets/imagotipo_2.svg'

const menuMain = [
  { to: '/', label: 'Dashboard', Icon: CiGrid41 },
  { to: '/personal', label: 'Trabajadores', Icon: CiUser },
  { to: '/asistencia', label: 'Asistencia', Icon: CiCalendarDate },
  { to: '/encuestas', label: 'Encuestas', Icon: CiCircleQuestion },
  { to: '/alertas', label: 'Alertas', Icon: CiWarning },
  { to: '/reportes', label: 'Reportes', Icon: CiViewList },
  { to: '/auditoria', label: 'Auditoría', Icon: CiClock1 },
  { to: '/bienestar', label: 'Bienestar', Icon: CiHeart },
  { to: '/citas', label: 'Citas', Icon: CiCalendar },
  { to: '/profesionales', label: 'Profesionales', Icon: CiUser },
]
const settingsItem = { to: '/configuracion', label: 'Configuración', Icon: CiSettings }

function Sidebar({ onOpenMessages }) {
  const version = pkg.version || '0.0.0'
  const openMessages = onOpenMessages
  return (
    <aside className="h-full bg-white p-3 pt-5 border-r border-[var(--border)] flex flex-col overflow-hidden">
      <div className="font-bold mb-5 flex items-center gap-2 px-1">
        <img src={Logo} alt="logotipo" />
      </div>
      <nav className="grid gap-1.5">
        {menuMain.map((item) => (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to}
            className={({ isActive }) => `no-underline visited:text-[var(--text)] flex items-center gap-2.5 px-2.5 py-1.5 rounded-full transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-[var(--text)] hover:bg-primary/10'}`}
            style={{ color: 'inherit' }}
          >
            {({ isActive }) => {
              const Icon = item.Icon
              return (
                <>
                  <Icon className={isActive ? 'text-white' : 'text-[var(--text)]'} size={20} />
                  <span className={isActive ? 'font-bold text-white text-sm' : 'font-light text-sm'}>{item.label}</span>
                </>
              )
            }}
          </NavLink>
        ))}
      </nav>

      {/* Botón fijo de mensajes */}
      <div className="mt-3">
        <button
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-full border border-[var(--border)] bg-white hover:bg-primary/10"
          onClick={openMessages}
          aria-label="Abrir mensajes"
        >
          <CiChat1 className="text-[var(--text)]" size={20} />
          <span className="font-light text-sm">Mensajes</span>
        </button>
      </div>

      <div className="mt-auto pt-6">
        <NavLink
          to={settingsItem.to}
          className={({ isActive }) => `no-underline visited:text-[var(--text)] flex items-center gap-2.5 px-2.5 py-1.5 rounded-full transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-[var(--text)] hover:bg-primary/10'}`}
          style={{ color: 'inherit' }}
        >
          {({ isActive }) => {
            const Icon = settingsItem.Icon
            return (
              <>
                <Icon className={isActive ? 'text-white' : 'text-[var(--text)]'} size={20} />
                <span className={isActive ? 'font-bold text-white text-sm' : 'font-light text-sm'}>{settingsItem.label}</span>
              </>
            )
          }}
        </NavLink>
        <p className="mt-2 text-[10px] text-[var(--muted)] px-2.5">v{version}</p>
      </div>

      {/* Panel de mensajes movido al layout */}
    </aside>
  )
}

export default Sidebar