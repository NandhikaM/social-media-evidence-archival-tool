/**
 * API client for TN Archival Tool backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Inject Bearer token if it exists in localStorage
  const token = localStorage.getItem('tn_archival_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Session expired or unauthorized, clear token
    localStorage.removeItem('tn_archival_token')
  }

  if (!response.ok) {
    let errorDetail = response.statusText
    try {
      const errJson = await response.json()
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorDetail || `API error: ${response.status}`)
  }

  return response.json()
}

export const api = {
  health: () => request('/health'),
  
  // Auth
  login: async (username, password) => {
    // OAuth2 expects form data (x-www-form-urlencoded)
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      let errorDetail = 'Login failed'
      try {
        const errJson = await response.json()
        if (errJson && errJson.detail) {
          errorDetail = errJson.detail
        }
      } catch {}
      throw new Error(errorDetail)
    }

    const data = await response.json()
    if (data.access_token) {
      localStorage.setItem('tn_archival_token', data.access_token)
    }
    return data
  },
  
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' })
    } finally {
      localStorage.removeItem('tn_archival_token')
    }
  },
  
  me: () => request('/auth/me'),

  // Users Management
  users: {
    list: () => request('/users/'),
    create: (data) => request('/users/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // Cases
  cases: {
    list: () => request('/cases'),
    create: (data) => request('/cases', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Archive Requests
  requests: {
    list: () => request('/requests'),
    create: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
    createBulk: (data) => request('/requests/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Archived Records & Remarks
  records: {
    list: () => request('/records'),
    get: (id) => request(`/records/${id}`),
    listRemarks: (id) => request(`/records/${id}/remarks`),
    createRemark: (id, content) =>
      request(`/records/${id}/remarks`, { method: 'POST', body: JSON.stringify({ content }) }),
  },

  // Reports / Dashboard
  reports: {
    dashboardStats: () => request('/reports/dashboard-stats'),
    generate: () => request('/reports/generate', { method: 'POST' }),
  },

  // Settings & Credentials
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
    getCredentials: () => request('/settings/credentials'),
    saveCredential: (data) => request('/settings/credentials', { method: 'POST', body: JSON.stringify(data) }),
  },
}

export default api
