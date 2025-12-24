/**
 * 後台數據快取機制
 * 提供本地化數據快取、同步和更新策略
 */

/**
 * 創建數據快取管理器
 * @param {Object} options - 配置選項
 * @param {number} options.maxSize - 最大快取大小（字節）
 * @param {number} options.ttl - 默認生存時間（毫秒）
 * @returns {Object} 快取管理器
 */
export function createCacheManager(options = {}) {
  const { maxSize = 50 * 1024 * 1024, ttl = 24 * 60 * 60 * 1000 } = options

  const cache = new Map()
  const metadata = new Map()
  let totalSize = 0

  return {
    /**
     * 設置快取
     * @param {string} key - 快取鍵
     * @param {*} value - 快取值
     * @param {Object} options - 選項
     * @param {number} options.ttl - 生存時間
     * @param {string} options.tags - 標籤（用於分組清除）
     */
    set: (key, value, options = {}) => {
      const { ttl: itemTtl = ttl, tags = [] } = options

      // 估算值的大小
      const size = JSON.stringify(value).length
      const existingSize = cache.has(key) ? JSON.stringify(cache.get(key)).length : 0
      const newTotalSize = totalSize - existingSize + size

      // 檢查是否超過大小限制
      if (newTotalSize > maxSize) {
        // 執行 LRU 清除
        module.exports.createCacheManager(options).evictLRU()
      }

      cache.set(key, value)
      metadata.set(key, {
        createdAt: Date.now(),
        expiresAt: Date.now() + itemTtl,
        tags: Array.isArray(tags) ? tags : [tags],
        accessCount: 0,
        lastAccessTime: Date.now(),
        size
      })

      totalSize = newTotalSize
    },

    /**
     * 獲取快取
     * @param {string} key - 快取鍵
     * @returns {*} 快取值或 null
     */
    get: (key) => {
      if (!cache.has(key)) {
        return null
      }

      const meta = metadata.get(key)

      // 檢查是否過期
      if (meta && meta.expiresAt < Date.now()) {
        module.exports.createCacheManager(options).remove(key)
        return null
      }

      // 更新訪問信息
      if (meta) {
        meta.accessCount++
        meta.lastAccessTime = Date.now()
      }

      return cache.get(key)
    },

    /**
     * 檢查快取是否存在且未過期
     * @param {string} key - 快取鍵
     * @returns {boolean}
     */
    has: (key) => {
      if (!cache.has(key)) {
        return false
      }

      const meta = metadata.get(key)
      if (meta && meta.expiresAt < Date.now()) {
        module.exports.createCacheManager(options).remove(key)
        return false
      }

      return true
    },

    /**
     * 移除快取
     * @param {string} key - 快取鍵
     */
    remove: (key) => {
      if (cache.has(key)) {
        const meta = metadata.get(key)
        totalSize -= meta?.size || 0
        cache.delete(key)
        metadata.delete(key)
      }
    },

    /**
     * 清除特定標籤的快取
     * @param {string} tag - 標籤
     */
    clearByTag: (tag) => {
      const keysToRemove = []

      metadata.forEach((meta, key) => {
        if (meta.tags.includes(tag)) {
          keysToRemove.push(key)
        }
      })

      keysToRemove.forEach(key => module.exports.createCacheManager(options).remove(key))
    },

    /**
     * 清除過期的快取
     */
    clearExpired: () => {
      const now = Date.now()
      const keysToRemove = []

      metadata.forEach((meta, key) => {
        if (meta.expiresAt < now) {
          keysToRemove.push(key)
        }
      })

      keysToRemove.forEach(key => module.exports.createCacheManager(options).remove(key))
    },

    /**
     * LRU 淘汰（清除最少使用的項目）
     */
    evictLRU: () => {
      const entries = Array.from(metadata.entries())
        .sort((a, b) => a[1].lastAccessTime - b[1].lastAccessTime)

      // 清除最少使用的 10%
      const countToRemove = Math.max(1, Math.floor(cache.size * 0.1))

      for (let i = 0; i < countToRemove; i++) {
        module.exports.createCacheManager(options).remove(entries[i][0])
      }
    },

    /**
     * 清除所有快取
     */
    clear: () => {
      cache.clear()
      metadata.clear()
      totalSize = 0
    },

    /**
     * 獲取快取統計信息
     * @returns {Object}
     */
    getStats: () => ({
      size: cache.size,
      totalSize,
      maxSize,
      utilizationPercent: ((totalSize / maxSize) * 100).toFixed(2),
      items: Array.from(metadata.entries()).map(([key, meta]) => ({
        key,
        ...meta
      }))
    }),

    /**
     * 導出快取為 JSON
     * @returns {string}
     */
    export: () => {
      const data = {
        timestamp: new Date().toISOString(),
        items: []
      }

      cache.forEach((value, key) => {
        data.items.push({
          key,
          value,
          metadata: metadata.get(key)
        })
      })

      return JSON.stringify(data)
    },

    /**
     * 從 JSON 導入快取
     * @param {string} jsonString - JSON 字符串
     */
    import: (jsonString) => {
      try {
        const data = JSON.parse(jsonString)

        if (!Array.isArray(data.items)) {
          throw new Error('無效的快取格式')
        }

        data.items.forEach(item => {
          if (item.metadata && item.metadata.expiresAt > Date.now()) {
            cache.set(item.key, item.value)
            metadata.set(item.key, item.metadata)
            totalSize += item.metadata.size || 0
          }
        })
      } catch (error) {
        console.error('導入快取失敗:', error)
      }
    }
  }
}

