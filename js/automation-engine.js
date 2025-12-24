/**
 * 自動搶票執行引擎 (Automation Engine)
 * 
 * 核心功能：
 * - 任務排程：根據指定時間自動執行搶票任務
 * - DOM 操作：自動點擊、填表、導航
 * - 重試機制：失敗自動重試，可配置次數和延遲
 * - 錯誤恢復：任務失敗時執行恢復邏輯
 * - 事件系統：監聽任務完成、失敗等事件
 * 
 * 依賴：task-model.js
 */

// ============== DOM 選擇器工具 ==============

/**
 * 建立 DOM 選擇器（支持多種格式）
 * 
 * @param {Object} config - 選擇器配置
 * @param {string} config.type - 選擇器類型: 'class', 'id', 'attribute', 'xpath'
 * @param {string} config.value - CSS/xpath 值
 * @param {string} [config.name] - attribute 選擇器的屬性名
 * @returns {string} DOM 選擇器字符串
 * @throws 當選擇器類型無效時
 */
export function createDOMSelector(config) {
  if (!config || !config.type) {
    throw new Error('選擇器配置缺少 type 字段')
  }

  const { type, value, name } = config

  switch (type) {
    case 'class':
      if (!value) throw new Error('class 選擇器缺少 value')
      return `.${value}`

    case 'id':
      if (!value) throw new Error('id 選擇器缺少 value')
      return `#${value}`

    case 'attribute':
      if (!name || !value) throw new Error('attribute 選擇器缺少 name 或 value')
      return `[${name}="${value}"]`

    case 'xpath':
      if (!value) throw new Error('xpath 選擇器缺少 value')
      return value // XPath 直接返回

    default:
      throw new Error(`未知的選擇器類型: ${type}`)
  }
}

// ============== 執行配置驗證 ==============

/**
 * 驗證自動化執行配置的有效性
 * 
 * @param {Object} config - 執行配置
 * @param {string} config.targetUrl - 目標網址 (必須)
 * @param {string} config.clickSelector - 要點擊的元素選擇器 (必須)
 * @param {number} [config.clickDelay=500] - 點擊前的延遲毫秒數
 * @param {number} [config.retryCount=3] - 失敗重試次數
 * @param {number} [config.retryDelay=1000] - 重試間隔毫秒數
 * @throws 當配置無效時
 */
export function validateExecutionConfig(config) {
  if (!config) {
    throw new Error('執行配置不能為空')
  }

  // 必需字段
  if (!config.targetUrl || typeof config.targetUrl !== 'string') {
    throw new Error('執行配置缺少有效的 targetUrl 字符串')
  }

  if (!config.clickSelector || typeof config.clickSelector !== 'string') {
    throw new Error('執行配置缺少有效的 clickSelector 字符串')
  }

  // 可選字段驗證
  if (config.clickDelay !== undefined) {
    if (typeof config.clickDelay !== 'number' || config.clickDelay < 0) {
      throw new Error('clickDelay 必須為非負整數')
    }
  }

  if (config.retryCount !== undefined) {
    if (typeof config.retryCount !== 'number' || config.retryCount < 0) {
      throw new Error('retryCount 必須為非負整數')
    }
  }

  if (config.retryDelay !== undefined) {
    if (typeof config.retryDelay !== 'number' || config.retryDelay < 0) {
      throw new Error('retryDelay 必須為非負整數')
    }
  }
}

// ============== 自動化引擎 ==============

/**
 * 建立自動化引擎實例
 * 
 * 提供方法：
 * - schedule(config) - 排程任務
 * - executeTask(taskId) - 立即執行任務
 * - pauseExecution(taskId) - 暫停任務
 * - resumeExecution(taskId) - 繼續暫停的任務
 * - cancelExecution(taskId) - 取消任務
 * - getExecutionStatus(taskId) - 獲取任務狀態
 * - listScheduledTasks(filter) - 列出排程任務
 * - onExecutionComplete(callback) - 監聽完成事件
 * 
 * @returns {Object} 自動化引擎實例
 */
