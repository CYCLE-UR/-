/**
 * 性能優化模塊
 * 包括防抖、節流、快取、延遲加載等優化技術
 */

/**
 * 創建防抖函數
 * @param {Function} func - 原函數
 * @param {number} wait - 等待時間（毫秒）
 * @param {Object} options - 選項
 * @param {boolean} options.leading - 是否在開始時立即執行
 * @param {boolean} options.trailing - 是否在結束時執行
 * @returns {Function} 防抖後的函數
 */
export function debounce(func, wait = 300, options = {}) {
  const { leading = false, trailing = true } = options
  let timeout = null
  let result = null
  let previous = 0

  return function debounced(...args) {
    const now = Date.now()
    
    // 首次調用設置 previous
    if (!previous && !leading) previous = now

    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }

      if (leading || (now - previous >= wait)) {
        result = func.apply(this, args)
        previous = now
      }
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        result = func.apply(this, args)
        previous = leading ? Date.now() : 0
        timeout = null
      }, remaining)
    }

    return result
  }
}

/**
 * 創建節流函數
 * @param {Function} func - 原函數
 * @param {number} interval - 節流間隔（毫秒）
 * @param {Object} options - 選項
 * @param {boolean} options.leading - 是否在開始時立即執行
 * @param {boolean} options.trailing - 是否在結束時執行
 * @returns {Function} 節流後的函數
 */
export function throttle(func, interval = 300, options = {}) {
  const { leading = true, trailing = false } = options
  let previous = leading ? 0 : Date.now()
  let timeout = null

  return function throttled(...args) {
    const now = Date.now()
    const remaining = interval - (now - previous)

    if (remaining <= 0 || remaining > interval) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }

      func.apply(this, args)
      previous = now
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        func.apply(this, args)
        previous = trailing ? Date.now() : 0
        timeout = null
      }, remaining)
    }
  }
}

/**
 * 簡單的內存快取
 * @param {Function} fn - 要快取的函數
 * @param {Object} options - 選項
 * @param {number} options.maxSize - 最大快取條目數
 * @param {number} options.ttl - 生存時間（毫秒）
 * @returns {Function} 帶快取的函數
 */
export function memoize(fn, options = {}) {
  const { maxSize = 100, ttl = null } = options
  const cache = new Map()
  let accessOrder = []

  return function memoized(...args) {
    const key = JSON.stringify(args)

    // 檢查快取
    if (cache.has(key)) {
      const cached = cache.get(key)
      
      // 檢查 TTL
      if (ttl && Date.now() - cached.timestamp > ttl) {
        cache.delete(key)
      } else {
        // 更新訪問順序
        accessOrder = accessOrder.filter(k => k !== key)
        accessOrder.push(key)
        return cached.value
      }
    }

    // 計算新值
    const value = fn.apply(this, args)

    // 存儲到快取
    cache.set(key, {
      value,
      timestamp: Date.now()
    })

    accessOrder.push(key)

    // 實現 LRU 淘汰
    if (cache.size > maxSize) {
      const oldestKey = accessOrder.shift()
      cache.delete(oldestKey)
    }

    return value
  }
}

/**
 * 批量延遲執行
 * @param {Function} fn - 要執行的函數
 * @param {Array} items - 項目列表
 * @param {Object} options - 選項
 * @param {number} options.batchSize - 批大小
 * @param {number} options.delay - 批次之間的延遲（毫秒）
 * @returns {Promise<Array>} 執行結果
 */
export async function batchProcess(fn, items, options = {}) {
  const { batchSize = 10, delay = 0 } = options
  const results = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(item => fn(item)))
    results.push(...batchResults)

    if (i + batchSize < items.length && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return results
}

/**
 * 優化的事件監聽器管理
 * @returns {Object} 事件管理器
 */
export function createEventManager() {
  const listeners = new Map()
  const throttledListeners = new Map()

  return {
    /**
     * 添加事件監聽器
     * @param {string} eventName - 事件名稱
     * @param {Function} callback - 回調函數
     * @param {Object} options - 選項
     * @param {number} options.throttle - 節流時間
     * @param {number} options.debounce - 防抖時間
     */
    on: (eventName, callback, options = {}) => {
      let finalCallback = callback

      if (options.throttle) {
        finalCallback = throttle(callback, options.throttle)
      } else if (options.debounce) {
        finalCallback = debounce(callback, options.debounce)
      }

      if (!listeners.has(eventName)) {
        listeners.set(eventName, [])
      }

      listeners.get(eventName).push({
        callback: finalCallback,
        original: callback,
        options
      })
    },

    /**
     * 移除事件監聽器
     * @param {string} eventName - 事件名稱
     * @param {Function} callback - 回調函數
     */
    off: (eventName, callback) => {
      if (!listeners.has(eventName)) return

      const list = listeners.get(eventName)
      const index = list.findIndex(item => item.original === callback)
      
      if (index > -1) {
        list.splice(index, 1)
      }
    },

    /**
     * 發送事件
     * @param {string} eventName - 事件名稱
     * @param {*} data - 事件數據
     */
    emit: (eventName, data) => {
      if (!listeners.has(eventName)) return

      listeners.get(eventName).forEach(item => {
        try {
          item.callback(data)
        } catch (error) {
          console.error(`事件 ${eventName} 處理出錯:`, error)
        }
      })
    },

    /**
     * 清除所有監聽器
     */
    clear: () => {
      listeners.clear()
    }
  }
}

