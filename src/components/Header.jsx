import { CiSettings } from 'react-icons/ci'
import { CiBellOn } from 'react-icons/ci'
import user from '../assets/user.svg'

function Header() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between p-4 pb-0.5 overflow-hidden">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="m-0 mb-0.5 text-xl font-semibold">Sistema de Salud Ocupacional</h1>
          <p className="text-[var(--muted)]">Gestión para RRHH y Comités de Salud</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-white grid place-items-center font-bold">
               <CiBellOn className='text-[var(--muted)]' size={32} />
          </span>
          <span className="w-10 h-10 rounded-full bg-white grid place-items-center font-bold">
              <CiSettings className='text-[var(--muted)]' size={32} />
          </span>
          <div className="w-11 h-11 rounded-full bg-white grid place-items-center">
            <img src={user} alt="Administrador" className="w-10 h-10 rounded-full" />
          </div>  
      </div>
    </header>
  )
}

export default Header