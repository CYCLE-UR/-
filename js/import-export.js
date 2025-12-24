/**
 * 任務導入/導出模塊
 * 支持 JSON 和 CSV 格式的任務導入導出功能
 */

import { deepClone } from './utils.js'
import { validateTask } from './task-model.js'

/**
 * 導出任務為 JSON 格式
 * @param {Array<Object>} tasks - 任務數組
 * @param {Object} options - 導出選項
 * @param {string} options.filename - 文件名（默認: tasks_export.json）
 * @returns {Object} { success: boolean, message: string, data?: string }
 */
export function exportTasksAsJSON(tasks, options = {}) {
  try {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        success: false,
        message: '沒有可導出的任務'
      }
    }

    const filename = options.filename || `tasks_export_${new Date().getTime()}.json`
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      taskCount: tasks.length,
      tasks: tasks.map(task => deepClone(task))
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    downloadFile(jsonString, filename, 'application/json')

    return {
      success: true,
      message: `成功導出 ${tasks.length} 個任務`,
      data: jsonString
    }
  } catch (error) {
    return {
      success: false,
      message: `導出失敗：${error.message}`
    }
  }
}

/**
 * 導出任務為 CSV 格式
 * @param {Array<Object>} tasks - 任務數組
 * @param {Object} options - 導出選項
 * @param {string} options.filename - 文件名（默認: tasks_export.csv）
 * @returns {Object} { success: boolean, message: string, data?: string }
 */
export function exportTasksAsCSV(tasks, options = {}) {
  try {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        success: false,
        message: '沒有可導出的任務'
      }
    }

    const filename = options.filename || `tasks_export_${new Date().getTime()}.csv`
    
    // CSV 標題
    const headers = [
      '任務名稱',
      '事件名稱',
      '事件日期',
      '售票時間',
      '狀態',
      '優先級',
      '購票數量',
      '目標 URL',
      '嘗試次數',
      '成功次數',
      '失敗次數',
      '創建時間',
      '更新時間'
    ]

    // 轉換數據為 CSV 行
    const rows = tasks.map(task => [
      escapeCsvField(task.name),
      escapeCsvField(task.eventName),
      task.eventDate,
      task.saleStartTime,
      task.status,
      task.priority,
      task.ticketConfig?.quantity || 1,
      escapeCsvField(task.ticketConfig?.targetUrl || ''),
      task.statistics?.attemptCount || 0,
      task.statistics?.successCount || 0,
      task.statistics?.failureCount || 0,
      task.createdAt,
      task.updatedAt
    ])

    // 組合 CSV 內容
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;')

    return {
      success: true,
      message: `成功導出 ${tasks.length} 個任務為 CSV`,
      data: csvContent
    }
  } catch (error) {
    return {
      success: false,
      message: `導出失敗：${error.message}`
    }
  }
}

/**
 * 從 JSON 導入任務
 * @param {string} jsonString - JSON 字符串
 * @returns {Object} { success: boolean, message: string, tasks?: Array, errors?: Array }
 */
export function importTasksFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    
    if (!Array.isArray(data.tasks)) {
      return {
        success: false,
        message: 'JSON 格式無效：缺少 tasks 數組'
      }
    }

    const { validTasks, errors } = validateAndProcessTasks(data.tasks)

    if (validTasks.length === 0) {
      return {
        success: false,
        message: '沒有有效的任務可導入',
        errors
      }
    }

    return {
      success: true,
      message: `成功導入 ${validTasks.length} 個任務${errors.length > 0 ? `，${errors.length} 個任務驗證失敗` : ''}`,
      tasks: validTasks,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    return {
      success: false,
      message: `導入失敗：${error.message}`
    }
  }
}

/**
 * 從 CSV 導入任務
 * @param {string} csvString - CSV 字符串
 * @returns {Object} { success: boolean, message: string, tasks?: Array, errors?: Array }
 */
export function importTasksFromCSV(csvString) {
  try {
    const lines = csvString.trim().split('\n')
    
    if (lines.length < 2) {
      return {
        success: false,
        message: 'CSV 文件格式無效：沒有足夠的數據行'
      }
    }

    // 解析標題
    const headers = parseCsvLine(lines[0])
    const expectedHeaders = [
      '任務名稱',
      '事件名稱',
      '事件日期',
      '售票時間'
    ]

    // 驗證必需的列
    const hasRequiredHeaders = expectedHeaders.every(h => headers.includes(h))
    if (!hasRequiredHeaders) {
      return {
        success: false,
        message: 'CSV 文件格式無效：缺少必需的列'
      }
    }

    // 解析數據行
    const tasks = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i])
      
      if (values.every(v => v === '')) {
        continue // 跳過空行
      }

      try {
        const task = {
          name: values[headers.indexOf('任務名稱')] || '',
          eventName: values[headers.indexOf('事件名稱')] || '',
          eventDate: values[headers.indexOf('事件日期')] || '',
          saleStartTime: values[headers.indexOf('售票時間')] || '',
          status: 'pending',
          priority: parseInt(values[headers.indexOf('優先級')]) || 5,
          ticketConfig: {
            targetUrl: values[headers.indexOf('目標 URL')] || '',
            seatPreference: 'any',
            quantity: parseInt(values[headers.indexOf('購票數量')]) || 1,
            priceRange: 'any'
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
          }
        }

        const validation = validateTask(task)
        if (validation.valid) {
          tasks.push(task)
        } else {
          errors.push({
            row: i + 1,
            message: validation.errors.join('；')
          })
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          message: `解析失敗：${error.message}`
        })
      }
    }

    if (tasks.length === 0) {
      return {
        success: false,
        message: '沒有有效的任務可導入',
        errors
      }
    }

    return {
      success: true,
      message: `成功導入 ${tasks.length} 個任務${errors.length > 0 ? `，${errors.length} 行驗證失敗` : ''}`,
      tasks,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    return {
      success: false,
      message: `導入失敗：${error.message}`
    }
  }
}

