/**
 * 高級搜索和排序模塊
 * 提供複雜的任務搜索、排序、過濾和分組功能
 */

/**
 * 搜索配置對象
 * @typedef {Object} SearchConfig
 * @property {string} query - 搜索查詢字符串
 * @property {Array<string>} fields - 搜索的字段列表
 * @property {string} matchMode - 匹配模式 ('exact' | 'contains' | 'regex' | 'fuzzy')
 * @property {boolean} caseSensitive - 是否區分大小寫
 */

/**
 * 執行高級搜索
 * @param {Array<Object>} tasks - 任務數組
 * @param {SearchConfig} searchConfig - 搜索配置
 * @returns {Array<Object>} 搜索結果
 */
export function advancedSearch(tasks, searchConfig) {
  const {
    query = '',
    fields = ['name', 'eventName', 'ticketConfig.targetUrl'],
    matchMode = 'contains',
    caseSensitive = false
  } = searchConfig

  if (!query || query.trim() === '') {
    return tasks
  }

  const processedQuery = caseSensitive ? query : query.toLowerCase()

  return tasks.filter(task => {
    return fields.some(field => {
      const value = getNestedValue(task, field)
      if (!value) return false

      const stringValue = String(value)
      const processedValue = caseSensitive ? stringValue : stringValue.toLowerCase()

      switch (matchMode) {
        case 'exact':
          return processedValue === processedQuery

        case 'contains':
          return processedValue.includes(processedQuery)

        case 'regex':
          try {
            const regex = new RegExp(processedQuery, caseSensitive ? 'g' : 'gi')
            return regex.test(processedValue)
          } catch {
            return false
          }

        case 'fuzzy':
          return fuzzyMatch(processedValue, processedQuery)

        default:
          return processedValue.includes(processedQuery)
      }
    })
  })
}

/**
 * 複雜搜索（支持多條件組合）
 * @param {Array<Object>} tasks - 任務數組
 * @param {Object} criteria - 搜索條件
 * @param {string} criteria.searchText - 文本搜索
 * @param {string} criteria.status - 狀態過濾
 * @param {number} criteria.priorityMin - 最小優先級
 * @param {number} criteria.priorityMax - 最大優先級
 * @param {string} criteria.dateFrom - 開始日期
 * @param {string} criteria.dateTo - 結束日期
 * @param {number} criteria.successRateMin - 最小成功率
 * @param {Array<string>} criteria.tags - 標籤過濾
 * @param {string} criteria.logic - 邏輯組合 ('AND' | 'OR')
 * @returns {Array<Object>} 過濾結果
 */
export function complexSearch(tasks, criteria = {}) {
  const {
    searchText = '',
    status = null,
    priorityMin = null,
    priorityMax = null,
    dateFrom = null,
    dateTo = null,
    successRateMin = null,
    tags = [],
    logic = 'AND'
  } = criteria

  const conditions = []

  // 文本搜索條件
  if (searchText) {
    conditions.push(task => {
      const searchLower = searchText.toLowerCase()
      return (
        task.name.toLowerCase().includes(searchLower) ||
        task.eventName.toLowerCase().includes(searchLower) ||
        (task.ticketConfig?.targetUrl || '').toLowerCase().includes(searchLower)
      )
    })
  }

  // 狀態條件
  if (status) {
    conditions.push(task => task.status === status)
  }

  // 優先級範圍條件
  if (priorityMin !== null || priorityMax !== null) {
    conditions.push(task => {
      if (priorityMin !== null && task.priority < priorityMin) return false
      if (priorityMax !== null && task.priority > priorityMax) return false
      return true
    })
  }

  // 日期範圍條件
  if (dateFrom || dateTo) {
    conditions.push(task => {
      const eventDate = new Date(task.eventDate)
      if (dateFrom && eventDate < new Date(dateFrom)) return false
      if (dateTo && eventDate > new Date(dateTo)) return false
      return true
    })
  }

  // 成功率條件
  if (successRateMin !== null) {
    conditions.push(task => {
      const rate = calculateSuccessRate(task)
      return rate >= successRateMin
    })
  }

  // 標籤條件
  if (tags && tags.length > 0) {
    conditions.push(task => {
      const taskTags = task.tags || []
      return tags.some(tag => taskTags.includes(tag))
    })
  }

  // 應用邏輯組合
  if (conditions.length === 0) {
    return tasks
  }

  return tasks.filter(task => {
    if (logic === 'AND') {
      return conditions.every(condition => condition(task))
    } else {
      return conditions.some(condition => condition(task))
    }
  })
}

