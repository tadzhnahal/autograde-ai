import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
})

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ag.token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) onUnauthorized?.()
    return Promise.reject(error)
  },
)
