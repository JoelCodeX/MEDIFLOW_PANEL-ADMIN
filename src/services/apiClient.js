// Cliente HTTP simple basado en fetch
export const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/'

function buildUrl(path, params = {}) {
  const base = apiBaseUrl || ''
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  let urlStr
  // Base relativa (p.ej. '/api/')
  if (base.startsWith('/')) {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    urlStr = `${window.location.origin}${cleanBase}/${cleanPath}`
  } else {
    // Base absoluta, preservar el pathname del base (p.ej. 'http://host:port/api/')
    try {
      const b = new URL(base)
      const basePath = b.pathname.endsWith('/') ? b.pathname.slice(0, -1) : b.pathname
      urlStr = `${b.origin}${basePath}/${cleanPath}`
    } catch {
      // Fallback: concatenación simple
      const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
      urlStr = `${cleanBase}/${cleanPath}`
    }
  }
  const url = new URL(urlStr)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })
  return url
}

function getAdminId() {
  const envId = import.meta.env.VITE_ADMIN_ID
  const lsId = (() => {
    try { return localStorage.getItem('admin_id') } catch { return null }
  })()
  return envId || lsId || null
}

function withAdminHeader(headers = {}) {
  const id = getAdminId()
  if (id) return { ...headers, 'X-Admin-Id': String(id) }
  return headers
}

export async function apiGet(path, params = {}) {
  const url = buildUrl(path, params)
  const res = await fetch(url.toString(), { headers: withAdminHeader() })
  if (!res.ok) {
    let message = `GET ${url} -> ${res.status}`
    try {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        message = data.error || data.message || message
      } catch {
        message = text || message
      }
    } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function apiPost(path, body = {}) {
  const url = buildUrl(path)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: withAdminHeader({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let message = `POST ${url} -> ${res.status}`
    try {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        message = data.error || data.message || message
      } catch {
        message = text || message
      }
    } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function apiPostForm(path, formData) {
  const url = buildUrl(path)
  const res = await fetch(url.toString(), {
    method: 'POST',
    // No establecer Content-Type explícito para permitir que el navegador configure el boundary correctamente
    headers: withAdminHeader(),
    body: formData,
  })
  if (!res.ok) {
    let message = `POST ${url} -> ${res.status}`
    try {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        message = data.error || data.message || message
      } catch {
        message = text || message
      }
    } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function apiPut(path, body = {}) {
  const url = buildUrl(path)
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: withAdminHeader({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let message = `PUT ${url} -> ${res.status}`
    try {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        message = data.error || data.message || message
      } catch {
        message = text || message
      }
    } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function apiDelete(path) {
  const url = buildUrl(path)
  const res = await fetch(url.toString(), { method: 'DELETE', headers: withAdminHeader() })
  if (!res.ok) {
    let message = `DELETE ${url} -> ${res.status}`
    try {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        message = data.error || data.message || message
      } catch {
        message = text || message
      }
    } catch {}
    throw new Error(message)
  }
  return res.json()
}