/**
 * 高級排序（支持多字段、自定義排序）
 * @param {Array<Object>} tasks - 任務數組
 * @param {Array<Object>} sortRules - 排序規則數組
 * @example
 * advancedSort(tasks, [
 *   { field: 'priority', order: 'desc' },
 *   { field: 'eventDate', order: 'asc' },
 *   { field: 'createdAt', order: 'desc' }
 * ])
 * @returns {Array<Object>} 排序後的任務
 */
export function advancedSort(tasks, sortRules = []) {
  if (!Array.isArray(sortRules) || sortRules.length === 0) {
    return tasks
  }

  const sorted = [...tasks]

  sorted.sort((a, b) => {
    for (const rule of sortRules) {
      const { field, order = 'asc', type = 'auto' } = rule
      const aVal = getNestedValue(a, field)
      const bVal = getNestedValue(b, field)

      let comparison = 0

      if (aVal == null && bVal == null) {
        comparison = 0
      } else if (aVal == null) {
        comparison = 1
      } else if (bVal == null) {
        comparison = -1
      } else {
        if (type === 'date' || field.includes('Date') || field.includes('Time')) {
          const aTime = new Date(aVal).getTime()
          const bTime = new Date(bVal).getTime()
          comparison = aTime - bTime
        } else if (type === 'number' || typeof aVal === 'number') {
          comparison = aVal - bVal
        } else if (type === 'string' || typeof aVal === 'string') {
          comparison = String(aVal).localeCompare(String(bVal), 'zh-TW')
        } else {
          comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        }
      }

      if (comparison !== 0) {
        return order === 'desc' ? -comparison : comparison
      }
    }

    return 0
  })

  return sorted
}

/**
 * 按字段分組任務
 * @param {Array<Object>} tasks - 任務數組
 * @param {string} groupBy - 分組字段
 * @returns {Object} 分組結果，鍵為分組值，值為任務數組
 */
export function groupTasks(tasks, groupBy) {
  const groups = {}

  tasks.forEach(task => {
    const value = getNestedValue(task, groupBy)
    const key = value != null ? String(value) : '未設置'

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(task)
  })

  return groups
}

/**
 * 統計任務信息
 * @param {Array<Object>} tasks - 任務數組
 * @returns {Object} 統計結果
 */
export function statisticsTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      total: 0,
      byStatus: {},
      byPriority: {},
      successRate: 0,
      avgAttempts: 0,
      totalAttempts: 0,
      totalSuccesses: 0
    }
  }

  const stats = {
    total: tasks.length,
    byStatus: {},
    byPriority: {},
    successRate: 0,
    avgAttempts: 0,
    totalAttempts: 0,
    totalSuccesses: 0
  }

  tasks.forEach(task => {
    // 按狀態統計
    const status = task.status || 'unknown'
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

    // 按優先級統計
    const priority = task.priority || 0
    stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1

    // 嘗試和成功統計
    const attempts = task.statistics?.attemptCount || 0
    const successes = task.statistics?.successCount || 0
    stats.totalAttempts += attempts
    stats.totalSuccesses += successes
  })

  // 計算平均嘗試次數和成功率
  stats.avgAttempts = stats.total > 0 ? (stats.totalAttempts / stats.total).toFixed(2) : 0
  stats.successRate = stats.totalAttempts > 0 ? ((stats.totalSuccesses / stats.totalAttempts) * 100).toFixed(2) : 0

  return stats
}

/**
 * 獲取任務統計概覽
 * @param {Array<Object>} tasks - 任務數組
 * @returns {Object} 概覽數據
 */