/**
 * 請求去重
 * @returns {Object} 去重管理器
 */
export function createRequestDeduplicator() {
  const pendingRequests = new Map()

  return {
    /**
     * 執行去重後的請求
     * @param {string} key - 請求鍵
     * @param {Function} fn - 請求函數
     * @returns {Promise}
     */
    execute: (key, fn) => {
      // 如果已有待處理的相同請求，直接返回
      if (pendingRequests.has(key)) {
        return pendingRequests.get(key)
      }

      // 執行新請求
      const promise = Promise.resolve()
        .then(() => fn())
        .finally(() => {
          pendingRequests.delete(key)
        })

      pendingRequests.set(key, promise)
      return promise
    },

    /**
     * 獲取待處理的請求數
     * @returns {number}
     */
    getPendingCount: () => pendingRequests.size,

    /**
     * 清除所有待處理的請求
     */
    clear: () => pendingRequests.clear()
  }
}

/**
 * 性能監控
 * @returns {Object} 性能監控器
 */
export function createPerformanceMonitor() {
  const metrics = new Map()

  return {
    /**
     * 測量函數執行時間
     * @param {string} name - 度量名稱
     * @param {Function} fn - 要測量的函數
     * @returns {*} 函數返回值
     */
    measure: (name, fn) => {
      const start = performance.now()
      const result = fn()
      const duration = performance.now() - start

      if (!metrics.has(name)) {
        metrics.set(name, {
          count: 0,
          total: 0,
          min: duration,
          max: duration,
          average: duration
        })
      }

      const metric = metrics.get(name)
      metric.count++
      metric.total += duration
      metric.min = Math.min(metric.min, duration)
      metric.max = Math.max(metric.max, duration)
      metric.average = metric.total / metric.count

      return result
    },

    /**
     * 異步函數的測量
     * @param {string} name - 度量名稱
     * @param {Function} fn - 異步函數
     * @returns {Promise}
     */
    measureAsync: async (name, fn) => {
      const start = performance.now()
      const result = await fn()
      const duration = performance.now() - start

      if (!metrics.has(name)) {
        metrics.set(name, {
          count: 0,
          total: 0,
          min: duration,
          max: duration,
          average: duration
        })
      }

      const metric = metrics.get(name)
      metric.count++
      metric.total += duration
      metric.min = Math.min(metric.min, duration)
      metric.max = Math.max(metric.max, duration)
      metric.average = metric.total / metric.count

      return result
    },

    /**
     * 獲取度量結果
     * @param {string} name - 度量名稱
     * @returns {Object}
     */
    getMetric: (name) => {
      return metrics.has(name) ? { ...metrics.get(name) } : null
    },

    /**
     * 獲取所有度量
     * @returns {Object}
     */
    getAllMetrics: () => {
      const result = {}
      metrics.forEach((value, key) => {
        result[key] = { ...value }
      })
      return result
    },

    /**
     * 清除度量
     * @param {string} name - 度量名稱
     */
    clear: (name) => {
      if (name) {
        metrics.delete(name)
      } else {
        metrics.clear()
      }
    }
  }
}

/**
 * 連接池管理
 * @param {Function} factory - 連接工廠函數
 * @param {Object} options - 選項
 * @param {number} options.maxConnections - 最大連接數
 * @returns {Object} 連接池
 */
export function createConnectionPool(factory, options = {}) {
  const { maxConnections = 10 } = options
  const pool = []
  const waiting = []

  return {
    /**
     * 獲取連接
     * @returns {Promise}
     */
    acquire: () => {
      if (pool.length > 0) {
        return Promise.resolve(pool.pop())
      }

      if (pool.length + waiting.length < maxConnections) {
        return Promise.resolve(factory())
      }

      return new Promise(resolve => {
        waiting.push(resolve)
      })
    },

    /**
     * 釋放連接
     * @param {*} connection - 連接對象
     */
    release: (connection) => {
      if (waiting.length > 0) {
        const resolve = waiting.shift()
        resolve(connection)
      } else {
        pool.push(connection)
      }
    },

    /**
     * 獲取池狀態
     * @returns {Object}
     */
    getStatus: () => ({
      available: pool.length,
      waiting: waiting.length,
      total: pool.length + waiting.length
    })
  }
}
