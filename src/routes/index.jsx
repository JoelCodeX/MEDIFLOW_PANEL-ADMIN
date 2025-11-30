import { createBrowserRouter } from 'react-router-dom'
import App from '@/app/App'
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
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