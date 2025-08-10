/**
 * 工具函数
 */

// 生成唯一ID
export function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11)
}

// 生成短ID
export function generateShortId() {
  return Math.random().toString(36).substring(2, 8)
}

// 验证邮箱格式
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证URL格式
export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件扩展名
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// 获取MIME类型
export function getMimeType(filename) {
  const ext = getFileExtension(filename).toLowerCase()
  const mimeTypes = {
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  
  return mimeTypes[ext] || 'application/octet-stream'
}

// 清理HTML标签
export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '')
}

// 截断文本
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 延迟函数
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 重试函数
export async function retry(fn, maxAttempts = 3, delayMs = 1000) {
  let lastError
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      console.warn(`Attempt ${attempt} failed:`, error.message)
      
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt)
      }
    }
  }
  
  throw lastError
}

// 解析User-Agent
export function parseUserAgent(userAgent) {
  const ua = userAgent || ''
  
  // 简单的浏览器检测
  const browsers = {
    chrome: /Chrome\/(\d+)/,
    firefox: /Firefox\/(\d+)/,
    safari: /Safari\/(\d+)/,
    edge: /Edge\/(\d+)/
  }
  
  const os = {
    windows: /Windows/,
    mac: /Macintosh/,
    linux: /Linux/,
    android: /Android/,
    ios: /iPhone|iPad/
  }
  
  let browser = 'unknown'
  let browserVersion = ''
  let operatingSystem = 'unknown'
  
  for (const [name, regex] of Object.entries(browsers)) {
    const match = ua.match(regex)
    if (match) {
      browser = name
      browserVersion = match[1]
      break
    }
  }
  
  for (const [name, regex] of Object.entries(os)) {
    if (regex.test(ua)) {
      operatingSystem = name
      break
    }
  }
  
  return {
    browser,
    browserVersion,
    operatingSystem,
    userAgent: ua
  }
}

// 生成随机字符串
export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// 哈希函数
export async function hashString(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 验证JSON
export function isValidJSON(str) {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// 安全的JSON解析
export function safeJSONParse(str, defaultValue = null) {
  try {
    return JSON.parse(str)
  } catch {
    return defaultValue
  }
}

// 获取客户端IP
export function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         request.headers.get('X-Real-IP') || 
         'unknown'
}

// 获取国家代码
export function getCountryCode(request) {
  return request.cf?.country || 'unknown'
}

// 速率限制键生成
export function getRateLimitKey(request, identifier = 'ip') {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('User-Agent') || ''
  
  switch (identifier) {
    case 'ip':
      return `rate_limit:ip:${ip}`
    case 'user_agent':
      return `rate_limit:ua:${hashString(userAgent)}`
    default:
      return `rate_limit:${identifier}`
  }
}
