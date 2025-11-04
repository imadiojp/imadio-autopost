const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token')
}

// Set auth token
export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token)
}

// Clear auth token
export function clearAuthToken() {
  localStorage.removeItem('auth_token')
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Auth API
export const authApi = {
  async register(username: string, email: string, password: string) {
    const data = await apiRequest<{ success: boolean; token: string; user: any }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }
    )
    if (data.token) {
      setAuthToken(data.token)
    }
    return data
  },

  async login(email: string, password: string) {
    const data = await apiRequest<{ success: boolean; token: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    )
    if (data.token) {
      setAuthToken(data.token)
    }
    return data
  },

  async getCurrentUser() {
    return apiRequest<{ success: boolean; user: any }>('/auth/me')
  },

  logout() {
    clearAuthToken()
  },
}

// X Account API
export const xAccountApi = {
  async initiateAuth() {
    return apiRequest<{ success: boolean; authUrl: string; state: string }>(
      '/auth/x/initiate'
    )
  },

  async initiateAuthAnonymous(anonymousId: string) {
    return apiRequest<{ success: boolean; authUrl: string; state: string; codeVerifier: string }>(
      '/auth/x/initiate-anonymous',
      {
        method: 'POST',
        body: JSON.stringify({ anonymousId }),
      }
    )
  },

  async getAccounts() {
    return apiRequest<{ success: boolean; accounts: any[] }>('/x-accounts')
  },

  async getAccountsAnonymous(anonymousId: string) {
    return apiRequest<{ success: boolean; accounts: any[] }>(
      '/x-accounts/anonymous',
      {
        method: 'POST',
        body: JSON.stringify({ anonymousId }),
      }
    )
  },

  async disconnectAccount(accountId: string) {
    return apiRequest<{ success: boolean; message: string }>(
      `/x-accounts/${accountId}/disconnect`,
      {
        method: 'PUT',
      }
    )
  },

  async deleteAccount(accountId: string) {
    return apiRequest<{ success: boolean; message: string }>(
      `/x-accounts/${accountId}`,
      {
        method: 'DELETE',
      }
    )
  },

  async updateAccountType(accountId: string, accountType: 'free' | 'premium') {
    return apiRequest<{ success: boolean; message: string }>(
      `/x-accounts/${accountId}/type`,
      {
        method: 'PUT',
        body: JSON.stringify({ accountType }),
      }
    )
  },
}

// Posts API
export const postsApi = {
  async createPost(post: any) {
    return apiRequest<{ success: boolean; post: any }>('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    })
  },

  async getPosts(filters?: { status?: string; type?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.type) params.append('type', filters.type)

    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<{ success: boolean; posts: any[] }>(`/posts${query}`)
  },

  async getPost(postId: string) {
    return apiRequest<{ success: boolean; post: any }>(`/posts/${postId}`)
  },

  async updatePost(postId: string, updates: any) {
    return apiRequest<{ success: boolean; message: string }>(
      `/posts/${postId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    )
  },

  async deletePost(postId: string) {
    return apiRequest<{ success: boolean; message: string }>(
      `/posts/${postId}`,
      {
        method: 'DELETE',
      }
    )
  },
}

// Settings API
export const settingsApi = {
  async getSettings() {
    return apiRequest<{ success: boolean; settings: any }>('/settings')
  },

  async updateSettings(settings: any) {
    return apiRequest<{ success: boolean; message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },
}

// Health check
export async function healthCheck() {
  return apiRequest<{ status: string; timestamp: string }>('/health')
}