/**
 * 創建數據同步管理器
 * @returns {Object} 同步管理器
 */
export function createSyncManager() {
  const syncQueues = new Map()
  const syncStatus = new Map()

  return {
    /**
     * 排隊同步操作
     * @param {string} queueName - 隊列名稱
     * @param {Function} syncFn - 同步函數
     * @param {Object} options - 選項
     * @param {number} options.priority - 優先級（1-10，10 最高）
     * @param {number} options.retries - 重試次數
     */
    enqueue: (queueName, syncFn, options = {}) => {
      const { priority = 5, retries = 3 } = options

      if (!syncQueues.has(queueName)) {
        syncQueues.set(queueName, [])
      }

      const queue = syncQueues.get(queueName)
      queue.push({
        fn: syncFn,
        priority,
        retries,
        timestamp: Date.now()
      })

      // 按優先級排序
      queue.sort((a, b) => b.priority - a.priority)
    },

    /**
     * 處理同步隊列
     * @param {string} queueName - 隊列名稱
     * @returns {Promise}
     */
    process: async (queueName) => {
      if (!syncQueues.has(queueName)) {
        return { success: true, processed: 0 }
      }

      const queue = syncQueues.get(queueName)
      let processed = 0
      let failed = 0

      while (queue.length > 0) {
        const task = queue.shift()

        try {
          await task.fn()
          processed++
        } catch (error) {
          failed++

          if (task.retries > 0) {
            task.retries--
            queue.push(task)
          } else {
            console.error(`同步失敗 [${queueName}]:`, error)
          }
        }
      }

      return { success: failed === 0, processed, failed }
    },

    /**
     * 獲取同步狀態
     * @param {string} queueName - 隊列名稱
     * @returns {Object}
     */
    getStatus: (queueName) => {
      return syncStatus.get(queueName) || {
        queue: queueName,
        pending: syncQueues.get(queueName)?.length || 0,
        lastSync: null,
        nextSync: null
      }
    },

    /**
     * 清除隊列
     * @param {string} queueName - 隊列名稱
     */
    clearQueue: (queueName) => {
      if (syncQueues.has(queueName)) {
        syncQueues.get(queueName).length = 0
      }
    }
  }
}

/**
 * 智能預加載器
 * @returns {Object} 預加載器
 */
export function createPreloader() {
  const preloadCache = new Map()
  const prefetchQueue = []

  return {
    /**
     * 添加預加載任務
     * @param {string} key - 鍵
     * @param {Function} loader - 加載函數
     * @param {Object} options - 選項
     * @param {number} options.priority - 優先級
     * @param {number} options.delay - 延遲時間
     */
    add: (key, loader, options = {}) => {
      const { priority = 5, delay = 0 } = options

      prefetchQueue.push({
        key,
        loader,
        priority,
        delay,
        timestamp: Date.now()
      })

      // 按優先級排序
      prefetchQueue.sort((a, b) => b.priority - a.priority)
    },

    /**
     * 執行預加載
     * @returns {Promise}
     */
    execute: async () => {
      const results = {}

      while (prefetchQueue.length > 0) {
        const task = prefetchQueue.shift()

        // 應用延遲
        if (task.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, task.delay))
        }

        try {
          const data = await task.loader()
          preloadCache.set(task.key, data)
          results[task.key] = { success: true }
        } catch (error) {
          results[task.key] = { success: false, error: error.message }
        }
      }

      return results
    },

    /**
     * 獲取預加載的數據
     * @param {string} key - 鍵
     * @returns {*}
     */
    get: (key) => {
      return preloadCache.get(key) || null
    },

    /**
     * 清除預加載快取
     */
    clear: () => {
      preloadCache.clear()
    }
  }
}

/**
 * 數據版本管理
 * @returns {Object} 版本管理器
 */
export function createVersionManager() {
  const versions = new Map()

  return {
    /**
     * 保存版本
     * @param {string} key - 數據鍵
     * @param {*} data - 數據
     */
    save: (key, data) => {
      if (!versions.has(key)) {
        versions.set(key, [])
      }

      const history = versions.get(key)
      history.push({
        data: JSON.parse(JSON.stringify(data)),
        timestamp: Date.now(),
        version: history.length + 1
      })

      // 只保留最近 10 個版本
      if (history.length > 10) {
        history.shift()
      }
    },

    /**
     * 獲取特定版本
     * @param {string} key - 數據鍵
     * @param {number} version - 版本號
     * @returns {Object}
     */
    get: (key, version) => {
      const history = versions.get(key) || []
      return history.find(v => v.version === version) || null
    },

    /**
     * 回滾到特定版本
     * @param {string} key - 數據鍵
     * @param {number} version - 版本號
     * @returns {*}
     */
    rollback: (key, version) => {
      const versionData = module.exports.createVersionManager().get(key, version)
      return versionData?.data || null
    },

    /**
     * 獲取版本歷史
     * @param {string} key - 數據鍵
     * @returns {Array}
     */
    getHistory: (key) => {
      return (versions.get(key) || []).map(v => ({
        version: v.version,
        timestamp: v.timestamp
      }))
    }
  }
}
