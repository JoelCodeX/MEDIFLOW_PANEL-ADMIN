# MediFlow (Panel Admin)

Aplicación web creada con Vite y React para la administración de MediFlow: gestión de usuarios, encuestas, asistencia, alertas y reportes.

## Requisitos
- Node.js 18+
- npm

## Instalación y ejecución
- `npm install`
- `npm run dev` inicia el servidor de desarrollo
- `npm run build` genera el artefacto de producción
- `npm run preview` sirve el build localmente
- `npm run lint` ejecuta el linter

## Variables de entorno
- Cliente usa variables `VITE_*` que se exponen al navegador.
- Configurar `VITE_API_URL` para el backend (`src/services/apiClient.js:1`).
- Opcional: `VITE_ADMIN_ID` para pruebas administrativas (`src/services/apiClient.js:30`).
- No colocar llaves ni secretos reales en variables `VITE_*`.

## Seguridad y manejo de secretos
- No almacenar tokens, claves o secretos en el frontend.
- Integraciones externas (Firebase, FCM) deben gestionarse vía backend.
- El archivo `.gitignore` ignora `.env`, llaves y archivos sensibles.

## Desarrollo
- Alias `@` apunta a `src` (`vite.config.js:16`).
- Proxy de desarrollo para API: `vite.config.js:8`.

## Estructura básica
- `src/services` contiene clientes HTTP y módulos de servicios.
- `src/pages` contiene pantallas funcionales (Dashboard, Configuración, etc.).

## Deploy
- Generar build con `npm run build` y servir `dist` en un servidor estático.
- Backend debe estar accesible desde `VITE_API_URL`.
