import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import App from '@/app/App'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PersonalPage from '@/pages/PersonalPage'
import AlertasPage from '@/pages/AlertasPage'
import ReportesPage from '@/pages/ReportesPage'
import BienestarPage from '@/pages/BienestarPage'
import InteraccionContenidosPage from '@/pages/InteraccionContenidosPage'
import ConfiguracionPage from '@/pages/ConfiguracionPage'
import CitasPage from '@/pages/CitasPage'
import AuditoriaPage from '@/pages/AuditoriaPage'
import AsistenciaPage from '@/pages/AsistenciaPage'
import EncuestasPage from '@/pages/EncuestasPage'
import ResultadosEncuestaPage from '@/pages/ResultadosEncuestaPage'
import EncuestasPublicadasPage from '@/pages/EncuestasPublicadasPage'
import ProfesionalesPage from '@/pages/ProfesionalesPage'

const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Cargando...</div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedLayout>
        <App />
      </ProtectedLayout>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'personal', element: <PersonalPage /> },
      { path: 'alertas', element: <AlertasPage /> },
      { path: 'profesionales', element: <ProfesionalesPage /> },
      { path: 'reportes', element: <ReportesPage /> },
      { path: 'bienestar', element: <BienestarPage /> },
      { path: 'bienestar/interaccion', element: <InteraccionContenidosPage /> },
      { path: 'citas', element: <CitasPage /> },
      { path: 'asistencia', element: <AsistenciaPage /> },
      { path: 'encuestas', element: <EncuestasPage /> },
      { path: 'encuestas/:id/editar', element: <EncuestasPage /> },
      { path: 'encuestas/publicadas', element: <EncuestasPublicadasPage /> },
      { path: 'encuestas/:id/resultados', element: <ResultadosEncuestaPage /> },
      { path: 'configuracion', element: <ConfiguracionPage /> },
      { path: 'auditoria', element: <AuditoriaPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
