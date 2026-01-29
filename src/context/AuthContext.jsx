import { createContext, useContext, useState, useEffect } from 'react'
import { apiPost } from '../services/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaurar sesión al cargar
    try {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (e) {
      console.error("Error restaurando sesión", e)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (correo, contrasena) => {
    try {
      const res = await apiPost('auth/admin/login', { correo, contrasena })
      const { token, admin } = res
      
      setToken(token)
      setUser(admin)
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(admin))
      // Legacy support for X-Admin-Id
      localStorage.setItem('admin_id', admin.id) 
      
      return true
    } catch (error) {
      console.error("Login failed", error)
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('admin_id')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
