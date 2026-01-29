import { CiSettings, CiBellOn, CiChat1 } from 'react-icons/ci'
import user from '../assets/user.svg'

function Header({ onOpenMessages }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between p-4 pb-0.5 overflow-hidden">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="m-0 mb-0.5 text-xl font-semibold">Sistema de Salud Ocupacional</h1>
          <p className="text-[var(--muted)]">Gestión para RRHH y Comités de Salud</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
          <button 
            className="w-10 h-10 rounded-full bg-white grid place-items-center font-bold hover:bg-gray-50 transition-colors"
            onClick={onOpenMessages}
            aria-label="Mensajes"
          >
              <CiChat1 className='text-[var(--muted)]' size={32} />
          </button>
          <button className="w-10 h-10 rounded-full bg-white grid place-items-center font-bold hover:bg-gray-50 transition-colors">
               <CiBellOn className='text-[var(--muted)]' size={32} />
          </button>
          <button className="w-10 h-10 rounded-full bg-white grid place-items-center font-bold hover:bg-gray-50 transition-colors">
              <CiSettings className='text-[var(--muted)]' size={32} />
          </button>
          <div className="w-11 h-11 rounded-full bg-white grid place-items-center cursor-pointer">
            <img src={user} alt="Administrador" className="w-10 h-10 rounded-full" />
          </div>  
      </div>
    </header>
  )
}

export default Header