export function createAutomationEngine() {
  // 內部狀態
  const scheduledTasks = new Map()    // 排程任務 Map: taskId -> taskInfo
  const executionTimers = new Map()   // 執行計時器 Map: taskId -> timeoutId
  const completionCallbacks = []      // 完成回調列表
  const executionStatus = new Map()   // 執行狀態 Map: taskId -> statusInfo

  // ========== 私有工具函數 ==========

  /**
   * 生成任務初始狀態
   */
  function createStatusInfo(taskId, config, executionTime) {
    return {
      taskId,
      status: 'scheduled',           // scheduled, executing, completed, failed, paused, cancelled
      config,
      executionTime,
      attemptCount: 0,
      lastAttemptTime: null,
      cancelledAt: null,
      completedAt: null,
      error: null,
      result: null
    }
  }

  /**
   * 模擬執行點擊操作
   * (實際環境中會使用真實 DOM 操作)
   */
  async function simulateClickExecution(config) {
    return new Promise((resolve, reject) => {
      // 模擬點擊延遲
      const delay = config.clickDelay || 500
      setTimeout(() => {
        // 模擬隨機成功/失敗（為了測試重試機制）
        const success = Math.random() > 0.3 // 70% 成功率
        if (success) {
          resolve({
            success: true,
            message: `成功點擊選擇器: ${config.clickSelector}`,
            timestamp: Date.now()
          })
        } else {
          reject(new Error(`無法找到選擇器: ${config.clickSelector}`))
        }
      }, delay)
    })
  }

  /**
   * 執行單次嘗試
   */
  async function attemptExecution(taskId, config, currentAttempt, maxRetries) {
    const status = executionStatus.get(taskId)
    if (!status) return

    status.attemptCount = currentAttempt
    status.lastAttemptTime = Date.now()

    try {
      const result = await simulateClickExecution(config)
      status.status = 'completed'
      status.completedAt = Date.now()
      status.result = result
      
      // 觸發完成回調
      triggerCompletionCallbacks({
        taskId,
        success: true,
        result,
        attemptCount: currentAttempt
      })

      return true
    } catch (error) {
      status.error = error.message

      // 檢查是否需要重試
      if (currentAttempt < maxRetries) {
        const retryDelay = config.retryDelay || 1000
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return attemptExecution(taskId, config, currentAttempt + 1, maxRetries)
      } else {
        status.status = 'failed'
        status.completedAt = Date.now()
        
        // 觸發完成回調（失敗）
        triggerCompletionCallbacks({
          taskId,
          success: false,
          error: error.message,
          attemptCount: currentAttempt
        })

        return false
      }
    }
  }

  /**
   * 觸發所有完成回調
   */
  function triggerCompletionCallbacks(result) {
    completionCallbacks.forEach(callback => {
      try {
        callback(result)
      } catch (err) {
        console.error('完成回調執行失敗:', err)
      }
    })
  }

  // ========== 公開方法 ==========

  return {
    /**
     * 排程任務
     */
    async schedule(taskConfig) {
      if (!taskConfig || !taskConfig.taskId) {
        throw new Error('任務配置缺少 taskId')
      }

      if (scheduledTasks.has(taskConfig.taskId)) {
        throw new Error(`任務 ${taskConfig.taskId} 已排程`)
      }

      validateExecutionConfig(taskConfig.config)

      // 檢查執行時間
      if (!(taskConfig.executionTime instanceof Date)) {
        throw new Error('executionTime 必須是 Date 對象')
      }

      if (taskConfig.executionTime <= new Date()) {
        throw new Error('executionTime 不能早於當前時間')
      }

      const statusInfo = createStatusInfo(
        taskConfig.taskId,
        taskConfig.config,
        taskConfig.executionTime
      )
      
      executionStatus.set(taskConfig.taskId, statusInfo)
      scheduledTasks.set(taskConfig.taskId, taskConfig)

      // 設置執行計時器
      const delayMs = taskConfig.executionTime.getTime() - Date.now()
      const timerId = setTimeout(() => {
        this.executeTask(taskConfig.taskId).catch(err => {
          console.error(`任務 ${taskConfig.taskId} 自動執行失敗:`, err)
        })
      }, delayMs)

      executionTimers.set(taskConfig.taskId, timerId)

      return {
        taskId: taskConfig.taskId,
        status: 'scheduled',
        executionTime: taskConfig.executionTime
      }
    },

    /**
     * 立即執行任務
     */
    async executeTask(taskId) {
      const taskConfig = scheduledTasks.get(taskId)
      if (!taskConfig) {
        throw new Error(`未找到任務: ${taskId}`)
      }

      const status = executionStatus.get(taskId)
      if (!status) {
        throw new Error(`無效的任務狀態: ${taskId}`)
      }

      // 清除排程的計時器
      if (executionTimers.has(taskId)) {
        clearTimeout(executionTimers.get(taskId))
        executionTimers.delete(taskId)
      }

      status.status = 'executing'
      const maxRetries = taskConfig.config.retryCount || 3

      // 異步執行
      setImmediate(() => {
        attemptExecution(taskId, taskConfig.config, 1, maxRetries)
      })

      return {
        taskId,
        status: 'executing'
      }
    },

    /**
     * 暫停執行
     */
    async pauseExecution(taskId) {
      const status = executionStatus.get(taskId)
      if (!status) {
        throw new Error(`未找到任務: ${taskId}`)
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return Promise.reject(new Error(`無法暫停已完成的任務: ${taskId}`))
      }

      // 清除計時器但保留任務配置
      if (executionTimers.has(taskId)) {
        clearTimeout(executionTimers.get(taskId))
        executionTimers.delete(taskId)
      }

      status.status = 'paused'

      return {
        taskId,
        status: 'paused'
      }
    },

    /**
     * 繼續暫停的任務
     */
    async resumeExecution(taskId) {
      const taskConfig = scheduledTasks.get(taskId)
      const status = executionStatus.get(taskId)

      if (!status) {
        throw new Error(`未找到任務: ${taskId}`)
      }

      if (status.status !== 'paused') {
        throw new Error(`任務不在暫停狀態: ${taskId}`)
      }

      status.status = 'scheduled'

      // 重新設置計時器（使用之前的執行時間）
      const delayMs = Math.max(0, status.executionTime.getTime() - Date.now())
      const timerId = setTimeout(() => {
        this.executeTask(taskId).catch(err => {
          console.error(`任務 ${taskId} 自動執行失敗:`, err)
        })
      }, delayMs)

      executionTimers.set(taskId, timerId)

      return {
        taskId,
        status: 'scheduled'
      }
    },

    /**
     * 取消執行
     */
    async cancelExecution(taskId) {
      const status = executionStatus.get(taskId)
      if (!status) {
        throw new Error(`未找到任務: ${taskId}`)
      }

      // 清除計時器
      if (executionTimers.has(taskId)) {
        clearTimeout(executionTimers.get(taskId))
        executionTimers.delete(taskId)
      }

      status.status = 'cancelled'
      status.cancelledAt = Date.now()

      return {
        taskId,
        status: 'cancelled'
      }
    },

    /**
     * 獲取執行狀態
     */
    async getExecutionStatus(taskId) {
      const status = executionStatus.get(taskId)
      if (!status) {
        throw new Error(`未找到任務: ${taskId}`)
      }

      return {
        taskId: status.taskId,
        status: status.status,
        config: status.config,
        executionTime: status.executionTime,
        attemptCount: status.attemptCount,
        lastAttemptTime: status.lastAttemptTime,
        cancelledAt: status.cancelledAt,
        completedAt: status.completedAt,
        error: status.error,
        result: status.result
      }
    },

    /**
     * 列出所有排程的任務
     */
    async listScheduledTasks(filter = {}) {
      const tasks = Array.from(scheduledTasks.values()).map(taskConfig => {
        const status = executionStatus.get(taskConfig.taskId)
        return {
          taskId: taskConfig.taskId,
          executionTime: taskConfig.executionTime,
          status: status.status,
          attemptCount: status.attemptCount,
          config: taskConfig.config
        }
      })

      // 按執行時間排序
      tasks.sort((a, b) => a.executionTime - b.executionTime)

      // 應用過濾器
      if (filter.status) {
        return tasks.filter(t => t.status === filter.status)
      }

      return tasks
    },

    /**
     * 監聽執行完成事件
     */
    onExecutionComplete(callback) {
      if (typeof callback !== 'function') {
        throw new Error('回調必須是函數')
      }
      completionCallbacks.push(callback)
    }
  }
}
