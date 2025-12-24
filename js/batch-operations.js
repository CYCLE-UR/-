/**
 * 批量操作模塊
 * 支持對多個任務進行批量操作（啟動、暫停、刪除等）
 */

/**
 * 批量操作結果統計
 * @typedef {Object} BatchOperationResult
 * @property {boolean} success - 是否全部成功
 * @property {number} total - 操作的任務總數
 * @property {number} successful - 成功操作的任務數
 * @property {number} failed - 失敗的任務數
 * @property {string} message - 操作消息
 * @property {Array<Object>} errors - 錯誤詳情
 */

/**
 * 批量啟動任務
 * @param {Array<string>} taskIds - 任務 ID 數組
 * @param {Function} startTaskFn - 啟動任務的函數 (taskId) => Promise
 * @returns {Promise<BatchOperationResult>}
 */
export async function batchStartTasks(taskIds, startTaskFn) {
  return executeBatchOperation(
    taskIds,
    startTaskFn,
    '啟動',
    '已全部啟動'
  )
}

/**
 * 批量暫停任務
 * @param {Array<string>} taskIds - 任務 ID 數組
 * @param {Function} pauseTaskFn - 暫停任務的函數 (taskId) => Promise
 * @returns {Promise<BatchOperationResult>}
 */
export async function batchPauseTasks(taskIds, pauseTaskFn) {
  return executeBatchOperation(
    taskIds,
    pauseTaskFn,
    '暫停',
    '已全部暫停'
  )
}

/**
 * 批量恢復任務
 * @param {Array<string>} taskIds - 任務 ID 數組
 * @param {Function} resumeTaskFn - 恢復任務的函數 (taskId) => Promise
 * @returns {Promise<BatchOperationResult>}
 */
export async function batchResumeTasks(taskIds, resumeTaskFn) {
  return executeBatchOperation(
    taskIds,
    resumeTaskFn,
    '恢復',
    '已全部恢復'
  )
}

/**
 * 批量刪除任務
 * @param {Array<string>} taskIds - 任務 ID 數組
 * @param {Function} deleteTaskFn - 刪除任務的函數 (taskId) => Promise
 * @returns {Promise<BatchOperationResult>}
 */
export async function batchDeleteTasks(taskIds, deleteTaskFn) {
  return executeBatchOperation(
    taskIds,
    deleteTaskFn,
    '刪除',
    '已全部刪除'
  )
}

/**
 * 批量設置優先級
 * @param {Array<string>} taskIds - 任務 ID 數組
 * @param {number} priority - 優先級（1-10）
 * @param {Function} updateTaskFn - 更新任務的函數 (taskId, updates) => Promise
 * @returns {Promise<BatchOperationResult>}
 */
export async function batchSetPriority(taskIds, priority, updateTaskFn) {
  return executeBatchOperation(
    taskIds,
    (taskId) => updateTaskFn(taskId, { priority }),
    '設置優先級',
    `已設置優先級為 ${priority}`
  )
}

/**
 * 批量複製任務
 * @param {Array<string>} taskIds - 任務 ID 數組
 * @param {Function} getTaskFn - 獲取任務的函數 (taskId) => Promise<Task>
 * @param {Function} addTaskFn - 添加任務的函數 (task) => Promise<Task>
 * @returns {Promise<BatchOperationResult>}
 */
export async function batchCopyTasks(taskIds, getTaskFn, addTaskFn) {
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return {
      success: false,
      total: 0,
      successful: 0,
      failed: 0,
      message: '沒有選擇任何任務',
      errors: []
    }
  }

  const errors = []
  const startTime = Date.now()

  for (const taskId of taskIds) {
    try {
      const originalTask = await getTaskFn(taskId)
      if (!originalTask) {
        errors.push({
          taskId,
          error: '任務不存在'
        })
        continue
      }

      // 創建副本
      const copiedTask = {
        ...originalTask,
        id: undefined, // 由系統生成新 ID
        name: `${originalTask.name} (副本)`,
        status: 'pending',
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
        completedAt: null
      }

      await addTaskFn(copiedTask)
    } catch (error) {
      errors.push({
        taskId,
        error: error.message
      })
    }
  }

  const successful = taskIds.length - errors.length
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  return {
    success: errors.length === 0,
    total: taskIds.length,
    successful,
    failed: errors.length,
    message: `成功複製 ${successful} 個任務${errors.length > 0 ? `，失敗 ${errors.length} 個` : ''}（耗時 ${duration}s）`,
    errors: errors.length > 0 ? errors : []
  }
}

/**
 * 批量清空統計數據
 * @param {Array<string>} taskIds - 任務 ID 數組
 * @param {Function} updateTaskFn - 更新任務的函數 (taskId, updates) => Promise
 * @returns {Promise<BatchOperationResult>}
 */
export async function batchResetStatistics(taskIds, updateTaskFn) {
  const resetStats = {
    statistics: {
      attemptCount: 0,
      successCount: 0,
      failureCount: 0,
      lastAttemptTime: null,
      lastSuccessTime: null
    }
  }

  return executeBatchOperation(
    taskIds,
    (taskId) => updateTaskFn(taskId, resetStats),
    '清空統計',
    '已清空統計數據'
  )
}

/**
 * 批量選擇任務（用於 UI 多選）
 * @param {Array<Object>} tasks - 任務數組
 * @param {Array<string>} selectedIds - 已選中的 ID
 * @param {string} action - 動作 ('select' | 'deselect' | 'selectAll' | 'deselectAll')
 * @param {string} taskId - 單個任務 ID（針對 select/deselect）
 * @returns {Array<string>} 更新後的選中 ID 數組
 */
