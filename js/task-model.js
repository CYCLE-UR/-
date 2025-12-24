/**
 * 搶票任務數據模型定義
 */

/**
 * 搶票任務數據結構
 * @typedef {Object} TicketTask
 * @property {string} id - 任務唯一 ID
 * @property {string} userId - 用戶 ID
 * @property {string} name - 任務名稱（如：「演唱會名稱」）
 * @property {string} eventName - 事件名稱（演唱會、演出等）
 * @property {string} eventDate - 事件日期（YYYY-MM-DD）
 * @property {string} saleStartTime - 售票開始時間（YYYY-MM-DD HH:mm:ss）
 * @property {string} status - 任務狀態：'pending'、'running'、'success'、'failed'、'paused'
 * @property {number} priority - 優先級（1-10，10 最高）
 * @property {Object} ticketConfig - 購票配置
 * @property {string} ticketConfig.targetUrl - 目標售票網址
 * @property {string} ticketConfig.seatPreference - 座位偏好（如：'front'、'middle'、'back'）
 * @property {number} ticketConfig.quantity - 購買數量
 * @property {string} ticketConfig.priceRange - 價格範圍（如：'any'、'low'、'medium'、'high'）
 * @property {Object} automationConfig - 自動化配置
 * @property {string} automationConfig.clickSelector - 購票按鈕選擇器
 * @property {number} automationConfig.clickDelay - 點擊延遲（毫秒）
 * @property {number} automationConfig.maxRetries - 最大重試次數
 * @property {number} automationConfig.retryInterval - 重試間隔（毫秒）
 * @property {Object} notificationConfig - 通知配置
 * @property {boolean} notificationConfig.enableDesktopNotification - 啟用桌面通知
 * @property {boolean} notificationConfig.enableEmailNotification - 啟用郵件通知
 * @property {string} notificationConfig.email - 郵件地址（可選）
 * @property {Object} statistics - 統計數據
 * @property {number} statistics.attemptCount - 嘗試次數
 * @property {number} statistics.successCount - 成功次數
 * @property {number} statistics.failureCount - 失敗次數
 * @property {string} statistics.lastAttemptTime - 上次嘗試時間
 * @property {string} statistics.lastSuccessTime - 上次成功時間
 * @property {string} createdAt - 創建時間
 * @property {string} updatedAt - 更新時間
 * @property {string} startedAt - 開始執行時間（可選）
 * @property {string} completedAt - 完成時間（可選）
 */

/**
 * 任務狀態常量
 */
export const TASK_STATUS = {
  PENDING: 'pending',      // 等待中
  RUNNING: 'running',      // 運行中
  SUCCESS: 'success',      // 成功
  FAILED: 'failed',        // 失敗
  PAUSED: 'paused'         // 暫停
}

/**
 * 座位偏好常量
 */
export const SEAT_PREFERENCE = {
  FRONT: 'front',          // 前排
  MIDDLE: 'middle',        // 中排
  BACK: 'back',            // 後排
  ANY: 'any'               // 任意
}

/**
 * 價格範圍常量
 */
export const PRICE_RANGE = {
  ANY: 'any',              // 任意價格
  LOW: 'low',              // 低價（0-30% 區間內）
  MEDIUM: 'medium',        // 中等價格（30-70% 區間內）
  HIGH: 'high'             // 高價（70-100% 區間內）
}

/**
 * 創建默認任務對象
 * @param {Object} overrides - 要覆蓋的欄位
 * @returns {Object} 新任務對象
 */
export function createDefaultTask(overrides = {}) {
  return {
    id: undefined,                    // 由系統生成
    userId: undefined,                // 由系統設置
    name: '',
    eventName: '',
    eventDate: '',
    saleStartTime: new Date().toISOString(),
    status: TASK_STATUS.PENDING,
    priority: 5,
    ticketConfig: {
      targetUrl: '',
      seatPreference: SEAT_PREFERENCE.ANY,
      quantity: 1,
      priceRange: PRICE_RANGE.ANY
    },
    automationConfig: {
      clickSelector: '',
      clickDelay: 100,
      maxRetries: 3,
      retryInterval: 1000
    },
    notificationConfig: {
      enableDesktopNotification: true,
      enableEmailNotification: false,
      email: ''
    },
    statistics: {
      attemptCount: 0,
      successCount: 0,
      failureCount: 0,
      lastAttemptTime: null,
      lastSuccessTime: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    ...overrides
  }
}

/**
 * 驗證任務對象
 * @param {Object} task - 任務對象
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateTask(task) {
  const errors = []

  // 必填字段檢查
  if (!task.name || task.name.trim() === '') {
    errors.push('任務名稱不能為空')
  }

  if (!task.eventName || task.eventName.trim() === '') {
    errors.push('事件名稱不能為空')
  }

  if (!task.eventDate || task.eventDate.trim() === '') {
    errors.push('事件日期不能為空')
  }

  if (!task.saleStartTime || task.saleStartTime.trim() === '') {
    errors.push('售票開始時間不能為空')
  }

  // 驗證日期格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(task.eventDate)) {
    errors.push('事件日期格式無效（應為 YYYY-MM-DD）')
  }

  const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
  if (!dateTimeRegex.test(task.saleStartTime)) {
    errors.push('售票開始時間格式無效（應為 YYYY-MM-DD HH:mm:ss）')
  }

  // 驗證優先級
  if (task.priority < 1 || task.priority > 10) {
    errors.push('優先級必須在 1-10 之間')
  }

  // 驗證狀態
  const validStatuses = Object.values(TASK_STATUS)
  if (!validStatuses.includes(task.status)) {
    errors.push(`任務狀態無效，有效值：${validStatuses.join('、')}`)
  }

  // 驗證座位偏好
  const validSeatPreferences = Object.values(SEAT_PREFERENCE)
  if (!validSeatPreferences.includes(task.ticketConfig.seatPreference)) {
    errors.push(`座位偏好無效，有效值：${validSeatPreferences.join('、')}`)
  }

  // 驗證購票數量
  if (task.ticketConfig.quantity < 1 || task.ticketConfig.quantity > 10) {
    errors.push('購票數量必須在 1-10 之間')
  }

  // 驗證價格範圍
  const validPriceRanges = Object.values(PRICE_RANGE)
  if (!validPriceRanges.includes(task.ticketConfig.priceRange)) {
    errors.push(`價格範圍無效，有效值：${validPriceRanges.join('、')}`)
  }

  // 驗證自動化配置
  if (task.automationConfig.clickDelay < 0) {
    errors.push('點擊延遲不能為負數')
  }

  if (task.automationConfig.maxRetries < 0) {
    errors.push('最大重試次數不能為負數')
  }

  if (task.automationConfig.retryInterval < 0) {
    errors.push('重試間隔不能為負數')
  }

  // 驗證郵件（如果啟用郵件通知）
  if (task.notificationConfig.enableEmailNotification) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!task.notificationConfig.email || !emailRegex.test(task.notificationConfig.email)) {
      errors.push('郵件通知已啟用但郵件地址無效')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 克隆任務對象
 * @param {Object} task - 任務對象
 * @returns {Object} 克隆後的任務
 */
export function cloneTask(task) {
  return JSON.parse(JSON.stringify(task))
}
