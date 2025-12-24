/**
 * 實時通知系統 (Notifications System)
 * 
 * 核心功能：
 * - 桌面通知：使用瀏覽器 Notification API
 * - 多類型通知：成功、失敗、進度、警告
 * - 通知歷史：記錄和查詢所有通知
 * - 事件系統：監聽通知發送事件
 * - 去重機制：避免重複通知
 * 
 * 依賴：無
 */

// ============== 通知配置驗證 ==============

/**
 * 驗證通知配置的有效性
 * 
 * @param {Object} config - 通知配置
 * @param {string} config.type - 通知類型: 'success', 'failure', 'progress', 'warning'
 * @param {string} config.title - 通知標題 (必須)
 * @param {string} [config.message] - 通知消息文本
 * @param {Object} [config.data] - 附加數據
 * @throws 當配置無效時
 */
export function validateNotificationConfig(config) {
  if (!config) {
    throw new Error('通知配置不能為空')
  }

  if (!config.type || typeof config.type !== 'string') {
    throw new Error('通知配置缺少有效的 type 字符串')
  }

  if (!config.title || typeof config.title !== 'string') {
    throw new Error('通知配置缺少有效的 title 字符串')
  }

  const validTypes = ['success', 'failure', 'progress', 'warning']
  if (!validTypes.includes(config.type)) {
    throw new Error(`無效的通知類型: ${config.type}，必須是 ${validTypes.join(', ')} 之一`)
  }

  if (config.message && typeof config.message !== 'string') {
    throw new Error('message 必須是字符串')
  }

  if (config.data && typeof config.data !== 'object') {
    throw new Error('data 必須是對象')
  }
}

// ============== 通知系統 ==============

/**
 * 建立通知系統實例
 * 
 * 提供方法：
 * - requestPermission() - 請求瀏覽器通知權限
 * - send(type, config) - 發送通知
 * - getNotificationHistory(filter) - 獲取通知歷史
 * - clearNotificationHistory() - 清除通知歷史
 * - onNotificationSent(callback) - 監聽通知發送事件
 * 
 * @returns {Object} 通知系統實例
 */
