/**
 * 後台管理系統 (Admin System)
 * 
 * 核心功能：
 * - 數據聚合：匯總用戶和任務統計數據
 * - 用戶管理：查看用戶列表和活動
 * - 任務監控：實時監控所有任務狀態
 * - 統計分析：生成各類統計報表
 * - 數據導出：CSV/JSON 格式導出
 * 
 * 依賴：bot-engine.js, automation-engine.js
 */

/**
 * 創建後台管理系統實例
 * 
 * @param {Object} botEngine - 搶票引擎實例
 * @param {Object} automationEngine - 自動化引擎實例
 * @returns {Object} 後台管理系統實例
 */
export function createAdminSystem(botEngine, automationEngine) {
  /**
   * 獲取儀表板數據
   */
  async function getDashboardData() {
    try {
      // 管理員模式：獲取所有用戶的所有任務
      const allTasks = await getAllUsersTasksAdmin()
      
      // 獲取用戶數據（從任務中提取）
      const userMap = new Map()
      allTasks.forEach(task => {
        if (!userMap.has(task.userId)) {
          userMap.set(task.userId, {
            id: task.userId,
            createdAt: task.createdAt,
            taskCount: 0,
            successCount: 0,
            isActive: false
          })
        }
        const user = userMap.get(task.userId)
        user.taskCount++
        if (task.status === 'success') {
          user.successCount++
        }
        // 檢查最近 7 天是否有活動
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        if (new Date(task.createdAt) > weekAgo) {
          user.isActive = true
        }
      })

      const users = Array.from(userMap.values()).map(user => ({
        ...user,
        successRate: user.taskCount > 0 
          ? Math.round((user.successCount / user.taskCount) * 100) 
          : 0
      }))

      // 計算統計數據
      const totalTasks = allTasks.length
      const runningTasks = allTasks.filter(t => t.status === 'running').length
      const successTasks = allTasks.filter(t => t.status === 'success').length
      const successRate = totalTasks > 0 
        ? Math.round((successTasks / totalTasks) * 100) 
        : 0

      // 今日任務
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTasks = allTasks.filter(t => 
        new Date(t.createdAt) >= today
      ).length

      // 昨日任務（計算增長率）
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayTasks = allTasks.filter(t => {
        const taskDate = new Date(t.createdAt)
        return taskDate >= yesterday && taskDate < today
      }).length
      const todayGrowth = yesterdayTasks > 0 
        ? Math.round(((todayTasks - yesterdayTasks) / yesterdayTasks) * 100)
        : 0

      // 最近活動
      const recentActivities = allTasks
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 10)
        .map(task => ({
          id: task.id,
          icon: task.status === 'success' ? '✅' : 
                task.status === 'failed' ? '❌' : 
                task.status === 'running' ? '⏳' : '📋',
          title: task.eventName,
          description: `${task.status === 'success' ? '成功完成' : 
                        task.status === 'failed' ? '執行失敗' : 
                        task.status === 'running' ? '正在執行' : '等待執行'}`,
          time: formatRelativeTime(task.updatedAt)
        }))

      // 熱門活動排行
      const eventMap = new Map()
      allTasks.forEach(task => {
        if (!eventMap.has(task.eventName)) {
          eventMap.set(task.eventName, {
            name: task.eventName,
            taskCount: 0,
            successCount: 0,
            totalAttempts: 0
          })
        }
        const event = eventMap.get(task.eventName)
        event.taskCount++
        if (task.status === 'success') {
          event.successCount++
        }
        event.totalAttempts++
      })

      const topEvents = Array.from(eventMap.values())
        .map(event => ({
          ...event,
          successRate: event.taskCount > 0 
            ? Math.round((event.successCount / event.taskCount) * 100) 
            : 0
        }))
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 10)

      return {
        stats: {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.isActive).length,
          totalTasks,
          runningTasks,
          successRate,
          successTasks,
          todayTasks,
          todayGrowth,
          pendingTasks: allTasks.filter(t => t.status === 'pending').length,
          pausedTasks: allTasks.filter(t => t.status === 'paused').length,
          failedTasks: allTasks.filter(t => t.status === 'failed').length
        },
        users,
        tasks: allTasks,
        recentActivities,
        topEvents
      }
    } catch (error) {
      console.error('獲取儀表板數據失敗:', error)
      return {
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalTasks: 0,
          runningTasks: 0,
          successRate: 0,
          successTasks: 0,
          todayTasks: 0,
          todayGrowth: 0
        },
        users: [],
        tasks: [],
        recentActivities: [],
        topEvents: []
      }
    }
  }

  /**
   * 獲取用戶詳細資訊
   * 
   * @param {string} userId - 用戶 ID
   * @returns {Promise<Object>} 用戶詳細資訊
   */
  async function getUserDetail(userId) {
    const allTasks = await botEngine.getAllTasks()
    const userTasks = allTasks.filter(t => t.userId === userId)
    
    return {
      userId,
      taskCount: userTasks.length,
      successCount: userTasks.filter(t => t.status === 'success').length,
      failedCount: userTasks.filter(t => t.status === 'failed').length,
      runningCount: userTasks.filter(t => t.status === 'running').length,
      tasks: userTasks
    }
  }

  /**
   * 獲取任務統計數據
   * 
   * @returns {Promise<Object>} 任務統計
   */
  async function getTaskStatistics() {
    const allTasks = await botEngine.getAllTasks()
    
    // 按狀態分類
    const byStatus = {
      pending: allTasks.filter(t => t.status === 'pending').length,
      running: allTasks.filter(t => t.status === 'running').length,
      success: allTasks.filter(t => t.status === 'success').length,
      failed: allTasks.filter(t => t.status === 'failed').length,
      paused: allTasks.filter(t => t.status === 'paused').length
    }

    // 按小時分布
    const byHour = Array(24).fill(0)
    allTasks.forEach(task => {
      const hour = new Date(task.executionTime).getHours()
      byHour[hour]++
    })

    // 最近 7 天趨勢
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const count = allTasks.filter(t => {
        const taskDate = new Date(t.createdAt)
        return taskDate >= date && taskDate < nextDate
      }).length
      
      last7Days.push({
        date: date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
        count
      })
    }

    return {
      byStatus,
      byHour,
      last7Days,
      total: allTasks.length
    }
  }

  /**
   * 導出用戶數據為 CSV 格式
   * 
   * @param {Array} users - 用戶列表
   * @returns {string} CSV 格式的用戶數據
   */
  function exportUsersToCSV(users) {
    const headers = ['用戶ID', '註冊時間', '任務數', '成功率', '狀態']
    const rows = users.map(u => [
      u.id,
      u.createdAt,
      u.taskCount,
      `${u.successRate}%`,
      u.isActive ? '活躍' : '非活躍'
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    return csv
  }

  /**
   * 導出任務數據為 CSV 格式
   * 
   * @param {Array} tasks - 任務列表
   * @returns {string} CSV 格式的任務數據
   */
  function exportTasksToCSV(tasks) {
    const headers = ['任務ID', '活動名稱', '狀態', '目標網址', '執行時間', '創建時間']
    const rows = tasks.map(t => [
      t.id,
      t.eventName,
      t.status,
      t.targetUrl,
      t.executionTime,
      t.createdAt
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    return csv
  }

  /**
   * 清理舊任務
   * 
   * @param {number} daysAgo - 清理多少天前的任務
   * @returns {Promise<number>} 清理的任務數量
   */
  async function clearOldTasks(daysAgo = 30) {
    const allTasks = await botEngine.getAllTasks()
    const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    
    let deletedCount = 0
    for (const task of allTasks) {
      if (new Date(task.createdAt) < cutoffDate && 
          (task.status === 'success' || task.status === 'failed')) {
        await botEngine.deleteTask(task.id)
        deletedCount++
      }
    }
    
    return deletedCount
  }

  /**
   * 格式化相對時間
   * 
   * @param {string} dateStr - 日期字符串
   * @returns {string} 相對時間描述
   */
  function formatRelativeTime(dateStr) {
    const now = Date.now()
    const date = new Date(dateStr)
    const diff = now - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '剛剛'
    if (minutes < 60) return `${minutes} 分鐘前`
    if (hours < 24) return `${hours} 小時前`
    if (days < 7) return `${days} 天前`
    
    return date.toLocaleDateString('zh-TW')
  }

  /**
   * 獲取所有用戶的所有任務（管理員專用）
   * 從 localStorage 中讀取所有任務數據
   */
  async function getAllUsersTasksAdmin() {
    const allTasks = []
    
    // 遍歷 localStorage 中所有的任務數據
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      // 查找任務相關的 key（通常是 tasks/ 開頭）
      if (key && key.includes('tasks/')) {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            const taskData = JSON.parse(value)
            if (taskData && taskData.id) {
              allTasks.push(taskData)
            }
          }
        } catch (error) {
          // 忽略解析錯誤
          console.warn('解析任務數據失敗:', key, error)
        }
      }
    }
    
    return allTasks
  }
  
  /**
   * 強制刪除任何用戶的任務（管理員專用）
   */
  async function forceDeleteTask(taskId) {
    try {
      // 從 localStorage 中直接刪除
      const key = `tasks/${taskId}`
      localStorage.removeItem(key)
      
      // 也嘗試通過引擎刪除
      await botEngine.deleteTask(taskId)
      
      return true
    } catch (error) {
      console.error('強制刪除任務失敗:', error)
      return false
    }
  }
  
  /**
   * 批量操作任務（管理員專用）
   */
  async function batchOperateTasks(taskIds, operation) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    }
    
    for (const taskId of taskIds) {
      try {
        switch (operation) {
          case 'delete':
            await forceDeleteTask(taskId)
            break
          case 'pause':
            await botEngine.pauseTask(taskId)
            break
          case 'resume':
            await botEngine.resumeTask(taskId)
            break
          default:
            throw new Error(`未知操作: ${operation}`)
        }
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({ taskId, error: error.message })
      }
    }
    
    return results
  }
  
  /**
   * 獲取系統性能指標（管理員專用）
   */
  async function getSystemMetrics() {
    const allTasks = await getAllUsersTasksAdmin()
    
    // 計算平均執行時間
    const completedTasks = allTasks.filter(t => 
      t.status === 'success' || t.status === 'failed'
    )
    
    let totalExecutionTime = 0
    completedTasks.forEach(task => {
      if (task.createdAt && task.updatedAt) {
        const start = new Date(task.createdAt).getTime()
        const end = new Date(task.updatedAt).getTime()
        totalExecutionTime += (end - start)
      }
    })
    
    const avgExecutionTime = completedTasks.length > 0 
      ? Math.round(totalExecutionTime / completedTasks.length / 1000)
      : 0
    
    // 計算存儲使用量
    let storageUsed = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key)
      if (key && value) {
        storageUsed += key.length + value.length
      }
    }
    const storageUsedMB = (storageUsed / 1024 / 1024).toFixed(2)
    
    return {
      totalTasks: allTasks.length,
      avgExecutionTime,
      storageUsedMB,
      storageKeys: localStorage.length,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 獲取系統健康狀態
   * 
   * @returns {Promise<Object>} 系統健康狀態
   */
  async function getSystemHealth() {
    const allTasks = await botEngine.getAllTasks()
    const stats = await botEngine.getStatistics()
    
    // 計算系統負載
    const runningTasks = allTasks.filter(t => t.status === 'running').length
    const totalTasks = allTasks.length
    const load = totalTasks > 0 ? (runningTasks / totalTasks) * 100 : 0
    
    // 計算錯誤率
    const errorRate = stats.total > 0 
      ? ((stats.failed / stats.total) * 100).toFixed(2)
      : 0
    
    return {
      status: load < 50 ? 'healthy' : load < 80 ? 'warning' : 'critical',
      load: load.toFixed(2),
      errorRate,
      runningTasks,
      totalTasks,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 獲取實時活動日誌
   * 
   * @param {number} limit - 返回的日誌數量限制
   * @returns {Promise<Array>} 活動日誌列表
   */
  async function getActivityLogs(limit = 50) {
    const allTasks = await botEngine.getAllTasks()
    
    const logs = allTasks
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit)
      .map(task => ({
        id: task.id,
        timestamp: task.updatedAt,
        action: getTaskAction(task.status),
        taskName: task.eventName,
        userId: task.userId,
        status: task.status
      }))
    
    return logs
  }

  /**
   * 根據任務狀態獲取操作描述
   */
  function getTaskAction(status) {
    const actionMap = {
      'pending': '創建任務',
      'running': '開始執行',
      'success': '執行成功',
      'failed': '執行失敗',
      'paused': '暫停任務'
    }
    return actionMap[status] || '更新任務'
  }

  // 返回公開 API
  return {
    getDashboardData,
    getUserDetail,
    getTaskStatistics,
    exportUsersToCSV,
    exportTasksToCSV,
    clearOldTasks,
    getSystemHealth,
    getActivityLogs,
    getAllUsersTasksAdmin,
    forceDeleteTask,
    batchOperateTasks,
    getSystemMetrics
  }
}

/**
 * 生成圖表數據
 * 
 * @param {Array} tasks - 任務列表
 * @param {string} type - 圖表類型
 * @returns {Object} 圖表數據配置
 */
export function generateChartData(tasks, type) {
  switch (type) {
    case 'statusDistribution':
      return {
        labels: ['待執行', '執行中', '已成功', '已失敗', '已暫停'],
        datasets: [{
          data: [
            tasks.filter(t => t.status === 'pending').length,
            tasks.filter(t => t.status === 'running').length,
            tasks.filter(t => t.status === 'success').length,
            tasks.filter(t => t.status === 'failed').length,
            tasks.filter(t => t.status === 'paused').length
          ],
          backgroundColor: [
            '#FCD34D', // 黃色
            '#60A5FA', // 藍色
            '#34D399', // 綠色
            '#F87171', // 紅色
            '#A78BFA'  // 紫色
          ]
        }]
      }
    
    case 'hourlyDistribution':
      const hourCounts = Array(24).fill(0)
      tasks.forEach(task => {
        const hour = new Date(task.executionTime).getHours()
        hourCounts[hour]++
      })
      
      return {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
          label: '任務數量',
          data: hourCounts,
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: '#6366F1',
          borderWidth: 2
        }]
      }
    
    case 'weeklyTrend':
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        
        const count = tasks.filter(t => {
          const taskDate = new Date(t.createdAt)
          return taskDate >= date && taskDate < nextDate
        }).length
        
        last7Days.push({
          label: date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
          count
        })
      }
      
      return {
        labels: last7Days.map(d => d.label),
        datasets: [{
          label: '任務數量',
          data: last7Days.map(d => d.count),
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true
        }]
      }
    
    default:
      return { labels: [], datasets: [] }
  }
}
