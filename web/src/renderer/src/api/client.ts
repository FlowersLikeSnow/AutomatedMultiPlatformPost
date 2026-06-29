import axios from 'axios'
import { message } from 'antd'
import { clearAuth } from '../stores/authStore'

const API_BASE_URL = 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle errors and format
apiClient.interceptors.response.use(
  (response) => {
    const result = response.data
    // 如果后端返回 code !== 200，统一处理错误
    if (result.code !== undefined && result.code !== 200) {
      message.error(result.msg || '请求失败')
      return Promise.reject(new Error(result.msg || '请求失败'))
    }
    return result
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      window.location.hash = '#/auth/login'
      message.error('登录已过期，请重新登录')
    } else {
      const msg = error.response?.data?.msg || error.message || '网络错误'
      message.error(msg)
    }
    return Promise.reject(error)
  }
)

export default apiClient
