import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createDefaultTask,
  validateTask,
  cloneTask,
  TASK_STATUS,
  SEAT_PREFERENCE,
  PRICE_RANGE
} from '../js/task-model.js'

describe('Task Model - 任務數據模型', () => {
  it('應該創建默認任務', () => {
    const task = createDefaultTask()
    expect(task.name).toBe('')
    expect(task.status).toBe(TASK_STATUS.PENDING)
    expect(task.priority).toBe(5)
    expect(task.createdAt).toBeDefined()
    expect(task.statistics.attemptCount).toBe(0)
  })

  it('應該支持覆蓋默認值', () => {
    const task = createDefaultTask({
      name: 'Test Concert',
      priority: 8
    })
    expect(task.name).toBe('Test Concert')
    expect(task.priority).toBe(8)
  })

  it('應該驗證有效的任務', () => {
    const task = createDefaultTask({
      name: 'Concert',
      eventName: 'BTS',
      eventDate: '2025-12-25',
      saleStartTime: '2025-12-25 10:00:00'
    })
    const result = validateTask(task)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('應該檢查必填字段', () => {
    const task = createDefaultTask({ name: '' })
    const result = validateTask(task)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('任務名稱不能為空')
  })

  it('應該驗證日期格式', () => {
    const task = createDefaultTask({
      name: 'Test',
      eventName: 'Test',
      eventDate: '2025/12/25',
      saleStartTime: '2025-12-25 10:00:00'
    })
    const result = validateTask(task)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('日期格式無效'))).toBe(true)
  })

  it('應該驗證優先級範圍', () => {
    const task = createDefaultTask({
      name: 'Test',
      eventName: 'Test',
      eventDate: '2025-12-25',
      saleStartTime: '2025-12-25 10:00:00',
      priority: 11
    })
    const result = validateTask(task)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('優先級必須在 1-10 之間')
  })

  it('應該驗證購票數量', () => {
    const task = createDefaultTask({
      name: 'Test',
      eventName: 'Test',
      eventDate: '2025-12-25',
      saleStartTime: '2025-12-25 10:00:00',
      ticketConfig: {
        ...createDefaultTask().ticketConfig,
        quantity: 11
      }
    })
    const result = validateTask(task)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('購票數量'))).toBe(true)
  })

  it('應該克隆任務對象', () => {
    const original = createDefaultTask({ name: 'Test' })
    const cloned = cloneTask(original)
    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    cloned.name = 'Modified'
    expect(original.name).toBe('Test')
  })

  it('應該驗證任務狀態', () => {
    const task = createDefaultTask({
      name: 'Test',
      eventName: 'Test',
      eventDate: '2025-12-25',
      saleStartTime: '2025-12-25 10:00:00',
      status: 'invalid_status'
    })
    const result = validateTask(task)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('任務狀態無效'))).toBe(true)
  })

  it('應該驗證座位偏好', () => {
    const task = createDefaultTask({
      name: 'Test',
      eventName: 'Test',
      eventDate: '2025-12-25',
      saleStartTime: '2025-12-25 10:00:00',
      ticketConfig: {
        ...createDefaultTask().ticketConfig,
        seatPreference: 'invalid'
      }
    })
    const result = validateTask(task)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('座位偏好無效'))).toBe(true)
  })

  it('應該驗證郵件格式', () => {
    const task = createDefaultTask({
      name: 'Test',
      eventName: 'Test',
      eventDate: '2025-12-25',
      saleStartTime: '2025-12-25 10:00:00',
      notificationConfig: {
        enableDesktopNotification: false,
        enableEmailNotification: true,
        email: 'invalid-email'
      }
    })
    const result = validateTask(task)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('郵件'))).toBe(true)
  })
})

describe('Task Status Constants - 任務狀態常量', () => {
  it('應該定義所有任務狀態', () => {
    expect(TASK_STATUS.PENDING).toBe('pending')
    expect(TASK_STATUS.RUNNING).toBe('running')
    expect(TASK_STATUS.SUCCESS).toBe('success')
    expect(TASK_STATUS.FAILED).toBe('failed')
    expect(TASK_STATUS.PAUSED).toBe('paused')
  })

  it('應該定義所有座位偏好', () => {
    expect(SEAT_PREFERENCE.FRONT).toBe('front')
    expect(SEAT_PREFERENCE.MIDDLE).toBe('middle')
    expect(SEAT_PREFERENCE.BACK).toBe('back')
    expect(SEAT_PREFERENCE.ANY).toBe('any')
  })

  it('應該定義所有價格範圍', () => {
    expect(PRICE_RANGE.ANY).toBe('any')
    expect(PRICE_RANGE.LOW).toBe('low')
    expect(PRICE_RANGE.MEDIUM).toBe('medium')
    expect(PRICE_RANGE.HIGH).toBe('high')
  })
})

describe('Task Configuration - 任務配置驗證', () => {
  it('應該接受所有有效的座位偏好', () => {
    const preferences = [SEAT_PREFERENCE.FRONT, SEAT_PREFERENCE.MIDDLE, SEAT_PREFERENCE.BACK, SEAT_PREFERENCE.ANY]
    
    preferences.forEach(pref => {
      const task = createDefaultTask({
        name: 'Test',
        eventName: 'Test',
        eventDate: '2025-12-25',
        saleStartTime: '2025-12-25 10:00:00',
        ticketConfig: {
          ...createDefaultTask().ticketConfig,
          seatPreference: pref
        }
      })
      const result = validateTask(task)
      expect(result.errors.some(e => e.includes('座位偏好'))).toBe(false)
    })
  })

  it('應該接受所有有效的價格範圍', () => {
    const ranges = [PRICE_RANGE.ANY, PRICE_RANGE.LOW, PRICE_RANGE.MEDIUM, PRICE_RANGE.HIGH]
    
    ranges.forEach(range => {
      const task = createDefaultTask({
        name: 'Test',
        eventName: 'Test',
        eventDate: '2025-12-25',
        saleStartTime: '2025-12-25 10:00:00',
        ticketConfig: {
          ...createDefaultTask().ticketConfig,
          priceRange: range
        }
      })
      const result = validateTask(task)
      expect(result.errors.some(e => e.includes('價格範圍'))).toBe(false)
    })
  })

  it('應該驗證自動化配置的延遲值', () => {
    const task = createDefaultTask({
      name: 'Test',
      eventName: 'Test',
      eventDate: '2025-12-25',
      saleStartTime: '2025-12-25 10:00:00',
      automationConfig: {
        ...createDefaultTask().automationConfig,
        clickDelay: -100
      }
    })
    const result = validateTask(task)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('點擊延遲不能為負數')
  })

  it('應該驗證自動化配置的重試次數', () => {
    const task = createDefaultTask({
      name: 'Test',
      eventName: 'Test',
      eventDate: '2025-12-25',
      saleStartTime: '2025-12-25 10:00:00',
      automationConfig: {
        ...createDefaultTask().automationConfig,
        maxRetries: -1
      }
    })
    const result = validateTask(task)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('最大重試次數不能為負數')
  })
})
