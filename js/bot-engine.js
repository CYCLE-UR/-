/**
 * 搶票自動化引擎
 * 提供任務管理、執行和監控功能
 */

import { validateTask, createDefaultTask, TASK_STATUS } from './task-model.js'
import {
  createData,
  readData,
  updateData,
  deleteData,
  listData,
  getCurrentUser
} from './storage.js'

/**
 * 創建搶票引擎實例
 * @returns {Object} 引擎實例
 */
export function createBotEngine() {
  const tasks = new Map()
  const listeners = new Map()

  const engine = {
    /**
     * 添加任務
     * @param {Object} taskData - 任務數據
     * @returns {Promise<Object>} 創建的任務
     */
    addTask: async (taskData) => {
      const validation = validateTask(taskData)
      if (!validation.valid) {
        throw new Error(`任務驗證失敗：${validation.errors.join('，')}`)
      }

      const user = getCurrentUser()
      if (!user) {
        throw new Error('未登錄')
      }

      const newTask = createDefaultTask({
        ...taskData,
        userId: user.id
      })

      const result = await createData(`tasks/${newTask.id}`, newTask)
      tasks.set(newTask.id, result)
      engine.emit('taskAdded', result)
      return result
    },

    /**
     * 獲取任務
     * @param {string} taskId - 任務 ID
     * @returns {Promise<Object>} 任務對象
     */
    getTask: async (taskId) => {
      if (tasks.has(taskId)) {
        return tasks.get(taskId)
      }
      const task = await readData(`tasks/${taskId}`)
      if (task && task.id) {
        tasks.set(taskId, task)
      }
      return task
    },

    /**
     * 更新任務
     * @param {string} taskId - 任務 ID
     * @param {Object} updates - 更新欄位
     * @returns {Promise<Object>} 更新後的任務
     */
    updateTask: async (taskId, updates) => {
      const task = await engine.getTask(taskId)
      if (!task) {
        throw new Error('任務不存在')
      }

      const updatedTask = {
        ...task,
        ...updates,
        id: taskId,
        updatedAt: new Date().toISOString()
      }

      const validation = validateTask(updatedTask)
      if (!validation.valid) {
        throw new Error(`任務驗證失敗：${validation.errors.join('，')}`)
      }

      const result = await updateData(`tasks/${taskId}`, updatedTask)
      tasks.set(taskId, result)
      engine.emit('taskUpdated', result)
      return result
    },

    /**
     * 刪除任務
     * @param {string} taskId - 任務 ID
     * @returns {Promise<void>}
     */
    deleteTask: async (taskId) => {
      await deleteData(`tasks/${taskId}`)
      tasks.delete(taskId)
      engine.emit('taskDeleted', taskId)
    },

    /**
     * 列出所有任務
     * @param {Object} filter - 過濾條件
     * @param {string} filter.status - 任務狀態
     * @param {number} filter.priority - 最小優先級
     * @returns {Promise<Array>} 任務列表
     */
    listTasks: async (filter = {}) => {
      const allTasks = await listData('tasks')
      let filteredTasks = Object.values(allTasks || {})

      if (filter.status) {
        filteredTasks = filteredTasks.filter(t => t.status === filter.status)
      }

      if (filter.priority) {
        filteredTasks = filteredTasks.filter(t => t.priority >= filter.priority)
      }

      // 按優先級降序排列
      return filteredTasks.sort((a, b) => b.priority - a.priority)
    },

    /**
     * 啟動任務
     * @param {string} taskId - 任務 ID
     * @returns {Promise<Object>} 更新後的任務
     */
    startTask: async (taskId) => {
      const task = await engine.getTask(taskId)
      if (!task) {
        throw new Error('任務不存在')
      }

      if (task.status !== TASK_STATUS.PENDING) {
        throw new Error('只能啟動待機狀態的任務')
      }

      const updatedStats = {
        ...task.statistics,
        attemptCount: (task.statistics?.attemptCount || 0) + 1,
        lastAttemptTime: new Date().toISOString()
      }

      return engine.updateTask(taskId, {
        status: TASK_STATUS.RUNNING,
        startedAt: new Date().toISOString(),
        statistics: updatedStats
      })
    },

    /**
     * 暫停任務
     * @param {string} taskId - 任務 ID
     * @returns {Promise<Object>} 更新後的任務
     */
    pauseTask: async (taskId) => {
      const task = await engine.getTask(taskId)
      if (!task) {
        throw new Error('任務不存在')
      }

      if (task.status !== TASK_STATUS.RUNNING) {
        throw new Error('只能暫停運行中的任務')
      }

      return engine.updateTask(taskId, { status: TASK_STATUS.PAUSED })
    },

    /**
     * 恢復任務
     * @param {string} taskId - 任務 ID
     * @returns {Promise<Object>} 更新後的任務
     */
    resumeTask: async (taskId) => {
      const task = await engine.getTask(taskId)
      if (!task) {
        throw new Error('任務不存在')
      }

      if (task.status !== TASK_STATUS.PAUSED) {
        throw new Error('只能恢復暫停狀態的任務')
      }

      return engine.updateTask(taskId, { status: TASK_STATUS.RUNNING })
    },

    /**
     * 標記任務成功
     * @param {string} taskId - 任務 ID
     * @returns {Promise<Object>} 更新後的任務
     */
    markTaskSuccess: async (taskId) => {
      const task = await engine.getTask(taskId)
      if (!task) {
        throw new Error('任務不存在')
      }

      const updatedStats = {
        ...task.statistics,
        successCount: (task.statistics?.successCount || 0) + 1,
        lastSuccessTime: new Date().toISOString()
      }

      const result = await engine.updateTask(taskId, {
        status: TASK_STATUS.SUCCESS,
        completedAt: new Date().toISOString(),
        statistics: updatedStats
      })

      engine.emit('taskSuccess', result)
      return result
    },

    /**
     * 標記任務失敗
     * @param {string} taskId - 任務 ID
     * @param {string} reason - 失敗原因
     * @returns {Promise<Object>} 更新後的任務
     */
    markTaskFailed: async (taskId, reason = '') => {
      const task = await engine.getTask(taskId)
      if (!task) {
        throw new Error('任務不存在')
      }

      const updatedStats = {
        ...task.statistics,
        failureCount: (task.statistics?.failureCount || 0) + 1,
        lastAttemptTime: new Date().toISOString()
      }

      const result = await engine.updateTask(taskId, {
        status: TASK_STATUS.FAILED,
        completedAt: new Date().toISOString(),
        statistics: updatedStats
      })

      engine.emit('taskFailed', { task: result, reason })
      return result
    },

    /**
     * 獲取任務統計信息
     * @param {string} taskId - 任務 ID
     * @returns {Promise<Object>} 統計信息
     */
    getTaskStatistics: async (taskId) => {
      const task = await engine.getTask(taskId)
      if (!task) {
        throw new Error('任務不存在')
      }

      const stats = task.statistics || {}
      const attemptCount = stats.attemptCount || 0
      const successCount = stats.successCount || 0

      return {
        id: taskId,
        name: task.name,
        status: task.status,
        priority: task.priority,
        attemptCount,
        successCount,
        failureCount: stats.failureCount || 0,
        successRate: attemptCount > 0 ? ((successCount / attemptCount) * 100).toFixed(2) + '%' : 'N/A',
        lastAttemptTime: stats.lastAttemptTime,
        lastSuccessTime: stats.lastSuccessTime
      }
    },

    /**
     * 獲取所有任務統計
     * @returns {Promise<Array>} 統計信息列表
     */
    getAllTasksStatistics: async () => {
      const allTasks = await engine.listTasks()
      return Promise.all(allTasks.map(task => engine.getTaskStatistics(task.id)))
    },

    /**
     * 添加事件監聽器
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     * @returns {Function} 取消監聽函數
     */
    on: (event, callback) => {
      if (!listeners.has(event)) {
        listeners.set(event, [])
      }
      listeners.get(event).push(callback)

      return () => {
        const callbacks = listeners.get(event)
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    },

    /**
     * 觸發事件
     * @param {string} event - 事件名稱
     * @param {*} data - 事件數據
     */
    emit: (event, data) => {
      const callbacks = listeners.get(event) || []
      callbacks.forEach(callback => callback(data))
    },

    /**
     * 清空內存緩存
     */
    clearCache: () => {
      tasks.clear()
      listeners.clear()
    }
  }

  return engine
}

/**
 * 創建全局引擎實例
 */
export const botEngine = createBotEngine()
