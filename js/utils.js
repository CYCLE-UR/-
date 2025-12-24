/**
 * 工具函數集合
 */

/**
 * 格式化日期為可讀的字符串
 * @param {Date | number | string} date - 日期對象或時間戳
 * @param {string} format - 格式字符串 (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} 格式化後的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 延遲執行（用於異步操作）
 * @param {number} ms - 毫秒數
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 驗證電子郵件格式
 * @param {string} email - 電子郵件地址
 * @returns {boolean} 是否有效
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 驗證 URL 格式
 * @param {string} url - URL 字符串
 * @returns {boolean} 是否有效
 */
export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 深複製對象
 * @param {*} obj - 要複製的對象
 * @returns {*} 複製後的對象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }

  if (obj instanceof Object) {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }

  return obj
}

/**
 * 生成唯一 ID
 * @returns {string} UUID v4 格式的唯一 ID
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 獲取對象中的值（支持嵌套路徑）
 * @param {Object} obj - 對象
 * @param {string} path - 路徑字符串，如 'user.profile.name'
 * @param {*} defaultValue - 默認值
 * @returns {*} 獲取的值
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  try {
    const value = path.split('.').reduce((current, prop) => current?.[prop], obj)
    return value !== undefined ? value : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * 設置對象中的值（支持嵌套路徑）
 * @param {Object} obj - 對象
 * @param {string} path - 路徑字符串，如 'user.profile.name'
 * @param {*} value - 要設置的值
 * @returns {Object} 修改後的對象
 */
export function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
  return obj
}

/**
 * 防抖函數
 * @param {Function} func - 要防抖的函數
 * @param {number} wait - 等待時間（毫秒）
 * @returns {Function} 防抖後的函數
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 節流函數
 * @param {Function} func - 要節流的函數
 * @param {number} limit - 時間限制（毫秒）
 * @returns {Function} 節流後的函數
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
