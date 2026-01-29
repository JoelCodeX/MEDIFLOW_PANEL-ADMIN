import { NavLink } from 'react-router-dom'
import { CiGrid41, CiUser, CiWarning, CiViewList, CiHeart, CiSettings, CiCalendar, CiChat1, CiCalendarDate, CiCircleQuestion, CiClock1 } from 'react-icons/ci'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import pkg from '../../package.json'
import Logo from '../assets/imagotipo_2.svg'
import LogoSmall from '../assets/imagotipo.svg'

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

function Sidebar({ onOpenMessages, isCollapsed, onToggle }) {
  const version = pkg.version || '0.0.0'
  const openMessages = onOpenMessages
  return (
    <aside className={`h-full bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-3'}`}>
      <div className={`flex items-center mb-6 transition-all ${isCollapsed ? 'flex-col gap-3 justify-center mt-2' : 'justify-between px-2'}`}>
        <img 
          src={isCollapsed ? LogoSmall : Logo} 
          alt="logotipo" 
          className={`transition-all object-contain ${isCollapsed ? 'w-8 h-8' : 'h-8'}`} 
        />
        <button 
          onClick={onToggle} 
          className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--muted)] transition-colors`}
          title={isCollapsed ? "Expandir" : "Contraer"}
        >
          {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
        </button>
      </div>

      <nav className="grid gap-1.5">
        {menuMain.map((item) => (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to}
            className={({ isActive }) => `no-underline visited:text-[var(--text)] flex items-center gap-3 px-2.5 py-2 rounded-full transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-[var(--text)] hover:bg-primary/10'} ${isCollapsed ? 'justify-center px-0' : ''}`}
            title={isCollapsed ? item.label : ''}
            style={{ color: 'inherit' }}
          >
            {({ isActive }) => {
              const Icon = item.Icon
              return (
                <>
                  <Icon className={isActive ? 'text-white' : 'text-[var(--text)]'} size={22} />
                  {!isCollapsed && <span className={isActive ? 'font-bold text-white text-sm' : 'font-medium text-sm'}>{item.label}</span>}
                </>
              )
            }}
          </NavLink>
        ))}
        
        {/* Opción Mensajes con mismo estilo */}
        <button
          className={`flex items-center gap-3 px-2.5 py-2 rounded-full transition-colors text-[var(--text)] hover:bg-primary/10 w-full ${isCollapsed ? 'justify-center px-0' : 'text-left'}`}
          onClick={openMessages}
          aria-label="Abrir mensajes"
          title={isCollapsed ? 'Mensajes' : ''}
        >
          <CiChat1 className="text-[var(--text)]" size={22} />
          {!isCollapsed && <span className="font-medium text-sm">Mensajes</span>}
        </button>
      </nav>

      <div className="mt-auto pt-4 flex flex-col gap-1">
        <NavLink
          to={settingsItem.to}
          className={({ isActive }) => `no-underline visited:text-[var(--text)] flex items-center gap-3 px-2.5 py-2 rounded-full transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-[var(--text)] hover:bg-primary/10'} ${isCollapsed ? 'justify-center px-0' : ''}`}
          style={{ color: 'inherit' }}
          title={isCollapsed ? settingsItem.label : ''}
        >
          {({ isActive }) => {
            const Icon = settingsItem.Icon
            return (
              <>
                <Icon className={isActive ? 'text-white' : 'text-[var(--text)]'} size={22} />
                {!isCollapsed && <span className={isActive ? 'font-bold text-white text-sm' : 'font-medium text-sm'}>{settingsItem.label}</span>}
              </>
            )
          }}
        </NavLink>
        {!isCollapsed && <p className="mt-2 text-[10px] text-[var(--muted)] px-2.5">v{version}</p>}
      </div>

      {/* Panel de mensajes movido al layout */}
    </aside>
  )
}

export default Sidebar