/**
 * 從文件導入任務
 * @param {File} file - 上傳的文件
 * @returns {Promise<Object>} { success: boolean, message: string, tasks?: Array, errors?: Array }
 */
export async function importTasksFromFile(file) {
  try {
    if (!file) {
      return {
        success: false,
        message: '沒有選擇文件'
      }
    }

    const fileType = file.name.split('.').pop().toLowerCase()
    const content = await file.text()

    if (fileType === 'json') {
      return importTasksFromJSON(content)
    } else if (fileType === 'csv') {
      return importTasksFromCSV(content)
    } else {
      return {
        success: false,
        message: '不支持的文件格式，僅支持 JSON 和 CSV'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `文件讀取失敗：${error.message}`
    }
  }
}

/**
 * 驗證並處理導入的任務
 * @private
 * @param {Array} tasks - 任務數組
 * @returns {Object} { validTasks: Array, errors: Array }
 */
function validateAndProcessTasks(tasks) {
  const validTasks = []
  const errors = []

  tasks.forEach((task, index) => {
    // 清除敏感信息
    const cleanTask = deepClone(task)
    delete cleanTask.id // 重新生成 ID
    delete cleanTask.userId // 將由導入者的 ID 替換

    const validation = validateTask(cleanTask)
    if (validation.valid) {
      validTasks.push(cleanTask)
    } else {
      errors.push({
        index,
        taskName: task.name,
        message: validation.errors.join('；')
      })
    }
  })

  return { validTasks, errors }
}

/**
 * 下載文件到本地
 * @private
 * @param {string} content - 文件內容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 類型
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 轉義 CSV 字段
 * @private
 * @param {string} field - 字段值
 * @returns {string} 轉義後的字段
 */
function escapeCsvField(field) {
  if (typeof field !== 'string') {
    field = String(field || '')
  }

  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }

  return field
}

/**
 * 解析 CSV 行
 * @private
 * @param {string} line - CSV 行字符串
 * @returns {Array<string>} 解析後的字段數組
 */
function parseCsvLine(line) {
  const result = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"'
        i++ // 跳過下一個引號
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * 生成導入模板
 * @param {string} format - 模板格式 ('json' 或 'csv')
 * @returns {Object} { success: boolean, message: string, data?: string }
 */
export function generateImportTemplate(format = 'json') {
  try {
    const filename = `task_template_${new Date().getTime()}.${format}`

    if (format === 'json') {
      const template = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        taskCount: 1,
        tasks: [
          {
            name: '示例搶票任務',
            eventName: '某演唱會',
            eventDate: '2025-12-25',
            saleStartTime: '2025-12-24 10:00:00',
            status: 'pending',
            priority: 5,
            ticketConfig: {
              targetUrl: 'https://example.com/tickets',
              seatPreference: 'any',
              quantity: 2,
              priceRange: 'any'
            },
            automationConfig: {
              clickSelector: '.buy-button',
              clickDelay: 100,
              maxRetries: 3,
              retryInterval: 1000
            },
            notificationConfig: {
              enableDesktopNotification: true,
              enableEmailNotification: false,
              email: ''
            }
          }
        ]
      }
      const jsonString = JSON.stringify(template, null, 2)
      downloadFile(jsonString, filename, 'application/json')
      return {
        success: true,
        message: '已生成 JSON 導入模板',
        data: jsonString
      }
    } else if (format === 'csv') {
      const template = `任務名稱,事件名稱,事件日期,售票時間,狀態,優先級,購票數量,目標 URL
示例搶票任務,某演唱會,2025-12-25,2025-12-24 10:00:00,pending,5,2,https://example.com/tickets`
      downloadFile(template, filename, 'text/csv;charset=utf-8;')
      return {
        success: true,
        message: '已生成 CSV 導入模板',
        data: template
      }
    } else {
      return {
        success: false,
        message: '不支持的模板格式'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `生成模板失敗：${error.message}`
    }
  }
}
