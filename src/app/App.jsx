import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { CiChat1 } from 'react-icons/ci'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

function App() {
  const [showMessages, setShowMessages] = useState(false)
  return (
    <div className="grid grid-cols-[220px_1fr] h-screen overflow-hidden">
      <Sidebar onOpenMessages={() => setShowMessages(true)} />
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <Header />
        <main className="p-4 flex-1 overflow-auto">
          <div className="max-w-screen-2xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
        {/* Botón flotante global Mensajes */}
        <button
          className="fixed bottom-6 right-6 px-3 py-2 rounded-full bg-primary text-white shadow-lg text-sm flex items-center gap-2"
          onClick={() => setShowMessages(true)}
          aria-label="Abrir mensajes"
        >
          <CiChat1 size={18} />
          <span>Mensajes</span>
        </button>
        {/* Panel de Mensajes mínimo, sin decorador */}
        {showMessages && (
          <div className="fixed bottom-20 right-6 w-[360px] bg-white border border-[var(--border)] rounded-xl shadow-sm z-50">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-medium">Mensajes</h3>
              <button className="px-2 py-1 rounded-md border text-xs" onClick={() => setShowMessages(false)}>Cerrar</button>
            </div>
            <div className="p-3">
              <p className="text-sm text-[var(--muted)]">Bandeja de mensajes (placeholder).</p>
              <ul className="grid gap-2 m-0">
                <li className="border border-[var(--border)] rounded-md px-3 py-2">Juan Pérez: Consulta sobre evaluación</li>
                <li className="border border-[var(--border)] rounded-md px-3 py-2">María P.: Confirmación de cita</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App