export function updateTaskSelection(tasks, selectedIds, action, taskId = null) {
  const selected = new Set(selectedIds)

  switch (action) {
    case 'select':
      if (taskId && tasks.find(t => t.id === taskId)) {
        selected.add(taskId)
      }
      break
    case 'deselect':
      if (taskId) {
        selected.delete(taskId)
      }
      break
    case 'selectAll':
      tasks.forEach(task => selected.add(task.id))
      break
    case 'deselectAll':
      selected.clear()
      break
    case 'toggle':
      if (taskId) {
        if (selected.has(taskId)) {
          selected.delete(taskId)
        } else {
          selected.add(taskId)
        }
      }
      break
  }

  return Array.from(selected)
}

/**
 * 過濾任務（支持多條件）
 * @param {Array<Object>} tasks - 任務數組
 * @param {Object} filters - 過濾條件
 * @param {string} filters.status - 任務狀態
 * @param {number} filters.priority - 優先級
 * @param {string} filters.eventName - 事件名稱
 * @param {string} filters.searchText - 搜索文本
 * @returns {Array<Object>} 過濾後的任務
 */
export function filterTasks(tasks, filters = {}) {
  return tasks.filter(task => {
    // 狀態過濾
    if (filters.status && task.status !== filters.status) {
      return false
    }

    // 優先級過濾
    if (filters.priority && task.priority !== filters.priority) {
      return false
    }

    // 事件名稱過濾
    if (filters.eventName && !task.eventName.includes(filters.eventName)) {
      return false
    }

    // 搜索文本（模糊搜索）
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      const matchesName = task.name.toLowerCase().includes(searchLower)
      const matchesEvent = task.eventName.toLowerCase().includes(searchLower)
      const matchesUrl = task.ticketConfig?.targetUrl?.toLowerCase().includes(searchLower)

      if (!matchesName && !matchesEvent && !matchesUrl) {
        return false
      }
    }

    // 日期範圍過濾
    if (filters.dateStart && filters.dateEnd) {
      const eventDate = new Date(task.eventDate)
      const start = new Date(filters.dateStart)
      const end = new Date(filters.dateEnd)

      if (eventDate < start || eventDate > end) {
        return false
      }
    }

    return true
  })
}

/**
 * 排序任務
 * @param {Array<Object>} tasks - 任務數組
 * @param {string} sortBy - 排序字段
 * @param {string} order - 排序順序 ('asc' | 'desc')
 * @returns {Array<Object>} 排序後的任務
 */
export function sortTasks(tasks, sortBy = 'createdAt', order = 'desc') {
  const sorted = [...tasks]

  sorted.sort((a, b) => {
    let aVal, bVal

    switch (sortBy) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'eventDate':
        aVal = new Date(a.eventDate).getTime()
        bVal = new Date(b.eventDate).getTime()
        break
      case 'priority':
        aVal = a.priority
        bVal = b.priority
        break
      case 'successRate':
        const aRate = a.statistics?.successCount / Math.max(a.statistics?.attemptCount, 1) || 0
        const bRate = b.statistics?.successCount / Math.max(b.statistics?.attemptCount, 1) || 0
        aVal = aRate
        bVal = bRate
        break
      case 'createdAt':
      default:
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
    }

    if (order === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })

  return sorted
}

/**
 * 執行批量操作的通用函數
 * @private
 * @param {Array<string>} taskIds - 任務 ID 數組
 * @param {Function} operationFn - 操作函數
 * @param {string} operationName - 操作名稱
 * @param {string} successMessage - 成功消息
 * @returns {Promise<BatchOperationResult>}
 */
async function executeBatchOperation(taskIds, operationFn, operationName, successMessage) {
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return {
      success: false,
      total: 0,
      successful: 0,
      failed: 0,
      message: `沒有選擇任何任務進行${operationName}`,
      errors: []
    }
  }

  const errors = []
  const startTime = Date.now()

  for (const taskId of taskIds) {
    try {
      await operationFn(taskId)
    } catch (error) {
      errors.push({
        taskId,
        error: error.message
      })
    }
  }

  const successful = taskIds.length - errors.length
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  return {
    success: errors.length === 0,
    total: taskIds.length,
    successful,
    failed: errors.length,
    message: `已${operationName} ${successful} 個任務${errors.length > 0 ? `，失敗 ${errors.length} 個` : ''}（耗時 ${duration}s）`,
    errors: errors.length > 0 ? errors : []
  }
}

/**
 * 導出批量操作記錄
 * @param {Array<Object>} operationRecords - 操作記錄數組
 * @returns {string} 導出的文本
 */
export function exportOperationLog(operationRecords) {
  const lines = [
    '批量操作記錄',
    '=' .repeat(60),
    `導出時間：${new Date().toISOString()}`,
    ''
  ]

  operationRecords.forEach((record, index) => {
    lines.push(`操作 ${index + 1}：${record.operationName}`)
    lines.push(`時間：${record.timestamp}`)
    lines.push(`結果：${record.success ? '成功' : '部分成功'}`)
    lines.push(`統計：${record.successful}/${record.total} (成功/總數)`)
    if (record.errors.length > 0) {
      lines.push(`錯誤：`)
      record.errors.forEach(err => {
        lines.push(`  - ${err.taskId}: ${err.error}`)
      })
    }
    lines.push('')
  })

  return lines.join('\n')
}