export function createNotificationSystem() {
  // 內部狀態
  const notificationHistory = []              // 通知歷史列表
  const sentCallbacks = []                    // 發送回調列表
  const sentNotificationCache = new Map()     // 已發送通知快取（去重用）
  let currentPermission = 'default'           // 當前權限狀態

  // ========== 私有工具函數 ==========

  /**
   * 生成唯一的通知 ID
   */
  function generateNotificationId() {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成通知的指紋（用於去重）
   */
  function generateNotificationFingerprint(type, config) {
    return `${type}:${config.title}:${config.message || ''}`
  }

  /**
   * 檢查通知是否重複
   */
  function isDuplicateNotification(type, config) {
    const fingerprint = generateNotificationFingerprint(type, config)
    const lastSent = sentNotificationCache.get(fingerprint)
    
    if (!lastSent) return false
    
    // 30 秒內的相同通知視為重複
    const timeDiff = Date.now() - lastSent
    return timeDiff < 30000
  }

  /**
   * 記錄已發送通知
   */
  function recordSentNotification(type, config) {
    const fingerprint = generateNotificationFingerprint(type, config)
    sentNotificationCache.set(fingerprint, Date.now())
  }

  /**
   * 觸發所有發送回調
   */
  function triggerSentCallbacks(notification) {
    sentCallbacks.forEach(callback => {
      try {
        callback(notification)
      } catch (err) {
        console.error('通知回調執行失敗:', err)
      }
    })
  }

  /**
   * 獲取通知的 CSS 類名（用於樣式）
   */
  function getNotificationClassName(type) {
    const classMap = {
      'success': 'notification-success',
      'failure': 'notification-failure',
      'progress': 'notification-progress',
      'warning': 'notification-warning'
    }
    return classMap[type] || 'notification'
  }

  /**
   * 獲取通知的圖標（用於桌面通知）
   */
  function getNotificationIcon(type) {
    const iconMap = {
      'success': '✓',
      'failure': '✗',
      'progress': '⏳',
      'warning': '⚠'
    }
    return iconMap[type] || '•'
  }

  // ========== 公開方法 ==========

  return {
    /**
     * 請求瀏覽器通知權限
     */
    async requestPermission() {
      if (!('Notification' in window)) {
        throw new Error('瀏覽器不支持通知功能')
      }

      if (Notification.permission !== 'default') {
        currentPermission = Notification.permission
        return Notification.permission
      }

      try {
        const permission = await Notification.requestPermission()
        currentPermission = permission
        return permission
      } catch (error) {
        console.error('請求通知權限失敗:', error)
        throw new Error('無法請求通知權限')
      }
    },

    /**
     * 發送通知
     */
    async send(type, config) {
      validateNotificationConfig({ ...config, type })

      // 檢查是否有權限
      if (Notification.permission === 'denied') {
        throw new Error('用戶拒絕了通知權限')
      }

      // 檢查去重
      if (isDuplicateNotification(type, config)) {
        return {
          success: true,
          type,
          isDuplicate: true,
          message: '通知已在最近發送，已去重'
        }
      }

      // 記錄為已發送
      recordSentNotification(type, config)

      const notificationId = generateNotificationId()
      const timestamp = Date.now()
      const icon = getNotificationIcon(type)

      // 構建通知對象
      const notification = {
        id: notificationId,
        type,
        title: config.title,
        message: config.message || '',
        data: config.data || {},
        timestamp,
        icon,
        className: getNotificationClassName(type)
      }

      // 嘗試顯示桌面通知
      if (Notification.permission === 'granted') {
        try {
          new Notification(`${icon} ${config.title}`, {
            body: config.message || '',
            icon: `/icons/${type}.png`,
            tag: type,
            requireInteraction: type === 'failure' // 失敗通知持續顯示
          })
        } catch (error) {
          console.warn('桌面通知顯示失敗:', error)
        }
      }

      // 添加到歷史記錄
      notificationHistory.push(notification)

      // 限制歷史記錄大小（最多保存 100 條）
      if (notificationHistory.length > 100) {
        notificationHistory.shift()
      }

      // 保存到 localStorage
      try {
        const history = JSON.parse(localStorage.getItem('notification_history') || '[]')
        history.push(notification)
        if (history.length > 100) history.shift()
        localStorage.setItem('notification_history', JSON.stringify(history))
      } catch (error) {
        console.warn('無法保存通知到 localStorage:', error)
      }

      // 觸發回調
      triggerSentCallbacks(notification)

      // 異步返回結果
      return Promise.resolve({
        success: true,
        type,
        id: notificationId,
        timestamp
      })
    },

    /**
     * 獲取通知歷史
     */
    async getNotificationHistory(filter = {}) {
      let history = [...notificationHistory]

      // 從 localStorage 恢復（如果內存中為空）
      if (history.length === 0) {
        try {
          history = JSON.parse(localStorage.getItem('notification_history') || '[]')
        } catch (error) {
          console.warn('無法從 localStorage 恢復通知:', error)
        }
      }

      // 按類型過濾
      if (filter.type) {
        history = history.filter(n => n.type === filter.type)
      }

      // 按日期範圍過濾
      if (filter.startTime) {
        history = history.filter(n => n.timestamp >= filter.startTime)
      }
      if (filter.endTime) {
        history = history.filter(n => n.timestamp <= filter.endTime)
      }

      // 按 taskId 過濾
      if (filter.taskId) {
        history = history.filter(n => n.data?.taskId === filter.taskId)
      }

      // 排序（最新的優先）
      history.sort((a, b) => b.timestamp - a.timestamp)

      // 限制結果數量
      if (filter.limit) {
        history = history.slice(0, filter.limit)
      }

      return history
    },

    /**
     * 清除通知歷史
     */
    async clearNotificationHistory(filter = {}) {
      if (filter.type) {
        // 只清除特定類型
        const index = notificationHistory.findIndex(n => n.type === filter.type)
        if (index > -1) {
          notificationHistory.splice(index, 1)
        }
      } else {
        // 清除所有
        notificationHistory.length = 0
      }

      // 同步到 localStorage
      try {
        if (filter.type) {
          const history = JSON.parse(localStorage.getItem('notification_history') || '[]')
          const filtered = history.filter(n => n.type !== filter.type)
          localStorage.setItem('notification_history', JSON.stringify(filtered))
        } else {
          localStorage.removeItem('notification_history')
        }
      } catch (error) {
        console.warn('無法更新 localStorage:', error)
      }
    },

    /**
     * 監聽通知發送事件
     */
    onNotificationSent(callback) {
      if (typeof callback !== 'function') {
        throw new Error('回調必須是函數')
      }
      sentCallbacks.push(callback)
    },

    /**
     * 獲取當前權限狀態
     */
    getPermissionStatus() {
      return Notification?.permission || currentPermission
    },

    /**
     * 獲取通知統計
     */
    async getNotificationStats() {
      const history = await this.getNotificationHistory()
      const stats = {
        total: history.length,
        byType: {
          success: 0,
          failure: 0,
          progress: 0,
          warning: 0
        },
        lastNotification: history[0] || null,
        oldestNotification: history[history.length - 1] || null
      }

      for (const notification of history) {
        if (stats.byType[notification.type] !== undefined) {
          stats.byType[notification.type]++
        }
      }

      return stats
    }
  }
}