export function getTasksSummary(tasks) {
  if (!Array.isArray(tasks)) {
    return {}
  }

  const summary = {}

  // 按狀態分組統計
  const byStatus = groupTasks(tasks, 'status')
  Object.keys(byStatus).forEach(status => {
    summary[`status_${status}`] = byStatus[status].length
  })

  // 按優先級分組統計
  const byPriority = groupTasks(tasks, 'priority')
  Object.keys(byPriority).forEach(priority => {
    summary[`priority_${priority}`] = byPriority[priority].length
  })

  // 日期統計
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  summary.createdToday = tasks.filter(t => new Date(t.createdAt) >= todayStart).length
  summary.createdThisWeek = tasks.filter(t => new Date(t.createdAt) >= weekStart).length

  return summary
}

/**
 * 模糊匹配
 * @private
 * @param {string} str - 字符串
 * @param {string} pattern - 模式
 * @returns {boolean}
 */
function fuzzyMatch(str, pattern) {
  let patternIdx = 0

  for (let i = 0; i < str.length && patternIdx < pattern.length; i++) {
    if (str[i] === pattern[patternIdx]) {
      patternIdx++
    }
  }

  return patternIdx === pattern.length
}

/**
 * 獲取嵌套值
 * @private
 * @param {Object} obj - 對象
 * @param {string} path - 路徑
 * @returns {*}
 */
function getNestedValue(obj, path) {
  try {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  } catch {
    return null
  }
}

/**
 * 計算成功率
 * @private
 * @param {Object} task - 任務
 * @returns {number} 成功率 (0-100)
 */
function calculateSuccessRate(task) {
  const attempts = task.statistics?.attemptCount || 0
  if (attempts === 0) return 0

  return (task.statistics?.successCount || 0) / attempts * 100
}

/**
 * 生成搜索建議（基於已有任務）
 * @param {Array<Object>} tasks - 任務數組
 * @returns {Object} 搜索建議
 */
export function getSearchSuggestions(tasks) {
  const suggestions = {
    names: new Set(),
    events: new Set(),
    urls: new Set(),
    statuses: new Set(),
    priorities: new Set()
  }

  tasks.forEach(task => {
    if (task.name) suggestions.names.add(task.name)
    if (task.eventName) suggestions.events.add(task.eventName)
    if (task.ticketConfig?.targetUrl) suggestions.urls.add(task.ticketConfig.targetUrl)
    if (task.status) suggestions.statuses.add(task.status)
    if (task.priority) suggestions.priorities.add(task.priority)
  })

  // 轉換 Set 為排序數組
  return {
    names: Array.from(suggestions.names).sort(),
    events: Array.from(suggestions.events).sort(),
    urls: Array.from(suggestions.urls).sort(),
    statuses: Array.from(suggestions.statuses).sort(),
    priorities: Array.from(suggestions.priorities).sort((a, b) => b - a)
  }
}

/**
 * 構建搜索查詢字符串
 * @param {Object} filters - 過濾條件
 * @returns {string} 查詢字符串
 */
export function buildSearchQuery(filters = {}) {
  const parts = []

  if (filters.searchText) {
    parts.push(`text:"${filters.searchText}"`)
  }

  if (filters.status) {
    parts.push(`status:${filters.status}`)
  }

  if (filters.priority) {
    parts.push(`priority:${filters.priority}`)
  }

  if (filters.eventName) {
    parts.push(`event:"${filters.eventName}"`)
  }

  if (filters.dateFrom) {
    parts.push(`from:${filters.dateFrom}`)
  }

  if (filters.dateTo) {
    parts.push(`to:${filters.dateTo}`)
  }

  return parts.join(' ')
}

/**
 * 解析搜索查詢字符串
 * @param {string} queryString - 查詢字符串
 * @returns {Object} 解析的過濾條件
 */
export function parseSearchQuery(queryString) {
  const filters = {}
  const regex = /(\w+):(?:"([^"]*)"|(\S+))/g
  let match

  while ((match = regex.exec(queryString)) !== null) {
    const key = match[1]
    const value = match[2] || match[3]

    switch (key) {
      case 'text':
        filters.searchText = value
        break
      case 'status':
        filters.status = value
        break
      case 'priority':
        filters.priority = parseInt(value)
        break
      case 'event':
        filters.eventName = value
        break
      case 'from':
        filters.dateFrom = value
        break
      case 'to':
        filters.dateTo = value
        break
    }
  }

  return filters
}
