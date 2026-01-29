import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { CiChat1 } from 'react-icons/ci'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

function App() {
  const [showMessages, setShowMessages] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className={`grid h-screen overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'grid-cols-[80px_1fr]' : 'grid-cols-[220px_1fr]'}`}>
      <Sidebar 
        onOpenMessages={() => setShowMessages(true)} 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <Header onOpenMessages={() => setShowMessages(true)} />
        <main className="p-4 flex-1 overflow-auto">
          <div className="max-w-screen-2xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
        
        {/* Panel de Mensajes */}
        {showMessages && (
          <div className="fixed top-20 right-6 w-[360px] bg-white border border-[var(--border)] rounded-xl shadow-xl z-50">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-medium">Mensajes</h3>
              <button className="px-2 py-1 rounded-md border text-xs hover:bg-gray-50" onClick={() => setShowMessages(false)}>Cerrar</button>
            </div>
            <div className="p-3">
              <p className="text-sm text-[var(--muted)] mb-3">Bandeja de entrada</p>
              <ul className="grid gap-2 m-0">
                <li className="border border-[var(--border)] rounded-md px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium text-xs text-primary mb-0.5">Juan Pérez</div>
                  <div className="text-xs text-gray-600">Consulta sobre evaluación ergonómica</div>
                </li>
                <li className="border border-[var(--border)] rounded-md px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium text-xs text-primary mb-0.5">María P.</div>
                  <div className="text-xs text-gray-600">Confirmación de cita médica</div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App